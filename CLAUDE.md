# cutmy-ai-demo — Claude Instructions

## What this is

A web app (TanStack Start, TypeScript) that lets a user describe a woodworking cabinet in plain language, confirms the spec via AI chat, shows a 3D preview, and exports DXF files ready for upload to a sheet-cutting service like cutmy.co.uk. Intended as a B2B-licensed tool for cutting suppliers.

## Repo structure

```
src/
  routes/            ← TanStack Start file-based routes
  components/        ← React components (chat, 3D preview, cut list)
  geometry/          ← Pure TS panel geometry engine (no deps)
  export/            ← DXF generation and ZIP bundling
  store/             ← Zustand state (conversation, panel set, camera)
local/               ← gitignored: FreeCAD files, DXF outputs, Python tooling
  projects/
    hallway-cabinet/ ← worked example (cut list, DXF files)
    garden-planter/
```

## Domain knowledge

The geometry rules live in `local/` — specifically:
- `local/projects/hallway-cabinet/NOTES.md` — worked example cut list
- The `freecad-diy-project` skill at `~/.claude/skills/freecad-diy-project/SKILL.md`

The geometry engine (`src/geometry/engine.ts`) is a TypeScript port of those rules.

## Key conventions

- **DXF naming:** `NN_description_xQTY__WxHmm.dxf`
- **Ply:** 18 mm birch (default), 9 mm birch (back panels)
- **Shelf pin holes:** 5 mm diameter, 32 mm pitch, columns at 50 mm from front and back face
- **Overlay doors:** 2 mm gap all round, `door_w = (W - 6) / 2`, `door_h = CH - 4`

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | TanStack Start (Vinxi) + TypeScript |
| 3D | react-three-fiber + @react-three/drei |
| AI | @anthropic-ai/sdk with streaming + prompt caching |
| Geometry | Pure TypeScript, no deps |
| DXF | dxf-writer |
| ZIP | JSZip |
| State | Zustand |
| Styling | Tailwind CSS |
