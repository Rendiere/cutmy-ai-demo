/**
 * Deterministic plain-language → ItemSpec parser.
 *
 * Used as the no-API-key fallback for the chat, and as a predictable baseline:
 * the same sentence always produces the same spec. The Claude-powered path
 * produces the same ItemSpec shape via a tool call.
 */

import type { ItemKind, ItemSpec } from './types'
import { defaultSpec } from './types'

const KIND_KEYWORDS: Array<[RegExp, ItemKind]> = [
  [/\b(floating|wall)\s+shel(f|ves)\b/i, 'floating_shelf'],
  [/\b(planter|garden\s+box|raised\s+bed|trough)\b/i, 'planter'],
  [/\b(book\s*shelf|book\s*case|shelving\s+unit|shelf\s+unit)\b/i, 'bookshelf'],
  [/\b(cabinet|cupboard|sideboard|dresser|unit)\b/i, 'cabinet'],
]

/** Convert a number + unit to millimetres. Bare numbers ≤ 3 are metres, ≤ 20 treated as cm is too risky — bare numbers are mm unless tiny. */
function toMm(value: number, unit: string | undefined): number {
  switch ((unit ?? '').toLowerCase()) {
    case 'm':
    case 'metre':
    case 'metres':
    case 'meter':
    case 'meters':
      return value * 1000
    case 'cm':
      return value * 10
    case 'mm':
      return value
    default:
      // Unitless: treat small numbers as metres ("2 tall"), else mm.
      return value <= 3 ? value * 1000 : value
  }
}

const NUM = String.raw`(\d+(?:[.,]\d+)?)`
const UNIT = String.raw`\s*(mm|cm|m|metres?|meters?)?\b`

function parseNum(s: string): number {
  return parseFloat(s.replace(',', '.'))
}

interface ParsedDims {
  width?: number
  height?: number
  depth?: number
}

function parseDimensions(text: string): ParsedDims {
  const dims: ParsedDims = {}

  // "800 x 2000 x 300" or "80cm x 2m x 30cm" → W x H x D
  const triple = new RegExp(
    `${NUM}${UNIT}\\s*[x×]\\s*${NUM}${UNIT}\\s*[x×]\\s*${NUM}${UNIT}`,
    'i',
  ).exec(text)
  if (triple) {
    dims.width = toMm(parseNum(triple[1]!), triple[2])
    dims.height = toMm(parseNum(triple[3]!), triple[4])
    dims.depth = toMm(parseNum(triple[5]!), triple[6])
  }

  // "800mm wide", "wide: 800", "width of 80cm", "2m tall/high", "300 deep"
  const named: Array<[keyof ParsedDims, RegExp[]]> = [
    [
      'width',
      [
        new RegExp(`${NUM}${UNIT}\\s*(?:wide|in width)`, 'i'),
        new RegExp(`width\\s*(?:of|is|:)?\\s*${NUM}${UNIT}`, 'i'),
      ],
    ],
    [
      'height',
      [
        new RegExp(`${NUM}${UNIT}\\s*(?:tall|high|in height)`, 'i'),
        new RegExp(`height\\s*(?:of|is|:)?\\s*${NUM}${UNIT}`, 'i'),
      ],
    ],
    [
      'depth',
      [
        new RegExp(`${NUM}${UNIT}\\s*(?:deep|in depth)`, 'i'),
        new RegExp(`depth\\s*(?:of|is|:)?\\s*${NUM}${UNIT}`, 'i'),
      ],
    ],
  ]
  for (const [key, patterns] of named) {
    for (const re of patterns) {
      const m = re.exec(text)
      if (m) {
        dims[key] = toMm(parseNum(m[1]!), m[2])
        break
      }
    }
  }

  return dims
}

const WORD_NUMBERS: Record<string, number> = {
  no: 0, zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1,
}

function parseCount(text: string, noun: string): number | undefined {
  const re = new RegExp(`\\b(\\d+|${Object.keys(WORD_NUMBERS).join('|')})\\s+(?:adjustable\\s+)?${noun}`, 'i')
  const m = re.exec(text)
  if (!m) return undefined
  const raw = m[1]!.toLowerCase()
  return raw in WORD_NUMBERS ? WORD_NUMBERS[raw] : parseInt(raw, 10)
}

export interface ParseResult {
  spec: ItemSpec
  /** What the parser understood, for the assistant reply */
  understood: string[]
}

/**
 * Parse a description, starting from `base` (or the kind's defaults).
 * Only fields actually mentioned in the text are changed, so the chat can
 * refine a spec incrementally ("make it 2m tall", "no doors").
 */
export function parseDescription(text: string, base?: ItemSpec): ParseResult {
  const understood: string[] = []

  let kind: ItemKind | undefined
  for (const [re, k] of KIND_KEYWORDS) {
    if (re.test(text)) {
      kind = k
      break
    }
  }

  let spec: ItemSpec
  if (base && (!kind || kind === base.kind)) {
    spec = { ...base }
  } else {
    spec = defaultSpec(kind ?? 'cabinet')
    understood.push(`item type: ${spec.name.toLowerCase()}`)
  }

  const dims = parseDimensions(text)
  if (dims.width) {
    spec.width = dims.width
    understood.push(`width ${dims.width} mm`)
  }
  if (dims.height) {
    spec.height = dims.height
    understood.push(`height ${dims.height} mm`)
  }
  if (dims.depth) {
    spec.depth = dims.depth
    understood.push(`depth ${dims.depth} mm`)
  }

  if (spec.kind === 'cabinet' || spec.kind === 'bookshelf') {
    const shelves = parseCount(text, 'shel(?:f|ves)')
    if (shelves !== undefined) {
      spec.shelfCount = shelves
      understood.push(`${shelves} shelves`)
    }
    if (/\b(?:no|without)\s+doors?\b/i.test(text)) {
      spec.hasDoors = false
      understood.push('no doors')
    } else if (/\bdoors?\b/i.test(text)) {
      spec.hasDoors = true
      understood.push('a pair of overlay doors')
    }
    if (/\b(?:no|without)\s+back\b/i.test(text)) {
      spec.hasBack = false
      understood.push('no back panel')
    }
  }

  const thickness = /(\d+)\s*mm\s+(?:ply|plywood|board|material)/i.exec(text)
  if (thickness) {
    spec.thickness = parseInt(thickness[1]!, 10)
    understood.push(`${spec.thickness} mm material`)
  }

  return { spec, understood }
}
