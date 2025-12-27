import Slider from "@react-native-community/slider";
import { useMemo, useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";
import { clamp, computeNetIncome, computeSplitAmounts } from "../src/lib/calculations";
import { useInvestmentStore } from "../src/state/useInvestmentStore";

const TRACK_COLORS = {
  needs: "#60a5fa",
  wants: "#f97316",
  savings: "#22c55e"
};

export function BudgetSplitter() {
  const [showDeduction, setShowDeduction] = useState(false);

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

  return (
    <View className="gap-5 bg-neutral-900 p-4 rounded-2xl">
      <View className="flex-row items-center justify-between">
        <View className="gap-1">
          <Text className="text-white text-xl font-semibold">Budget Splitter</Text>
          <Text className="text-neutral-400 text-sm">Interactive 50/30/20 with live amounts</Text>
        </View>
        <Text onPress={resetSplit} className="text-emerald-400 font-semibold">Reset</Text>
      </View>

      <View className="gap-3">
        <Text className="text-neutral-300">Monthly income</Text>
        <TextInput
          value={income ? String(income) : ""}
          onChangeText={(v) => setIncome(Number(v) || 0)}
          keyboardType="numeric"
          placeholder="Enter monthly income"
          placeholderTextColor="#6b7280"
          className="bg-neutral-800 text-white rounded-xl px-4 py-3"
        />
      </View>

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
              onValueChange={(v) => setSplit(item.key, clamp(v, 0, 100))}
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

      <View className="h-3 rounded-full overflow-hidden bg-neutral-800 flex-row">
        {splitSummary.map((item) => (
          <View
            key={item.key}
            style={{ flex: item.pct }}
            className="h-full"
          >
            <View style={{ backgroundColor: item.color, flex: 1 }} />
          </View>
        ))}
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
