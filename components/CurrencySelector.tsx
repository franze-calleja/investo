import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { CURRENCIES, useInvestmentStore } from "../src/state/useInvestmentStore";

export function CurrencySelector({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const currency = useInvestmentStore((state) => state.currency);
  const setCurrency = useInvestmentStore((state) => state.setCurrency);

  const handleSelect = (curr: typeof CURRENCIES[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrency(curr);
    setTimeout(onClose, 200);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Animated.View className="justify-end flex-1 bg-black/60" entering={FadeIn.duration(200)}>
        <Pressable className="flex-1" onPress={onClose} />
        <Animated.View
          entering={SlideInDown.springify().damping(40).stiffness(150)}
          className="p-6 pb-8 bg-neutral-900 rounded-t-3xl"
          style={{ maxHeight: '70%' }}
        >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-semibold text-white">Select Currency</Text>
          <Pressable
            onPress={onClose}
            className="items-center justify-center w-8 h-8 rounded-full bg-neutral-800"
          >
            <Ionicons name="close" size={20} color="#a3a3a3" />
          </Pressable>
        </View>
        <ScrollView className="gap-3" contentContainerStyle={{ gap: 12 }}>
          {CURRENCIES.map((curr) => (
            <Pressable
              key={curr.code}
              onPress={() => handleSelect(curr)}
              className={`p-4 rounded-xl flex-row items-center justify-between ${
                curr.code === currency.code ? "bg-emerald-500" : "bg-neutral-800"
              }`}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">{curr.symbol}</Text>
                <View>
                  <Text
                    className={`font-semibold ${
                      curr.code === currency.code ? "text-white" : "text-neutral-100"
                    }`}
                  >
                    {curr.code}
                  </Text>
                  <Text
                    className={`text-sm ${
                      curr.code === currency.code ? "text-emerald-100" : "text-neutral-400"
                    }`}
                  >
                    {curr.name}
                  </Text>
                </View>
              </View>
              {curr.code === currency.code && (
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
      </Animated.View>
    </Modal>
  );
}
