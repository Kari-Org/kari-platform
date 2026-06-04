import { type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';

/** Dark, safe-area screen wrapper. Pass `className` for padding/layout. */
export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View className={`flex-1 ${className ?? ''}`}>{children}</View>
    </SafeAreaView>
  );
}
