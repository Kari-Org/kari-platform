import { Text, View } from 'react-native';

interface Props {
  current: number; // 1-based
  total: number;
}

/** "•••• — current of total" progress used by multi-step flows. */
export function StepDots({ current, total }: Props) {
  return (
    <View className="items-center">
      <View className="mb-2 flex-row items-center">
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            className={`mx-1 h-1.5 rounded-full ${i + 1 === current ? 'w-6 bg-brand' : 'w-1.5 bg-hairline'}`}
          />
        ))}
      </View>
      <Text className="font-pmedium text-xs text-subtle">
        {current} of {total}
      </Text>
    </View>
  );
}
