import { forwardRef, useMemo } from "react";
import { Dimensions, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { computeFutureValueMonthly, computeNetIncome, computePassiveIncome, computeSplitAmounts } from "../src/lib/calculations";
import { formatCurrency } from "../src/lib/formatCurrency";
import { useInvestmentStore } from "../src/state/useInvestmentStore";

function formatNumber(value: number) {
  return Math.round(value).toLocaleString();
}

function Card({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View
      className="gap-1 p-4 bg-neutral-900 rounded-2xl"
      style={accent ? { borderColor: accent, borderWidth: 1 } : undefined}
    >
      <Text className="text-sm text-neutral-400">{label}</Text>
      <Text className="text-xl font-semibold text-white">{value}</Text>
    </View>
  );
}

export const ShareableCard = forwardRef<View>((props, ref) => {
  const income = useInvestmentStore((state) => state.income);
  const deductionPct = useInvestmentStore((state) => state.deductionPct);
  const split = useInvestmentStore((state) => state.split);
  const horizonYears = useInvestmentStore((state) => state.horizonYears);
  const manualRatePct = useInvestmentStore((state) => state.manualRatePct);
  const assetRate = useInvestmentStore((state) => state.assetRate);
  const lumpSum = useInvestmentStore((state) => state.lumpSum);
  const inflationAdjusted = useInvestmentStore((state) => state.inflationAdjusted);
  const comparisonEnabled = useInvestmentStore((state) => state.comparisonEnabled);
  const comparisonRate = useInvestmentStore((state) => state.comparisonRate);
  const currency = useInvestmentStore((state) => state.currency);

  const derived = useMemo(() => {
    const netIncome = computeNetIncome(income, deductionPct);
    const splitAmounts = computeSplitAmounts(netIncome, split);
    const savingsMonthly = splitAmounts.savings;
    const baseRate = manualRatePct ?? assetRate.cagrPct ?? 0;
    const inflationRate = inflationAdjusted ? 3.5 : 0;
    const effectiveRate = Math.max(baseRate - inflationRate, 0);
    const growth = computeFutureValueMonthly(savingsMonthly, effectiveRate, horizonYears, lumpSum);
    const passiveIncome = computePassiveIncome(growth.futureValue, effectiveRate);
    return { growth, passiveIncome, savingsMonthly, effectiveRate };
  }, [income, deductionPct, split, horizonYears, manualRatePct, assetRate.cagrPct, lumpSum, inflationAdjusted]);

  const chartData = useMemo(() => {
    const years = Math.min(horizonYears, 20);
    const increment = horizonYears > 20 ? Math.ceil(horizonYears / 20) : 1;
    const mainPoints: number[] = [];
    const comparisonPoints: number[] = [];
    const labels: string[] = [];

    for (let year = 0; year <= horizonYears; year += increment) {
      const netIncome = computeNetIncome(income, deductionPct);
      const splitAmounts = computeSplitAmounts(netIncome, split);
      const savingsMonthly = splitAmounts.savings;

      const baseRate = manualRatePct ?? assetRate.cagrPct ?? 0;
      const inflationRate = inflationAdjusted ? 3.5 : 0;
      const effectiveRate = Math.max(baseRate - inflationRate, 0);
      const growth = computeFutureValueMonthly(savingsMonthly, effectiveRate, year, lumpSum);
      mainPoints.push(growth.futureValue);

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
  }, [
    horizonYears,
    income,
    deductionPct,
    split,
    manualRatePct,
    assetRate.cagrPct,
    lumpSum,
    inflationAdjusted,
    comparisonEnabled,
    comparisonRate,
  ]);

  return (
    <View ref={ref} collapsable={false} style={{ backgroundColor: "#0a0a0a", padding: 16, gap: 12, borderRadius: 16, overflow: 'hidden', opacity: 1 }}>
      {/* Header */}
      <View style={{ alignItems: "center", marginBottom: 8 }}>
        <Text style={{ color: "#22c55e", fontSize: 24, fontWeight: "bold" }}>My Investment Plan</Text>
        <Text style={{ color: "#a3a3a3", fontSize: 14 }}>{horizonYears}-Year Projection</Text>
      </View>

      {/* Chart */}
      <View style={{ alignItems: "center", marginBottom: 8 }}>
        {comparisonEnabled && (
          <View style={{ flexDirection: "row", gap: 16, marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#22c55e" }} />
              <Text style={{ color: "#a3a3a3", fontSize: 12 }}>Main ({derived.effectiveRate.toFixed(1)}%)</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#fb923c" }} />
              <Text style={{ color: "#a3a3a3", fontSize: 12 }}>Compare ({comparisonRate.toFixed(1)}%)</Text>
            </View>
          </View>
        )}
        <LineChart
          data={chartData}
          width={Dimensions.get("window").width - 64}
          height={200}
          chartConfig={{
            backgroundColor: "#171717",
            backgroundGradientFrom: "#171717",
            backgroundGradientTo: "#171717",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(163, 163, 163, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: "3",
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
          style={{ marginVertical: 8, borderRadius: 16 }}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
        />
      </View>

      {/* Stats Cards */}
      <View style={{ gap: 12 }}>
        <Card
          label="Total Portfolio Value"
          value={formatCurrency(derived.growth.futureValue, currency.code, currency.symbol)}
          accent="#22c55e"
        />
        <Card label="Total Contributions" value={formatCurrency(derived.growth.principal, currency.code, currency.symbol)} />
        <Card label="Total Interest Earned" value={formatCurrency(derived.growth.interest, currency.code, currency.symbol)} />
        <Card label="Monthly Passive Income" value={formatCurrency(derived.passiveIncome, currency.code, currency.symbol)} />
      </View>

      {/* Footer */}
      <View
        style={{
          alignItems: "center",
          marginTop: 8,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: "#262626",
        }}
      >
        <Text style={{ color: "#737373", fontSize: 12 }}>Generated with Investo</Text>
      </View>
    </View>
  );
});

ShareableCard.displayName = "ShareableCard";
