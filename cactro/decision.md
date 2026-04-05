# Decisions

## Which APIs did you choose and why?

Frankfurter API (`api.frankfurter.app`) for both the premium path and as the primary free-tier source — it's free, reliable, and returns clean JSON. OpenER API (`open.er-api.com`) as the free-tier fallback — different provider, so a Frankfurter outage doesn't take both down.

## What's your fallback strategy when an API fails?

Tiered fallback:
- Paid user → Frankfurter fails → fall back to free pool (Frankfurter → OpenER), set `premium_fallback: true` in response
- Free user → Frankfurter fails → try OpenER
- Both fail → return HTTP 503

Errors are caught, logged, and never propagate as unhandled exceptions.

## How do you handle conflicting data from different sources?

We don't merge — we use the first successful response and stop. No averaging or reconciliation. The source field in the response tells the client exactly where the rate came from.

## What does the user see when things fail or data is stale?

- API error: inline red error text per row in the table, no crash or navigation away
- Stale data: the freshness indicator turns amber with a "⚠ stale" suffix once the cache TTL is exceeded (5 min for premium, 3 min for free)
- Full outage: a 503 response, shown as an inline error in the UI

## Did you do anything to improve the staleness of data?

Yes — stale-while-revalidate via a background updater. After every response is sent, a fire-and-forget async job re-fetches the rate and updates the cache. So the next request gets a fresh value without waiting. The frontend also recomputes the freshness indicator every 30 seconds without a full page reload.

## What did you cut to ship in 60 minutes?

- No test suite (unit, integration, or property-based)
- No rate limiting or auth on the API
- No persistent cache (in-memory only, resets on restart)
- No pagination or filtering in the UI
- No retry logic with backoff on API failures

## What would you add with more time?

- Redis for persistent, shared cache across instances
- Retry with exponential backoff on external API calls
- API key auth for the `/convert` endpoint
- Rate limiting per user
- More currencies and a configurable currency pair selector in the UI
- Proper error boundary in React

## Other thoughts

Using `pg` directly instead of the Supabase JS client was the right call here — avoids needing the anon key and keeps the backend dependency footprint smaller. The Vite proxy in dev means zero CORS config needed locally, and swapping to `VITE_API_URL` for production is a one-liner.
