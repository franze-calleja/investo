import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useMemo, useRef, useState } from "react";
import { Dimensions, Pressable, Switch, Text, View } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { clamp, computeNetIncome, computeSplitAmounts } from "../src/lib/calculations";
import { useInvestmentStore } from "../src/state/useInvestmentStore";
import { IncomeKeypad } from "./IncomeKeypad";

const TRACK_COLORS = {
  needs: "#60a5fa",
  wants: "#f97316",
  savings: "#22c55e"
};

export function BudgetSplitter() {
  const [showDeduction, setShowDeduction] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const lastHapticValue = useRef<{ [key: string]: number }>({});

  const income = useInvestmentStore((state) => state.income);
  const deductionPct = useInvestmentStore((state) => state.deductionPct);
  const split = useInvestmentStore((state) => state.split);
  const setIncome = useInvestmentStore((state) => state.setIncome);
  const setDeductionPct = useInvestmentStore((state) => state.setDeductionPct);
  const setSplit = useInvestmentStore((state) => state.setSplit);
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
    <View className="gap-5 bg-neutral-900 p-4 rounded-2xl">
      <View className="flex-row items-center justify-between">
        <View className="gap-1">
          <Text className="text-white text-xl font-semibold">Budget Splitter</Text>
          <Text className="text-neutral-400 text-sm">Interactive 50/30/20 with live amounts</Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            resetSplit();
          }}
        >
          <Text className="text-emerald-400 font-semibold">Reset</Text>
        </Pressable>
      </View>

      <View className="gap-3">
        <Text className="text-neutral-300">Monthly income</Text>
        <Pressable
          onPress={() => setShowKeypad(true)}
          className="bg-neutral-800 rounded-xl px-4 py-3"
        >
          <Text className="text-white text-lg">
            {income ? `₱${income.toLocaleString()}` : "Tap to enter income"}
          </Text>
        </Pressable>
      </View>

      <IncomeKeypad
        visible={showKeypad}
        onClose={() => setShowKeypad(false)}
        onSubmit={setIncome}
        initialValue={income}
      />

      <View className="flex-row items-center justify-between">
        <Text className="text-neutral-300">Deduction toggle</Text>
        <Switch value={showDeduction} onValueChange={setShowDeduction} />
      </View>

      {showDeduction && (
        <View className="gap-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-neutral-300">Deduction %</Text>
            <Text className="text-white font-semibold">{deductionPct}%</Text>
          </View>
          <Slider
            value={deductionPct}
            onValueChange={(v) => setDeductionPct(clamp(v, 0, 60))}
            minimumValue={0}
            maximumValue={60}
            step={1}
            minimumTrackTintColor="#22c55e"
            maximumTrackTintColor="#1f2937"
            thumbTintColor="#22c55e"
          />
        </View>
      )}

      <View className="gap-4">
        {splitSummary.map((item) => (
          <View key={item.key} className="gap-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-white font-semibold">{item.label}</Text>
              <Text className="text-white">{item.pct.toFixed(0)}% • ₱{Math.round(item.amount).toLocaleString()}</Text>
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
              minimumValue={0}
              maximumValue={100}
              step={1}
              minimumTrackTintColor={item.color}
              maximumTrackTintColor="#1f2937"
              thumbTintColor={item.color}
            />
          </View>
        ))}
      </View>

      {/* Donut Chart */}
      <View className="items-center py-4">
        <PieChart
          data={chartData}
          width={Dimensions.get("window").width - 80}
          height={200}
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
      </View>

      <View className="flex-row justify-between">
        <Text className="text-neutral-400">Net income</Text>
        <Text className="text-white font-semibold">₱{Math.round(derived.netIncome).toLocaleString()}</Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-neutral-400">Savings monthly</Text>
        <Text className="text-emerald-400 font-semibold">₱{Math.round(derived.savingsMonthly).toLocaleString()}</Text>
      </View>
    </View>
  );
}
