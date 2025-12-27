import { useMemo } from "react";
import { Text, View } from "react-native";
import { computeFutureValueMonthly, computeNetIncome, computePassiveIncome, computeSplitAmounts } from "../src/lib/calculations";
import { useInvestmentStore } from "../src/state/useInvestmentStore";

function Card({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View className="bg-neutral-900 rounded-2xl p-4 gap-1" style={accent ? { borderColor: accent, borderWidth: 1 } : undefined}>
      <Text className="text-neutral-400 text-sm">{label}</Text>
      <Text className="text-white text-xl font-semibold">{value}</Text>
    </View>
  );
}

export function DetailsDashboard() {
  const income = useInvestmentStore((state) => state.income);
  const deductionPct = useInvestmentStore((state) => state.deductionPct);
  const split = useInvestmentStore((state) => state.split);
  const horizonYears = useInvestmentStore((state) => state.horizonYears);
  const manualRatePct = useInvestmentStore((state) => state.manualRatePct);
  const assetRate = useInvestmentStore((state) => state.assetRate);

  const derived = useMemo(() => {
    const netIncome = computeNetIncome(income, deductionPct);
    const splitAmounts = computeSplitAmounts(netIncome, split);
    const savingsMonthly = splitAmounts.savings;
    const effectiveRate = manualRatePct ?? assetRate.cagrPct ?? 0;
    const growth = computeFutureValueMonthly(savingsMonthly, effectiveRate, horizonYears);
    const passiveIncome = computePassiveIncome(growth.futureValue, effectiveRate);
    return { growth, passiveIncome };
  }, [income, deductionPct, split, horizonYears, manualRatePct, assetRate.cagrPct]);

  return (
    <View className="gap-3">
      <Text className="text-white text-xl font-semibold">Details Dashboard</Text>
      <View className="gap-3">
        <Card label="Total Portfolio Value" value={`₱${Math.round(derived.growth.futureValue).toLocaleString()}`} accent="#22c55e" />
        <Card label="Total Contributions" value={`₱${Math.round(derived.growth.principal).toLocaleString()}`} />
        <Card label="Total Interest Earned" value={`₱${Math.round(derived.growth.interest).toLocaleString()}`} />
        <Card label="Monthly Passive Income" value={`₱${Math.round(derived.passiveIncome).toLocaleString()}`} />
      </View>
    </View>
  );
}
