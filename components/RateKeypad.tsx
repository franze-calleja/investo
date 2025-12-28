import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useInvestmentStore } from "../src/state/useInvestmentStore";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface RateKeypadProps {
  value: string;
  onChange: (value: string) => void;
}

export function RateKeypad({ value, onChange }: RateKeypadProps) {
  const theme = useInvestmentStore((state) => state.theme);
  const isDark = theme === 'dark';
  
  const handlePress = (num: string) => {
    if (num === "." && value.includes(".")) return;
    if (value.length >= 6) return; // Max 6 chars (e.g., "100.00")
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(value + num);
  };

  const handleDelete = () => {
    if (value.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onChange("");
  };

  const buttons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "⌫"],
  ];

  return (
    <View className="gap-2">
      {buttons.map((row, i) => (
        <View key={i} className="flex-row gap-2">
          {row.map((btn) => {
            const scale = useSharedValue(1);
            
            return (
              <AnimatedPressable
                key={btn}
                onPressIn={() => {
                  scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
                }}
                onPressOut={() => {
                  scale.value = withSpring(1, { damping: 15, stiffness: 400 });
                }}
                onPress={() => {
                  if (btn === "⌫") handleDelete();
                  else handlePress(btn);
                }}
                onLongPress={btn === "⌫" ? handleClear : undefined}
                className={`flex-1 rounded-xl h-14 items-center justify-center ${isDark ? 'bg-neutral-800 active:bg-neutral-700' : 'bg-neutral-200 active:bg-neutral-300'}`}
                style={useAnimatedStyle(() => ({
                  transform: [{ scale: scale.value }]
                }))}
              >
                <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{btn}</Text>
              </AnimatedPressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
