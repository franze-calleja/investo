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
        <Text className="text-white text-2xl font-semibold">Market Selector (preview)</Text>
        <Text className="text-neutral-400 text-sm">
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
          className="bg-neutral-900 text-white rounded-xl px-4 py-3"
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
          className="bg-neutral-900 text-white rounded-xl px-4 py-3"
        />
      </View>

      <Pressable
        onPress={refetch}
        className="bg-emerald-500 active:bg-emerald-600 rounded-xl px-4 py-3 items-center"
      >
        <Text className="text-white font-semibold">Refresh rate</Text>
      </Pressable>

      <View className="bg-neutral-900 rounded-2xl p-4 gap-2">
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
