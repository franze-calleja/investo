import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useMemo, useRef, useState } from "react";
import { Dimensions, Pressable, Switch, Text, View } from "react-native";
import { PieChart } from "react-native-chart-kit";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { clamp, computeNetIncome, computeSplitAmounts } from "../src/lib/calculations";
import { useCurrencyFormatter } from "../src/lib/formatCurrency";
import { useInvestmentStore } from "../src/state/useInvestmentStore";
import { IncomeKeypad } from "./IncomeKeypad";

const TRACK_COLORS = {
  needs: "#60a5fa",
  wants: "#f97316",
  savings: "#22c55e"
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BudgetSplitter() {
  const formatCurrency = useCurrencyFormatter();
  const theme = useInvestmentStore((state) => state.theme);
  const isDark = theme === 'dark';
  const [showDeduction, setShowDeduction] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [showLumpSumKeypad, setShowLumpSumKeypad] = useState(false);
  const lastHapticValue = useRef<{ [key: string]: number }>({});
  const incomeScale = useSharedValue(1);
  const lumpSumScale = useSharedValue(1);
  const resetScale = useSharedValue(1);

  const income = useInvestmentStore((state) => state.income);
  const currency = useInvestmentStore((state) => state.currency);
  const deductionPct = useInvestmentStore((state) => state.deductionPct);
  const split = useInvestmentStore((state) => state.split);
  const lumpSum = useInvestmentStore((state) => state.lumpSum);
  const setIncome = useInvestmentStore((state) => state.setIncome);
  const setDeductionPct = useInvestmentStore((state) => state.setDeductionPct);
  const setSplit = useInvestmentStore((state) => state.setSplit);
  const setLumpSum = useInvestmentStore((state) => state.setLumpSum);
  const resetSplit = useInvestmentStore((state) => state.resetSplit);

  const derived = useMemo(() => {
    const netIncome = computeNetIncome(income, deductionPct);
    const splitAmounts = computeSplitAmounts(netIncome, split);
    const savingsMonthly = splitAmounts.savings;
    return { netIncome, splitAmounts, savingsMonthly };
  }, [income, deductionPct, split]);

  const splitSummary = useMemo(
    () => [
      { key: "needsPct" as const, label: "Needs", pct: split.needsPct, amount: derived.splitAmounts.needs, color: TRACK_COLORS.needs },
      { key: "wantsPct" as const, label: "Wants", pct: split.wantsPct, amount: derived.splitAmounts.wants, color: TRACK_COLORS.wants },
      { key: "savingsPct" as const, label: "Savings", pct: split.savingsPct, amount: derived.splitAmounts.savings, color: TRACK_COLORS.savings }
    ],
    [split, derived.splitAmounts]
  );

  const chartData = useMemo(
    () => splitSummary.map((item) => ({
      name: item.label,
      population: item.amount,
      color: item.color,
      legendFontColor: "#a3a3a3",
      legendFontSize: 13,
    })),
    [splitSummary]
  );

  return (
    <Animated.View className={`gap-5 p-4 rounded-2xl ${isDark ? 'bg-neutral-900' : 'bg-white'}`} entering={FadeIn.duration(300)}>
      <View className="flex-row items-center justify-between">
        <View className="gap-1">
          <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Budget Splitter</Text>
          <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Interactive 50/30/20 with live amounts</Text>
        </View>
        <AnimatedPressable
          onPressIn={() => {
            resetScale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
          }}
          onPressOut={() => {
            resetScale.value = withSpring(1, { damping: 15, stiffness: 400 });
          }}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            resetSplit();
          }}
          style={useAnimatedStyle(() => ({
            transform: [{ scale: resetScale.value }]
          }))}
        >
          <Text className="text-emerald-400 font-semibold">Reset</Text>
        </AnimatedPressable>
      </View>

      {/* Quick Presets */}
      <View className="gap-3">
        <Text className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>Quick Presets</Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSplit("needsPct", 50);
              setSplit("wantsPct", 30);
              setSplit("savingsPct", 20);
            }}
            className={`flex-1 px-3 py-2 rounded-xl ${
              split.needsPct === 50 && split.wantsPct === 30 && split.savingsPct === 20
                ? "bg-emerald-500"
                : isDark ? "bg-neutral-800" : "bg-neutral-100"
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                split.needsPct === 50 && split.wantsPct === 30 && split.savingsPct === 20
                  ? "text-white"
                  : isDark ? "text-neutral-400" : "text-neutral-600"
              }`}
            >
              50/30/20
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSplit("needsPct", 60);
              setSplit("wantsPct", 20);
              setSplit("savingsPct", 20);
            }}
            className={`flex-1 px-3 py-2 rounded-xl ${
              split.needsPct === 60 && split.wantsPct === 20 && split.savingsPct === 20
                ? "bg-emerald-500"
                : isDark ? "bg-neutral-800" : "bg-neutral-100"
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                split.needsPct === 60 && split.wantsPct === 20 && split.savingsPct === 20
                  ? "text-white"
                  : isDark ? "text-neutral-400" : "text-neutral-600"
              }`}
            >
              60/20/20
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSplit("needsPct", 70);
              setSplit("wantsPct", 20);
              setSplit("savingsPct", 10);
            }}
            className={`flex-1 px-3 py-2 rounded-xl ${
              split.needsPct === 70 && split.wantsPct === 20 && split.savingsPct === 10
                ? "bg-emerald-500"
                : isDark ? "bg-neutral-800" : "bg-neutral-100"
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                split.needsPct === 70 && split.wantsPct === 20 && split.savingsPct === 10
                  ? "text-white"
                  : isDark ? "text-neutral-400" : "text-neutral-600"
              }`}
            >
              70/20/10
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="gap-3">
        <Text className={isDark ? 'text-neutral-300' : 'text-neutral-600'}>Monthly income</Text>
        <AnimatedPressable
          onPressIn={() => {
            incomeScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onPressOut={() => {
            incomeScale.value = withSpring(1, { damping: 15, stiffness: 400 });
          }}
          onPress={() => setShowKeypad(true)}
          className={`rounded-xl px-4 py-3 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}
          style={useAnimatedStyle(() => ({
            transform: [{ scale: incomeScale.value }]
          }))}
        >
          <Text className={`text-lg ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            {income ? formatCurrency(income) : "Tap to enter income"}
          </Text>
        </AnimatedPressable>
      </View>

      <IncomeKeypad
        visible={showKeypad}
        onClose={() => setShowKeypad(false)}
        onSubmit={setIncome}
        initialValue={income}
      />

      <IncomeKeypad
        visible={showLumpSumKeypad}
        onClose={() => setShowLumpSumKeypad(false)}
        onSubmit={setLumpSum}
        initialValue={lumpSum}
        title="Starting Lump Sum"
      />

      {/* Lump Sum */}
      <View className="gap-3">
        <Text className={isDark ? 'text-neutral-300' : 'text-neutral-600'}>Starting lump sum (optional)</Text>
        <AnimatedPressable
          onPressIn={() => {
            lumpSumScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onPressOut={() => {
            lumpSumScale.value = withSpring(1, { damping: 15, stiffness: 400 });
          }}
          onPress={() => setShowLumpSumKeypad(true)}
          className={`rounded-xl px-4 py-3 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}
          style={useAnimatedStyle(() => ({
            transform: [{ scale: lumpSumScale.value }]
          }))}
        >
          <Text className={`text-lg ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            {lumpSum ? formatCurrency(lumpSum) : "Tap to add initial investment"}
          </Text>
        </AnimatedPressable>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className={isDark ? 'text-neutral-300' : 'text-neutral-600'}>Deduction toggle</Text>
        <Switch value={showDeduction} onValueChange={setShowDeduction} />
      </View>

      {showDeduction && (
        <View className="gap-2">
          <View className="flex-row justify-between items-center">
            <Text className={isDark ? 'text-neutral-300' : 'text-neutral-600'}>Deduction %</Text>
            <Text className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{deductionPct}%</Text>
          </View>
          <Slider
            value={deductionPct}
            onValueChange={(v) => setDeductionPct(clamp(v, 0, 60))}
            minimumValue={0}
            maximumValue={60}
            step={1}
            minimumTrackTintColor="#22c55e"
            maximumTrackTintColor={isDark ? "#1f2937" : "#e5e7eb"}
            thumbTintColor="#22c55e"
          />
        </View>
      )}

      <View className="gap-4">
        {splitSummary.map((item) => (
          <View key={item.key} className="gap-2">
            <View className="flex-row justify-between items-center">
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{item.label}</Text>
              <Text className={isDark ? 'text-white' : 'text-neutral-900'}>{item.pct.toFixed(0)}% • {formatCurrency(item.amount)}</Text>
            </View>
            <Slider
              value={item.pct}
              onValueChange={(v) => {
                const newValue = Math.round(clamp(v, 0, 100));
                // Haptic feedback on every 5% increment
                const lastValue = lastHapticValue.current[item.key] || 0;
                if (Math.floor(newValue / 5) !== Math.floor(lastValue / 5)) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  lastHapticValue.current[item.key] = newValue;
                }
                setSplit(item.key, newValue);
              }}
              onSlidingComplete={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              minimumValue={0}
              maximumValue={100}
              step={1}
              minimumTrackTintColor={item.color}
              maximumTrackTintColor={isDark ? "#1f2937" : "#e5e7eb"}
              thumbTintColor={item.color}
            />
          </View>
        ))}
      </View>

      {/* Donut Chart */}
      <Animated.View className="items-center py-4" entering={FadeIn.duration(300)}>
        <PieChart
          data={chartData}
          width={Math.min(Dimensions.get("window").width - 80, 340)}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            backgroundGradientFrom: "#171717",
            backgroundGradientTo: "#171717",
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 0]}
          absolute
          hasLegend={true}
        />
      </Animated.View>

      <Animated.View className="flex-row justify-between" entering={FadeIn.duration(300).delay(100)}>
        <Text className="text-neutral-400">Net income</Text>
        <Text className="text-white font-semibold">{formatCurrency(derived.netIncome)}</Text>
      </Animated.View>
      <Animated.View className="flex-row justify-between" entering={FadeIn.duration(300).delay(200)}>
        <Text className="text-neutral-400">Savings monthly</Text>
        <Text className="text-emerald-400 font-semibold">{formatCurrency(derived.savingsMonthly)}</Text>
      </Animated.View>
    </Animated.View>
  );
}
