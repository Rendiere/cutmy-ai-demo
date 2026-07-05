/**
 * Bundle the full cutting pack as a ZIP:
 * per-panel DXFs + cutlist.csv + instructions.md.
 */

import JSZip from 'jszip'
import type { CutListRow, ItemSpec } from '~/geometry/types'
import { cutListToCsv } from '~/geometry/cutlist'
import { generateInstructions } from '~/geometry/instructions'
import { cutListToDxfFiles } from './dxf'

export async function buildCuttingPack(
  spec: ItemSpec,
  rows: CutListRow[],
): Promise<Blob> {
  const zip = new JSZip()

  const dxfDir = zip.folder('dxf')!
  for (const file of cutListToDxfFiles(rows)) {
    dxfDir.file(file.name, file.content)
  }

  zip.file('cutlist.csv', cutListToCsv(rows))
  zip.file('instructions.md', generateInstructions(spec, rows))

  return zip.generateAsync({ type: 'blob' })
}

export function packFileName(spec: ItemSpec): string {
  const slug = spec.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'cutting-pack'}_${spec.width}x${spec.height}x${spec.depth}mm.zip`
}
