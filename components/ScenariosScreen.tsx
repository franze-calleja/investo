import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useInvestmentStore } from "../src/state/useInvestmentStore";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ScenariosScreen() {
  const theme = useInvestmentStore((state) => state.theme);
  const isDark = theme === 'dark';
  const scenarios = useInvestmentStore((state) => state.scenarios);
  const saveScenario = useInvestmentStore((state) => state.saveScenario);
  const loadScenario = useInvestmentStore((state) => state.loadScenario);
  const deleteScenario = useInvestmentStore((state) => state.deleteScenario);
  const renameScenario = useInvestmentStore((state) => state.renameScenario);
  
  const formatCurrency = (value: number, currencySymbol: string) => {
    return `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const saveScale = useSharedValue(1);

  const handleSave = () => {
    if (!scenarioName.trim()) {
      Alert.alert("Name Required", "Please enter a name for this scenario");
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    saveScenario(scenarioName.trim());
    setScenarioName("");
    setShowSaveDialog(false);
    Alert.alert("✓ Saved", `Scenario "${scenarioName.trim()}" has been saved`);
  };

  const handleLoad = (id: string, name: string) => {
    Alert.alert(
      "Load Scenario",
      `Load "${name}"? Your current settings will be replaced.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadScenario(id);
            Alert.alert("✓ Loaded", `Scenario "${name}" has been loaded`);
          },
        },
      ]
    );
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Scenario",
      `Delete "${name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteScenario(id);
          },
        },
      ]
    );
  };

  const handleRename = (id: string) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    renameScenario(id, editingName.trim());
    setEditingId(null);
    setEditingName("");
  };

  return (
    <>
      <Animated.View className="gap-2 mb-2" entering={FadeIn.duration(400)}>
        <View className="flex-row items-center justify-between">
          <View className="gap-1">
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Scenarios</Text>
            <Text className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Save and compare different investment strategies
            </Text>
          </View>
          <AnimatedPressable
            onPressIn={() => {
              saveScale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            onPressOut={() => {
              saveScale.value = withSpring(1, { damping: 15, stiffness: 400 });
            }}
            onPress={() => setShowSaveDialog(true)}
            className="flex-row items-center gap-2 px-4 py-2 bg-emerald-500 rounded-xl"
            style={useAnimatedStyle(() => ({
              transform: [{ scale: saveScale.value }]
            }))}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text className="font-semibold text-white">Save</Text>
          </AnimatedPressable>
        </View>
      </Animated.View>

      {/* Save Dialog */}
      {showSaveDialog && (
        <Animated.View
          entering={FadeIn.duration(200)}
          className={`p-4 border rounded-2xl ${
            isDark ? 'bg-neutral-900 border-emerald-500/30' : 'bg-white border-emerald-500/30'
          }`}
        >
          <Text className={`mb-2 text-sm font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
            Scenario Name
          </Text>
          <TextInput
            value={scenarioName}
            onChangeText={setScenarioName}
            placeholder="e.g., Conservative Plan"
            placeholderTextColor="#737373"
            className={`p-3 mb-3 rounded-lg ${
              isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-900'
            }`}
            autoFocus
          />
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => {
                setShowSaveDialog(false);
                setScenarioName("");
              }}
              className={`flex-1 py-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}
            >
              <Text className={`font-semibold text-center ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className="flex-1 py-3 rounded-lg bg-emerald-500"
            >
              <Text className="font-semibold text-center text-white">Save Current</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Scenarios List */}
      {scenarios.length === 0 ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          className={`items-center gap-3 p-8 rounded-2xl ${isDark ? 'bg-neutral-900' : 'bg-white'}`}
        >
          <Text className="text-4xl">📊</Text>
          <Text className={`text-center ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            No saved scenarios yet. Save your current settings to create your first scenario!
          </Text>
        </Animated.View>
      ) : (
        <View className="gap-3">
          {scenarios.map((scenario, index) => (
            <Animated.View
              key={scenario.id}
              entering={FadeIn.duration(300).delay(index * 50)}
              className={`p-4 rounded-2xl ${isDark ? 'bg-neutral-900' : 'bg-white'}`}
            >
              {editingId === scenario.id ? (
                <View className="gap-2">
                  <TextInput
                    value={editingName}
                    onChangeText={setEditingName}
                    autoFocus
                    onBlur={() => handleRename(scenario.id)}
                    onSubmitEditing={() => handleRename(scenario.id)}
                    className={`p-2 rounded-lg ${
                      isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-900'
                    }`}
                  />
                </View>
              ) : (
                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 gap-1">
                      <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {scenario.name}
                      </Text>
                      <Text className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>
                        {new Date(scenario.createdAt).toLocaleDateString()}
                      </Text>
                      <Text className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        Salary: {formatCurrency(scenario.data.income, scenario.data.currency.symbol)}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleLoad(scenario.id, scenario.name)}
                        className={`px-4 py-2 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'}`}
                      >
                        <Text className="text-sm font-semibold text-emerald-400">Load</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setEditingId(scenario.id);
                          setEditingName(scenario.name);
                        }}
                        className={`px-3 py-2 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}
                      >
                        <Ionicons name="pencil" size={16} color={isDark ? "#a3a3a3" : "#525252"} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(scenario.id, scenario.name)}
                        className={`px-3 py-2 rounded-lg ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>
          ))}
        </View>
      )}
    </>
  );
}
