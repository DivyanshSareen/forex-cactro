import { SupportedCurrency, CacheEntry } from "../types";

export const PREMIUM_TTL_MS = 300_000; // 5 minutes
export const FREE_TTL_MS = 180_000;    // 3 minutes

class RateCache {
  private store = new Map<string, CacheEntry>();

  private key(base: SupportedCurrency, target: SupportedCurrency): string {
    return `${base}:${target}`;
  }

  get(base: SupportedCurrency, target: SupportedCurrency): CacheEntry | null {
    const entry = this.store.get(this.key(base, target));
    if (!entry) return null;
    if (Date.now() < entry.expiresAt.getTime()) return entry;
    this.store.delete(this.key(base, target));
    return null;
  }

  set(base: SupportedCurrency, target: SupportedCurrency, entry: CacheEntry): void {
    const k = this.key(base, target);
    const existing = this.store.get(k);
    // Only skip overwrite if existing is premium and new entry is free
    if (existing && existing.source === "premium" && entry.source === "free") return;
    this.store.set(k, entry);
  }
}

export const rateCache = new RateCache();
