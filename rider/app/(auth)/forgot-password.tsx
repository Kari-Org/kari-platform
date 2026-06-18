import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { authApi } from '@/api/endpoints';
import { BrandMark } from '@/components/BrandMark';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { PhoneInput } from '@/components/PhoneInput';
import { errorMessage } from '@/lib/error';

const LABEL = 'text-[13px] text-white';
const INPUT = 'text-[13px] text-white';

export default function ForgotPassword() {
  const [phone, setPhone] = useState('+234');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    try {
      await authApi.forgotPassword({ phone: phone.trim() });
      setSent(true);
    } catch (e) {
      Alert.alert('Error', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    setLoading(true);
    try {
      await authApi.resetPassword({ phone: phone.trim(), code: code.trim(), newPassword });
      Alert.alert('Password reset', 'You can now sign in with your new password.');
      router.replace('/(auth)/signin');
    } catch (e) {
      Alert.alert('Error', errorMessage(e));
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
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          <View className="mb-9 items-center">
            <BrandMark />
          </View>
          <Text className="text-center font-psemibold text-[28px] text-white">Reset password</Text>
          <Text className="mb-8 mt-2 text-center font-sans text-sm text-muted">
            {sent
              ? 'Enter the code we sent and your new password.'
              : 'Enter your phone number to receive a reset code.'}
          </Text>

          {!sent ? (
            <>
              <PhoneInput label="Phone Number" value={phone} onChangeText={setPhone} />
              <KariButton
                label="Send code"
                onPress={send}
                loading={loading}
                disabled={phone.length < 13}
              />
            </>
          ) : (
            <>
              <InputField
                label="Code"
                labelClassName={LABEL}
                inputClassName={INPUT}
                value={code}
                onChangeText={setCode}
                placeholder="4-digit code"
                keyboardType="number-pad"
                maxLength={4}
              />
              <InputField
                label="New password"
                labelClassName={LABEL}
                inputClassName={INPUT}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                secureTextEntry
              />
              <KariButton
                label="Reset password"
                onPress={reset}
                loading={loading}
                disabled={code.length !== 4 || newPassword.length < 8}
              />
            </>
          )}

          <Text
            onPress={() => router.back()}
            className="mt-5 text-center font-pmedium text-xs text-white"
          >
            Back to <Text className="text-brand">Login</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </OnboardingScreen>
  );
}
