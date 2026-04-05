# Implementation Plan: Forex Rates Service

## Overview

Incremental implementation of the forex rates service: backend first (types, cache, adapters, tier resolver, rate fetcher, background updater, route), then frontend (user selector, rate table, freshness indicator).

## Tasks

- [x] 1. Set up backend project structure and shared types
  - Scaffold `backend/` with `src/` directory, `tsconfig.json`, and `package.json` (Express, TypeScript, @supabase/supabase-js, dotenv)
  - Create `src/types.ts` defining `SupportedCurrency`, `SUPPORTED_CURRENCIES`, `UserTier`, `CacheEntry`, `ExchangeRateData`, `RateFetchResult`, `ConvertRequest`, `ConvertResponse`
  - _Requirements: 1.1, 1.2, 8.1, 8.3_

- [x] 2. Implement in-memory cache
  - [x] 2.1 Create `src/services/cache.ts` implementing `RateCache` with `get` and `set` methods
    - Key format: `${base}:${target}`
    - Premium TTL: 5 minutes; free TTL: 3 minutes
    - `set` overwrites a free entry when a premium entry arrives for the same key
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3. Implement external API adapters
  - [x] 3.1 Create `src/adapters/frankfurterAdapter.ts` implementing `ExternalApiAdapter`
    - GET `https://api.frankfurter.app/latest?from={base}&to={target}`
    - Parse response into `ExchangeRateData`; throw on non-2xx or malformed response
    - _Requirements: 3.1, 4.2, 8.1, 8.2_
  - [x] 3.2 Create `src/adapters/openERAdapter.ts` implementing `ExternalApiAdapter`
    - GET `https://open.er-api.com/v6/latest/{base}`, extract target rate from `rates` map
    - Parse response into `ExchangeRateData`; throw on non-2xx or malformed response
    - _Requirements: 4.2, 8.1, 8.2_

- [x] 4. Implement tier resolver
  - Create `src/services/tierResolver.ts` querying the Supabase `users` table by `user_id`
  - Return `"paid"` or `"free"`; default to `"free"` on missing user or Supabase error, logging the error
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.1_

- [x] 5. Implement rate fetcher
  - Create `src/services/rateFetcher.ts` implementing `RateFetcher.fetch`
  - Cache-first: return cached entry if non-expired
  - Paid tier: call `FrankfurterAdapter`; on failure fall back to free pool and set `premiumFallback: true`
  - Free tier: call `FrankfurterAdapter` (primary), then `OpenERAdapter` (fallback); 503 if both fail
  - Store result in cache after a successful fetch
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 5.2, 7.1, 7.2, 8.1, 8.2_

- [x] 6. Implement background updater
  - Create `src/services/backgroundUpdater.ts` implementing `BackgroundUpdater.scheduleRefresh`
  - Fire-and-forget: call `rateFetcher.fetch` asynchronously; catch and log errors without modifying the existing cache entry
  - Log errors with `level: "error"`, `component: "BackgroundUpdater"`, `currencyPair`, and `error` fields
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 7. Implement the convert route and wire up Express app
  - [x] 7.1 Create `src/routes/convert.ts` handling `POST /api/convert`
    - Validate all required fields; return 422 for missing/malformed fields
    - Validate currencies against `SUPPORTED_CURRENCIES`; return 400 for unsupported values
    - Call `tierResolver.resolve`, then `rateFetcher.fetch`
    - Schedule background refresh via `backgroundUpdater.scheduleRefresh`
    - Serialize and return `ConvertResponse`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.6, 6.1, 6.2_
  - [x] 7.2 Create `src/index.ts` bootstrapping Express, mounting the convert router, and starting the server
    - _Requirements: 1.1_

- [x] 8. Checkpoint — verify backend wiring
  - Ensure all backend modules compile without TypeScript errors
  - Manually verify `POST /api/convert` returns correct shape for a free-tier and paid-tier user ID
  - Ask the user if any questions arise before proceeding to the frontend

- [x] 9. Set up frontend project structure
  - Scaffold `frontend/` with Vite + React + TypeScript template
  - Install ShadCN/UI and configure `tailwind.config.ts` and `components.json`
  - Create `src/api/convertApi.ts` with a typed `fetchRate(userId, base, target, value)` function calling `POST /api/convert`
  - _Requirements: 9.1_

- [x] 10. Implement UserSelector component
  - Create `src/components/UserSelector.tsx` using a ShadCN `Select`
  - Hardcode two options: a free-tier user ID and a paid-tier user ID
  - Emit the selected user ID via an `onChange` callback prop
  - _Requirements: 9.1_

- [x] 11. Implement RateTable component
  - [x] 11.1 Create `src/components/RateTable.tsx` that accepts `userId` and renders a table of all currency pairs within `SUPPORTED_CURRENCIES`
    - For each pair, call `fetchRate` and display `converted_value`, `exchange_rate`, and `cache_timestamp`
    - Show a premium badge when `premium: true`
    - Show a "Premium Fallback" label when `premium_fallback: true`
    - Display an inline error message (non-blocking) when the API returns an error
    - _Requirements: 9.2, 9.4, 9.5, 9.6_

- [x] 12. Implement FreshnessIndicator component
  - Create `src/components/FreshnessIndicator.tsx` accepting `cacheTimestamp: string` and `isPaid: boolean` as props
  - Compute age from `cache_timestamp` and display in seconds or minutes
  - Apply a visually distinct style when age exceeds the applicable TTL (5 min for premium, 3 min for free)
  - Refresh the displayed age every 30 seconds using `setInterval`
  - _Requirements: 9.3, 10.1, 10.2, 10.3_

- [x] 13. Wire up App component
  - Update `src/App.tsx` to render `UserSelector` and pass the selected user ID to `RateTable`
  - Re-fetch rates when the selected user changes
  - _Requirements: 9.1, 9.2_

- [x] 14. Final checkpoint — end-to-end verification
  - Ensure frontend compiles without TypeScript errors
  - Confirm the full flow works: user selection → rate fetch → freshness indicator updates
  - Ask the user if any questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP (none in this plan since tests are excluded)
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation before moving to the next layer
