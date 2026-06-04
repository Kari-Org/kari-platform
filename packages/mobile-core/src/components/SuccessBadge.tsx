import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { colors } from '../theme/tokens';

/** The yellow scalloped check-seal used on success interstitials. */
export function SuccessBadge({ size = 104 }: { size?: number }) {
  return (
    <View className="items-center justify-center">
      <MaterialCommunityIcons name="check-decagram" size={size} color={colors.brand} />
    </View>
  );
}
