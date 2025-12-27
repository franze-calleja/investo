import { ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { BudgetSplitter } from "../../components/BudgetSplitter";
import { MarketSelector } from "../../components/MarketSelector";

export default function SetupScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-950" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, gap: 16 }}>
        <Animated.View className="gap-2 mb-2" entering={FadeIn.duration(400)}>
          <Text className="text-white text-2xl font-bold">Setup Your Budget</Text>
          <Text className="text-neutral-400 text-sm">Configure your income, budget split, and investment target</Text>
        </Animated.View>
        <View className="gap-4">
          <BudgetSplitter />
          <MarketSelector />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
