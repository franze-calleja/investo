import { useInvestmentStore } from "../state/useInvestmentStore";

export function formatCurrency(value: number, currencyCode?: string, currencySymbol?: string): string {
  const currency = currencyCode || useInvestmentStore.getState().currency.code;
  const symbol = currencySymbol || useInvestmentStore.getState().currency.symbol;
  
  const formatted = Math.round(value).toLocaleString();
  return `${symbol}${formatted}`;
}

export function useCurrencyFormatter() {
  const currency = useInvestmentStore((state) => state.currency);
  
  return (value: number) => formatCurrency(value, currency.code, currency.symbol);
}
