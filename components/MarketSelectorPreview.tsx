import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useAssetCagr } from "../src/hooks/useAssetCagr";

type Props = {
  defaultSymbol?: string;
};

export function MarketSelectorPreview({ defaultSymbol = "SPX" }: Props) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [manualRate, setManualRate] = useState<string>("");

  const { data, isLoading, isError, error, isFallback, refetch } = useAssetCagr({ symbol });

  const effectiveRate = useMemo(() => {
    const manual = Number(manualRate);
    if (Number.isFinite(manual) && manualRate.trim().length > 0) return manual;
    return data?.cagrPct ?? undefined;
  }, [manualRate, data?.cagrPct]);

  return (
    <View className="gap-6">
      <View className="gap-2">
        <Text className="text-2xl font-semibold text-white">Market Selector (preview)</Text>
        <Text className="text-sm text-neutral-400">
          Enter a symbol to fetch its approximate CAGR. Manual rate override always wins.
        </Text>
      </View>

      <View className="gap-3">
        <Text className="text-neutral-300">Symbol</Text>
        <TextInput
          value={symbol}
          onChangeText={setSymbol}
          autoCapitalize="characters"
          placeholder="e.g., SPX or AAPL"
          placeholderTextColor="#6b7280"
          className="px-4 py-3 text-white bg-neutral-900 rounded-xl"
        />
      </View>

      <View className="gap-3">
        <Text className="text-neutral-300">Manual rate override (%)</Text>
        <TextInput
          value={manualRate}
          onChangeText={setManualRate}
          keyboardType="decimal-pad"
          placeholder="Leave blank to use API/fallback"
          placeholderTextColor="#6b7280"
          className="px-4 py-3 text-white bg-neutral-900 rounded-xl"
        />
      </View>

      <Pressable
        onPress={refetch}
        className="items-center px-4 py-3 bg-emerald-500 active:bg-emerald-600 rounded-xl"
      >
        <Text className="font-semibold text-white">Refresh rate</Text>
      </Pressable>

      <View className="gap-2 p-4 bg-neutral-900 rounded-2xl">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-semibold text-white">Rate</Text>
          {isLoading && <Text className="text-sm text-amber-400">Loading…</Text>}
          {isFallback && <Text className="text-xs text-orange-400">Using fallback rate</Text>}
        </View>
        {isError && !data && <Text className="text-sm text-red-400">{String(error)}</Text>}
        {effectiveRate !== undefined ? (
          <Text className="text-3xl font-semibold text-emerald-400">{effectiveRate}%</Text>
        ) : (
          <Text className="text-neutral-500">No rate available yet.</Text>
        )}
        {data && (
          <Text className="text-sm text-neutral-400">
            Source: {data.source} • symbol {data.symbol} • span ~
            {data.yearsUsed ? data.yearsUsed.toFixed(1) : "n/a"}y
          </Text>
        )}
      </View>
    </View>
  );
}
