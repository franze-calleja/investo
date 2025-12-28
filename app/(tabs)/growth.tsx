import { ScrollView, Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { GrowthSimulator } from "../../components/GrowthSimulator";
import { useInvestmentStore } from "../../src/state/useInvestmentStore";

export default function GrowthScreen() {
  const theme = useInvestmentStore((state) => state.theme);
  const isDark = theme === 'dark';
  
  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, gap: 16 }}>
        <Animated.View className="gap-2 mb-2" entering={FadeIn.duration(400)}>
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Growth Projection</Text>
          <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>See how your savings will grow over time</Text>
        </Animated.View>
        <GrowthSimulator />
      </ScrollView>
    </SafeAreaView>
  );
}
