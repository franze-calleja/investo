import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import { ActionSheetIOS, Alert, Platform, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";
import { selectDerived, useInvestmentStore } from "../src/state/useInvestmentStore";
import { CurrencySelector } from "./CurrencySelector";
import { ScenariosManager } from "./ScenariosManager";
import { ShareableCard } from "./ShareableCard";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DetailsDashboard() {
  const viewRef = useRef<View>(null);
  const shareScale = useSharedValue(1);
  const currencyScale = useSharedValue(1);
  const scenariosScale = useSharedValue(1);
  const income = useInvestmentStore((state) => state.income);
  const currency = useInvestmentStore((state) => state.currency);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [showScenariosManager, setShowScenariosManager] = useState(false);

  const generatePDFHTML = () => {
    const state = useInvestmentStore.getState();
    const derived = selectDerived(state);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #0a0a0a;
              color: white;
              padding: 24px;
              margin: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
            }
            .header h1 {
              color: #22c55e;
              font-size: 32px;
              margin: 0 0 8px 0;
            }
            .header p {
              color: #a3a3a3;
              font-size: 16px;
              margin: 0;
            }
            .card {
              background: #171717;
              border-radius: 16px;
              padding: 20px;
              margin-bottom: 16px;
            }
            .card-primary {
              border: 2px solid #22c55e;
            }
            .card-label {
              color: #a3a3a3;
              font-size: 14px;
              margin-bottom: 8px;
            }
            .card-value {
              color: white;
              font-size: 24px;
              font-weight: bold;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              margin-top: 24px;
            }
            .footer {
              text-align: center;
              margin-top: 32px;
              padding-top: 16px;
              border-top: 1px solid #262626;
              color: #737373;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>My Investment Plan</h1>
            <p>${state.horizonYears}-Year Projection</p>
          </div>
          
          <div class="card card-primary">
            <div class="card-label">Total Portfolio Value</div>
            <div class="card-value">${currency.symbol}${Math.round(derived.growth.futureValue).toLocaleString()}</div>
          </div>
          
          <div class="stats-grid">
            <div class="card">
              <div class="card-label">Monthly Savings</div>
              <div class="card-value">${currency.symbol}${Math.round(derived.savingsMonthly).toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-label">Investment Period</div>
              <div class="card-value">${state.horizonYears} Years</div>
            </div>
            <div class="card">
              <div class="card-label">Total Contributions</div>
              <div class="card-value">${currency.symbol}${Math.round(derived.growth.principal).toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-label">Total Interest</div>
              <div class="card-value">${currency.symbol}${Math.round(derived.growth.interest).toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-label">Annual Return</div>
              <div class="card-value">${derived.effectiveRate.toFixed(2)}%</div>
            </div>
            <div class="card">
              <div class="card-label">Monthly Passive Income</div>
              <div class="card-value">${currency.symbol}${Math.round(derived.passiveIncome).toLocaleString()}</div>
            </div>
          </div>
          
          <div class="footer">
            Generated with Investo • ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;
  };

  const handleSharePDF = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const html = generatePDFHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing not available", "Sharing is not supported on this device");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Your Investment Plan",
        UTI: "com.adobe.pdf",
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert("Error", `Failed to share PDF: ${error?.message || error}`);
    }
  };

  const handleShareImage = async () => {
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

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Share as Image', 'Share as PDF'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleShareImage();
          } else if (buttonIndex === 2) {
            handleSharePDF();
          }
        }
      );
    } else {
      // For Android, show a simple alert
      Alert.alert(
        'Share Investment Plan',
        'Choose export format:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Image', onPress: handleShareImage },
          { text: 'PDF', onPress: handleSharePDF },
        ]
      );
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
        <View className="flex-row gap-2">
          <AnimatedPressable
            onPressIn={() => {
              scenariosScale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
            }}
            onPressOut={() => {
              scenariosScale.value = withSpring(1, { damping: 15, stiffness: 400 });
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowScenariosManager(true);
            }}
            className="flex-row items-center gap-2 px-3 py-2 bg-neutral-800 rounded-xl"
            style={useAnimatedStyle(() => ({
              transform: [{ scale: scenariosScale.value }]
            }))}
          >
            <Ionicons name="file-tray-stacked-outline" size={18} color="#a3a3a3" />
          </AnimatedPressable>
          <AnimatedPressable
            onPressIn={() => {
              currencyScale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
            }}
            onPressOut={() => {
              currencyScale.value = withSpring(1, { damping: 15, stiffness: 400 });
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCurrencySelector(true);
            }}
            className="flex-row items-center gap-2 px-3 py-2 bg-neutral-800 rounded-xl"
            style={useAnimatedStyle(() => ({
              transform: [{ scale: currencyScale.value }]
            }))}
          >
            <Text className="text-lg">{currency.symbol}</Text>
            <Text className="text-xs text-neutral-400">{currency.code}</Text>
          </AnimatedPressable>
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
      </View>
      <ShareableCard ref={viewRef} />
      <CurrencySelector 
        visible={showCurrencySelector} 
        onClose={() => setShowCurrencySelector(false)} 
      />
      <ScenariosManager
        visible={showScenariosManager}
        onClose={() => setShowScenariosManager(false)}
      />
    </Animated.View>
  );
}
