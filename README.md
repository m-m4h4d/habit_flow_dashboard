# HabitFlow Dashboard

A private, local-first habit tracker: daily check-ins, streaks, weekly targets and charts. Data is stored in the browser (`localStorage`). No account or backend.

- `/` – landing page (`index.html`)
- `/app` – the dashboard (`app.html` → `src/HabitFlowDashboard.jsx`)

## Develop

```bash
npm install
npm run dev      # http://localhost:5173 (dashboard at /app.html in dev)
npm run build    # outputs to dist/
npm run preview
```

Stack: Vite, React 18, Tailwind CSS 3, lucide-react.

## Deploy to Vercel

Import the repo in Vercel. No settings needed; `vercel.json` sets the Vite framework preset, `npm run build`, the `dist` output, and `cleanUrls` so `app.html` is served at `/app`.

Or use the CLI: `npx vercel` (preview) / `npx vercel --prod`.
