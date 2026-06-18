import { Text, TextInput, type TextInputProps, View } from 'react-native';
import { colors } from '../theme/tokens';

interface Props extends TextInputProps {
  label?: string;
  /** Override the label's size/color classes (default: "text-sm text-muted"). */
  labelClassName?: string;
  /** Override the input's size/color classes (default: "text-base text-white"). */
  inputClassName?: string;
}

export function InputField({ label, labelClassName, inputClassName, ...props }: Props) {
  return (
    <View className="mb-4">
      {label ? (
        <Text className={`mb-2 font-pmedium ${labelClassName ?? 'text-sm text-muted'}`}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.subtle}
        className={`rounded-input bg-card px-4 py-4 font-sans ${inputClassName ?? 'text-base text-white'}`}
        {...props}
      />
    </View>
  );
}
