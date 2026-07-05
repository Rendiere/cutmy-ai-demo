/**
 * DXF generation: one file per unique cut list part, drawn 1:1 in millimetres,
 * origin at the panel's bottom-left corner — the format sheet-cutting services
 * such as cutmy.co.uk accept.
 *
 * - Panel outline: closed polyline on layer OUTLINE
 * - Drilled holes (e.g. shelf pins): circles on layer HOLES
 */

import Drawing from 'dxf-writer'
import type { CutListRow } from '~/geometry/types'

/** `NN_description_xQTY__WxHmm.dxf` (see CLAUDE.md DXF naming convention) */
export function dxfFileName(row: CutListRow): string {
  const description = row.label
    .toLowerCase()
    .replace(/\s*\/\s*/g, '-')
    .replace(/[^a-z0-9-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return `${row.no}_${description}_x${row.qty}__${row.w}x${row.h}mm.dxf`
}

export function panelToDxf(row: CutListRow): string {
  const d = new Drawing()
  d.setUnits('Millimeters')

  d.addLayer('OUTLINE', Drawing.ACI.WHITE, 'CONTINUOUS')
  d.setActiveLayer('OUTLINE')
  d.drawPolyline(
    [
      [0, 0],
      [row.w, 0],
      [row.w, row.h],
      [0, row.h],
    ],
    true,
  )

  if (row.holes.length > 0) {
    d.addLayer('HOLES', Drawing.ACI.RED, 'CONTINUOUS')
    d.setActiveLayer('HOLES')
    for (const hole of row.holes) {
      d.drawCircle(hole.x, hole.y, hole.diameter / 2)
    }
  }

  return d.toDxfString()
}

export interface DxfFile {
  name: string
  content: string
}

export function cutListToDxfFiles(rows: CutListRow[]): DxfFile[] {
  return rows.map((row) => ({
    name: dxfFileName(row),
    content: panelToDxf(row),
  }))
}
