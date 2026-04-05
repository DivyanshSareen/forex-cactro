import { rateCache, PREMIUM_TTL_MS, FREE_TTL_MS } from "./cache";
import { frankfurterAdapter } from "../adapters/frankfurterAdapter";
import { openERAdapter } from "../adapters/openERAdapter";
import { SupportedCurrency, UserTier, RateFetchResult } from "../types";

class RateFetcher {
  async fetch(base: SupportedCurrency, target: SupportedCurrency, tier: UserTier): Promise<RateFetchResult> {
    // 1. Check cache first
    const cached = rateCache.get(base, target);
    if (cached) {
      return {
        rate: cached.rate,
        source: cached.source,
        premiumFallback: false,
        cacheTimestamp: cached.timestamp,
        fromCache: true,
      };
    }

    // 2. Paid tier: try premium adapter first
    if (tier === "paid") {
      try {
        const data = await frankfurterAdapter.fetchRate(base, target);
        const entry = {
          rate: data.rate,
          source: "premium" as const,
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + PREMIUM_TTL_MS),
        };
        rateCache.set(base, target, entry);
        return {
          rate: entry.rate,
          source: "premium",
          premiumFallback: false,
          cacheTimestamp: entry.timestamp,
          fromCache: false,
        };
      } catch (err) {
        console.error("Premium adapter failed, falling back to free pool:", err);
      }
    }

    // 3. Free pool (free tier or paid tier fallback)
    const premiumFallback = tier === "paid";
    let rate: number | null = null;

    try {
      const data = await frankfurterAdapter.fetchRate(base, target);
      rate = data.rate;
    } catch {
      try {
        const data = await openERAdapter.fetchRate(base, target);
        rate = data.rate;
      } catch {
        throw new Error("All exchange rate APIs unavailable");
      }
    }

    const entry = {
      rate: rate!,
      source: "free" as const,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + FREE_TTL_MS),
    };
    rateCache.set(base, target, entry);
    return {
      rate: entry.rate,
      source: "free",
      premiumFallback,
      cacheTimestamp: entry.timestamp,
      fromCache: false,
    };
  }
}

export const rateFetcher = new RateFetcher();
