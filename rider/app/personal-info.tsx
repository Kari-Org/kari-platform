import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { type ComponentProps, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { authApi, ridersApi } from '@/api/endpoints';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';
import { colors } from '@/theme/tokens';

export default function PersonalInfo() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['rider-me'], queryFn: ridersApi.me });
  const { data: user } = useQuery({ queryKey: ['auth-me'], queryFn: authApi.me });
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirst(profile.firstName ?? '');
      setLast(profile.lastName ?? '');
    }
  }, [profile]);

  const soon = () =>
    Alert.alert('Coming soon', 'Changing your phone or email is coming in a later update.');

  const save = async () => {
    if (!first.trim() || !last.trim()) {
      Alert.alert('Name required', 'Please enter your first and last name.');
      return;
    }
    setBusy(true);
    try {
      await ridersApi.setProfile({ firstName: first.trim(), lastName: last.trim() });
      await qc.invalidateQueries({ queryKey: ['rider-me'] });
      Alert.alert('Saved', 'Your profile has been updated.');
      router.back();
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="Personal Information" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingTop: 8, paddingBottom: 24 }}
      >
        <InputField label="First name" value={first} onChangeText={setFirst} placeholder="First name" />
        <InputField label="Last name" value={last} onChangeText={setLast} placeholder="Last name" />

        <ReadOnly icon="call-outline" label="Phone" value={user?.phone ?? '—'} onEdit={soon} />
        <ReadOnly icon="mail-outline" label="Email" value={user?.email ?? '—'} onEdit={soon} />

        <View className="flex-1" />
        <View className="pb-8">
          <KariButton label="Save" onPress={save} loading={busy} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function ReadOnly({
  icon,
  label,
  value,
  onEdit,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 font-pmedium text-sm text-muted">{label}</Text>
      <View className="flex-row items-center rounded-input bg-card px-4 py-4">
        <Ionicons name={icon} size={18} color={colors.subtle} />
        <Text numberOfLines={1} className="ml-3 flex-1 font-sans text-base text-white">
          {value}
        </Text>
        <Text onPress={onEdit} className="font-pmedium text-sm text-brand">
          Edit
        </Text>
      </View>
    </View>
  );
}
