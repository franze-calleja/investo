import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Switch, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useAssetCagr } from "../src/hooks/useAssetCagr";
import { useInvestmentStore } from "../src/state/useInvestmentStore";
import { RateKeypad } from "./RateKeypad";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MarketSelector() {
  const assetRate = useInvestmentStore((state) => state.assetRate);
  const manualRatePct = useInvestmentStore((state) => state.manualRatePct);
  const inflationAdjusted = useInvestmentStore((state) => state.inflationAdjusted);
  const setAssetRate = useInvestmentStore((state) => state.setAssetRate);
  const setManualRatePct = useInvestmentStore((state) => state.setManualRatePct);
  const setInflationAdjusted = useInvestmentStore((state) => state.setInflationAdjusted);

  const [symbol, setSymbol] = useState(assetRate.symbol ?? "SPX");
  const [manualRate, setManualRate] = useState<string>(manualRatePct?.toString() ?? "");
  const refreshScale = useSharedValue(1);

  const { data, isLoading, isError, error, isFallback, refetch } = useAssetCagr({ symbol });

  useEffect(() => {
    if (!data) return;
    setAssetRate({ symbol: data.symbol, cagrPct: data.cagrPct, source: data.source });
  }, [data, setAssetRate]);

  useEffect(() => {
    if (manualRate.trim().length === 0) {
      setManualRatePct(null);
      return;
    }
    const value = Number(manualRate);
    if (Number.isFinite(value)) {
      setManualRatePct(value);
    }
  }, [manualRate, setManualRatePct]);

  const effectiveRate = useMemo(() => {
    const manual = Number(manualRate);
    if (Number.isFinite(manual) && manualRate.trim().length > 0) return manual;
    return data?.cagrPct ?? assetRate.cagrPct ?? undefined;
  }, [manualRate, data?.cagrPct, assetRate.cagrPct]);

  return (
    <Animated.View className="gap-5 bg-neutral-900 p-4 rounded-2xl" entering={FadeIn.duration(300)}>
      <View className="flex-row items-center justify-between">
        <View className="gap-1">
          <Text className="text-white text-xl font-semibold">Market Selector</Text>
          <Text className="text-neutral-400 text-sm">API-backed rate with manual override</Text>
        </View>
        <AnimatedPressable
          onPressIn={() => {
            refreshScale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onPressOut={() => {
            refreshScale.value = withSpring(1, { damping: 15, stiffness: 400 });
          }}
          onPress={refetch}
          style={useAnimatedStyle(() => ({
            transform: [{ scale: refreshScale.value }]
          }))}
        >
          <Text className="text-emerald-400 font-semibold">Refresh</Text>
        </AnimatedPressable>
      </View>

      <View className="gap-3">
        <Text className="text-neutral-300">Symbol</Text>
        <TextInput
          value={symbol}
          onChangeText={setSymbol}
          autoCapitalize="characters"
          placeholder="e.g., SPX or AAPL"
          placeholderTextColor="#6b7280"
          className="bg-neutral-800 text-white rounded-xl px-4 py-3"
        />
      </View>

      <View className="gap-3">
        <Text className="text-neutral-300">Manual rate override (%)</Text>
        <View className="bg-neutral-800 text-white rounded-xl px-4 py-3 min-h-[52px] justify-center">
          <Text className={manualRate ? "text-white text-base" : "text-neutral-500 text-base"}>
            {manualRate || "Leave blank to use API/fallback"}
          </Text>
        </View>
        {manualRate && Number(manualRate) > 50 && (
          <Text className="text-amber-400 text-xs">⚠️ High rate - be realistic with projections</Text>
        )}
        <RateKeypad value={manualRate} onChange={setManualRate} />
      </View>

      {/* Inflation Toggle */}
      <View className="flex-row items-center justify-between bg-neutral-800 rounded-xl px-4 py-3">
        <View className="flex-1 gap-1">
          <Text className="text-white font-semibold">Adjust for inflation</Text>
          <Text className="text-neutral-400 text-xs">Subtracts ~3.5% to show real returns</Text>
        </View>
        <Switch
          value={inflationAdjusted}
          onValueChange={(value) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setInflationAdjusted(value);
          }}
          trackColor={{ false: "#1f2937", true: "#22c55e" }}
          thumbColor={inflationAdjusted ? "#fff" : "#9ca3af"}
        />
      </View>

      <View className="bg-neutral-800 rounded-2xl p-4 gap-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-white text-lg font-semibold">Rate</Text>
          {isLoading && (
            <Animated.View entering={FadeIn.duration(200)}>
              <Text className="text-amber-400 text-sm">Loading…</Text>
            </Animated.View>
          )}
          {isFallback && !isLoading && (
            <Animated.View entering={FadeIn.duration(200)}>
              <Text className="text-orange-400 text-xs">Using fallback rate</Text>
            </Animated.View>
          )}
        </View>
        {isError && !data && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Text className="text-red-400 text-sm">{String(error)}</Text>
          </Animated.View>
        )}
        {effectiveRate !== undefined ? (
          <Animated.View entering={FadeIn.duration(300)}>
            <Text className="text-3xl text-emerald-400 font-semibold">{effectiveRate}%</Text>
          </Animated.View>
        ) : (
          <Text className="text-neutral-500">No rate available yet.</Text>
        )}
        {data && (
          <Text className="text-neutral-400 text-sm">
            Source: {data.source} • symbol {data.symbol} • span ~
            {data.yearsUsed ? data.yearsUsed.toFixed(1) : "n/a"}y
          </Text>
        )}
      </View>
    </Animated.View>
  );
}
