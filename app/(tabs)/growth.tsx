import { ScrollView, Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { GrowthSimulator } from "../../components/GrowthSimulator";

export default function GrowthScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-950" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, gap: 16 }}>
        <Animated.View className="gap-2 mb-2" entering={FadeIn.duration(400)}>
          <Text className="text-white text-2xl font-bold">Growth Projection</Text>
          <Text className="text-neutral-400 text-sm">See how your savings will grow over time</Text>
        </Animated.View>
        <GrowthSimulator />
      </ScrollView>
    </SafeAreaView>
  );
}
