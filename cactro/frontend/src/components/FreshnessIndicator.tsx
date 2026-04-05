import { useEffect, useState } from "react";

interface FreshnessIndicatorProps {
  cacheTimestamp: string;
  isPaid: boolean;
}

const TTL_PAID = 300;  // 5 minutes in seconds
const TTL_FREE = 180;  // 3 minutes in seconds

function computeAge(cacheTimestamp: string): number {
  return Math.floor((Date.now() - new Date(cacheTimestamp).getTime()) / 1000);
}

function formatAge(age: number): string {
  if (age < 60) {
    return `${age}s ago`;
  }
  return `${Math.floor(age / 60)}m ${age % 60}s ago`;
}

export default function FreshnessIndicator({ cacheTimestamp, isPaid }: FreshnessIndicatorProps) {
  const [age, setAge] = useState(() => computeAge(cacheTimestamp));

  useEffect(() => {
    setAge(computeAge(cacheTimestamp));

    const interval = setInterval(() => {
      setAge(computeAge(cacheTimestamp));
    }, 30_000);

    return () => clearInterval(interval);
  }, [cacheTimestamp]);

  const ttl = isPaid ? TTL_PAID : TTL_FREE;
  const isStale = age > ttl;

  return (
    <span style={{ color: isStale ? "#f59e0b" : "#22c55e" }}>
      {formatAge(age)}{isStale ? " ⚠ stale" : ""}
    </span>
  );
}
