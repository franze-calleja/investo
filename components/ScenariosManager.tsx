import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { useInvestmentStore } from "../src/state/useInvestmentStore";

export function ScenariosManager({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const scenarios = useInvestmentStore((state) => state.scenarios);
  const saveScenario = useInvestmentStore((state) => state.saveScenario);
  const loadScenario = useInvestmentStore((state) => state.loadScenario);
  const deleteScenario = useInvestmentStore((state) => state.deleteScenario);
  const renameScenario = useInvestmentStore((state) => state.renameScenario);
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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
            onClose();
            setTimeout(() => {
              Alert.alert("✓ Loaded", `Scenario "${name}" has been loaded`);
            }, 300);
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
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Animated.View className="justify-end flex-1 bg-black/60" entering={FadeIn.duration(200)}>
          <Pressable className="flex-1" onPress={onClose} />
          <Animated.View
            entering={SlideInDown.springify().damping(40).stiffness(150)}
            className="p-6 pb-8 bg-neutral-900 rounded-t-3xl"
            style={{ maxHeight: "75%" }}
          >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-semibold text-white">Scenarios</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSaveDialog(true);
                }}
                className="flex-row items-center gap-2 px-4 py-2 bg-emerald-500 rounded-xl"
              >
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text className="font-semibold text-white">Save</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                className="items-center justify-center w-10 h-10 rounded-xl bg-neutral-800"
              >
                <Ionicons name="close" size={20} color="#a3a3a3" />
              </Pressable>
            </View>
          </View>

          {/* Save Dialog */}
          {showSaveDialog && (
            <Animated.View
              entering={FadeIn.duration(200)}
              className="p-4 mb-4 border rounded-xl bg-neutral-800 border-emerald-500/30"
            >
              <Text className="mb-2 text-sm text-neutral-300">Scenario Name</Text>
              <TextInput
                value={scenarioName}
                onChangeText={setScenarioName}
                placeholder="e.g., Conservative Plan"
                placeholderTextColor="#737373"
                className="p-3 mb-3 text-white rounded-lg bg-neutral-900"
                autoFocus
              />
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    setShowSaveDialog(false);
                    setScenarioName("");
                  }}
                  className="flex-1 py-2 rounded-lg bg-neutral-700"
                >
                  <Text className="font-semibold text-center text-white">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  className="flex-1 py-2 rounded-lg bg-emerald-500"
                >
                  <Text className="font-semibold text-center text-white">Save</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Scenarios List */}
          <ScrollView className="gap-3" contentContainerStyle={{ gap: 12 }}>
            {scenarios.length === 0 ? (
              <View className="items-center gap-3 p-8 rounded-xl bg-neutral-800">
                <Text className="text-4xl">📊</Text>
                <Text className="text-center text-neutral-400">
                  No saved scenarios yet. Tap "Save" to create one!
                </Text>
              </View>
            ) : (
              scenarios.map((scenario) => (
                <View
                  key={scenario.id}
                  className="p-4 rounded-xl bg-neutral-800"
                >
                  {editingId === scenario.id ? (
                    <View className="gap-2">
                      <TextInput
                        value={editingName}
                        onChangeText={setEditingName}
                        className="p-2 text-white rounded-lg bg-neutral-900"
                        autoFocus
                        onBlur={() => handleRename(scenario.id)}
                        onSubmitEditing={() => handleRename(scenario.id)}
                      />
                    </View>
                  ) : (
                    <>
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <Text className="text-lg font-semibold text-white">
                            {scenario.name}
                          </Text>
                          <Text className="text-xs text-neutral-500">
                            {new Date(scenario.createdAt).toLocaleDateString()} •{" "}
                            {scenario.data.currency.symbol}
                            {Math.round(scenario.data.income).toLocaleString()} income
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => {
                            setEditingId(scenario.id);
                            setEditingName(scenario.name);
                          }}
                          className="p-2"
                        >
                          <Ionicons name="pencil" size={16} color="#a3a3a3" />
                        </Pressable>
                      </View>

                      <View className="flex-row gap-2 mt-2">
                        <Pressable
                          onPress={() => handleLoad(scenario.id, scenario.name)}
                          className="flex-1 py-2 rounded-lg bg-emerald-500/20"
                        >
                          <Text className="font-semibold text-center text-emerald-400">
                            Load
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(scenario.id, scenario.name)}
                          className="px-4 py-2 rounded-lg bg-red-500/20"
                        >
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
