import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '../theme/tokens';

interface Props {
  checked: boolean;
  onChange: (value: boolean) => void;
  children?: ReactNode;
}

export function Checkbox({ checked, onChange, children }: Props) {
  return (
    <Pressable className="flex-row items-start" onPress={() => onChange(!checked)}>
      <View
        className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border border-white ${
          checked ? 'bg-brand' : ''
        }`}
      >
        {checked ? <Ionicons name="checkmark" size={14} color={colors.bg} /> : null}
      </View>
      {children ? <View className="ml-3 flex-1">{children}</View> : null}
    </Pressable>
  );
}
