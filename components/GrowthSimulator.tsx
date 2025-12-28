import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useRef, useState } from "react";
import { Dimensions, Pressable, Switch, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import Animated, { FadeIn, useSharedValue } from "react-native-reanimated";
import { computeFutureValueMonthly, computeNetIncome, computePassiveIncome, computeSplitAmounts } from "../src/lib/calculations";
import { useCurrencyFormatter } from "../src/lib/formatCurrency";
import { useInvestmentStore } from "../src/state/useInvestmentStore";

export function GrowthSimulator() {
  const formatCurrency = useCurrencyFormatter();
  const theme = useInvestmentStore((state) => state.theme);
  const isDark = theme === 'dark';
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
  const setInflationAdjusted = useInvestmentStore((state) => state.setInflationAdjusted);
  const comparisonEnabled = useInvestmentStore((state) => state.comparisonEnabled);
  const comparisonRate = useInvestmentStore((state) => state.comparisonRate);
  const setComparisonEnabled = useInvestmentStore((state) => state.setComparisonEnabled);
  const setComparisonRate = useInvestmentStore((state) => state.setComparisonRate);

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
    const mainPoints: number[] = [];
    const comparisonPoints: number[] = [];
    const labels: string[] = [];

    for (let year = 0; year <= horizonYears; year += increment) {
      const netIncome = computeNetIncome(income, deductionPct);
      const splitAmounts = computeSplitAmounts(netIncome, split);
      const savingsMonthly = splitAmounts.savings;
      
      // Main scenario
      const baseRate = manualRatePct ?? assetRate.cagrPct ?? 0;
      const inflationRate = inflationAdjusted ? 3.5 : 0;
      const effectiveRate = Math.max(baseRate - inflationRate, 0);
      const growth = computeFutureValueMonthly(savingsMonthly, effectiveRate, year, lumpSum);
      mainPoints.push(growth.futureValue);
      
      // Comparison scenario
      if (comparisonEnabled) {
        const compGrowth = computeFutureValueMonthly(savingsMonthly, comparisonRate, year, lumpSum);
        comparisonPoints.push(compGrowth.futureValue);
      }
      
      labels.push(year % 5 === 0 ? `${year}y` : "");
    }

    const datasets = [
      {
        data: mainPoints,
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 3,
      },
    ];

    if (comparisonEnabled && comparisonPoints.length > 0) {
      datasets.push({
        data: comparisonPoints,
        color: (opacity = 1) => `rgba(251, 146, 60, ${opacity})`,
        strokeWidth: 3,
      });
    }

    return { labels, datasets };
  }, [horizonYears, income, deductionPct, split, manualRatePct, assetRate.cagrPct, lumpSum, inflationAdjusted, comparisonEnabled, comparisonRate]);

  // Timeline breakdown showing growth at key milestones
  const timelineBreakdown = useMemo(() => {
    const milestones = [5, 10, 15, 20, 25, 30, 40, 50].filter(year => year <= horizonYears);
    if (!milestones.includes(horizonYears)) {
      milestones.push(horizonYears);
    }
    milestones.sort((a, b) => a - b);

    return milestones.map(year => {
      const netIncome = computeNetIncome(income, deductionPct);
      const splitAmounts = computeSplitAmounts(netIncome, split);
      const savingsMonthly = splitAmounts.savings;
      const baseRate = manualRatePct ?? assetRate.cagrPct ?? 0;
      const inflationRate = inflationAdjusted ? 3.5 : 0;
      const effectiveRate = Math.max(baseRate - inflationRate, 0);
      const growth = computeFutureValueMonthly(savingsMonthly, effectiveRate, year, lumpSum);
      return {
        year,
        futureValue: growth.futureValue,
        principal: growth.principal,
        interest: growth.interest,
      };
    });
  }, [horizonYears, income, deductionPct, split, manualRatePct, assetRate.cagrPct, lumpSum, inflationAdjusted]);

  if (income === 0) {
    return (
      <Animated.View className={`gap-5 p-4 rounded-2xl ${isDark ? 'bg-neutral-900' : 'bg-white'}`} entering={FadeIn.duration(300)}>
        <View className="gap-1">
          <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Growth Simulator</Text>
          <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Time horizon with principal vs interest visual</Text>
        </View>
        <View className={`items-center gap-3 p-8 rounded-2xl ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
          <Text className="text-4xl text-center text-neutral-500">📈</Text>
          <Text className={`text-center ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Configure your budget and income to see growth projections</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View className={`gap-5 p-4 rounded-2xl ${isDark ? 'bg-neutral-900' : 'bg-white'}`} entering={FadeIn.duration(300)}>
      <View className="gap-1">
        <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Growth Simulator</Text>
        <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Time horizon with principal vs interest visual</Text>
      </View>

      {/* Inflation Toggle */}
      <View className={`flex-row items-center justify-between rounded-xl px-4 py-3 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
        <View className="flex-1 gap-1">
          <Text className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Adjust for inflation</Text>
          <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Subtracts ~3.5% to show real returns</Text>
        </View>
        <Switch
          value={inflationAdjusted}
          onValueChange={(value) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setInflationAdjusted(value);
          }}
          trackColor={{ false: isDark ? "#1f2937" : "#d4d4d8", true: "#22c55e" }}
          thumbColor={inflationAdjusted ? "#fff" : "#9ca3af"}
        />
      </View>

      {/* Comparison Mode Toggle */}
      <View className={`flex-row items-center justify-between rounded-xl px-4 py-3 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
        <View className="flex-1 gap-1">
          <Text className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Compare Scenarios</Text>
          <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>See side-by-side growth comparison</Text>
        </View>
        <Switch
          value={comparisonEnabled}
          onValueChange={(value) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setComparisonEnabled(value);
          }}
          trackColor={{ false: isDark ? "#1f2937" : "#d4d4d8", true: "#fb923c" }}
          thumbColor={comparisonEnabled ? "#fff" : "#9ca3af"}
        />
      </View>

      {/* Comparison Rate Input (shown when comparison is enabled) */}
      {comparisonEnabled && (
        <Animated.View entering={FadeIn.duration(300)} className="gap-3">
          <Text className={`font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>Comparison Rate (%)</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setComparisonRate(1);
              }}
              className={`flex-1 px-4 py-3 rounded-xl ${comparisonRate === 1 ? 'bg-orange-500' : isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}
            >
              <Text className={`text-center font-semibold ${comparisonRate === 1 ? 'text-white' : isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Bank 1%
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setComparisonRate(3.5);
              }}
              className={`flex-1 px-4 py-3 rounded-xl ${comparisonRate === 3.5 ? 'bg-orange-500' : isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}
            >
              <Text className={`text-center font-semibold ${comparisonRate === 3.5 ? 'text-white' : isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Inflation 3.5%
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setComparisonRate(5);
              }}
              className={`flex-1 px-4 py-3 rounded-xl ${comparisonRate === 5 ? 'bg-orange-500' : isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}
            >
              <Text className={`text-center font-semibold ${comparisonRate === 5 ? 'text-white' : isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Bonds 5%
              </Text>
            </Pressable>
          </View>
          <View className={`flex-row items-center gap-3 rounded-xl px-4 py-3 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
            <Text className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Custom:</Text>
            <Slider
              value={comparisonRate}
              onValueChange={(value) => setComparisonRate(Number(value.toFixed(1)))}
              onSlidingComplete={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              minimumValue={0}
              maximumValue={20}
              step={0.1}
              minimumTrackTintColor="#fb923c"
              maximumTrackTintColor={isDark ? "#1f2937" : "#e5e7eb"}
              thumbTintColor="#fb923c"
              style={{ flex: 1 }}
            />
            <Text className="text-orange-400 font-bold text-lg w-16 text-right">{comparisonRate.toFixed(1)}%</Text>
          </View>
        </Animated.View>
      )}

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className={isDark ? 'text-neutral-300' : 'text-neutral-600'}>Horizon (years)</Text>
          <Text className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{displayHorizon}y</Text>
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
          maximumTrackTintColor={isDark ? "#1f2937" : "#e5e7eb"}
          thumbTintColor="#22c55e"
        />
      </View>

      {/* Line Chart */}
      <Animated.View className="items-center" entering={FadeIn.duration(300)}>
        {comparisonEnabled && (
          <View className="flex-row gap-4 mb-2 px-4">
            <View className="flex-row items-center gap-2">
              <View className="w-4 h-4 rounded-full bg-emerald-500" />
              <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Main ({derived.effectiveRate.toFixed(1)}%)</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-4 h-4 rounded-full bg-orange-400" />
              <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Compare ({comparisonRate.toFixed(1)}%)</Text>
            </View>
          </View>
        )}
        <LineChart
          data={chartData}
          width={Dimensions.get("window").width - 64}
          height={220}
          chartConfig={{
            backgroundColor: isDark ? "#171717" : "#f9fafb",
            backgroundGradientFrom: isDark ? "#171717" : "#f9fafb",
            backgroundGradientTo: isDark ? "#171717" : "#f9fafb",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            labelColor: (opacity = 1) => isDark ? `rgba(163, 163, 163, ${opacity})` : `rgba(64, 64, 64, ${opacity})`,
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
              stroke: isDark ? "#1f2937" : "#e5e7eb",
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

      {/* Comparison Difference Display */}
      {comparisonEnabled && (
        <Animated.View entering={FadeIn.duration(300)} className={`p-4 border rounded-2xl gap-2 ${isDark ? 'bg-amber-900/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
          <Text className="text-sm font-semibold text-amber-400">Opportunity Gap</Text>
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            {formatCurrency(Math.abs(derived.growth.futureValue - computeFutureValueMonthly(derived.savingsMonthly, comparisonRate, horizonYears, lumpSum).futureValue))}
          </Text>
          <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            {derived.effectiveRate > comparisonRate 
              ? `You'd earn ${formatCurrency(derived.growth.futureValue - computeFutureValueMonthly(derived.savingsMonthly, comparisonRate, horizonYears, lumpSum).futureValue)} MORE with your main scenario`
              : `You'd earn ${formatCurrency(computeFutureValueMonthly(derived.savingsMonthly, comparisonRate, horizonYears, lumpSum).futureValue - derived.growth.futureValue)} MORE with the comparison scenario`
            }
          </Text>
        </Animated.View>
      )}

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

      <View className={`gap-2 p-4 rounded-2xl ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
        <Text className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>Projected total value</Text>
        <Text className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{formatCurrency(derived.growth.futureValue)}</Text>
        <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
          Based on monthly savings {formatCurrency(derived.savingsMonthly)} at {derived.effectiveRate}% annual
          {derived.inflationRate > 0 && " (inflation-adjusted)"}
        </Text>
        {lumpSum > 0 && (
          <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>+ Starting lump sum {formatCurrency(lumpSum)}</Text>
        )}
      </View>

      {/* Timeline Breakdown */}
      <View className="gap-3">
        <Text className={`text-sm font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>Growth Timeline</Text>
        <View className="gap-2">
          {timelineBreakdown.map((milestone, index) => (
            <Animated.View
              key={milestone.year}
              entering={FadeIn.duration(300).delay(index * 50)}
              className={`flex-row items-center justify-between p-3 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}
            >
              <View className="gap-1">
                <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Year {milestone.year}</Text>
                <View className="flex-row gap-2">
                  <Text className="text-xs text-emerald-400">{formatCurrency(milestone.principal)} saved</Text>
                  <Text className="text-xs text-amber-400">+ {formatCurrency(milestone.interest)} interest</Text>
                </View>
              </View>
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{formatCurrency(milestone.futureValue)}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
