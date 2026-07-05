import { useRef, useState } from 'react'
import { useAppStore } from '~/store/useAppStore'
import { parseDescription } from '~/geometry/parser'
import type { ItemSpec } from '~/geometry/types'

function fallbackReply(understood: string[], spec: ItemSpec): string {
  const summary = `${spec.name}: ${spec.width} × ${spec.height} × ${spec.depth} mm`
  if (understood.length === 0) {
    return (
      `I couldn't pick out any changes from that, so the design is unchanged (${summary}). ` +
      'Try phrases like “800mm wide”, “2 shelves” or “no doors”, or edit the form below.'
    )
  }
  return (
    `Got it — I set ${understood.join(', ')}. Now designing: ${summary}. ` +
    'The cut list and preview are updated; refine further or download the cutting pack.'
  )
}

export function ChatPanel() {
  const { messages, addMessage, appendToLastAssistant, spec, setSpec, aiAvailable, setAiAvailable } =
    useAppStore()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollDown = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    })
  }

  const runFallback = (text: string) => {
    const { spec: next, understood } = parseDescription(text, spec)
    setSpec(next)
    addMessage({ role: 'assistant', content: fallbackReply(understood, next) })
  }

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setBusy(true)
    addMessage({ role: 'user', content: text })
    scrollDown()

    const history = [...useAppStore.getState().messages]

    try {
      if (aiAvailable === false) {
        runFallback(text)
        return
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, spec }),
      })
      if (res.status === 503) {
        setAiAvailable(false)
        runFallback(text)
        return
      }
      if (!res.ok || !res.body) {
        throw new Error(`Chat request failed (${res.status})`)
      }
      setAiAvailable(true)
      addMessage({ role: 'assistant', content: '' })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let sawError: string | null = null
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          const event = JSON.parse(line) as Record<string, unknown>
          if (event.type === 'text') {
            appendToLastAssistant(event.text as string)
            scrollDown()
          } else if (event.type === 'spec') {
            setSpec(event.spec as ItemSpec)
          } else if (event.type === 'error') {
            sawError = event.message as string
          }
        }
      }
      if (sawError) {
        appendToLastAssistant(
          `\n\n(The AI request failed: ${sawError}. Falling back to the built-in parser.)`,
        )
        runFallback(text)
      }
    } catch {
      // Network/parse failure: stay useful with the deterministic parser.
      setAiAvailable(false)
      runFallback(text)
    } finally {
      setBusy(false)
      scrollDown()
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
          Design chat
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            aiAvailable
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-amber-500/20 text-amber-300'
          }`}
          title={
            aiAvailable
              ? 'Claude is interpreting your messages'
              : 'No ANTHROPIC_API_KEY configured — using the built-in offline parser'
          }
        >
          {aiAvailable ? 'Claude' : aiAvailable === false ? 'offline parser' : 'auto'}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-sky-600/80 text-white'
                : 'bg-white/10 text-white/90'
            }`}
          >
            {m.content || '…'}
          </div>
        ))}
      </div>

      <form
        className="flex gap-2 border-t border-white/10 p-3"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        <input
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-sky-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. a bookshelf 800mm wide, 2m tall with 4 shelves"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {busy ? '…' : 'Send'}
        </button>
      </form>
    </div>
  )
}
