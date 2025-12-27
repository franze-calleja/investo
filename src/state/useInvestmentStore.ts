import { create } from "zustand";
import { clamp, computeFutureValueMonthly, computeNetIncome, computePassiveIncome, computeSplitAmounts } from "../lib/calculations";

type Split = {
  needsPct: number;
  wantsPct: number;
  savingsPct: number;
};

type AssetRate = {
  symbol: string | null;
  cagrPct: number | null;
  source?: "api" | "fallback";
};

type InvestmentState = {
  income: number;
  deductionPct: number;
  split: Split;
  horizonYears: number;
  manualRatePct: number | null;
  assetRate: AssetRate;
};

type InvestmentActions = {
  setIncome: (value: number) => void;
  setDeductionPct: (value: number) => void;
  setSplit: (key: keyof Split, value: number) => void;
  resetSplit: () => void;
  setHorizonYears: (value: number) => void;
  setManualRatePct: (value: number | null) => void;
  setAssetRate: (value: AssetRate) => void;
};

type InvestmentStore = InvestmentState & InvestmentActions;

const defaultSplit: Split = { needsPct: 50, wantsPct: 30, savingsPct: 20 };

function rebalanceSplit(current: Split, changedKey: keyof Split, newValue: number): Split {
  const value = clamp(newValue, 0, 100);
  const { needsPct, wantsPct, savingsPct } = current;

  if (changedKey === "needsPct") {
    const remaining = 100 - value;
    const newSavings = Math.min(savingsPct, remaining);
    const newWants = clamp(remaining - newSavings, 0, 100);
    return { needsPct: value, wantsPct: newWants, savingsPct: newSavings };
  }

  if (changedKey === "wantsPct") {
    const remaining = 100 - value;
    const newSavings = Math.min(savingsPct, remaining);
    const newNeeds = clamp(remaining - newSavings, 0, 100);
    return { needsPct: newNeeds, wantsPct: value, savingsPct: newSavings };
  }

  // savingsPct changed
  const remaining = 100 - value;
  const newNeeds = Math.min(needsPct, remaining);
  const newWants = clamp(remaining - newNeeds, 0, 100);
  return { needsPct: newNeeds, wantsPct: newWants, savingsPct: value };
}

export const useInvestmentStore = create<InvestmentStore>((set) => ({
  income: 60000,
  deductionPct: 0,
  split: defaultSplit,
  horizonYears: 20,
  manualRatePct: null,
  assetRate: { symbol: "SPX", cagrPct: null, source: undefined },

  setIncome: (value) => set({ income: Math.max(0, value) }),
  setDeductionPct: (value) => set({ deductionPct: clamp(value, 0, 60) }),
  setSplit: (key, value) =>
    set((state) => ({
      split: rebalanceSplit(state.split, key, value)
    })),
  resetSplit: () => set({ split: defaultSplit }),
  setHorizonYears: (value) => set({ horizonYears: clamp(value, 1, 50) }),
  setManualRatePct: (value) => set({ manualRatePct: value === null ? null : Math.max(0, value) }),
  setAssetRate: (value) => set({ assetRate: value })
}));

export function selectDerived(state: InvestmentStore) {
  const netIncome = computeNetIncome(state.income, state.deductionPct);
  const splitAmounts = computeSplitAmounts(netIncome, state.split);
  const savingsMonthly = splitAmounts.savings;

  const effectiveRate = state.manualRatePct ?? state.assetRate.cagrPct ?? 0;

  const growth = computeFutureValueMonthly(savingsMonthly, effectiveRate, state.horizonYears);
  const passiveIncome = computePassiveIncome(growth.futureValue, effectiveRate);

  return {
    netIncome,
    splitAmounts,
    savingsMonthly,
    effectiveRate,
    growth,
    passiveIncome
  };
}
