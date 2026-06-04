import { Text, TextInput, View } from 'react-native';
import { colors } from '../theme/tokens';

interface Props {
  /** Full phone, e.g. +2348012345678. Parent owns the value. */
  value: string;
  onChangeText: (full: string) => void;
  label?: string;
}

const PREFIX = '+234';

export function PhoneInput({ value, onChangeText, label }: Props) {
  const local = value.startsWith(PREFIX) ? value.slice(PREFIX.length) : value.replace(/^\+/, '');
  return (
    <View className="mb-4">
      {label ? <Text className="mb-2 font-pmedium text-sm text-muted">{label}</Text> : null}
      <View className="flex-row items-center rounded-input bg-card">
        <View className="border-r border-hairline px-4 py-4">
          <Text className="font-pmedium text-base text-white">🇳🇬 {PREFIX}</Text>
        </View>
        <TextInput
          value={local}
          onChangeText={(t) => onChangeText(PREFIX + t.replace(/[^0-9]/g, ''))}
          keyboardType="phone-pad"
          placeholder="801 234 5678"
          placeholderTextColor={colors.subtle}
          className="flex-1 px-4 py-4 font-sans text-base text-white"
        />
      </View>
    </View>
  );
}
