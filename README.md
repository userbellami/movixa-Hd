# MOVIXA STREAM
Premium movie and TV discovery site powered by TMDB (trailers, details, where to watch).

## Deploy on Vercel
1. Import this repo in Vercel (no build settings needed, framework "Other").
2. Settings > Environment Variables: add `TMDB_API_KEY` (v3 key or v4 read token).
3. Redeploy.

## Edit contact and social links
Open `js/config.js`, change values, commit and push.

## Local test (Termux)
    pkg install nodejs
    TMDB_API_KEY=your_key node server.js

This product uses the TMDB API but is not endorsed or certified by TMDB.
