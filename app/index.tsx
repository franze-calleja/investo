import { SafeAreaView, ScrollView, View } from "react-native";
import { BudgetSplitter } from "../components/BudgetSplitter";
import { DetailsDashboard } from "../components/DetailsDashboard";
import { GrowthSimulator } from "../components/GrowthSimulator";
import { MarketSelector } from "../components/MarketSelector";

export default function Index() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View className="gap-4">
          <BudgetSplitter />
          <MarketSelector />
          <GrowthSimulator />
          <DetailsDashboard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
