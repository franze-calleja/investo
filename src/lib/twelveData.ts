const BASE_URL = "https://api.twelvedata.com";
const YEAR_MS = 1000 * 60 * 60 * 24 * 365;

type TimeSeriesValue = {
  datetime: string;
  close: string;
};

type TimeSeriesResponse = {
  values?: TimeSeriesValue[];
  status?: string;
  message?: string;
};

export type CagrResult = {
  symbol: string;
  cagrPct: number;
  yearsUsed: number;
  samples: number;
  source: "api" | "fallback";
};

function toNumber(value: string | number): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new Error("Invalid numeric value in time series");
  }
  return num;
}

function pickWindow(values: TimeSeriesValue[], targetYears: number) {
  if (!values.length) return null;
  const sorted = [...values].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );
  const last = sorted[sorted.length - 1];
  const lastTime = new Date(last.datetime).getTime();
  const cutoff = lastTime - targetYears * YEAR_MS;

  const startIndex = sorted.findIndex(
    (v) => new Date(v.datetime).getTime() >= cutoff
  );

  if (startIndex === -1 || startIndex >= sorted.length - 1) {
    return null;
  }

  const window = sorted.slice(startIndex);
  const start = window[0];
  const end = window[window.length - 1];
  const yearsUsed =
    (new Date(end.datetime).getTime() - new Date(start.datetime).getTime()) /
    YEAR_MS;

  if (yearsUsed < 0.5) return null;

  return { start, end, yearsUsed, samples: window.length };
}

function computeCagr(values: TimeSeriesValue[]): {
  cagrPct: number;
  yearsUsed: number;
  samples: number;
} {
  const windows = [10, 5, 3];

  for (const years of windows) {
    const window = pickWindow(values, years);
    if (window) {
      const startPrice = toNumber(window.start.close);
      const endPrice = toNumber(window.end.close);
      const cagr = Math.pow(endPrice / startPrice, 1 / window.yearsUsed) - 1;
      return {
        cagrPct: Number((cagr * 100).toFixed(2)),
        yearsUsed: window.yearsUsed,
        samples: window.samples
      };
    }
  }

  // fallback: use full span if nothing matched
  const sorted = [...values].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );
  if (sorted.length < 2) {
    throw new Error("Not enough data to compute CAGR");
  }
  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  const yearsUsed =
    (new Date(end.datetime).getTime() - new Date(start.datetime).getTime()) /
    YEAR_MS;
  const startPrice = toNumber(start.close);
  const endPrice = toNumber(end.close);
  const cagr = Math.pow(endPrice / startPrice, 1 / Math.max(yearsUsed, 1)) - 1;

  return {
    cagrPct: Number((cagr * 100).toFixed(2)),
    yearsUsed,
    samples: sorted.length
  };
}

export async function fetchAssetCagr(symbol: string, signal?: AbortSignal) : Promise<CagrResult> {
  const apiKey = process.env.EXPO_PUBLIC_TWELVE_DATA_KEY;

  if (!apiKey) {
    throw new Error("Missing Twelve Data API key");
  }

  const url = `${BASE_URL}/time_series?symbol=${encodeURIComponent(
    symbol
  )}&interval=1month&outputsize=240&apikey=${apiKey}`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Twelve Data request failed (${res.status})`);
  }

  const json = (await res.json()) as TimeSeriesResponse;

  if (json.status === "error") {
    throw new Error(json.message ?? "Twelve Data API error");
  }

  if (!json.values?.length) {
    throw new Error("No data returned from Twelve Data");
  }

  const stats = computeCagr(json.values);

  return {
    symbol,
    ...stats,
    source: "api"
  };
}

export function computeManualCagr(values: TimeSeriesValue[]) {
  return computeCagr(values);
}
