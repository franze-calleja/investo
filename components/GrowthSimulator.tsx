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
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastHapticValue = useRef(horizonYears);
  const chartOpacity = useSharedValue(1);
  const income = useInvestmentStore((state) => state.income);
  const deductionPct = useInvestmentStore((state) => state.deductionPct);
  const split = useInvestmentStore((state) => state.split);
  const manualRatePct = useInvestmentStore((state) => state.manualRatePct);
  const assetRate = useInvestmentStore((state) => state.assetRate);

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

  const chartData = useMemo(() => {
    const years = Math.min(horizonYears, 20); // Show max 20 points for readability
    const increment = horizonYears > 20 ? Math.ceil(horizonYears / 20) : 1;
    const points: number[] = [];
    const labels: string[] = [];

    for (let year = 0; year <= horizonYears; year += increment) {
      const netIncome = computeNetIncome(income, deductionPct);
      const splitAmounts = computeSplitAmounts(netIncome, split);
      const savingsMonthly = splitAmounts.savings;
      const effectiveRate = manualRatePct ?? assetRate.cagrPct ?? 0;
      const growth = computeFutureValueMonthly(savingsMonthly, effectiveRate, year);
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
  }, [horizonYears, income, deductionPct, split, manualRatePct, assetRate.cagrPct]);

  return (
    <View className="gap-5 bg-neutral-900 p-4 rounded-2xl">
      <View className="gap-1">
        <Text className="text-white text-xl font-semibold">Growth Simulator</Text>
        <Text className="text-neutral-400 text-sm">Time horizon with principal vs interest visual</Text>
      </View>

      <View className="gap-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-neutral-300">Horizon (years)</Text>
          <Text className="text-white font-semibold">{displayHorizon}y</Text>
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
