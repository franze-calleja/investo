import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoalsMilestones } from "../../components/GoalsMilestones";
import { useInvestmentStore } from "../../src/state/useInvestmentStore";

export default function GoalsScreen() {
  const theme = useInvestmentStore((state) => state.theme);
  const isDark = theme === 'dark';
  
  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, gap: 16 }}>
        <GoalsMilestones />
      </ScrollView>
    </SafeAreaView>
  );
}
