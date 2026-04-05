import { ExchangeRateData, ExternalApiAdapter, SupportedCurrency } from "../types";

class FrankfurterAdapter implements ExternalApiAdapter {
  async fetchRate(base: SupportedCurrency, target: SupportedCurrency): Promise<ExchangeRateData> {
    const url = `https://api.frankfurter.app/latest?from=${base}&to=${target}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Frankfurter API returned status ${response.status}`);
    }

    const data = await response.json() as { rates: Record<string, unknown>; base: string; date: string };

    const rate = data?.rates?.[target];
    if (typeof rate !== "number") {
      throw new Error(`Frankfurter API response missing or invalid rate for ${target}`);
    }

    return {
      rate,
      baseCurrency: base,
      targetCurrency: target,
      retrievedAt: new Date(),
    };
  }
}

export const frankfurterAdapter = new FrankfurterAdapter();
