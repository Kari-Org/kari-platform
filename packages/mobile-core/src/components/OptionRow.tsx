import { Pressable, Text, View } from 'react-native';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Radio-style selectable row used in multi-step surveys. */
export function OptionRow({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-3 flex-row items-center rounded-card border px-4 py-4 ${
        selected ? 'border-brand bg-brand/10' : 'border-hairline bg-card'
      }`}
    >
      <View
        className={`mr-3 h-5 w-5 items-center justify-center rounded-full border ${
          selected ? 'border-brand' : 'border-subtle'
        }`}
      >
        {selected ? <View className="h-2.5 w-2.5 rounded-full bg-brand" /> : null}
      </View>
      <Text className="flex-1 font-pmedium text-base text-white">{label}</Text>
    </Pressable>
  );
}
