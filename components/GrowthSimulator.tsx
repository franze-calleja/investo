import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useRef, useState } from "react";
import { Dimensions, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import Animated, { FadeIn, useSharedValue } from "react-native-reanimated";
import { computeFutureValueMonthly, computeNetIncome, computePassiveIncome, computeSplitAmounts } from "../src/lib/calculations";
import { useInvestmentStore } from "../src/state/useInvestmentStore";

function formatNumber(value: number) {
  return Math.round(value).toLocaleString();
}

export function GrowthSimulator() {
  const horizonYears = useInvestmentStore((state) => state.horizonYears);
  const setHorizonYears = useInvestmentStore((state) => state.setHorizonYears);
  const [displayHorizon, setDisplayHorizon] = useState(horizonYears);
  const debounceTimer = useRef<number | null>(null);
  const lastHapticValue = useRef(horizonYears);
  const chartOpacity = useSharedValue(1);
  const income = useInvestmentStore((state) => state.income);
  const deductionPct = useInvestmentStore((state) => state.deductionPct);
  const split = useInvestmentStore((state) => state.split);
  const manualRatePct = useInvestmentStore((state) => state.manualRatePct);
  const assetRate = useInvestmentStore((state) => state.assetRate);
  const lumpSum = useInvestmentStore((state) => state.lumpSum);
  const inflationAdjusted = useInvestmentStore((state) => state.inflationAdjusted);

  const handleHorizonChange = useCallback((value: number) => {
    const rounded = Math.round(value);
    setDisplayHorizon(rounded);
    
    // Haptic feedback at 5-year increments
    if (Math.floor(rounded / 5) !== Math.floor(lastHapticValue.current / 5)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      lastHapticValue.current = rounded;
    }
    
    // Debounce the actual store update for performance
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setHorizonYears(rounded);
    }, 150);
  }, [setHorizonYears]);

  const derived = useMemo(() => {
    const netIncome = computeNetIncome(income, deductionPct);
    const splitAmounts = computeSplitAmounts(netIncome, split);
    const savingsMonthly = splitAmounts.savings;
    const baseRate = manualRatePct ?? assetRate.cagrPct ?? 0;
    const inflationRate = inflationAdjusted ? 3.5 : 0;
    const effectiveRate = Math.max(baseRate - inflationRate, 0);
    const growth = computeFutureValueMonthly(savingsMonthly, effectiveRate, horizonYears, lumpSum);
    const passiveIncome = computePassiveIncome(growth.futureValue, effectiveRate);
    return { growth, passiveIncome, savingsMonthly, effectiveRate, inflationRate };
  }, [income, deductionPct, split, manualRatePct, assetRate.cagrPct, horizonYears, lumpSum, inflationAdjusted]);

  const chartBars = useMemo(() => {
    const total = derived.growth.futureValue;
    if (total <= 0) return { principalPct: 0, interestPct: 0 };
    const principalPct = (derived.growth.principal / total) * 100;
    const interestPct = 100 - principalPct;
    return { principalPct, interestPct };
  }, [derived.growth.futureValue, derived.growth.principal]);

  const chartData = useMemo(() => {
    const years = Math.min(horizonYears, 20); // Show max 20 points for readability
    const increment = horizonYears > 20 ? Math.ceil(horizonYears / 20) : 1;
    const points: number[] = [];
    const labels: string[] = [];

    for (let year = 0; year <= horizonYears; year += increment) {
      const netIncome = computeNetIncome(income, deductionPct);
      const splitAmounts = computeSplitAmounts(netIncome, split);
      const savingsMonthly = splitAmounts.savings;
      const baseRate = manualRatePct ?? assetRate.cagrPct ?? 0;
      const inflationRate = inflationAdjusted ? 3.5 : 0;
      const effectiveRate = Math.max(baseRate - inflationRate, 0);
      const growth = computeFutureValueMonthly(savingsMonthly, effectiveRate, year, lumpSum);
      points.push(growth.futureValue);
      labels.push(year % 5 === 0 ? `${year}y` : "");
    }

    return {
      labels,
      datasets: [
        {
          data: points,
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  }, [horizonYears, income, deductionPct, split, manualRatePct, assetRate.cagrPct, lumpSum, inflationAdjusted]);

  if (income === 0) {
    return (
      <Animated.View className="gap-5 p-4 bg-neutral-900 rounded-2xl" entering={FadeIn.duration(300)}>
        <View className="gap-1">
          <Text className="text-xl font-semibold text-white">Growth Simulator</Text>
          <Text className="text-sm text-neutral-400">Time horizon with principal vs interest visual</Text>
        </View>
        <View className="items-center gap-3 p-8 bg-neutral-800 rounded-2xl">
          <Text className="text-4xl text-center text-neutral-500">📈</Text>
          <Text className="text-center text-neutral-400">Configure your budget and income to see growth projections</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View className="gap-5 p-4 bg-neutral-900 rounded-2xl" entering={FadeIn.duration(300)}>
      <View className="gap-1">
        <Text className="text-xl font-semibold text-white">Growth Simulator</Text>
        <Text className="text-sm text-neutral-400">Time horizon with principal vs interest visual</Text>
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-neutral-300">Horizon (years)</Text>
          <Text className="font-semibold text-white">{displayHorizon}y</Text>
        </View>
        <Slider
          value={displayHorizon}
          onValueChange={handleHorizonChange}
          onSlidingComplete={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          minimumValue={1}
          maximumValue={50}
          step={1}
          minimumTrackTintColor="#22c55e"
          maximumTrackTintColor="#1f2937"
          thumbTintColor="#22c55e"
        />
      </View>

      {/* Line Chart */}
      <Animated.View className="items-center" entering={FadeIn.duration(300)}>
        <LineChart
          data={chartData}
          width={Dimensions.get("window").width - 64}
          height={220}
          chartConfig={{
            backgroundColor: "#171717",
            backgroundGradientFrom: "#171717",
            backgroundGradientTo: "#171717",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(163, 163, 163, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#22c55e",
            },
            propsForBackgroundLines: {
              strokeDasharray: "",
              stroke: "#1f2937",
              strokeWidth: 1,
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
        />
      </Animated.View>

      <View className="gap-2">
        <Text className="text-sm text-neutral-300">Principal vs Interest</Text>
        <View className="flex-row h-3 overflow-hidden rounded-full bg-neutral-800">
          <View style={{ flex: chartBars.principalPct }} className="h-full bg-emerald-500" />
          <View style={{ flex: chartBars.interestPct }} className="h-full bg-amber-400" />
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-emerald-400">Principal {chartBars.principalPct.toFixed(0)}%</Text>
          <Text className="text-sm text-amber-400">Interest {chartBars.interestPct.toFixed(0)}%</Text>
        </View>
      </View>

      <View className="gap-2 p-4 bg-neutral-800 rounded-2xl">
        <Text className="text-sm text-neutral-300">Projected total value</Text>
        <Text className="text-3xl font-semibold text-white">₱{formatNumber(derived.growth.futureValue)}</Text>
        <Text className="text-sm text-neutral-400">
          Based on monthly savings ₱{formatNumber(derived.savingsMonthly)} at {derived.effectiveRate}% annual
        </Text>
      </View>
    </Animated.View>
  );
}
