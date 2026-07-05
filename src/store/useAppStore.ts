import { create } from 'zustand'
import type { CutListRow, ItemSpec, Panel } from '~/geometry/types'
import { defaultSpec } from '~/geometry/types'
import { generatePanels } from '~/geometry/engine'
import { simplifyCutList } from '~/geometry/cutlist'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AppState {
  spec: ItemSpec
  panels: Panel[]
  cutList: CutListRow[]
  messages: ChatMessage[]
  exploded: boolean
  /** null = not probed yet */
  aiAvailable: boolean | null
  specError: string | null
  setSpec: (spec: ItemSpec) => void
  addMessage: (message: ChatMessage) => void
  appendToLastAssistant: (delta: string) => void
  setExploded: (exploded: boolean) => void
  setAiAvailable: (available: boolean) => void
}

function derive(spec: ItemSpec): {
  panels: Panel[]
  cutList: CutListRow[]
  specError: string | null
} {
  try {
    const panels = generatePanels(spec)
    return { panels, cutList: simplifyCutList(panels), specError: null }
  } catch (err) {
    return {
      panels: [],
      cutList: [],
      specError: err instanceof Error ? err.message : String(err),
    }
  }
}

const initialSpec = defaultSpec('cabinet')

export const useAppStore = create<AppState>((set) => ({
  spec: initialSpec,
  ...derive(initialSpec),
  messages: [
    {
      role: 'assistant',
      content:
        "Describe what you'd like to build — for example: “a bookshelf 800mm wide, " +
        '2m tall, 300mm deep with 4 shelves”. You can refine it afterwards, or edit ' +
        'the dimensions directly below.',
    },
  ],
  exploded: false,
  aiAvailable: null,
  specError: null,
  setSpec: (spec) => set({ spec, ...derive(spec) }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  appendToLastAssistant: (delta) =>
    set((state) => {
      const messages = [...state.messages]
      const last = messages[messages.length - 1]
      if (last?.role === 'assistant') {
        messages[messages.length - 1] = {
          ...last,
          content: last.content + delta,
        }
      } else {
        messages.push({ role: 'assistant', content: delta })
      }
      return { messages }
    }),
  setExploded: (exploded) => set({ exploded }),
  setAiAvailable: (aiAvailable) => set({ aiAvailable }),
}))
