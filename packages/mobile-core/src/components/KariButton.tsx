import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '../theme/tokens';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

export function KariButton({ label, onPress, variant = 'primary', loading, disabled }: Props) {
  const outline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`h-[52px] items-center justify-center rounded-pill ${
        outline ? 'border border-brand' : 'bg-brand'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={outline ? colors.brand : colors.bg} />
      ) : (
        <Text className={`font-psemibold text-base ${outline ? 'text-brand' : 'text-bg'}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
