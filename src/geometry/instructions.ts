/**
 * Build instructions generator: ItemSpec + simplified cut list → markdown.
 * Steps reference the cut list part numbers so the instructions, the CSV
 * and the DXF filenames all speak the same language.
 */

import type { CutListRow, ItemSpec } from './types'
import { areaSummary, materialName } from './cutlist'

function findRow(rows: CutListRow[], label: string): CutListRow | undefined {
  return rows.find((r) =>
    r.label.toLowerCase().split(' / ').includes(label.toLowerCase()),
  )
}

function ref(rows: CutListRow[], label: string): string {
  const row = findRow(rows, label)
  return row ? `${label} (part ${row.no})` : label
}

function hardwareFor(spec: ItemSpec): string[] {
  const hw: string[] = []
  switch (spec.kind) {
    case 'cabinet':
    case 'bookshelf':
      hw.push('40 mm wood screws (or 8 mm dowels + glue) for the carcass — 4 per joint')
      if (spec.hasBack) hw.push('20 mm screws for the back panel, ~150 mm spacing')
      if (spec.shelfCount > 0) hw.push(`5 mm shelf pins — 4 per shelf (${spec.shelfCount * 4} total)`)
      if (spec.hasDoors) {
        hw.push('4 × 35 mm concealed cup hinges (full overlay) + mounting plates')
        hw.push('2 × door handles or push latches')
      }
      hw.push('Wood glue, sandpaper (120/240 grit), finish of your choice')
      break
    case 'planter':
      hw.push('40 mm exterior-grade screws — 4 per corner joint')
      hw.push('Exterior wood glue, planter liner or exterior sealant')
      break
    case 'floating_shelf':
      hw.push('2–3 concealed floating-shelf brackets (12 mm rod type) + wall fixings')
      break
  }
  return hw
}

function assemblySteps(spec: ItemSpec, rows: CutListRow[]): string[] {
  const side = ref(rows, 'Side')
  switch (spec.kind) {
    case 'cabinet':
    case 'bookshelf': {
      const steps = [
        `Lay one ${side} on the bench, inside face up.`,
      ]
      if (spec.shelfCount > 0) {
        steps.unshift(
          `Drill the 5 mm shelf pin holes in both ${side} panels before assembly — two columns per side, 50 mm from the front and back edges, 32 mm apart vertically (positions are pre-drawn in the DXF).`,
        )
      }
      steps.push(
        `Glue and screw the ${ref(rows, 'Top')} and ${ref(rows, 'Bottom')} between the two Side panels, flush with the top and bottom ends. Check the diagonals are equal so the carcass is square.`,
      )
      if (spec.hasBack) {
        steps.push(
          `Drop the ${ref(rows, 'Back')} into the rear opening and screw it to the back edges of the carcass — it holds the unit square.`,
        )
      }
      if (spec.shelfCount > 0) {
        steps.push(
          `Insert shelf pins at your preferred heights and fit the ${ref(rows, 'Shelf')} panel${spec.shelfCount > 1 ? 's' : ''}.`,
        )
      }
      if (spec.hasDoors) {
        steps.push(
          `Drill 35 mm hinge cups 22 mm in from the hinge edge of each ${ref(rows, 'Door')}, hang the doors and adjust for an even 2 mm gap all round.`,
        )
      }
      steps.push('Sand all edges and apply your finish.')
      return steps
    }
    case 'planter':
      return [
        `Glue and screw both ${ref(rows, 'End')} panels between the two ${ref(rows, 'Long side')} panels to form the box.`,
        `Fit the ${ref(rows, 'Base')} inside the box, flush with the bottom edges, and screw through the sides and ends into it.`,
        'Drill drainage holes in the base if planting directly, or fit a liner.',
        'Sand the edges and apply an exterior finish.',
      ]
    case 'floating_shelf':
      return [
        'Fix the concealed brackets to the wall, level, at your chosen height.',
        `Drill matching holes into the back edge of the ${ref(rows, 'Shelf')} and slide it onto the brackets.`,
      ]
  }
}

export function generateInstructions(
  spec: ItemSpec,
  rows: CutListRow[],
): string {
  const lines: string[] = []
  lines.push(`# ${spec.name} — build instructions`)
  lines.push('')
  lines.push(
    `External size: **${spec.width} × ${spec.height} × ${spec.depth} mm** (W × H × D), ` +
      `${materialName(spec.material)} ${spec.thickness} mm` +
      (spec.hasBack ? ` with a ${spec.backThickness} mm back` : '') +
      '.',
  )
  lines.push('')

  lines.push('## Cut list')
  lines.push('')
  lines.push('| Part | Description | Size (mm) | Thickness | Qty |')
  lines.push('|------|-------------|-----------|-----------|-----|')
  for (const r of rows) {
    lines.push(
      `| ${r.no} | ${r.label} | ${r.w} × ${r.h} | ${r.thickness} mm | ${r.qty} |`,
    )
  }
  lines.push('')
  for (const a of areaSummary(rows)) {
    lines.push(
      `- ${materialName(a.material)} ${a.thickness} mm: ~${a.areaM2} m² of panels`,
    )
  }
  lines.push('')

  lines.push('## Hardware')
  lines.push('')
  for (const hw of hardwareFor(spec)) lines.push(`- ${hw}`)
  lines.push('')

  lines.push('## Tools')
  lines.push('')
  lines.push('- Drill/driver with 3 mm pilot, 5 mm and countersink bits')
  if (spec.hasDoors) lines.push('- 35 mm Forstner bit for hinge cups')
  lines.push('- Clamps, square, tape measure, sandpaper')
  lines.push('')

  lines.push('## Assembly')
  lines.push('')
  assemblySteps(spec, rows).forEach((step, i) => {
    lines.push(`${i + 1}. ${step}`)
  })
  lines.push('')

  lines.push('## Ordering the panels')
  lines.push('')
  lines.push(
    'Upload the DXF files in this pack to your cutting provider (e.g. cutmy.co.uk) — ' +
      'one file per unique part, drawn 1:1 in millimetres; the quantity to order is in ' +
      'each filename and in `cutlist.csv`.',
  )
  lines.push('')
  return lines.join('\n')
}
