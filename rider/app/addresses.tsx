import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ComponentProps, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { ridersApi } from '@/api/endpoints';
import type { PlaceSuggestion, SavedAddress } from '@/api/types';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';
import { colors } from '@/theme/tokens';

const LABELS = ['HOME', 'WORK', 'OTHER'] as const;
const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const iconFor = (label: string): ComponentProps<typeof Ionicons>['name'] =>
  label === 'HOME' ? 'home-outline' : label === 'WORK' ? 'briefcase-outline' : 'location-outline';

export default function Addresses() {
  const qc = useQueryClient();
  const { data: addresses } = useQuery({
    queryKey: ['rider-addresses'],
    queryFn: ridersApi.listAddresses,
  });
  const [label, setLabel] = useState<(typeof LABELS)[number]>('HOME');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (p: PlaceSuggestion) => {
    setBusy(true);
    try {
      await ridersApi.addAddress({ label, address: p.description, lat: p.lat, lng: p.lng });
      await qc.invalidateQueries({ queryKey: ['rider-addresses'] });
      setText('');
      Alert.alert('Address saved', `${titleCase(label)} address added.`);
    } catch (e) {
      Alert.alert('Could not save address', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="Saved Addresses" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
      >
        {addresses && addresses.length > 0 ? (
          <View className="mb-6 overflow-hidden rounded-card bg-card">
            {addresses.map((a: SavedAddress, i) => (
              <View
                key={a.id}
                className={`flex-row items-center px-4 py-4 ${
                  i < addresses.length - 1 ? 'border-b border-hairline' : ''
                }`}
              >
                <Ionicons name={iconFor(a.label)} size={20} color={colors.muted} />
                <View className="ml-3 flex-1">
                  <Text className="font-pmedium text-sm text-white">{titleCase(a.label)}</Text>
                  <Text numberOfLines={1} className="font-sans text-xs text-subtle">
                    {a.address}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text className="mb-6 mt-2 font-sans text-sm text-subtle">No saved addresses yet.</Text>
        )}

        <Text className="mb-2 font-psemibold text-base text-white">Add an address</Text>
        <View className="mb-3 flex-row gap-2">
          {LABELS.map((l) => {
            const on = label === l;
            return (
              <Pressable
                key={l}
                onPress={() => setLabel(l)}
                className={`rounded-pill border px-4 py-2 ${on ? 'border-brand bg-brand' : 'border-hairline'}`}
              >
                <Text className={`font-pmedium text-sm ${on ? 'text-bg' : 'text-muted'}`}>
                  {titleCase(l)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <AddressAutocomplete
          value={text}
          onChangeText={setText}
          onSelect={add}
          placeholder="Search an address to save"
        />
        {busy ? <Text className="font-sans text-xs text-subtle">Saving…</Text> : null}
      </ScrollView>
    </Screen>
  );
}
