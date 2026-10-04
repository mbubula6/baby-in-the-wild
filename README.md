# Baby in the Wild 🌿
Mobile-first web app: map of playgrounds, nurseries, kindergartens, toilets and changing tables (OpenStreetMap data), favorites, community-added places, nanny finder (preview), accounts (Supabase). PL/EN.

## Run
1. `npm install`
2. Create a Supabase project, run `supabase.sql` in the SQL editor. For the demo, turn off "Confirm email" (Auth > Providers > Email).
3. `cp .env.example .env` and fill in the URL and anon key.
4. `npm run dev`

## Deploy
Push to GitHub, import in Vercel (Vite is auto-detected), add the two `VITE_SUPABASE_*` env vars.
Without the env vars the map, list and local favorites still work; accounts and community places need Supabase.
