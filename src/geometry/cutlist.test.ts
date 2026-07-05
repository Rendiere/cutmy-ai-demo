import { describe, expect, it } from 'vitest'
import { generatePanels } from './engine'
import { areaSummary, cutListToCsv, simplifyCutList } from './cutlist'
import { defaultSpec } from './types'

const cabinet = {
  ...defaultSpec('cabinet'),
  width: 800,
  height: 900,
  depth: 400,
  shelfCount: 2,
  hasDoors: true,
  hasBack: true,
}

describe('simplifyCutList', () => {
  const rows = simplifyCutList(generatePanels(cabinet))

  it('merges identical panels (top + bottom) into one qty row', () => {
    const topBottom = rows.find((r) => r.label.includes('Top'))!
    expect(topBottom.label).toBe('Top / Bottom')
    expect(topBottom.qty).toBe(2)
  })

  it('sorts largest-first with stable two-digit numbering', () => {
    const areas = rows.map((r) => r.w * r.h)
    expect([...areas].sort((a, b) => b - a)).toEqual(areas)
    expect(rows.map((r) => r.no)).toEqual(
      rows.map((_, i) => String(i + 1).padStart(2, '0')),
    )
  })

  it('keeps hole data on the deduped row', () => {
    const side = rows.find((r) => r.label === 'Side')!
    expect(side.holes.length).toBeGreaterThan(0)
    expect(side.qty).toBe(2)
  })

  it('does not merge panels of different thickness', () => {
    const back = rows.find((r) => r.label === 'Back')!
    expect(back.thickness).toBe(9)
    expect(back.label).toBe('Back')
  })
})

describe('cutListToCsv', () => {
  const rows = simplifyCutList(generatePanels(cabinet))
  const csv = cutListToCsv(rows)
  const lines = csv.trim().split('\n')

  it('has a header and one line per unique part', () => {
    expect(lines[0]).toBe(
      'Part,Description,Length_mm,Width_mm,Thickness_mm,Material,Quantity,Notes',
    )
    expect(lines.length).toBe(rows.length + 1)
  })

  it('puts the longer edge in the Length column', () => {
    for (const line of lines.slice(1)) {
      const cols = line.split(',')
      expect(Number(cols[2])).toBeGreaterThanOrEqual(Number(cols[3]))
    }
  })

  it('escapes commas in text fields', () => {
    expect(csv).toContain('"')
  })
})

describe('areaSummary', () => {
  it('reports m² per material/thickness', () => {
    const rows = simplifyCutList(generatePanels(cabinet))
    const summary = areaSummary(rows)
    const t18 = summary.find((s) => s.thickness === 18)!
    const t9 = summary.find((s) => s.thickness === 9)!
    expect(t18.areaM2).toBeGreaterThan(0)
    expect(t9.areaM2).toBeGreaterThan(0)
  })
})
