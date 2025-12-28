import { useMemo } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { computeFutureValueMonthly, computeNetIncome, computeSplitAmounts } from "../src/lib/calculations";
import { useCurrencyFormatter } from "../src/lib/formatCurrency";
import { useInvestmentStore } from "../src/state/useInvestmentStore";

interface Milestone {
  threshold: number;
  title: string;
  icon: string;
  description?: string;
}

const MILESTONES: Milestone[] = [
  { threshold: 50000, title: "Emergency Fund Secure", icon: "🛡️", description: "6 months of expenses covered" },
  { threshold: 100000, title: "Six Figures", icon: "💯", description: "First major milestone" },
  { threshold: 500000, title: "Half Million", icon: "💰", description: "Serious wealth building" },
  { threshold: 1000000, title: "First Car", icon: "🚗", description: "Enough for a solid vehicle" },
  { threshold: 2000000, title: "Travel Fund", icon: "✈️", description: "Dream vacation unlocked" },
  { threshold: 5000000, title: "House Downpayment", icon: "🏠", description: "20% on a starter home" },
  { threshold: 10000000, title: "Eight Figures", icon: "🎯", description: "Major wealth milestone" },
  { threshold: 20000000, title: "Financial Freedom", icon: "🌴", description: "Passive income sustains lifestyle" },
  { threshold: 50000000, title: "Generational Wealth", icon: "👑", description: "Legacy secured" },
];

export function GoalsMilestones() {
  const formatCurrency = useCurrencyFormatter();
  const theme = useInvestmentStore((state) => state.theme);
  const isDark = theme === 'dark';
  const income = useInvestmentStore((state) => state.income);
  const currency = useInvestmentStore((state) => state.currency);

  const formatCurrencyShort = (value: number): string => {
    if (value >= 1000000) {
      return `${currency.symbol}${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${currency.symbol}${(value / 1000).toFixed(0)}k`;
    }
    return formatCurrency(value);
  };
  const deductionPct = useInvestmentStore((state) => state.deductionPct);
  const split = useInvestmentStore((state) => state.split);
  const manualRatePct = useInvestmentStore((state) => state.manualRatePct);
  const assetRate = useInvestmentStore((state) => state.assetRate);
  const horizonYears = useInvestmentStore((state) => state.horizonYears);
  const lumpSum = useInvestmentStore((state) => state.lumpSum);
  const inflationAdjusted = useInvestmentStore((state) => state.inflationAdjusted);

  const currentValue = useMemo(() => {
    const netIncome = computeNetIncome(income, deductionPct);
    const splitAmounts = computeSplitAmounts(netIncome, split);
    const savingsMonthly = splitAmounts.savings;
    const baseRate = manualRatePct ?? assetRate.cagrPct ?? 0;
    const inflationRate = inflationAdjusted ? 3.5 : 0;
    const effectiveRate = Math.max(baseRate - inflationRate, 0);
    const growth = computeFutureValueMonthly(savingsMonthly, effectiveRate, horizonYears, lumpSum);
    return growth.futureValue;
  }, [income, deductionPct, split, manualRatePct, assetRate.cagrPct, horizonYears, lumpSum, inflationAdjusted]);

  const achievedCount = useMemo(() => {
    return MILESTONES.filter((m) => currentValue >= m.threshold).length;
  }, [currentValue]);

  return (
    <>
      {/* Header */}
      <Animated.View className="gap-2 mb-4" entering={FadeIn.duration(300)}>
        <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Goal Milestones</Text>
        <Text className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
          Track your progress • {achievedCount} of {MILESTONES.length} unlocked
        </Text>
        <View className={`p-4 mt-2 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
          <Text className={`mb-1 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Current Projected Value</Text>
          <Text className="text-3xl font-bold text-emerald-400">{formatCurrencyShort(currentValue)}</Text>
        </View>
      </Animated.View>

      {/* Milestones List */}
      <View className="gap-4">
        {MILESTONES.map((milestone, index) => {
          const isAchieved = currentValue >= milestone.threshold;
          const progress = Math.min((currentValue / milestone.threshold) * 100, 100);

          return (
            <Animated.View
              key={milestone.threshold}
              entering={FadeIn.duration(400).delay(index * 50)}
              className={`rounded-2xl p-5 ${
                isAchieved ? "bg-emerald-900/40 border-2 border-emerald-500/50" : isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-neutral-200"
              }`}
            >
              <View className="flex-row items-start gap-4">
                {/* Icon */}
                <View
                  className={`w-16 h-16 rounded-2xl items-center justify-center ${
                    isAchieved ? "bg-emerald-500/20" : isDark ? "bg-neutral-800" : "bg-neutral-100"
                  }`}
                >
                  <Text className="text-4xl" style={{ opacity: isAchieved ? 1 : 0.3 }}>
                    {milestone.icon}
                  </Text>
                </View>

                {/* Content */}
                <View className="flex-1 gap-2">
                  <View className="flex-row items-center gap-2">
                    <Text className={`text-lg font-bold ${isAchieved ? "text-emerald-400" : isDark ? "text-white" : "text-neutral-900"}`}>
                      {milestone.title}
                    </Text>
                    {isAchieved && <Text className="text-xl text-emerald-400">✓</Text>}
                  </View>

                  <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{milestone.description}</Text>

                  <View className="flex-row items-center justify-between mt-1">
                    <Text className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>{formatCurrencyShort(milestone.threshold)}</Text>
                    {!isAchieved && (
                      <Text className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>{progress.toFixed(0)}% there</Text>
                    )}
                  </View>

                  {/* Progress Bar */}
                  {!isAchieved && (
                    <View className={`h-2 mt-1 overflow-hidden rounded-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                      <View
                        className="h-full rounded-full bg-emerald-500/50"
                        style={{ width: `${progress}%` }}
                      />
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* Motivational Footer */}
      {achievedCount < MILESTONES.length && (
        <Animated.View
          className={`p-6 mt-6 border rounded-2xl ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}
          entering={FadeIn.duration(400).delay(500)}
        >
          <Text className={`mb-2 font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Next Milestone</Text>
          {(() => {
            const nextMilestone = MILESTONES.find((m) => currentValue < m.threshold);
            if (!nextMilestone) return null;
            const remaining = nextMilestone.threshold - currentValue;
            return (
              <View className="gap-1">
                <Text className="text-xl text-emerald-400">
                  {nextMilestone.icon} {nextMilestone.title}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {formatCurrencyShort(remaining)} away from unlocking
                </Text>
              </View>
            );
          })()}
        </Animated.View>
      )}

      {achievedCount === MILESTONES.length && (
        <Animated.View
          className="p-6 mt-6 border-2 bg-emerald-900/30 rounded-2xl border-emerald-500/50"
          entering={FadeIn.duration(400).delay(500)}
        >
          <Text className="mb-2 text-3xl text-center">🎉</Text>
          <Text className={`mb-2 text-xl font-bold text-center ${isDark ? 'text-white' : 'text-neutral-900'}`}>All Milestones Unlocked!</Text>
          <Text className={`text-center ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
            You've reached every goal. Time to set even bigger dreams! 🚀
          </Text>
        </Animated.View>
      )}
    </>
  );
}
