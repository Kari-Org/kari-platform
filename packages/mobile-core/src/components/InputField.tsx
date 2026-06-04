import { Text, TextInput, type TextInputProps, View } from 'react-native';
import { colors } from '../theme/tokens';

interface Props extends TextInputProps {
  label?: string;
}

export function InputField({ label, ...props }: Props) {
  return (
    <View className="mb-4">
      {label ? <Text className="mb-2 font-pmedium text-sm text-muted">{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.subtle}
        className="rounded-input bg-card px-4 py-4 font-sans text-base text-white"
        {...props}
      />
    </View>
  );
}
