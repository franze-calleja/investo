import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

interface IncomeKeypadProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (value: number) => void;
  initialValue?: number;
}

export function IncomeKeypad({ visible, onClose, onSubmit, initialValue = 0 }: IncomeKeypadProps) {
  const [value, setValue] = useState(initialValue.toString());

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
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-neutral-900 rounded-t-3xl p-6 gap-6">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-xl font-bold">Monthly Income</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={28} color="#a3a3a3" />
            </Pressable>
          </View>

          {/* Display */}
          <View className="bg-neutral-800 rounded-2xl p-6">
            <Text className="text-neutral-400 text-sm mb-2">Amount</Text>
            <Text className="text-white text-4xl font-bold">
              ₱{value || "0"}
            </Text>
          </View>

          {/* Keypad */}
          <View className="gap-3">
            {keys.map((row, rowIndex) => (
              <View key={rowIndex} className="flex-row gap-3">
                {row.map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => handlePress(key)}
                    className="flex-1 bg-neutral-800 rounded-2xl py-5 items-center active:bg-neutral-700"
                  >
                    {key === "backspace" ? (
                      <Ionicons name="backspace-outline" size={24} color="#fff" />
                    ) : key === "clear" ? (
                      <Text className="text-red-400 text-lg font-semibold">C</Text>
                    ) : (
                      <Text className="text-white text-2xl font-semibold">{key}</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            ))}
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            className="bg-emerald-500 rounded-2xl py-4 items-center active:bg-emerald-600"
          >
            <Text className="text-white text-lg font-bold">Set Income</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
