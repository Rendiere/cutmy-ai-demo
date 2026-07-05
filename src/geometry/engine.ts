/**
 * Panel geometry engine: ItemSpec → Panel[].
 *
 * TypeScript port of the FreeCAD project rules (see CLAUDE.md):
 * - 18 mm birch ply carcass, 9 mm birch ply backs
 * - Shelf pin holes: 5 mm dia, 32 mm pitch, columns 50 mm from front and back face
 * - Overlay doors: 2 mm gap all round → door_w = (W - 6) / 2, door_h = CH - 4
 */

import type { Hole, ItemSpec, Panel } from './types'
import { DEFAULTS } from './types'

/** Shelf pin hole pattern for one side panel (panel drawn as depth × height). */
export function sidePinHoles(spec: ItemSpec): Hole[] {
  if (spec.shelfCount <= 0) return []
  const { pinHoleDiameter, pinHolePitch, pinHoleInset, pinHoleEndMargin } =
    DEFAULTS
  const columns = [pinHoleInset, spec.depth - pinHoleInset]
  const holes: Hole[] = []
  for (
    let y = pinHoleEndMargin;
    y <= spec.height - pinHoleEndMargin;
    y += pinHolePitch
  ) {
    for (const x of columns) {
      holes.push({ x, y, diameter: pinHoleDiameter })
    }
  }
  return holes
}

function validateSpec(spec: ItemSpec): void {
  const { width: W, height: H, depth: D, thickness: t } = spec
  if (![W, H, D, t].every((v) => Number.isFinite(v) && v > 0)) {
    throw new Error('Spec dimensions must be positive numbers')
  }
  if (spec.kind !== 'floating_shelf' && (W <= 2 * t || H <= 2 * t || D <= t)) {
    throw new Error('Item is too small for the panel thickness')
  }
}

function carcassPanels(spec: ItemSpec): Panel[] {
  const { width: W, height: H, depth: D, thickness: t, material } = spec
  const panels: Panel[] = []

  panels.push({
    role: 'side',
    label: 'Side',
    w: D,
    h: H,
    thickness: t,
    material,
    qty: 2,
    holes: sidePinHoles(spec),
    notes:
      spec.shelfCount > 0
        ? 'Drill shelf pin holes 5 mm dia on the inside face'
        : undefined,
  })

  panels.push({
    role: 'top',
    label: 'Top',
    w: W - 2 * t,
    h: D,
    thickness: t,
    material,
    qty: 1,
    holes: [],
    notes: 'Fits between the sides',
  })
  panels.push({
    role: 'bottom',
    label: 'Bottom',
    w: W - 2 * t,
    h: D,
    thickness: t,
    material,
    qty: 1,
    holes: [],
    notes: 'Fits between the sides',
  })

  if (spec.shelfCount > 0) {
    panels.push({
      role: 'shelf',
      label: 'Shelf',
      w: W - 2 * t - DEFAULTS.shelfClearance,
      h: D - DEFAULTS.shelfFrontSetback,
      thickness: t,
      material,
      qty: spec.shelfCount,
      holes: [],
      notes: 'Adjustable, rests on 5 mm shelf pins',
    })
  }

  if (spec.hasBack) {
    panels.push({
      role: 'back',
      label: 'Back',
      w: W - 2 * t,
      h: H - 2 * t,
      thickness: spec.backThickness,
      material,
      qty: 1,
      holes: [],
      notes: 'Inset into the carcass opening, screwed to rear edges',
    })
  }

  if (spec.hasDoors) {
    const { doorGap } = DEFAULTS
    panels.push({
      role: 'door',
      label: 'Door',
      w: (W - 3 * doorGap) / 2,
      h: H - 2 * doorGap,
      thickness: t,
      material,
      qty: 2,
      holes: [],
      notes: `Overlay pair, ${doorGap} mm gap all round`,
    })
  }

  return panels
}

function planterPanels(spec: ItemSpec): Panel[] {
  const { width: W, height: H, depth: D, thickness: t, material } = spec
  return [
    {
      role: 'side',
      label: 'Long side',
      w: W,
      h: H,
      thickness: t,
      material,
      qty: 2,
      holes: [],
    },
    {
      role: 'end',
      label: 'End',
      w: D - 2 * t,
      h: H,
      thickness: t,
      material,
      qty: 2,
      holes: [],
      notes: 'Fits between the long sides',
    },
    {
      role: 'base',
      label: 'Base',
      w: W - 2 * t,
      h: D - 2 * t,
      thickness: t,
      material,
      qty: 1,
      holes: [],
      notes: 'Drill 10 mm drainage holes on site if planting directly',
    },
  ]
}

function floatingShelfPanels(spec: ItemSpec): Panel[] {
  const { width: W, depth: D, thickness: t, material } = spec
  return [
    {
      role: 'shelf',
      label: 'Shelf',
      w: W,
      h: D,
      thickness: t,
      material,
      qty: 1,
      holes: [],
      notes: 'Mount on concealed floating-shelf brackets',
    },
  ]
}

/** Generate the full panel set for an item. */
export function generatePanels(spec: ItemSpec): Panel[] {
  validateSpec(spec)
  switch (spec.kind) {
    case 'cabinet':
    case 'bookshelf':
      return carcassPanels(spec)
    case 'planter':
      return planterPanels(spec)
    case 'floating_shelf':
      return floatingShelfPanels(spec)
  }
}
