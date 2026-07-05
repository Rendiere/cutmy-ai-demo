/**
 * 3D placement of panels for the preview.
 * Coordinates: X = width, Y = height, Z = depth (toward the viewer).
 * Positions are box centres in mm, matching the generated panel set.
 */

import type { ItemSpec } from './types'
import { DEFAULTS } from './types'

export interface PlacedPanel {
  key: string
  label: string
  /** Box size [x, y, z] in mm */
  size: [number, number, number]
  /** Box centre [x, y, z] in mm, origin at the item's bottom-front-left */
  position: [number, number, number]
  role: string
}

export function layoutPanels(spec: ItemSpec): PlacedPanel[] {
  const { width: W, height: H, depth: D, thickness: t } = spec
  const placed: PlacedPanel[] = []

  const push = (
    key: string,
    label: string,
    role: string,
    size: [number, number, number],
    position: [number, number, number],
  ) => placed.push({ key, label, role, size, position })

  switch (spec.kind) {
    case 'cabinet':
    case 'bookshelf': {
      push('side-l', 'Side', 'side', [t, H, D], [t / 2, H / 2, D / 2])
      push('side-r', 'Side', 'side', [t, H, D], [W - t / 2, H / 2, D / 2])
      push('top', 'Top', 'top', [W - 2 * t, t, D], [W / 2, H - t / 2, D / 2])
      push('bottom', 'Bottom', 'bottom', [W - 2 * t, t, D], [W / 2, t / 2, D / 2])
      if (spec.hasBack) {
        const tb = spec.backThickness
        push(
          'back',
          'Back',
          'back',
          [W - 2 * t, H - 2 * t, tb],
          [W / 2, H / 2, tb / 2],
        )
      }
      const innerH = H - 2 * t
      for (let i = 0; i < spec.shelfCount; i++) {
        const y = t + (innerH * (i + 1)) / (spec.shelfCount + 1)
        push(
          `shelf-${i}`,
          'Shelf',
          'shelf',
          [W - 2 * t - DEFAULTS.shelfClearance, t, D - DEFAULTS.shelfFrontSetback],
          [W / 2, y, (D - DEFAULTS.shelfFrontSetback) / 2 + DEFAULTS.shelfFrontSetback / 2],
        )
      }
      if (spec.hasDoors) {
        const g = DEFAULTS.doorGap
        const dw = (W - 3 * g) / 2
        const dh = H - 2 * g
        push('door-l', 'Door', 'door', [dw, dh, t], [g + dw / 2, H / 2, D + t / 2])
        push('door-r', 'Door', 'door', [dw, dh, t], [W - g - dw / 2, H / 2, D + t / 2])
      }
      break
    }
    case 'planter': {
      push('side-f', 'Long side', 'side', [W, H, t], [W / 2, H / 2, D - t / 2])
      push('side-b', 'Long side', 'side', [W, H, t], [W / 2, H / 2, t / 2])
      push('end-l', 'End', 'end', [t, H, D - 2 * t], [t / 2, H / 2, D / 2])
      push('end-r', 'End', 'end', [t, H, D - 2 * t], [W - t / 2, H / 2, D / 2])
      push('base', 'Base', 'base', [W - 2 * t, t, D - 2 * t], [W / 2, t / 2, D / 2])
      break
    }
    case 'floating_shelf': {
      push('shelf', 'Shelf', 'shelf', [W, t, D], [W / 2, t / 2, D / 2])
      break
    }
  }

  return placed
}
