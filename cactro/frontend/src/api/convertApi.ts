export interface ConvertResponse {
  converted_value: number;
  exchange_rate: number;
  source: 'premium' | 'free';
  premium: boolean;
  premium_fallback: boolean;
  cache_timestamp: string;
}

export async function fetchRate(
  userId: string,
  base: string,
  target: string,
  value: number
): Promise<ConvertResponse> {
  const base_url = import.meta.env.VITE_API_URL ?? '';
  const res = await fetch(`${base_url}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      base_currency: base,
      value_of_base_currency: value,
      target_currency: target,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}
