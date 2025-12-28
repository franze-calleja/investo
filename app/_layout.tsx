import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { useInvestmentStore } from "../src/state/useInvestmentStore";
import "./global.css";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const theme = useInvestmentStore((state) => state.theme);
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    // Apply theme to native color scheme
    if (theme) {
      // This will trigger NativeWind's dark: classes
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
