/**
 * POST /api/chat — Claude-powered spec extraction with streaming.
 *
 * Emits newline-delimited JSON events:
 *   {"type":"text","text":"..."}   assistant text delta
 *   {"type":"spec","spec":{...}}   validated ItemSpec from the set_item_spec tool
 *   {"type":"done"}
 *
 * Returns 503 {"error":"no_api_key"} when ANTHROPIC_API_KEY is not configured,
 * which tells the client to fall back to the built-in deterministic parser.
 */

import { createFileRoute } from '@tanstack/react-router'
import Anthropic from '@anthropic-ai/sdk'
import { normalizeSpec, SPEC_TOOL, SYSTEM_PROMPT } from '~/server/claude'
import type { ItemSpec } from '~/geometry/types'

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  spec?: ItemSpec
}

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
          return Response.json({ error: 'no_api_key' }, { status: 503 })
        }

        let body: ChatRequestBody
        try {
          body = (await request.json()) as ChatRequestBody
        } catch {
          return Response.json({ error: 'invalid_json' }, { status: 400 })
        }
        if (!Array.isArray(body.messages) || body.messages.length === 0) {
          return Response.json({ error: 'no_messages' }, { status: 400 })
        }

        const client = new Anthropic({ apiKey })
        const encoder = new TextEncoder()

        const specContext = body.spec
          ? `\n\nCurrent spec (refine rather than restart unless the user changes item type): ${JSON.stringify(body.spec)}`
          : ''

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const emit = (event: Record<string, unknown>) =>
              controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
            try {
              const runner = client.messages.stream({
                model: 'claude-sonnet-5',
                max_tokens: 1024,
                system: [
                  {
                    type: 'text',
                    text: SYSTEM_PROMPT + specContext,
                    cache_control: { type: 'ephemeral' },
                  },
                ],
                tools: [SPEC_TOOL],
                messages: body.messages.slice(-20).map((m) => ({
                  role: m.role,
                  content: m.content,
                })),
              })

              runner.on('text', (text) => emit({ type: 'text', text }))

              const final = await runner.finalMessage()
              for (const block of final.content) {
                if (block.type === 'tool_use' && block.name === SPEC_TOOL.name) {
                  emit({
                    type: 'spec',
                    spec: normalizeSpec(block.input as Record<string, unknown>),
                  })
                }
              }
              emit({ type: 'done' })
            } catch (err) {
              emit({
                type: 'error',
                message: err instanceof Error ? err.message : 'Claude request failed',
              })
            } finally {
              controller.close()
            }
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
          },
        })
      },
    },
  },
})
