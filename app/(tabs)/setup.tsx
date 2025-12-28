import { ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { BudgetSplitter } from "../../components/BudgetSplitter";
import { MarketSelector } from "../../components/MarketSelector";
import { useInvestmentStore } from "../../src/state/useInvestmentStore";

export default function SetupScreen() {
  const theme = useInvestmentStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, gap: 16 }}>
        <Animated.View className="gap-2 mb-2" entering={FadeIn.duration(400)}>
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Setup Your Budget</Text>
          <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Configure your income, budget split, and investment target</Text>
        </Animated.View>
        <View className="gap-4">
          <BudgetSplitter />
          <MarketSelector />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
