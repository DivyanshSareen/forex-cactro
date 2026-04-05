import { rateFetcher } from "./rateFetcher";
import { SupportedCurrency, UserTier } from "../types";

class BackgroundUpdater {
  scheduleRefresh(base: SupportedCurrency, target: SupportedCurrency, tier: UserTier): void {
    rateFetcher.fetch(base, target, tier).then(() => {
      // refresh complete, cache updated by rateFetcher
    }).catch((err) => {
      console.error({
        level: "error",
        component: "BackgroundUpdater",
        currencyPair: `${base}:${target}`,
        error: err,
      });
    });
  }
}

export const backgroundUpdater = new BackgroundUpdater();
