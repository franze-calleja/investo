import { Pressable, Text, View } from "react-native";

interface RateKeypadProps {
  value: string;
  onChange: (value: string) => void;
}

export function RateKeypad({ value, onChange }: RateKeypadProps) {
  const handlePress = (num: string) => {
    if (num === "." && value.includes(".")) return;
    if (value.length >= 6) return; // Max 6 chars (e.g., "100.00")
    onChange(value + num);
  };

  const handleDelete = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
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
          {row.map((btn) => (
            <Pressable
              key={btn}
              onPress={() => {
                if (btn === "⌫") handleDelete();
                else handlePress(btn);
              }}
              onLongPress={btn === "⌫" ? handleClear : undefined}
              className="flex-1 bg-neutral-800 rounded-xl h-14 items-center justify-center active:bg-neutral-700"
            >
              <Text className="text-white text-xl font-semibold">{btn}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
