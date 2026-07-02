# Death Race Radio

A Juice WRLD music catalog and player. Browse the full discography — released albums, unreleased tracks, unsurfaced recordings, and recording sessions — all organized by era.

**Live at [deathraceradio.xyz](https://deathraceradio.xyz)**

---

## Features

- Browse and search the full Juice WRLD catalog
- Filter by era and category (Released, Unreleased, Unsurfaced, Recording Sessions)
- Audio playback with queue support
- Synced lyrics
- Like and save tracks
- Comments on songs
- Radio mode

## Stack

- React 19 + TypeScript
- Vite + Tailwind CSS v4
- Redux Toolkit (state management + API layer)
- React Router v7
- Supabase (auth, likes, comments)

## Data

All song data and audio is served by [juicewrldapi.com](https://juicewrldapi.com).

## Running Locally

```bash
npm install
npm run dev
```

To enable auth, likes, and comments, create a `.env` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Without these the app still runs, it falls back to a local demo mode using browser storage.

## Deploying

The project is configured for both [GitHub Pages](.github/workflows/deploy.yml) and [Vercel](vercel.json).

**GitHub Pages:** Add your Supabase credentials as repository secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), then push to `main`. The workflow handles the rest.

**Vercel:** Import the repo and set the same two environment variables in the project settings.

## Contributing

Pull requests are welcome. For larger changes, open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
