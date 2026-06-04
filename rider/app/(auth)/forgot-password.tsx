import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { BrandMark } from '@/components/BrandMark';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { PhoneInput } from '@/components/PhoneInput';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { authApi } from '@/api/endpoints';
import { errorMessage } from '@/lib/error';

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
    <Screen className="px-5">
      <ScreenHeader />
      <View className="mt-4 items-center">
        <BrandMark />
      </View>
      <Text className="mt-8 font-pbold text-3xl text-white">Reset password</Text>
      <Text className="mb-8 mt-2 font-sans text-base text-muted">
        {sent
          ? 'Enter the code we sent and your new password.'
          : 'Enter your phone number to receive a reset code.'}
      </Text>

      {!sent ? (
        <>
          <PhoneInput label="Phone Number" value={phone} onChangeText={setPhone} />
          <KariButton label="Send code" onPress={send} loading={loading} disabled={phone.length < 13} />
        </>
      ) : (
        <>
          <InputField
            label="Code"
            value={code}
            onChangeText={setCode}
            placeholder="4-digit code"
            keyboardType="number-pad"
            maxLength={4}
          />
          <InputField
            label="New password"
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

      <Text onPress={() => router.back()} className="mt-4 text-center font-sans text-muted">
        Back to <Text className="text-brand">Login</Text>
      </Text>
    </Screen>
  );
}
