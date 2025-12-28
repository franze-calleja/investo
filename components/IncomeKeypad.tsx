import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, SlideInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useInvestmentStore } from "../src/state/useInvestmentStore";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface IncomeKeypadProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (value: number) => void;
  initialValue?: number;
  title?: string;
}

export function IncomeKeypad({ visible, onClose, onSubmit, initialValue = 0, title = "Monthly Income" }: IncomeKeypadProps) {
  const [value, setValue] = useState(initialValue.toString());
  const submitScale = useSharedValue(1);
  const currency = useInvestmentStore((state) => state.currency);
  const theme = useInvestmentStore((state) => state.theme);
  const isDark = theme === 'dark';

  const numValue = Number(value) || 0;
  const isVeryHigh = numValue > 500000;
  const isVeryLow = numValue > 0 && numValue < 5000;

  const handlePress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === "backspace") {
      setValue((prev) => prev.slice(0, -1));
    } else if (key === "clear") {
      setValue("");
    } else {
      setValue((prev) => prev + key);
    }
  };

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const numValue = Number(value) || 0;
    onSubmit(numValue);
    onClose();
  };

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["clear", "0", "backspace"],
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Animated.View className="justify-end flex-1 bg-black/50" entering={FadeIn.duration(10)}>
        <Animated.View className={`gap-6 p-6 rounded-t-3xl ${isDark ? 'bg-neutral-900' : 'bg-white'}`} entering={SlideInDown.springify().damping(40).stiffness(150)}>
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{title}</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={28} color="#a3a3a3" />
            </Pressable>
          </View>

          {/* Display */}
          <View className={`p-6 rounded-2xl ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
            <Text className={`mb-2 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Amount</Text>
            <Text className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {currency.symbol}{value ? Number(value).toLocaleString() : "0"}
            </Text>
            {isVeryHigh && (
              <Text className="mt-2 text-xs text-amber-400">⚠️ That's quite high! Double check your amount</Text>
            )}
            {isVeryLow && (
              <Text className="mt-2 text-xs text-orange-400">💡 Tip: Even small amounts can grow over time</Text>
            )}
          </View>

          {/* Keypad */}
          <View className="gap-3">
            {keys.map((row, rowIndex) => (
              <View key={rowIndex} className="flex-row gap-3">
                {row.map((key) => {
                  const scale = useSharedValue(1);
                  
                  return (
                    <AnimatedPressable
                      key={key}
                      onPressIn={() => {
                        scale.value = withSpring(0.92, { damping: 20, stiffness: 300 });
                      }}
                      onPressOut={() => {
                        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
                      }}
                      onPress={() => handlePress(key)}
                      className={`items-center flex-1 py-5 rounded-2xl ${isDark ? 'bg-neutral-800 active:bg-neutral-700' : 'bg-neutral-200 active:bg-neutral-300'}`}
                      style={useAnimatedStyle(() => ({
                        transform: [{ scale: scale.value }]
                      }))}
                    >
                      {key === "backspace" ? (
                        <Ionicons name="backspace-outline" size={24} color={isDark ? "#fff" : "#171717"} />
                      ) : key === "clear" ? (
                        <Text className="text-lg font-semibold text-red-400">C</Text>
                      ) : (
                        <Text className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{key}</Text>
                      )}
                    </AnimatedPressable>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Submit Button */}
          <AnimatedPressable
            onPressIn={() => {
              submitScale.value = withSpring(0.95, { damping: 20, stiffness: 300 });
            }}
            onPressOut={() => {
              submitScale.value = withSpring(1, { damping: 20, stiffness: 300 });
            }}
            onPress={handleSubmit}
            className="items-center py-4 bg-emerald-500 rounded-2xl active:bg-emerald-600"
            style={useAnimatedStyle(() => ({
              transform: [{ scale: submitScale.value }]
            }))}
          >
            <Text className="text-lg font-bold text-white">Set Income</Text>
          </AnimatedPressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
