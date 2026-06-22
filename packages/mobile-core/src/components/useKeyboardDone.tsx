import { useId } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  type KeyboardTypeOptions,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { colors } from '../theme/tokens';

// iOS numeric keyboards (number-pad, decimal-pad, phone-pad, numeric) have no
// return/Done key, so there's no built-in way to dismiss them. These get a
// "Done" accessory bar above the keyboard. No-op on Android (system back
// dismisses) and for keyboards that already have a return key.
const NEEDS_DONE: KeyboardTypeOptions[] = ['number-pad', 'numeric', 'decimal-pad', 'phone-pad'];

export function useKeyboardDone(keyboardType?: KeyboardTypeOptions) {
  const id = useId();
  const enabled = Platform.OS === 'ios' && !!keyboardType && NEEDS_DONE.includes(keyboardType);

  const accessory = enabled ? (
    <InputAccessoryView nativeID={id}>
      <View
        style={{
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
          alignItems: 'flex-end',
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <Pressable onPress={() => Keyboard.dismiss()} hitSlop={8}>
          <Text style={{ color: colors.brand, fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16 }}>
            Done
          </Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  ) : null;

  return { inputAccessoryViewID: enabled ? id : undefined, accessory };
}
