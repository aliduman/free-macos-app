# free-macos-app

Bilingual (TR/EN) web app for browsing open source macOS applications.

Data source: [open-source-mac-os-apps](https://github.com/serhii-londar/open-source-mac-os-apps)

## How data works

- On first visit (or after 7 days), the app fetches data from GitHub
- All app descriptions are translated to Turkish via [MyMemory](https://mymemory.translated.net/) (free API)
- Translated data is saved to **localStorage**
- For the rest of the week, data is read from localStorage (no network needed)

## Setup

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run fetch-data` | Optional: pre-fetch data to `public/data` (legacy) |
| `npm run preview` | Preview production build |

## localStorage key

`free-macos-app-data-v1` — contains apps + `fetchedAt` timestamp

## AGENT NOTE

 To resume this session: agent --resume=e75a9fb0-7b93-4d0f-8ea1-3d0b7ed7b6e5
