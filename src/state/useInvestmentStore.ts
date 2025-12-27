import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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
  lumpSum: number;
  inflationAdjusted: boolean;
};

type InvestmentActions = {
  setIncome: (value: number) => void;
  setDeductionPct: (value: number) => void;
  setSplit: (key: keyof Split, value: number) => void;
  resetSplit: () => void;
  setHorizonYears: (value: number) => void;
  setManualRatePct: (value: number | null) => void;
  setAssetRate: (value: AssetRate) => void;
  setLumpSum: (value: number) => void;
  setInflationAdjusted: (value: boolean) => void;
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

export const useInvestmentStore = create<InvestmentStore>()(
  persist(
    (set) => ({
      income: 60000,
      deductionPct: 0,
      split: defaultSplit,
      horizonYears: 20,
      manualRatePct: null,
      assetRate: { symbol: "SPX", cagrPct: null, source: undefined },
      lumpSum: 0,
      inflationAdjusted: false,

      setIncome: (value) => set({ income: Math.max(0, value) }),
      setDeductionPct: (value) => set({ deductionPct: clamp(value, 0, 60) }),
      setSplit: (key, value) =>
        set((state) => ({
          split: rebalanceSplit(state.split, key, value)
        })),
      resetSplit: () => set({ split: defaultSplit }),
      setHorizonYears: (value) => set({ horizonYears: clamp(value, 1, 50) }),
      setManualRatePct: (value) => set({ manualRatePct: value === null ? null : Math.max(0, value) }),
      setAssetRate: (value) => set({ assetRate: value }),
      setLumpSum: (value) => set({ lumpSum: Math.max(0, value) }),
      setInflationAdjusted: (value) => set({ inflationAdjusted: value })
    }),
    {
      name: "investo-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function selectDerived(state: InvestmentStore) {
  const netIncome = computeNetIncome(state.income, state.deductionPct);
  const splitAmounts = computeSplitAmounts(netIncome, state.split);
  const savingsMonthly = splitAmounts.savings;

  const baseRate = state.manualRatePct ?? state.assetRate.cagrPct ?? 0;
  const inflationRate = state.inflationAdjusted ? 3.5 : 0;
  const effectiveRate = Math.max(baseRate - inflationRate, 0);

  const growth = computeFutureValueMonthly(savingsMonthly, effectiveRate, state.horizonYears, state.lumpSum);
  const passiveIncome = computePassiveIncome(growth.futureValue, effectiveRate);

  return {
    netIncome,
    splitAmounts,
    savingsMonthly,
    effectiveRate,
    baseRate,
    inflationRate,
    growth,
    passiveIncome
  };
}
