import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Gender } from '@kari/types';
import { ridersApi } from '@/api/endpoints';
import { BrandMark } from '@/components/BrandMark';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Select } from '@/components/Select';
import { errorMessage } from '@/lib/error';

const GENDERS = [
  { value: Gender.MALE, label: 'Male' },
  { value: Gender.FEMALE, label: 'Female' },
  { value: Gender.OTHER, label: 'Other' },
  { value: Gender.PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

export default function AdditionalInfo() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [nin, setNin] = useState('');
  const [referral, setReferral] = useState('');
  const [loading, setLoading] = useState(false);

  const valid = Boolean(
    firstName.trim() && lastName.trim() && gender && /^[0-9]{11}$/.test(nin),
  );

  const submit = async () => {
    setLoading(true);
    try {
      await ridersApi.setProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: gender ?? undefined,
        referralCode: referral.trim() || undefined,
      });
      await ridersApi.submitNin({ nin: nin.trim() });
      router.push('/(onboarding)/liveness');
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen className="px-5">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScreenHeader title="Additional Information" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View className="mt-4 items-center">
            <BrandMark />
          </View>
          <Text className="mt-6 font-pbold text-2xl text-white">Additional Information</Text>
          <Text className="mb-6 mt-2 font-sans text-base text-muted">
            A few details to finish setting up your account.
          </Text>
          <InputField label="First name *" value={firstName} onChangeText={setFirstName} placeholder="Ada" />
          <InputField label="Last name *" value={lastName} onChangeText={setLastName} placeholder="Okafor" />
          <Select
            label="Gender *"
            placeholder="Select gender"
            value={gender}
            options={GENDERS}
            onChange={(v) => setGender(v as Gender)}
          />
          <InputField
            label="National Identification Number (NIN) *"
            value={nin}
            onChangeText={setNin}
            placeholder="11-digit NIN"
            keyboardType="number-pad"
            maxLength={11}
          />
          <InputField
            label="Referral code"
            value={referral}
            onChangeText={setReferral}
            placeholder="If you were referred, enter the code"
            autoCapitalize="characters"
          />
          <View className="flex-1" />
          <View className="pb-8 pt-4">
            <KariButton label="Next" onPress={submit} loading={loading} disabled={!valid} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
