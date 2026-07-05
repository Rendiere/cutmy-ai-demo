import { describe, expect, it } from 'vitest'
import { generatePanels } from '~/geometry/engine'
import { simplifyCutList } from '~/geometry/cutlist'
import { defaultSpec } from '~/geometry/types'
import { cutListToDxfFiles, dxfFileName, panelToDxf } from './dxf'

const rows = simplifyCutList(
  generatePanels({
    ...defaultSpec('cabinet'),
    width: 800,
    height: 900,
    depth: 400,
    shelfCount: 2,
    hasDoors: true,
    hasBack: true,
  }),
)

describe('dxfFileName', () => {
  it('follows NN_description_xQTY__WxHmm.dxf', () => {
    const side = rows.find((r) => r.label === 'Side')!
    expect(dxfFileName(side)).toBe(
      `${side.no}_side_x2__400x900mm.dxf`,
    )
  })

  it('slugifies merged labels', () => {
    const topBottom = rows.find((r) => r.label === 'Top / Bottom')!
    expect(dxfFileName(topBottom)).toMatch(/^\d{2}_top-bottom_x2__764x400mm\.dxf$/)
  })
})

describe('panelToDxf', () => {
  it('is valid DXF in millimetres with a closed outline', () => {
    const side = rows.find((r) => r.label === 'Side')!
    const dxf = panelToDxf(side)
    expect(dxf).toContain('SECTION')
    expect(dxf).toContain('EOF')
    // $INSUNITS = 4 → millimetres
    expect(dxf).toContain('$INSUNITS')
    expect(dxf).toContain('LWPOLYLINE')
  })

  it('draws one circle per shelf pin hole', () => {
    const side = rows.find((r) => r.label === 'Side')!
    const dxf = panelToDxf(side)
    const circles = dxf.match(/CIRCLE/g) ?? []
    expect(circles.length).toBe(side.holes.length)
  })

  it('panels without holes have no HOLES layer entities', () => {
    const door = rows.find((r) => r.label === 'Door')!
    expect(panelToDxf(door)).not.toContain('CIRCLE')
  })
})

describe('cutListToDxfFiles', () => {
  it('produces one file per unique part with unique names', () => {
    const files = cutListToDxfFiles(rows)
    expect(files.length).toBe(rows.length)
    expect(new Set(files.map((f) => f.name)).size).toBe(files.length)
  })
})
