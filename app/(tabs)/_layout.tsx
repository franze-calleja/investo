import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useInvestmentStore } from "../../src/state/useInvestmentStore";

export default function TabLayout() {
  const theme = useInvestmentStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <View className={isDark ? "bg-black flex-1" : "bg-gray-50 flex-1"}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#22c55e",
          tabBarInactiveTintColor: isDark ? "#6b7280" : "#9ca3af",
          tabBarStyle: {
            position: "absolute",
            bottom: 25,
            marginHorizontal: 20,
            elevation: 0,
            backgroundColor: isDark ? "#171717" : "#ffffff",
            borderRadius: 25,
            height: 75,
            paddingBottom: 8,
            paddingTop: 8,
            borderWidth: 1,
            borderColor: isDark ? "#1f2937" : "#e5e7eb",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -4,
            },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
        }}
      >
      <Tabs.Screen
        name="setup"
        options={{
          title: "Setup",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="growth"
        options={{
          title: "Growth",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="details"
        options={{
          title: "Details",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      </Tabs>
    </View>
  );
}
