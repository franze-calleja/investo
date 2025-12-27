import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fallbackAssets } from "../data/fallbackRates";
import { fetchAssetCagr, type CagrResult } from "../lib/twelveData";

type UseAssetCagrParams = {
  symbol?: string | null;
  enabled?: boolean;
};

type UseAssetCagrResult = {
  data?: CagrResult;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  isFallback: boolean;
  refetch: () => void;
};

const DAY_MS = 1000 * 60 * 60 * 24;

export function useAssetCagr({ symbol, enabled = true }: UseAssetCagrParams): UseAssetCagrResult {
  const query = useQuery<CagrResult>({
    queryKey: ["assetCagr", symbol],
    queryFn: async ({ signal }) => {
      if (!symbol) {
        throw new Error("Symbol is required to fetch CAGR");
      }
      return fetchAssetCagr(symbol, signal);
    },
    enabled: Boolean(symbol) && enabled,
    staleTime: DAY_MS,
    gcTime: DAY_MS * 3,
    retry: 1
  });

  const fallback = useMemo(() => {
    if (!symbol) return undefined;
    const exact = fallbackAssets.find((a) => a.symbol.toLowerCase() === symbol.toLowerCase());
    return exact ?? undefined;
  }, [symbol]);

  const data: CagrResult | undefined = useMemo(() => {
    if (query.data) return query.data;
    if (query.isError && fallback) {
      return {
        symbol: fallback.symbol,
        cagrPct: fallback.cagrPct,
        yearsUsed: 0,
        samples: 0,
        source: "fallback"
      };
    }
    return undefined;
  }, [query.data, query.isError, fallback]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFallback: Boolean(query.isError && data?.source === "fallback"),
    refetch: query.refetch
  };
}
