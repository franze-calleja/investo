import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoalsMilestones } from "../../components/GoalsMilestones";

export default function GoalsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-950" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, gap: 16 }}>
        <GoalsMilestones />
      </ScrollView>
    </SafeAreaView>
  );
}
