import { useEffect, useState } from 'react';
import { fetchRate, ConvertResponse } from '../api/convertApi';
import FreshnessIndicator from './FreshnessIndicator';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'INR'];

type RateEntry = { data: ConvertResponse | null; error: string | null };

export default function RateTable({ userId }: { userId: string }) {
  const [rates, setRates] = useState<Map<string, RateEntry>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const pairs: [string, string][] = [];
    for (const base of CURRENCIES) {
      for (const target of CURRENCIES) {
        if (base !== target) pairs.push([base, target]);
      }
    }

    const results = new Map<string, RateEntry>();
    Promise.all(
      pairs.map(([base, target]) =>
        fetchRate(userId, base, target, 1)
          .then((data) => results.set(`${base}:${target}`, { data, error: null }))
          .catch((err) =>
            results.set(`${base}:${target}`, {
              data: null,
              error: err instanceof Error ? err.message : String(err),
            })
          )
      )
    ).then(() => {
      setRates(new Map(results));
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        Loading rates...
      </div>
    );
  }

  const rows: { base: string; target: string; key: string; entry: RateEntry }[] = [];
  for (const base of CURRENCIES) {
    for (const target of CURRENCIES) {
      if (base !== target) {
        const key = `${base}:${target}`;
        const entry = rates.get(key) ?? { data: null, error: 'No data' };
        rows.push({ base, target, key, entry });
      }
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Base', 'Target', 'Rate', 'Converted', 'Source', 'Freshness'].map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map(({ base, target, key, entry }) => (
            <tr key={key} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-800">{base}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{target}</td>
              <td className="px-4 py-3 text-gray-700">
                {entry.error ? (
                  <span className="text-red-500">{entry.error}</span>
                ) : (
                  entry.data?.exchange_rate.toFixed(4)
                )}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {!entry.error && entry.data != null
                  ? entry.data.converted_value.toFixed(4)
                  : null}
              </td>
              <td className="px-4 py-3">
                {!entry.error && entry.data != null ? (
                  <span className="flex items-center gap-1">
                    {entry.data.source}
                    {entry.data.premium && (
                      <span className="ml-1 rounded px-1.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-300">
                        Premium
                      </span>
                    )}
                    {entry.data.premium_fallback && (
                      <span className="ml-1 rounded px-1.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-300">
                        Fallback
                      </span>
                    )}
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3">
                {!entry.error && entry.data != null ? (
                  <FreshnessIndicator
                    cacheTimestamp={entry.data.cache_timestamp}
                    isPaid={entry.data.premium}
                  />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
