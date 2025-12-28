import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useAssetCagr } from "../src/hooks/useAssetCagr";
import { useInvestmentStore } from "../src/state/useInvestmentStore";
import { RateKeypad } from "./RateKeypad";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MarketSelector() {
  const theme = useInvestmentStore((state) => state.theme);
  const isDark = theme === 'dark';
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
    <Animated.View className={`gap-5 p-4 rounded-2xl ${isDark ? 'bg-neutral-900' : 'bg-white'}`} entering={FadeIn.duration(300)}>
      <View className="flex-row items-center justify-between">
        <View className="gap-1">
          <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Market Selector</Text>
          <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>API-backed rate with manual override</Text>
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
        <Text className={isDark ? 'text-neutral-300' : 'text-neutral-600'}>Symbol</Text>
        <TextInput
          value={symbol}
          onChangeText={setSymbol}
          autoCapitalize="characters"
          placeholder="e.g., SPX or AAPL"
          placeholderTextColor="#6b7280"
          className={`rounded-xl px-4 py-3 ${isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-900'}`}
        />
      </View>

      <View className="gap-3">
        <Text className={isDark ? 'text-neutral-300' : 'text-neutral-600'}>Manual rate override (%)</Text>
        <View className={`rounded-xl px-4 py-3 min-h-[52px] justify-center ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
          <Text className={`text-base ${manualRate ? (isDark ? 'text-white' : 'text-neutral-900') : isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
            {manualRate || "Leave blank to use API/fallback"}
          </Text>
        </View>
        {manualRate && Number(manualRate) > 50 && (
          <Text className="text-amber-400 text-xs">⚠️ High rate - be realistic with projections</Text>
        )}
        <RateKeypad value={manualRate} onChange={setManualRate} />
      </View>

      <View className={`rounded-2xl p-4 gap-2 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
        <View className="flex-row items-center gap-2">
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Rate</Text>
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
          <Text className={isDark ? 'text-neutral-500' : 'text-neutral-400'}>No rate available yet.</Text>
        )}
        {data && (
          <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Source: {data.source} • symbol {data.symbol} • span ~
            {data.yearsUsed ? data.yearsUsed.toFixed(1) : "n/a"}y
          </Text>
        )}
      </View>
    </Animated.View>
  );
}
