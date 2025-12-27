export type FallbackAsset = {
  symbol: string;
  name: string;
  cagrPct: number; // annualized return percent
  source: string;
};

export const fallbackAssets: FallbackAsset[] = [
  { symbol: "SPX", name: "S&P 500 (10y)", cagrPct: 10.5, source: "static" },
  { symbol: "URTH", name: "MSCI World ETF (10y)", cagrPct: 9.1, source: "static" },
  { symbol: "PSEi", name: "PH Index placeholder", cagrPct: 6.5, source: "static" },
  { symbol: "BTC", name: "Bitcoin capped", cagrPct: 20.0, source: "static" },
  { symbol: "BANK", name: "Savings account", cagrPct: 2.0, source: "static" }
];

export const fallbackBankRatePct = 2.0;
