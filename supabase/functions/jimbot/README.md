# Jimbot Edge Function

Edge Function entrypoint: `supabase/functions/jimbot/index.ts`

## Required secrets

- `OPENAI_API_KEY` (set it yourself)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (injected automatically by hosted Supabase; the CLI rejects `SUPABASE_*` names in `secrets set`)

```bash
supabase secrets set OPENAI_API_KEY=your_key_here
```

For local development (`supabase functions serve`), create `supabase/functions/.env`:

```env
OPENAI_API_KEY=your_key_here
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your_local_anon_key
```

## After `db reset` / seed

Hybrid search needs vectors in `business_embeddings`. After resetting or reseeding the DB, run:

```bash
pnpm embed:businesses
```

If the index is empty, Jimbot still works via `ilike` + type aliases (no invented places), but ranking is weaker until embeddings are seeded.

## Serve locally

```bash
supabase functions serve jimbot --env-file supabase/functions/.env
```

## Request shape

`POST /functions/v1/jimbot`

```json
{
  "message": "Plan mo ako 1-day trip sa Iloilo",
  "conversationId": null,
  "planningContext": null,
  "explicitConfirmed": false,
  "history": []
}
```

`Authorization: Bearer <supabase-user-jwt>` is optional for public planning tools, but required for user-scoped tools and `save_itinerary`.
