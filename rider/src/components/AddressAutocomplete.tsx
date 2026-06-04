import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { placesApi } from '@/api/endpoints';
import type { PlaceSuggestion } from '@/api/types';
import { colors } from '@/theme/tokens';

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (place: PlaceSuggestion) => void;
  /** Optional point to bias suggestions around (e.g. current location). */
  near?: { lat: number; lng: number };
}

/** Address field with debounced, backend-proxied autocomplete suggestions. */
export function AddressAutocomplete({
  label,
  placeholder,
  value,
  onChangeText,
  onSelect,
  near,
}: Props) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const skipNext = useRef(false); // don't re-query right after a selection

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const q = value.trim();
    if (!focused || q.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        setSuggestions(await placesApi.autocomplete(q, near));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [value, focused, near]);

  const choose = (s: PlaceSuggestion) => {
    skipNext.current = true;
    onChangeText(s.description);
    onSelect(s);
    setSuggestions([]);
    setFocused(false);
  };

  return (
    <View className="mb-4">
      {label ? <Text className="mb-2 font-pmedium text-sm text-muted">{label}</Text> : null}
      <View className="flex-row items-center rounded-input bg-card px-4">
        <Ionicons name="location-outline" size={18} color={colors.subtle} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholder={placeholder ?? 'Search address'}
          placeholderTextColor={colors.subtle}
          className="flex-1 px-3 py-4 font-sans text-base text-white"
        />
        {loading ? <ActivityIndicator color={colors.subtle} /> : null}
      </View>
      {focused && suggestions.length > 0 ? (
        <View className="mt-1 overflow-hidden rounded-card border border-hairline bg-surface">
          {suggestions.map((s) => (
            <Pressable
              key={s.placeId}
              onPress={() => choose(s)}
              className="flex-row items-center border-b border-hairline px-4 py-3"
            >
              <Ionicons name="location" size={16} color={colors.brand} />
              <Text numberOfLines={2} className="ml-2 flex-1 font-sans text-sm text-white">
                {s.description}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
