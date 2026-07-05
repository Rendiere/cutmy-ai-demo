# cutmy-ai-demo

Describe a simple household item in plain language → confirm the spec → get a
**simplified cut list**, **build instructions** and **DXF cut files** ready to upload
to a sheet-cutting service such as [cutmy.co.uk](https://cutmy.co.uk).

Supported items: cabinets (optional overlay doors), bookshelves, garden planters and
floating shelves — all parametric (width × height × depth, shelf count, doors, back panel).

## What you get

Clicking **Download cutting pack** produces a ZIP:

```
dxf/
  01_back_x1__764x1964mm.dxf      ← one file per unique part, 1:1 in mm
  02_side_x2__300x2000mm.dxf      ← shelf-pin holes drawn as 5 mm circles
  03_top-bottom_x2__764x300mm.dxf ← identical panels deduplicated (qty in name)
  04_shelf_x4__763x280mm.dxf
cutlist.csv                       ← Part, Description, Length/Width/Thickness (mm), Qty
instructions.md                   ← hardware list + ordered assembly steps
```

Part numbers are stable across the CSV, the DXF filenames, the on-screen cut list and
the build instructions.

## Construction rules

- 18 mm birch plywood carcass, 9 mm inset back panel
- Adjustable shelves on 5 mm pins — two columns per side, 50 mm from the front/back
  face, 32 mm pitch (pre-drawn in the side-panel DXFs)
- Overlay doors: 2 mm gap all round (`door_w = (W − 6) / 2`, `door_h = H − 4`)

## Running

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # geometry / cut list / parser / DXF unit tests
npm run build && npm start
```

### AI chat

Set `ANTHROPIC_API_KEY` to have Claude interpret your descriptions (streaming, with
prompt caching). **Without a key the app still works**: a built-in deterministic parser
handles phrases like "a bookshelf 800mm wide, 2m tall with 4 shelves", "no doors",
"make it 60cm deep" — the chat badge shows which mode is active.

## Deployment (free, GitHub Pages)

Every push to `master` runs `.github/workflows/deploy-pages.yml`: unit tests, a static
SPA build (`PAGES_BASE=/<repo>/ npm run build`), and a publish of `dist/client` to the
`gh-pages` branch. On static hosting there is no server, so the chat always uses the
built-in parser — the cut list, 3D preview, instructions and DXF/ZIP export are all
client-side and fully functional.

One-time setup (GitHub only lets repo admins do this): **Settings → Pages → Source:
Deploy from a branch → `gh-pages` / `/ (root)`**. After that the site is live at
`https://<owner>.github.io/cutmy-ai-demo/` and every deploy is automatic.

## Stack

TanStack Start + TypeScript · react-three-fiber 3D preview · pure-TS geometry engine
(`src/geometry/engine.ts`) · dxf-writer + JSZip export · Zustand · Tailwind CSS.
