import { ExchangeRateData, ExternalApiAdapter, SupportedCurrency } from "../types";

class OpenERAdapter implements ExternalApiAdapter {
  async fetchRate(base: SupportedCurrency, target: SupportedCurrency): Promise<ExchangeRateData> {
    const url = `https://open.er-api.com/v6/latest/${base}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OpenER API returned status ${response.status}`);
    }

    const data = await response.json() as { result: string; rates: Record<string, unknown> };

    if (data?.result !== "success") {
      throw new Error(`OpenER API returned non-success result: ${data?.result}`);
    }

    const rate = data?.rates?.[target];
    if (typeof rate !== "number") {
      throw new Error(`OpenER API response missing or invalid rate for ${target}`);
    }

    return {
      rate,
      baseCurrency: base,
      targetCurrency: target,
      retrievedAt: new Date(),
    };
  }
}

export const openERAdapter = new OpenERAdapter();
