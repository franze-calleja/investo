import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useAssetCagr } from "../src/hooks/useAssetCagr";
import { useInvestmentStore } from "../src/state/useInvestmentStore";
import { RateKeypad } from "./RateKeypad";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MarketSelector() {
  const assetRate = useInvestmentStore((state) => state.assetRate);
  const manualRatePct = useInvestmentStore((state) => state.manualRatePct);
  const setAssetRate = useInvestmentStore((state) => state.setAssetRate);
  const setManualRatePct = useInvestmentStore((state) => state.setManualRatePct);

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
    <View className="gap-5 bg-neutral-900 p-4 rounded-2xl">
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
          <Text className="text-white text-base">
            {manualRate || "Leave blank to use API/fallback"}
          </Text>
        </View>
        <RateKeypad value={manualRate} onChange={setManualRate} />
      </View>

      <View className="bg-neutral-800 rounded-2xl p-4 gap-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-white text-lg font-semibold">Rate</Text>
          {isLoading && <Text className="text-amber-400 text-sm">Loading…</Text>}
          {isFallback && <Text className="text-orange-400 text-xs">Using fallback rate</Text>}
        </View>
        {isError && !data && <Text className="text-red-400 text-sm">{String(error)}</Text>}
        {effectiveRate !== undefined ? (
          <Text className="text-3xl text-emerald-400 font-semibold">{effectiveRate}%</Text>
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
    </View>
  );
}
