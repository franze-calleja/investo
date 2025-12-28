import { ScrollView, Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailsDashboard } from "../../components/DetailsDashboard";
import { useInvestmentStore } from "../../src/state/useInvestmentStore";

export default function DetailsScreen() {
  const theme = useInvestmentStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, gap: 16 }}>
        <Animated.View className="gap-2 mb-2" entering={FadeIn.duration(400)}>
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Investment Details</Text>
          <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Breakdown of your portfolio projections</Text>
        </Animated.View>
        <DetailsDashboard />
      </ScrollView>
    </SafeAreaView>
  );
}
