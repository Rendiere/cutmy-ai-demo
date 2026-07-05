import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsConfigPaths from 'vite-tsconfig-paths'

// Static SPA build for GitHub Pages: `PAGES_BASE=/cutmy-ai-demo/ vite build`
// emits a fully static site in dist/client (no server; the chat falls back to
// the built-in parser). Unset, the default SSR build/dev server is used.
const pagesBase = process.env.PAGES_BASE

export default defineConfig({
  base: pagesBase ?? '/',
  plugins: [
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
    tanstackStart(
      pagesBase ? { spa: { enabled: true } } : {},
    ),
    viteReact(),
    tailwindcss(),
  ],
})
