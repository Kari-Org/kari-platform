import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../theme/tokens';

interface Props {
  title?: string;
  /** Override the default back behavior (router.back, or Home if no stack). */
  onBack?: () => void;
  /** Optional right-side action (e.g. a Cancel link). */
  right?: ReactNode;
  showBack?: boolean;
}

/** Thin top bar: left back chevron (→ Home when the stack is empty), optional
 *  title, optional right action. Keeps navigation consistent across screens. */
export function ScreenHeader({ title, onBack, right, showBack = true }: Props) {
  const router = useRouter();
  const back = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };
  return (
    <View className="h-11 flex-row items-center">
      {showBack ? (
        <Pressable
          onPress={back}
          hitSlop={12}
          className="-ml-2 h-11 w-11 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
      ) : (
        <View className="w-9" />
      )}
      {title ? (
        <Text className="ml-1 flex-1 font-psemibold text-lg text-white" numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View className="flex-1" />
      )}
      {right ?? null}
    </View>
  );
}
