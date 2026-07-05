/**
 * Cut list simplification: collapse identical panels into quantity rows,
 * sort largest-first, and assign stable part numbers shared by the CSV,
 * the DXF filenames and the build instructions.
 */

import type { CutListRow, Panel } from './types'

function panelKey(p: Panel): string {
  return [p.w, p.h, p.thickness, p.material].join('|')
}

export function simplifyCutList(panels: Panel[]): CutListRow[] {
  const groups = new Map<string, { labels: string[]; panel: Panel; qty: number }>()

  for (const p of panels) {
    const key = panelKey(p)
    const existing = groups.get(key)
    if (existing) {
      existing.qty += p.qty
      if (!existing.labels.includes(p.label)) existing.labels.push(p.label)
    } else {
      groups.set(key, { labels: [p.label], panel: p, qty: p.qty })
    }
  }

  const rows = [...groups.values()]
    .sort((a, b) => {
      const areaDiff = b.panel.w * b.panel.h - a.panel.w * a.panel.h
      if (areaDiff !== 0) return areaDiff
      return b.panel.thickness - a.panel.thickness
    })
    .map((g, i): CutListRow => {
      const merged = g.labels.length > 1
      return {
        no: String(i + 1).padStart(2, '0'),
        label: g.labels.join(' / '),
        w: g.panel.w,
        h: g.panel.h,
        thickness: g.panel.thickness,
        material: g.panel.material,
        qty: g.qty,
        holes: g.panel.holes,
        notes: merged
          ? g.labels.map((l) => l.toLowerCase()).join(' + ')
          : g.panel.notes,
      }
    })

  return rows
}

const MATERIAL_NAMES: Record<string, string> = {
  birch_ply: 'Birch plywood',
}

export function materialName(material: string): string {
  return MATERIAL_NAMES[material] ?? material
}

/**
 * CSV in the shape panel-cutting providers import:
 * one row per unique part, sizes in mm, quantity column.
 */
export function cutListToCsv(rows: CutListRow[]): string {
  const esc = (v: string | number): string => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = [
    'Part',
    'Description',
    'Length_mm',
    'Width_mm',
    'Thickness_mm',
    'Material',
    'Quantity',
    'Notes',
  ]
  const lines = rows.map((r) =>
    [
      r.no,
      r.label,
      // Length is the longer edge, as panel saw operators expect.
      Math.max(r.w, r.h),
      Math.min(r.w, r.h),
      r.thickness,
      materialName(r.material),
      r.qty,
      r.notes ?? '',
    ]
      .map(esc)
      .join(','),
  )
  return [header.join(','), ...lines].join('\n') + '\n'
}

/** Total panel area in m² (per material+thickness), useful for a sheet estimate. */
export function areaSummary(
  rows: CutListRow[],
): Array<{ material: string; thickness: number; areaM2: number }> {
  const acc = new Map<string, { material: string; thickness: number; areaM2: number }>()
  for (const r of rows) {
    const key = `${r.material}|${r.thickness}`
    const entry =
      acc.get(key) ?? { material: r.material, thickness: r.thickness, areaM2: 0 }
    entry.areaM2 += (r.w * r.h * r.qty) / 1_000_000
    acc.set(key, entry)
  }
  return [...acc.values()].map((e) => ({ ...e, areaM2: Math.round(e.areaM2 * 100) / 100 }))
}
