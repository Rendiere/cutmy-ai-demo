import { useAppStore } from '~/store/useAppStore'
import type { ItemKind } from '~/geometry/types'
import { defaultSpec } from '~/geometry/types'

const KIND_LABELS: Record<ItemKind, string> = {
  cabinet: 'Cabinet (doors optional)',
  bookshelf: 'Bookshelf',
  planter: 'Garden planter',
  floating_shelf: 'Floating shelf',
}

function NumberField(props: {
  label: string
  value: number
  min?: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-white/60">
      {props.label}
      <input
        type="number"
        className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-sky-500"
        value={props.value}
        min={props.min ?? 1}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (Number.isFinite(v)) props.onChange(v)
        }}
      />
    </label>
  )
}

export function SpecForm() {
  const { spec, setSpec, specError } = useAppStore()
  const isCarcass = spec.kind === 'cabinet' || spec.kind === 'bookshelf'

  return (
    <div className="space-y-3 border-t border-white/10 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
        Specification
      </h2>

      <label className="flex flex-col gap-1 text-xs text-white/60">
        Item type
        <select
          className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-sky-500"
          value={spec.kind}
          onChange={(e) => setSpec(defaultSpec(e.target.value as ItemKind))}
        >
          {Object.entries(KIND_LABELS).map(([kind, label]) => (
            <option key={kind} value={kind} className="bg-slate-900">
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-3 gap-2">
        <NumberField
          label="Width (mm)"
          value={spec.width}
          onChange={(width) => setSpec({ ...spec, width })}
        />
        <NumberField
          label="Height (mm)"
          value={spec.height}
          onChange={(height) => setSpec({ ...spec, height })}
        />
        <NumberField
          label="Depth (mm)"
          value={spec.depth}
          onChange={(depth) => setSpec({ ...spec, depth })}
        />
      </div>

      {isCarcass && (
        <div className="flex items-end gap-4">
          <div className="w-24">
            <NumberField
              label="Shelves"
              value={spec.shelfCount}
              min={0}
              onChange={(shelfCount) =>
                setSpec({ ...spec, shelfCount: Math.max(0, Math.round(shelfCount)) })
              }
            />
          </div>
          {spec.kind === 'cabinet' && (
            <label className="flex items-center gap-2 pb-1.5 text-sm text-white/80">
              <input
                type="checkbox"
                checked={spec.hasDoors}
                onChange={(e) => setSpec({ ...spec, hasDoors: e.target.checked })}
              />
              Doors
            </label>
          )}
          <label className="flex items-center gap-2 pb-1.5 text-sm text-white/80">
            <input
              type="checkbox"
              checked={spec.hasBack}
              onChange={(e) => setSpec({ ...spec, hasBack: e.target.checked })}
            />
            Back panel
          </label>
        </div>
      )}

      {specError && (
        <p className="rounded-md bg-red-500/15 px-3 py-2 text-xs text-red-300">
          {specError}
        </p>
      )}
    </div>
  )
}
