import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailsDashboard } from "../../components/DetailsDashboard";

export default function DetailsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-950" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, gap: 16 }}>
        <View className="gap-2 mb-2">
          <Text className="text-white text-2xl font-bold">Portfolio Details</Text>
          <Text className="text-neutral-400 text-sm">Summary of your investment projections</Text>
        </View>
        <DetailsDashboard />
      </ScrollView>
    </SafeAreaView>
  );
}
