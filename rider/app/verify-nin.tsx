import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { ridersApi } from '@/api/endpoints';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';

export default function VerifyNin() {
  const router = useRouter();
  const [nin, setNin] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await ridersApi.submitNin({ nin: nin.trim() });
      if (res.verified) {
        Alert.alert('NIN verified', 'You can now start and join carpools.', [
          { text: 'Done', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Not verified', "We couldn't verify that NIN — please check and try again.");
      }
    } catch (e) {
      Alert.alert('Verification failed', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="Verify NIN" />
      <Text className="mt-4 font-sans text-sm text-muted">
        Carpooling is NIN-gated so co-riders can trust each other. Enter your 11-digit National
        Identification Number to verify.
      </Text>
      <Text className="mt-6" />
      <InputField
        label="NIN"
        value={nin}
        onChangeText={setNin}
        keyboardType="number-pad"
        placeholder="e.g. 12345678901"
        maxLength={11}
      />
      <KariButton label="Verify" onPress={submit} loading={busy} disabled={nin.trim().length < 11} />
    </Screen>
  );
}
