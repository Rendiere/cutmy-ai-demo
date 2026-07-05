/**
 * Core domain types for the panel geometry engine.
 * All dimensions are millimetres. Pure TypeScript, no dependencies.
 */

export type ItemKind = 'cabinet' | 'bookshelf' | 'planter' | 'floating_shelf'

export type Material = 'birch_ply'

export interface ItemSpec {
  kind: ItemKind
  /** Display name, e.g. "Hallway cabinet" */
  name: string
  /** External width */
  width: number
  /** External height */
  height: number
  /** External depth (front to back) */
  depth: number
  /** Number of adjustable shelves (cabinet/bookshelf only) */
  shelfCount: number
  /** Pair of overlay doors (cabinet only) */
  hasDoors: boolean
  /** 9 mm back panel (cabinet/bookshelf only) */
  hasBack: boolean
  material: Material
  /** Carcass panel thickness (default 18) */
  thickness: number
  /** Back panel thickness (default 9) */
  backThickness: number
}

/** A drilled hole on a panel face. Coordinates from the panel's bottom-left corner. */
export interface Hole {
  x: number
  y: number
  diameter: number
}

export type PanelRole =
  | 'side'
  | 'top'
  | 'bottom'
  | 'shelf'
  | 'door'
  | 'back'
  | 'end'
  | 'base'

export interface Panel {
  role: PanelRole
  /** Human label, e.g. "Side" */
  label: string
  /** Panel width in mm (X axis of the DXF drawing) */
  w: number
  /** Panel height in mm (Y axis of the DXF drawing) */
  h: number
  thickness: number
  material: Material
  qty: number
  holes: Hole[]
  notes?: string
}

/** One row of the simplified (deduplicated) cut list. */
export interface CutListRow {
  /** Stable two-digit part number, "01".. */
  no: string
  /** Merged label, e.g. "Top / Bottom" */
  label: string
  w: number
  h: number
  thickness: number
  material: Material
  qty: number
  holes: Hole[]
  notes?: string
}

export const DEFAULTS = {
  thickness: 18,
  backThickness: 9,
  material: 'birch_ply' as Material,
  /** Shelf pin holes: 5 mm dia, 32 mm pitch, columns 50 mm from front and back face */
  pinHoleDiameter: 5,
  pinHolePitch: 32,
  pinHoleInset: 50,
  /** First/last pin hole distance from panel bottom/top edge */
  pinHoleEndMargin: 96,
  /** Overlay doors: 2 mm gap all round */
  doorGap: 2,
  /** Total side-to-side clearance for adjustable shelves */
  shelfClearance: 1,
  /** Shelves sit back from the front edge to clear doors and pin columns */
  shelfFrontSetback: 20,
} as const

export function defaultSpec(kind: ItemKind = 'cabinet'): ItemSpec {
  const base = {
    material: DEFAULTS.material,
    thickness: DEFAULTS.thickness,
    backThickness: DEFAULTS.backThickness,
  }
  switch (kind) {
    case 'cabinet':
      return {
        ...base,
        kind,
        name: 'Cabinet',
        width: 800,
        height: 900,
        depth: 400,
        shelfCount: 1,
        hasDoors: true,
        hasBack: true,
      }
    case 'bookshelf':
      return {
        ...base,
        kind,
        name: 'Bookshelf',
        width: 800,
        height: 1800,
        depth: 300,
        shelfCount: 4,
        hasDoors: false,
        hasBack: true,
      }
    case 'planter':
      return {
        ...base,
        kind,
        name: 'Garden planter',
        width: 1000,
        height: 400,
        depth: 400,
        shelfCount: 0,
        hasDoors: false,
        hasBack: false,
      }
    case 'floating_shelf':
      return {
        ...base,
        kind,
        name: 'Floating shelf',
        width: 900,
        height: 18,
        depth: 240,
        shelfCount: 0,
        hasDoors: false,
        hasBack: false,
      }
  }
}
