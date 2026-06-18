import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Gender } from '@kari/types';
import { ridersApi } from '@/api/endpoints';
import { BrandMark } from '@/components/BrandMark';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Select } from '@/components/Select';
import { errorMessage } from '@/lib/error';
import { colors } from '@/theme/tokens';

const LABEL = 'text-[13px] text-white';
const INPUT = 'text-[13px] text-white';

const GENDERS = [
  { value: Gender.MALE, label: 'Male' },
  { value: Gender.FEMALE, label: 'Female' },
  { value: Gender.OTHER, label: 'Other' },
  { value: Gender.PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

export default function AdditionalInfo() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nin, setNin] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [referral, setReferral] = useState('');
  const [loading, setLoading] = useState(false);

  // NIN is optional at setup but compulsory for carpool; if provided it must be a full 11 digits.
  const ninValid = nin.length === 0 || nin.length === 11;
  const valid = Boolean(firstName.trim() && lastName.trim() && gender && ninValid);

  const submit = async () => {
    setLoading(true);
    try {
      await ridersApi.setProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: gender ?? undefined,
        referralCode: referral.trim() || undefined,
      });
      if (nin.trim()) {
        // NIN provided → run liveness next (the selfie confirms the NIN).
        await ridersApi.submitNin({ nin: nin.trim() });
        router.push('/(onboarding)/liveness');
      } else {
        // No NIN → liveness isn't meaningful yet; skip it. Both are completed later
        // (NIN + selfie) when the rider opts into carpool.
        router.push('/(onboarding)/preferences');
      }
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingScreen className="px-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="mb-6 mt-2 items-center">
            <BrandMark />
          </View>
          <Text className="mb-6 text-center font-psemibold text-base text-white">
            Additional Information
          </Text>

          <InputField
            label="First name *"
            labelClassName={LABEL}
            inputClassName={INPUT}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
          />
          <InputField
            label="Last name *"
            labelClassName={LABEL}
            inputClassName={INPUT}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
          />

          <View className="mb-4">
            <Text className="mb-2 font-pmedium text-[13px] text-white">
              National Identification Number (NIN)
            </Text>
            <TextInput
              value={nin}
              onChangeText={setNin}
              placeholder="11-digit NIN"
              keyboardType="number-pad"
              maxLength={11}
              placeholderTextColor={colors.subtle}
              className="rounded-input bg-card px-4 py-4 font-sans text-[13px] text-white"
            />
            <Text className="mt-1.5 font-sans text-[11px] text-muted">
              Optional now — but your NIN and a quick selfie are required to use carpool. You can add
              it later.
            </Text>
          </View>

          <Select
            label="Gender *"
            labelClassName={LABEL}
            inputClassName="text-[13px]"
            placeholder="Select gender"
            value={gender}
            options={GENDERS}
            onChange={(v) => setGender(v as Gender)}
          />

          <View className="mb-4">
            <Text className="mb-2 font-pmedium text-[13px] text-white">Referral code</Text>
            <TextInput
              value={referral}
              onChangeText={setReferral}
              autoCapitalize="characters"
              placeholderTextColor={colors.subtle}
              className="rounded-input bg-card px-4 py-4 font-sans text-[13px] text-white"
            />
            <Text className="mt-1.5 font-sans text-[10px] text-white/40">
              If you were referred, kindly input the code
            </Text>
          </View>

          <View className="flex-1" />
          <View className="flex-row gap-2 pb-8 pt-4">
            <View className="flex-1">
              <KariButton label="Back" variant="outline" onPress={() => router.back()} />
            </View>
            <View className="flex-1">
              <KariButton label="Next" onPress={submit} loading={loading} disabled={!valid} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </OnboardingScreen>
  );
}
