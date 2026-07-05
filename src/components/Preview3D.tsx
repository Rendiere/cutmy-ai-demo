import { Canvas } from '@react-three/fiber'
import { Edges, OrbitControls } from '@react-three/drei'
import { useMemo } from 'react'
import { useAppStore } from '~/store/useAppStore'
import { layoutPanels } from '~/geometry/layout'
import type { PlacedPanel } from '~/geometry/layout'
import type { ItemSpec } from '~/geometry/types'

const ROLE_COLORS: Record<string, string> = {
  side: '#d4a86a',
  top: '#c89b5f',
  bottom: '#c89b5f',
  shelf: '#e0b878',
  door: '#b98d52',
  back: '#8a6f4d',
  end: '#c89b5f',
  base: '#b98d52',
}

const MM = 0.001

/** Direction to push each panel in exploded view, per role. */
function explodeOffset(p: PlacedPanel, spec: ItemSpec): [number, number, number] {
  const gap = 120
  switch (p.role) {
    case 'side':
      return [p.position[0] < spec.width / 2 ? -gap : gap, 0, 0]
    case 'end':
      return [p.position[0] < spec.width / 2 ? -gap : gap, 0, 0]
    case 'top':
      return [0, gap, 0]
    case 'bottom':
    case 'base':
      return [0, -gap, 0]
    case 'back':
      return [0, 0, -gap]
    case 'door':
      return [0, 0, gap * 2]
    default:
      return [0, 0, gap / 2]
  }
}

function PanelMeshes({ spec, exploded }: { spec: ItemSpec; exploded: boolean }) {
  const placed = useMemo(() => layoutPanels(spec), [spec])
  return (
    <group
      position={[
        (-spec.width / 2) * MM,
        (-spec.height / 2) * MM,
        (-spec.depth / 2) * MM,
      ]}
    >
      {placed.map((p) => {
        const off = exploded ? explodeOffset(p, spec) : [0, 0, 0]
        return (
          <mesh
            key={p.key}
            position={[
              (p.position[0] + off[0]!) * MM,
              (p.position[1] + off[1]!) * MM,
              (p.position[2] + off[2]!) * MM,
            ]}
          >
            <boxGeometry
              args={[p.size[0] * MM, p.size[1] * MM, p.size[2] * MM]}
            />
            <meshStandardMaterial
              color={ROLE_COLORS[p.role] ?? '#d4a86a'}
              roughness={0.8}
            />
            <Edges linewidth={1} threshold={15} color="#3a2e1f" />
          </mesh>
        )
      })}
    </group>
  )
}

export function Preview3D() {
  const { spec, panels, exploded, setExploded } = useAppStore()
  const radius =
    Math.max(spec.width, spec.height, spec.depth) * MM * (exploded ? 2.2 : 1.6)

  return (
    <div className="relative h-full min-h-[320px]">
      {panels.length > 0 ? (
        <Canvas
          camera={{ position: [radius, radius * 0.75, radius], fov: 45 }}
          key={exploded ? 'x' : 'n'}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 4]} intensity={1.2} />
          <directionalLight position={[-3, 2, -4]} intensity={0.4} />
          <PanelMeshes spec={spec} exploded={exploded} />
          <OrbitControls makeDefault enableDamping />
          <gridHelper args={[4, 20, '#2a2f3a', '#1b1f28']} position={[0, (-spec.height / 2) * MM, 0]} />
        </Canvas>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-white/40">
          Fix the specification to see the preview
        </div>
      )}
      <button
        className="absolute right-3 top-3 rounded-md border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white/80 backdrop-blur hover:bg-black/60"
        onClick={() => setExploded(!exploded)}
      >
        {exploded ? 'Assembled view' : 'Exploded view'}
      </button>
    </div>
  )
}
