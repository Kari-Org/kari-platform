import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { colors } from '../theme/tokens';

export interface SelectOption {
  label: string;
  value: string;
}

interface Props {
  label?: string;
  placeholder?: string;
  value?: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
}

/** Labeled field that opens a bottom-sheet list of options. */
export function Select({ label, placeholder = 'Select', value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View className="mb-4">
      {label ? <Text className="mb-2 font-pmedium text-sm text-muted">{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-input bg-card px-4 py-4"
      >
        <Text className={`font-sans text-base ${selected ? 'text-white' : 'text-subtle'}`}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.subtle} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/60" onPress={() => setOpen(false)}>
          <View className="rounded-t-3xl bg-surface px-5 pb-10 pt-5">
            {label ? (
              <Text className="mb-3 font-psemibold text-base text-white">{label}</Text>
            ) : null}
            {options.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className="flex-row items-center justify-between border-b border-hairline py-4"
              >
                <Text className="font-pmedium text-base text-white">{o.label}</Text>
                {o.value === value ? (
                  <Ionicons name="checkmark" size={18} color={colors.brand} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
