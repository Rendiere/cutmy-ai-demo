import { describe, expect, it } from 'vitest'
import { generatePanels, sidePinHoles } from './engine'
import { defaultSpec } from './types'
import type { ItemSpec } from './types'

const cabinet: ItemSpec = {
  ...defaultSpec('cabinet'),
  width: 800,
  height: 900,
  depth: 400,
  shelfCount: 2,
  hasDoors: true,
  hasBack: true,
}

describe('generatePanels — cabinet', () => {
  const panels = generatePanels(cabinet)
  const byRole = (role: string) => panels.find((p) => p.role === role)!

  it('produces two full-height sides at depth × height', () => {
    const side = byRole('side')
    expect(side.qty).toBe(2)
    expect(side.w).toBe(400)
    expect(side.h).toBe(900)
    expect(side.thickness).toBe(18)
  })

  it('top and bottom fit between the sides', () => {
    for (const role of ['top', 'bottom']) {
      const p = byRole(role)
      expect(p.w).toBe(800 - 36)
      expect(p.h).toBe(400)
      expect(p.qty).toBe(1)
    }
  })

  it('back is 9 mm and inset into the opening', () => {
    const back = byRole('back')
    expect(back.thickness).toBe(9)
    expect(back.w).toBe(800 - 36)
    expect(back.h).toBe(900 - 36)
  })

  it('shelves have side clearance and front setback', () => {
    const shelf = byRole('shelf')
    expect(shelf.qty).toBe(2)
    expect(shelf.w).toBe(800 - 36 - 1)
    expect(shelf.h).toBe(400 - 20)
  })

  it('overlay doors follow door_w = (W - 6) / 2 and door_h = CH - 4', () => {
    const door = byRole('door')
    expect(door.qty).toBe(2)
    expect(door.w).toBe((800 - 6) / 2)
    expect(door.h).toBe(900 - 4)
  })
})

describe('shelf pin holes', () => {
  it('columns sit 50 mm from front and back face, 32 mm pitch, 5 mm dia', () => {
    const holes = sidePinHoles(cabinet)
    expect(holes.length).toBeGreaterThan(0)
    const xs = [...new Set(holes.map((h) => h.x))].sort((a, b) => a - b)
    expect(xs).toEqual([50, 350])
    const ys = [...new Set(holes.map((h) => h.y))].sort((a, b) => a - b)
    expect(ys[0]).toBe(96)
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]! - ys[i - 1]!).toBe(32)
    }
    expect(ys[ys.length - 1]!).toBeLessThanOrEqual(900 - 96)
    expect(holes.every((h) => h.diameter === 5)).toBe(true)
  })

  it('no pin holes when there are no shelves', () => {
    expect(sidePinHoles({ ...cabinet, shelfCount: 0 })).toEqual([])
  })
})

describe('generatePanels — other kinds', () => {
  it('bookshelf has no doors', () => {
    const panels = generatePanels(defaultSpec('bookshelf'))
    expect(panels.some((p) => p.role === 'door')).toBe(false)
    expect(panels.some((p) => p.role === 'back')).toBe(true)
  })

  it('planter is five panels forming a box', () => {
    const spec = { ...defaultSpec('planter'), width: 1000, height: 400, depth: 400 }
    const panels = generatePanels(spec)
    expect(panels.map((p) => p.qty).reduce((a, b) => a + b, 0)).toBe(5)
    const end = panels.find((p) => p.role === 'end')!
    expect(end.w).toBe(400 - 36)
    const base = panels.find((p) => p.role === 'base')!
    expect(base.w).toBe(1000 - 36)
    expect(base.h).toBe(400 - 36)
  })

  it('floating shelf is a single panel', () => {
    const panels = generatePanels(defaultSpec('floating_shelf'))
    expect(panels).toHaveLength(1)
    expect(panels[0]!.qty).toBe(1)
  })

  it('rejects impossible dimensions', () => {
    expect(() => generatePanels({ ...cabinet, width: 20 })).toThrow()
    expect(() => generatePanels({ ...cabinet, height: -5 })).toThrow()
  })
})
