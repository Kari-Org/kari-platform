import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
import { OtpChannel } from '@kari/types';
import { KariButton, Screen, ScreenHeader, colors } from '@kari/mobile-core';
import { authApi } from '@/api/endpoints';
import { BrandMark } from '@/components/BrandMark';
import { errorMessage } from '@/lib/error';
import { useAuthStore } from '@/stores/auth.store';

export default function Otp() {
  const { phone, channel } = useLocalSearchParams<{ phone: string; channel?: string }>();
  const setSession = useAuthStore((s) => s.setSession);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const channelLabel = channel === OtpChannel.WHATSAPP ? 'WhatsApp' : 'SMS';

  const verify = async (value?: string) => {
    const c = value ?? code;
    if (c.length !== 4) return;
    setLoading(true);
    try {
      const res = await authApi.verify({ phone: String(phone), code: c });
      await setSession(res.tokens, res.user);
      router.replace({
        pathname: '/success',
        params: {
          title: 'Verification Successful',
          subtitle: 'Your phone number has been verified.',
          next: 'onboarding',
        },
      });
    } catch (e) {
      Alert.alert('Verification failed', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await authApi.sendOtp({ phone: String(phone), channel: channel as OtpChannel | undefined });
      Alert.alert('Code sent', 'A new code is on its way.');
    } catch (e) {
      Alert.alert('Error', errorMessage(e));
    }
  };

  return (
    <Screen className="px-5">
      <ScreenHeader />
      <View className="mt-2 items-center">
        <BrandMark />
      </View>
      <Text className="mt-8 text-center font-pbold text-3xl text-white">Verification</Text>
      <Text className="mb-1 mt-2 text-center font-sans text-base text-muted">Enter verification code</Text>
      <Text className="mb-8 text-center font-sans text-sm text-subtle">
        We sent a code to your {channelLabel}: {phone}
      </Text>
      <OtpInput
        numberOfDigits={4}
        focusColor={colors.brand}
        onTextChange={setCode}
        onFilled={(v) => verify(v)}
        theme={{
          pinCodeContainerStyle: { backgroundColor: colors.card, borderColor: colors.hairline },
          pinCodeTextStyle: { color: '#ffffff' },
        }}
      />
      <View className="mt-8">
        <KariButton label="Verify" onPress={() => verify()} loading={loading} disabled={code.length !== 4} />
      </View>
      <Text onPress={resend} className="mt-4 text-center font-sans text-muted">
        Didn’t get the code? <Text className="text-brand">Click to resend</Text>
      </Text>
    </Screen>
  );
}
