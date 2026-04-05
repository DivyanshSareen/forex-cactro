import { Router, Request, Response } from "express";
import { SUPPORTED_CURRENCIES, SupportedCurrency, ConvertResponse } from "../types";
import { tierResolver } from "../services/tierResolver";
import { rateFetcher } from "../services/rateFetcher";
import { backgroundUpdater } from "../services/backgroundUpdater";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { user_id, base_currency, value_of_base_currency, target_currency } = req.body;

  // Validate required fields
  if (user_id === undefined || user_id === null) {
    return res.status(422).json({ error: "Missing required field: user_id" });
  }
  if (typeof user_id !== "string") {
    return res.status(422).json({ error: "Invalid value for field: user_id" });
  }

  if (base_currency === undefined || base_currency === null) {
    return res.status(422).json({ error: "Missing required field: base_currency" });
  }
  if (typeof base_currency !== "string") {
    return res.status(422).json({ error: "Invalid value for field: base_currency" });
  }

  if (value_of_base_currency === undefined || value_of_base_currency === null) {
    return res.status(422).json({ error: "Missing required field: value_of_base_currency" });
  }
  if (typeof value_of_base_currency !== "number") {
    return res.status(422).json({ error: "Invalid value for field: value_of_base_currency" });
  }

  if (target_currency === undefined || target_currency === null) {
    return res.status(422).json({ error: "Missing required field: target_currency" });
  }
  if (typeof target_currency !== "string") {
    return res.status(422).json({ error: "Invalid value for field: target_currency" });
  }

  // Validate supported currencies
  if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(base_currency)) {
    return res.status(400).json({
      error: `Unsupported currency: ${base_currency}. Supported: USD, EUR, GBP, JPY, INR`,
    });
  }
  if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(target_currency)) {
    return res.status(400).json({
      error: `Unsupported currency: ${target_currency}. Supported: USD, EUR, GBP, JPY, INR`,
    });
  }

  const base = base_currency as SupportedCurrency;
  const target = target_currency as SupportedCurrency;

  try {
    const tier = await tierResolver.resolve(user_id);
    const result = await rateFetcher.fetch(base, target, tier);

    // Fire-and-forget background refresh
    backgroundUpdater.scheduleRefresh(base, target, tier);

    const response: ConvertResponse = {
      converted_value: value_of_base_currency * result.rate,
      exchange_rate: result.rate,
      source: result.source,
      premium: result.source === "premium",
      premium_fallback: result.premiumFallback,
      cache_timestamp: result.cacheTimestamp.toISOString(),
    };

    return res.status(200).json(response);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "All exchange rate APIs unavailable") {
      return res.status(503).json({ error: "Exchange rate service temporarily unavailable" });
    }
    throw err;
  }
});

export default router;
