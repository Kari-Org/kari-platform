import { Text, TextInput, View } from 'react-native';
import { colors } from '../theme/tokens';
import { useKeyboardDone } from './useKeyboardDone';

interface Props {
  /** Full phone, e.g. +2348012345678. Parent owns the value. */
  value: string;
  onChangeText: (full: string) => void;
  label?: string;
}

const PREFIX = '+234';

/** Reduce any user/value input to the NG local part: 10 digits, leading 0 / 234 dropped. */
function toLocalDigits(input: string): string {
  let d = input.replace(/\D/g, '');
  if (d.startsWith('234')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 10);
}

/** Group the local digits as 3-3-4 for display, e.g. "803 123 4567". */
function formatLocal(digits: string): string {
  const [a, b, c] = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)];
  return [a, b, c].filter(Boolean).join(' ');
}

export function PhoneInput({ value, onChangeText, label }: Props) {
  const localDigits = toLocalDigits(value.startsWith(PREFIX) ? value.slice(PREFIX.length) : value);
  const { inputAccessoryViewID, accessory } = useKeyboardDone('phone-pad');
  return (
    <View className="mb-4">
      {label ? <Text className="mb-2 font-pmedium text-sm text-muted">{label}</Text> : null}
      <View className="flex-row items-center rounded-input bg-card">
        <View className="border-r border-hairline px-4 py-4">
          <Text className="font-pmedium text-base text-white">🇳🇬 {PREFIX}</Text>
        </View>
        <TextInput
          // Display is grouped (e.g. "803 123 4567"); the value stays normalized to +234XXXXXXXXXX.
          value={formatLocal(localDigits)}
          onChangeText={(t) => onChangeText(PREFIX + toLocalDigits(t))}
          keyboardType="phone-pad"
          placeholder="803 123 4567"
          placeholderTextColor={colors.subtle}
          className="flex-1 px-4 py-4 font-sans text-base text-white"
          inputAccessoryViewID={inputAccessoryViewID}
        />
      </View>
      {accessory}
    </View>
  );
}
