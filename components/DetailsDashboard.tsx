import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { useRef } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";
import { useInvestmentStore } from "../src/state/useInvestmentStore";
import { ShareableCard } from "./ShareableCard";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DetailsDashboard() {
  const viewRef = useRef<View>(null);
  const shareScale = useSharedValue(1);
  const income = useInvestmentStore((state) => state.income);

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (!viewRef.current) {
        Alert.alert("Error", "View reference not found");
        return;
      }

      // Delay to ensure chart rendering is complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing not available", "Sharing is not supported on this device");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share Your Investment Plan",
        UTI: "public.png",
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert("Error", `Failed to share: ${error?.message || error}`);
    }
  };

  if (income === 0) {
    return (
      <Animated.View className="gap-3" entering={FadeIn.duration(300)}>
        <Text className="text-xl font-semibold text-white">Details Dashboard</Text>
        <View className="items-center gap-3 p-8 bg-neutral-900 rounded-2xl">
          <Text className="text-lg text-center text-neutral-500">💰</Text>
          <Text className="text-center text-neutral-400">Set your monthly income in the Setup tab to see your investment projections</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View className="gap-3" entering={FadeIn.duration(300)}>
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-white">Details Dashboard</Text>
        <AnimatedPressable
          onPressIn={() => {
            shareScale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
          }}
          onPressOut={() => {
            shareScale.value = withSpring(1, { damping: 15, stiffness: 400 });
          }}
          onPress={handleShare}
          className="flex-row items-center gap-2 px-4 py-2 bg-emerald-500 rounded-xl"
          style={useAnimatedStyle(() => ({
            transform: [{ scale: shareScale.value }]
          }))}
        >
          <Ionicons name="share-outline" size={18} color="#fff" />
          <Text className="font-semibold text-white">Share</Text>
        </AnimatedPressable>
      </View>
      <ShareableCard ref={viewRef} />
    </Animated.View>
  );
}
