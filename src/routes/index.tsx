import { createFileRoute } from '@tanstack/react-router'
import { ChatPanel } from '~/components/ChatPanel'
import { SpecForm } from '~/components/SpecForm'
import { Preview3D } from '~/components/Preview3D'
import { CutListPanel } from '~/components/CutListPanel'
import { useAppStore } from '~/store/useAppStore'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const spec = useAppStore((s) => s.spec)

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
        <h1 className="text-lg font-semibold">
          cutmy<span className="text-sky-400">.ai</span>
        </h1>
        <p className="text-sm text-white/50">
          Describe it → confirm the spec → download DXF cut files
        </p>
        <span className="ml-auto rounded-md bg-white/5 px-3 py-1 text-xs text-white/60">
          {spec.name} · {spec.width} × {spec.height} × {spec.depth} mm
        </span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[360px_1fr_460px]">
        <section className="flex min-h-0 flex-col border-r border-white/10">
          <div className="min-h-0 flex-1">
            <ChatPanel />
          </div>
          <SpecForm />
        </section>

        <section className="min-h-0 border-r border-white/10">
          <Preview3D />
        </section>

        <section className="min-h-0">
          <CutListPanel />
        </section>
      </div>
    </main>
  )
}
