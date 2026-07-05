/**
 * Claude integration: system prompt, spec tool definition, and validation
 * of tool output back into a safe ItemSpec.
 */

import type { ItemKind, ItemSpec } from '~/geometry/types'
import { DEFAULTS, defaultSpec } from '~/geometry/types'

export const SYSTEM_PROMPT = `You are a woodworking design assistant inside a cut-list app.
The user describes a simple household item (cabinet, bookshelf, garden planter or floating shelf).
Your job:
1. Work out the item specification (external dimensions in mm, shelf count, doors, back panel).
2. ALWAYS call the set_item_spec tool with the full spec whenever the design changes.
3. Reply briefly (2-3 sentences max) confirming what you set and asking about anything genuinely ambiguous. Do not repeat the full cut list — the app renders it.

Construction rules the app applies automatically (do not restate them):
- 18 mm birch plywood carcass, 9 mm back panel
- Adjustable shelves on 5 mm pins (32 mm pitch)
- Overlay doors with a 2 mm gap all round

Sensible defaults if the user doesn't say: cabinets 800×900×400 mm with 1 shelf and doors;
bookshelves 800×1800×300 mm with 4 shelves, no doors; planters 1000×400×400 mm;
floating shelves 900 mm wide × 240 mm deep. Prefer proceeding with defaults over asking.`

export const SPEC_TOOL = {
  name: 'set_item_spec',
  description:
    'Set the current item specification. Call this whenever the design changes. All dimensions are millimetres, external.',
  input_schema: {
    type: 'object' as const,
    properties: {
      kind: {
        type: 'string',
        enum: ['cabinet', 'bookshelf', 'planter', 'floating_shelf'],
      },
      name: { type: 'string', description: 'Short display name for the item' },
      width: { type: 'number', description: 'External width in mm' },
      height: { type: 'number', description: 'External height in mm' },
      depth: { type: 'number', description: 'External depth in mm' },
      shelfCount: { type: 'integer', minimum: 0, maximum: 12 },
      hasDoors: { type: 'boolean' },
      hasBack: { type: 'boolean' },
      thickness: {
        type: 'number',
        description: 'Carcass panel thickness in mm, default 18',
      },
    },
    required: ['kind', 'width', 'height', 'depth'],
  },
}

const KINDS: ItemKind[] = ['cabinet', 'bookshelf', 'planter', 'floating_shelf']

function num(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

/** Normalize untrusted tool input into a valid ItemSpec. */
export function normalizeSpec(input: Record<string, unknown>): ItemSpec {
  const kind = KINDS.includes(input.kind as ItemKind)
    ? (input.kind as ItemKind)
    : 'cabinet'
  const base = defaultSpec(kind)
  return {
    ...base,
    name:
      typeof input.name === 'string' && input.name.trim()
        ? input.name.trim().slice(0, 60)
        : base.name,
    width: num(input.width, base.width, 50, 3000),
    height: num(input.height, base.height, DEFAULTS.thickness, 3000),
    depth: num(input.depth, base.depth, 50, 1200),
    shelfCount:
      kind === 'cabinet' || kind === 'bookshelf'
        ? num(input.shelfCount, base.shelfCount, 0, 12)
        : 0,
    hasDoors: kind === 'cabinet' ? Boolean(input.hasDoors ?? base.hasDoors) : false,
    hasBack:
      kind === 'cabinet' || kind === 'bookshelf'
        ? Boolean(input.hasBack ?? base.hasBack)
        : false,
    thickness: num(input.thickness, base.thickness, 6, 30),
  }
}
