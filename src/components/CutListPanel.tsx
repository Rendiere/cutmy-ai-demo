import { useMemo, useState } from 'react'
import { useAppStore } from '~/store/useAppStore'
import { areaSummary, cutListToCsv, materialName } from '~/geometry/cutlist'
import { generateInstructions } from '~/geometry/instructions'
import { dxfFileName } from '~/export/dxf'
import { buildCuttingPack, packFileName } from '~/export/zip'

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function CutListPanel() {
  const { spec, cutList } = useAppStore()
  const [tab, setTab] = useState<'cutlist' | 'instructions'>('cutlist')
  const [zipping, setZipping] = useState(false)

  const instructions = useMemo(
    () => (cutList.length ? generateInstructions(spec, cutList) : ''),
    [spec, cutList],
  )

  const downloadPack = async () => {
    if (zipping || cutList.length === 0) return
    setZipping(true)
    try {
      const blob = await buildCuttingPack(spec, cutList)
      download(blob, packFileName(spec))
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-white/10 px-4 py-2">
        {(['cutlist', 'instructions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              tab === t ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {t === 'cutlist' ? 'Cut list' : 'Build instructions'}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button
            onClick={() =>
              download(
                new Blob([cutListToCsv(cutList)], { type: 'text/csv' }),
                'cutlist.csv',
              )
            }
            disabled={cutList.length === 0}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
          >
            CSV
          </button>
          <button
            onClick={() => void downloadPack()}
            disabled={zipping || cutList.length === 0}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            {zipping ? 'Zipping…' : 'Download cutting pack (DXF + CSV)'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'cutlist' ? (
          <>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-white/40">
                  <th className="pb-2 pr-2">#</th>
                  <th className="pb-2 pr-2">Part</th>
                  <th className="pb-2 pr-2">Size (mm)</th>
                  <th className="pb-2 pr-2">Thk</th>
                  <th className="pb-2 pr-2">Qty</th>
                  <th className="pb-2">DXF file</th>
                </tr>
              </thead>
              <tbody className="text-white/85">
                {cutList.map((r) => (
                  <tr key={r.no} className="border-t border-white/5">
                    <td className="py-2 pr-2 text-white/40">{r.no}</td>
                    <td className="py-2 pr-2">{r.label}</td>
                    <td className="py-2 pr-2 tabular-nums">
                      {r.w} × {r.h}
                    </td>
                    <td className="py-2 pr-2 tabular-nums">{r.thickness}</td>
                    <td className="py-2 pr-2 tabular-nums">{r.qty}</td>
                    <td className="py-2 font-mono text-xs text-white/50">
                      {dxfFileName(r)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 space-y-1 text-xs text-white/50">
              {areaSummary(cutList).map((a) => (
                <p key={`${a.material}-${a.thickness}`}>
                  {materialName(a.material)} {a.thickness} mm: ~{a.areaM2} m² of
                  panels
                </p>
              ))}
              <p>
                Upload the DXF files to your cutting provider (e.g. cutmy.co.uk) —
                drawn 1:1 in mm, shelf-pin holes included.
              </p>
            </div>
          </>
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/85">
            {instructions}
          </pre>
        )}
      </div>
    </div>
  )
}
