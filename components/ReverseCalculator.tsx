import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { computeRequiredMonthlyContribution } from "../src/lib/calculations";
import { useCurrencyFormatter } from "../src/lib/formatCurrency";
import { useInvestmentStore } from "../src/state/useInvestmentStore";

export function ReverseCalculator() {
  const theme = useInvestmentStore((state) => state.theme);
  const isDark = theme === 'dark';
  const currency = useInvestmentStore((state) => state.currency);
  const assetRate = useInvestmentStore((state) => state.assetRate);
  const manualRatePct = useInvestmentStore((state) => state.manualRatePct);
  const formatCurrency = useCurrencyFormatter();
  
  const [targetAmount, setTargetAmount] = useState("");
  const [years, setYears] = useState("");
  const [currentSavings, setCurrentSavings] = useState("");
  
  const effectiveRate = manualRatePct ?? assetRate.cagrPct ?? 8;
  
  const parsedTarget = parseFloat(targetAmount) || 0;
  const parsedYears = parseFloat(years) || 0;
  const parsedSavings = parseFloat(currentSavings) || 0;
  
  const result = computeRequiredMonthlyContribution(
    parsedTarget,
    effectiveRate,
    parsedYears,
    parsedSavings
  );
  
  const isValid = parsedTarget > 0 && parsedYears > 0;
  
  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      className={`p-6 rounded-2xl ${isDark ? 'bg-neutral-900' : 'bg-white'}`}
    >
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <Text className="text-2xl">🎯</Text>
        <View className="flex-1">
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            Reverse Calculator
          </Text>
          <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            How much to save monthly for your goal?
          </Text>
        </View>
      </View>

      {/* Input Fields */}
      <View className="gap-4 mb-4">
        {/* Target Amount */}
        <View>
          <Text className={`mb-2 text-sm font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
            Target Amount
          </Text>
          <View className={`flex-row items-center gap-2 px-4 py-3 rounded-xl ${
            isDark ? 'bg-neutral-800' : 'bg-neutral-100'
          }`}>
            <Text className={`text-lg font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {currency.symbol}
            </Text>
            <TextInput
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="5000000"
              placeholderTextColor="#737373"
              keyboardType="numeric"
              className={`flex-1 text-lg font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}
            />
          </View>
        </View>

        {/* Time Horizon */}
        <View>
          <Text className={`mb-2 text-sm font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
            Time Horizon (years)
          </Text>
          <View className={`flex-row items-center gap-2 px-4 py-3 rounded-xl ${
            isDark ? 'bg-neutral-800' : 'bg-neutral-100'
          }`}>
            <Ionicons name="calendar-outline" size={20} color={isDark ? '#22c55e' : '#16a34a'} />
            <TextInput
              value={years}
              onChangeText={setYears}
              placeholder="30"
              placeholderTextColor="#737373"
              keyboardType="numeric"
              className={`flex-1 text-lg font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}
            />
          </View>
        </View>

        {/* Current Savings (Optional) */}
        <View>
          <Text className={`mb-2 text-sm font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
            Current Savings (optional)
          </Text>
          <View className={`flex-row items-center gap-2 px-4 py-3 rounded-xl ${
            isDark ? 'bg-neutral-800' : 'bg-neutral-100'
          }`}>
            <Text className={`text-lg font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {currency.symbol}
            </Text>
            <TextInput
              value={currentSavings}
              onChangeText={setCurrentSavings}
              placeholder="0"
              placeholderTextColor="#737373"
              keyboardType="numeric"
              className={`flex-1 text-lg font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}
            />
          </View>
        </View>
      </View>

      {/* Results */}
      {isValid && (
        <Animated.View entering={FadeIn.duration(300)} className="gap-3">
          {/* Monthly Savings Required */}
          <View className={`p-4 rounded-xl border-2 ${
            isDark ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <Text className={`mb-1 text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              Required Monthly Savings
            </Text>
            <Text className={`text-3xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {formatCurrency(result.monthly)}/mo
            </Text>
          </View>

          {/* Breakdown */}
          <View className={`p-4 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
            <Text className={`mb-3 text-sm font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
              Breakdown
            </Text>
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className={`${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Total Contributions
                </Text>
                <Text className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  {formatCurrency(result.totalContributions)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className={`${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Interest Earned
                </Text>
                <Text className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {formatCurrency(result.interest)}
                </Text>
              </View>
              <View className={`h-px my-1 ${isDark ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
              <View className="flex-row items-center justify-between">
                <Text className={`font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  Target Amount
                </Text>
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  {formatCurrency(parsedTarget)}
                </Text>
              </View>
            </View>
          </View>

          {/* Rate Info */}
          <View className={`flex-row items-center gap-2 p-3 rounded-lg ${
            isDark ? 'bg-neutral-800/50' : 'bg-neutral-50'
          }`}>
            <Ionicons name="information-circle-outline" size={16} color={isDark ? '#a3a3a3' : '#525252'} />
            <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Calculated at {effectiveRate.toFixed(1)}% annual return
              {assetRate.symbol && ` (${assetRate.symbol})`}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Empty State */}
      {!isValid && (
        <View className={`items-center gap-2 p-6 rounded-xl ${isDark ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
          <Ionicons name="calculator-outline" size={32} color={isDark ? '#525252' : '#a3a3a3'} />
          <Text className={`text-sm text-center ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Enter your target amount and time horizon to calculate required monthly savings
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
