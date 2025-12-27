import Slider from "@react-native-community/slider";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { computeFutureValueMonthly, computeNetIncome, computePassiveIncome, computeSplitAmounts } from "../src/lib/calculations";
import { useInvestmentStore } from "../src/state/useInvestmentStore";

function formatNumber(value: number) {
  return Math.round(value).toLocaleString();
}

export function GrowthSimulator() {
  const horizonYears = useInvestmentStore((state) => state.horizonYears);
  const setHorizonYears = useInvestmentStore((state) => state.setHorizonYears);
  const income = useInvestmentStore((state) => state.income);
  const deductionPct = useInvestmentStore((state) => state.deductionPct);
  const split = useInvestmentStore((state) => state.split);
  const manualRatePct = useInvestmentStore((state) => state.manualRatePct);
  const assetRate = useInvestmentStore((state) => state.assetRate);

  const derived = useMemo(() => {
    const netIncome = computeNetIncome(income, deductionPct);
    const splitAmounts = computeSplitAmounts(netIncome, split);
    const savingsMonthly = splitAmounts.savings;
    const effectiveRate = manualRatePct ?? assetRate.cagrPct ?? 0;
    const growth = computeFutureValueMonthly(savingsMonthly, effectiveRate, horizonYears);
    const passiveIncome = computePassiveIncome(growth.futureValue, effectiveRate);
    return { growth, passiveIncome, savingsMonthly, effectiveRate };
  }, [income, deductionPct, split, manualRatePct, assetRate.cagrPct, horizonYears]);

  const chartBars = useMemo(() => {
    const total = derived.growth.futureValue;
    if (total <= 0) return { principalPct: 0, interestPct: 0 };
    const principalPct = (derived.growth.principal / total) * 100;
    const interestPct = 100 - principalPct;
    return { principalPct, interestPct };
  }, [derived.growth.futureValue, derived.growth.principal]);

  return (
    <View className="gap-5 bg-neutral-900 p-4 rounded-2xl">
      <View className="gap-1">
        <Text className="text-white text-xl font-semibold">Growth Simulator</Text>
        <Text className="text-neutral-400 text-sm">Time horizon with principal vs interest visual</Text>
      </View>

      <View className="gap-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-neutral-300">Horizon (years)</Text>
          <Text className="text-white font-semibold">{horizonYears}y</Text>
        </View>
        <Slider
          value={horizonYears}
          onValueChange={(v) => setHorizonYears(Math.round(v))}
          minimumValue={1}
          maximumValue={50}
          step={1}
          minimumTrackTintColor="#22c55e"
          maximumTrackTintColor="#1f2937"
          thumbTintColor="#22c55e"
        />
      </View>

      <View className="gap-2">
        <Text className="text-neutral-300 text-sm">Principal vs Interest</Text>
        <View className="h-3 rounded-full overflow-hidden bg-neutral-800 flex-row">
          <View style={{ flex: chartBars.principalPct }} className="h-full bg-emerald-500" />
          <View style={{ flex: chartBars.interestPct }} className="h-full bg-amber-400" />
        </View>
        <View className="flex-row justify-between">
          <Text className="text-emerald-400 text-sm">Principal {chartBars.principalPct.toFixed(0)}%</Text>
          <Text className="text-amber-400 text-sm">Interest {chartBars.interestPct.toFixed(0)}%</Text>
        </View>
      </View>

      <View className="bg-neutral-800 rounded-2xl p-4 gap-2">
        <Text className="text-neutral-300 text-sm">Projected total value</Text>
        <Text className="text-3xl text-white font-semibold">₱{formatNumber(derived.growth.futureValue)}</Text>
        <Text className="text-neutral-400 text-sm">
          Based on monthly savings ₱{formatNumber(derived.savingsMonthly)} at {derived.effectiveRate}% annual
        </Text>
      </View>
    </View>
  );
}
