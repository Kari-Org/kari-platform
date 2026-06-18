import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
import { OtpChannel } from '@kari/types';
import { authApi } from '@/api/endpoints';
import { BrandMark } from '@/components/BrandMark';
import { KariButton } from '@/components/KariButton';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { errorMessage } from '@/lib/error';
import { useAuthStore } from '@/stores/auth.store';
import { colors } from '@/theme/tokens';

export default function Otp() {
  const { phone, channel, mode } = useLocalSearchParams<{
    phone: string;
    channel?: string;
    mode?: string;
  }>();
  const isLogin = mode === 'login';
  const setSession = useAuthStore((s) => s.setSession);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const channelLabel = channel === OtpChannel.WHATSAPP ? 'WhatsApp' : 'SMS';

  const verify = async (value?: string) => {
    const c = value ?? code;
    if (c.length !== 4) return;
    setLoading(true);
    try {
      const res = isLogin
        ? await authApi.loginVerify({ phone: String(phone), code: c })
        : await authApi.verify({ phone: String(phone), code: c });
      await setSession(res.tokens, res.user);
      router.replace({
        pathname: '/success',
        params: isLogin
          ? { heading: 'Verification', title: 'Login Successful', next: 'home' }
          : {
              heading: 'Verification',
              title: 'Verification Successful',
              subtitle: 'Your phone number has been verified.',
              next: 'profile',
            },
      });
    } catch (e) {
      Alert.alert('Verification failed', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (isLogin) {
      // A login OTP can only be minted by re-entering the password.
      Alert.alert('Resend code', 'Please go back and log in again to get a new code.');
      return;
    }
    try {
      await authApi.sendOtp({ phone: String(phone), channel: channel as OtpChannel | undefined });
      Alert.alert('Code sent', 'A new code is on its way.');
    } catch (e) {
      Alert.alert('Error', errorMessage(e));
    }
  };

  return (
    <OnboardingScreen className="px-6">
      <View className="mb-10 mt-14 items-center">
        <BrandMark />
      </View>
      <Text className="text-center font-psemibold text-[28px] text-white">Verification</Text>
      <Text className="mt-6 text-center font-pmedium text-base text-white">
        Enter verification code
      </Text>
      <Text className="mb-7 mt-2 text-center font-sans text-xs text-white/50">
        We have sent a code to your {channelLabel}:{' '}
        <Text className="font-pmedium text-white">{phone}</Text>
      </Text>

      <OtpInput
        numberOfDigits={4}
        focusColor={colors.brand}
        onTextChange={setCode}
        onFilled={(v) => verify(v)}
        theme={{
          containerStyle: { justifyContent: 'center', gap: 16 },
          pinCodeContainerStyle: {
            backgroundColor: colors.card,
            borderColor: colors.brand,
            borderWidth: 2,
            borderRadius: 5,
            width: 66,
            height: 64,
          },
          pinCodeTextStyle: { color: '#ffffff', fontSize: 24 },
        }}
      />

      <Text onPress={resend} className="mt-4 text-center font-pmedium text-xs text-white/50">
        Didn&apos;t get the code? <Text className="text-white">Click to resend.</Text>
      </Text>

      <View className="mt-8 flex-row gap-2">
        <View className="flex-1">
          <KariButton label="Back" variant="outline" onPress={() => router.back()} />
        </View>
        <View className="flex-1">
          <KariButton
            label="Verify"
            onPress={() => verify()}
            loading={loading}
            disabled={code.length !== 4}
          />
        </View>
      </View>
    </OnboardingScreen>
  );
}
