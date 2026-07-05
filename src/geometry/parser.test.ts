import { describe, expect, it } from 'vitest'
import { parseDescription } from './parser'

describe('parseDescription', () => {
  it('parses a bookshelf with named dimensions and shelf count', () => {
    const { spec } = parseDescription(
      'I want a bookshelf 800mm wide, 2m tall and 300mm deep with 4 shelves',
    )
    expect(spec.kind).toBe('bookshelf')
    expect(spec.width).toBe(800)
    expect(spec.height).toBe(2000)
    expect(spec.depth).toBe(300)
    expect(spec.shelfCount).toBe(4)
    expect(spec.hasDoors).toBe(false)
  })

  it('parses W x H x D triples with mixed units', () => {
    const { spec } = parseDescription('a cabinet 80cm x 90cm x 40cm with doors')
    expect(spec.kind).toBe('cabinet')
    expect(spec.width).toBe(800)
    expect(spec.height).toBe(900)
    expect(spec.depth).toBe(400)
    expect(spec.hasDoors).toBe(true)
  })

  it('parses word numbers and "no doors"', () => {
    const { spec } = parseDescription(
      'a cupboard with two shelves and no doors, width of 60cm',
    )
    expect(spec.kind).toBe('cabinet')
    expect(spec.shelfCount).toBe(2)
    expect(spec.hasDoors).toBe(false)
    expect(spec.width).toBe(600)
  })

  it('recognises planters and floating shelves', () => {
    expect(parseDescription('a garden planter 1.2m x 40cm x 40cm').spec.kind).toBe(
      'planter',
    )
    expect(parseDescription('a floating shelf 900 wide').spec.kind).toBe(
      'floating_shelf',
    )
  })

  it('refines an existing spec without resetting unmentioned fields', () => {
    const first = parseDescription('a bookshelf 800 wide, 1800 tall, 300 deep').spec
    const second = parseDescription('make it 2m tall', first).spec
    expect(second.kind).toBe('bookshelf')
    expect(second.height).toBe(2000)
    expect(second.width).toBe(800)
    expect(second.depth).toBe(300)
  })

  it('is deterministic', () => {
    const text = 'a cabinet 800 x 900 x 400 with 1 shelf and doors'
    expect(parseDescription(text)).toEqual(parseDescription(text))
  })
})
