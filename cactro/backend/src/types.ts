export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "INR"] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export type UserTier = "free" | "paid";

export interface CacheEntry {
  rate: number;
  source: "premium" | "free";
  timestamp: Date;
  expiresAt: Date;
}

export interface ExchangeRateData {
  rate: number;
  baseCurrency: SupportedCurrency;
  targetCurrency: SupportedCurrency;
  retrievedAt: Date;
}

export interface RateFetchResult {
  rate: number;
  source: "premium" | "free";
  premiumFallback: boolean;
  cacheTimestamp: Date;
  fromCache: boolean;
}

export interface ConvertRequest {
  user_id: string;
  base_currency: SupportedCurrency;
  value_of_base_currency: number;
  target_currency: SupportedCurrency;
}

export interface ConvertResponse {
  converted_value: number;
  exchange_rate: number;
  source: "premium" | "free";
  premium: boolean;
  premium_fallback: boolean;
  cache_timestamp: string;
}

export interface ExternalApiAdapter {
  fetchRate(base: SupportedCurrency, target: SupportedCurrency): Promise<ExchangeRateData>;
}
