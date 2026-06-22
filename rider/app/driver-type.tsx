import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { BehaviorPreference } from '@kari/types';
import { ridersApi } from '@/api/endpoints';
import { KariButton } from '@/components/KariButton';
import { OptionRow } from '@/components/OptionRow';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';

const OPTIONS: { value: BehaviorPreference; label: string }[] = [
  { value: BehaviorPreference.TALKATIVE, label: 'Talkative — happy to chat' },
  { value: BehaviorPreference.RESERVED, label: 'Reserved — a quiet ride' },
  { value: BehaviorPreference.NEUTRAL, label: 'Neutral' },
  { value: BehaviorPreference.NO_PREFERENCE, label: 'No preference' },
];

export default function DriverType() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['rider-me'], queryFn: ridersApi.me });
  const [sel, setSel] = useState<BehaviorPreference | null>(null);
  const [busy, setBusy] = useState(false);
  const current = sel ?? profile?.preferredDriverBehavior ?? BehaviorPreference.NO_PREFERENCE;

  const save = async () => {
    setBusy(true);
    try {
      await ridersApi.setPreferences({ preferredDriverBehavior: current });
      await qc.invalidateQueries({ queryKey: ['rider-me'] });
      router.back();
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="Driver Type" />
      <View className="mt-4 flex-1">
        <Text className="mb-4 font-sans text-sm text-muted">What kind of driver do you prefer?</Text>
        {OPTIONS.map((o) => (
          <OptionRow
            key={o.value}
            label={o.label}
            selected={current === o.value}
            onPress={() => setSel(o.value)}
          />
        ))}
        <View className="flex-1" />
        <View className="pb-8">
          <KariButton label="Save" onPress={save} loading={busy} />
        </View>
      </View>
    </Screen>
  );
}
