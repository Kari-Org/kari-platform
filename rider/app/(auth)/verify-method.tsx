import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { OtpChannel, UserRole } from '@kari/types';
import { authApi } from '@/api/endpoints';
import { BrandMark } from '@/components/BrandMark';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { errorMessage } from '@/lib/error';
import { useSignupDraft } from '@/stores/signup.store';
import { colors } from '@/theme/tokens';

export default function VerifyMethod() {
  const draft = useSignupDraft();
  const [loading, setLoading] = useState<OtpChannel | null>(null);

  const choose = async (channel: OtpChannel) => {
    if (!draft.phone) {
      router.replace('/(auth)/signup');
      return;
    }
    setLoading(channel);
    try {
      try {
        await authApi.signup({
          email: draft.email,
          phone: draft.phone,
          password: draft.password,
          role: UserRole.RIDER,
          channel,
        });
      } catch (e) {
        // Account may already exist from a previous attempt — just resend.
        try {
          await authApi.sendOtp({ phone: draft.phone, channel });
        } catch {
          throw e;
        }
      }
      draft.set({ channel });
      router.push({ pathname: '/(auth)/otp', params: { phone: draft.phone, channel } });
    } catch (e) {
      Alert.alert('Could not send code', errorMessage(e));
    } finally {
      setLoading(null);
    }
  };

  return (
    <OnboardingScreen className="px-6">
      <View className="mb-10 mt-14 items-center">
        <BrandMark />
      </View>
      <Text className="text-center font-psemibold text-[28px] text-white">Verification</Text>
      <Text className="mt-3 text-center font-pmedium text-base text-white">
        Kindly choose a verification method
      </Text>
      <Text className="mt-2 text-center font-sans text-xs text-white/50">
        The code will be sent to your number:{' '}
        <Text className="font-pmedium text-white">{draft.phone}</Text>
      </Text>

      <View className="mt-10 items-start gap-2.5">
        <MethodPill
          icon="chatbubble-ellipses-outline"
          label="Get code via SMS"
          loading={loading === OtpChannel.SMS}
          onPress={() => choose(OtpChannel.SMS)}
          extraPadRight
        />
        <MethodPill
          icon="logo-whatsapp"
          label="Get code via Whatsapp"
          loading={loading === OtpChannel.WHATSAPP}
          onPress={() => choose(OtpChannel.WHATSAPP)}
        />
      </View>
    </OnboardingScreen>
  );
}

function MethodPill({
  icon,
  label,
  loading,
  onPress,
  extraPadRight,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  loading: boolean;
  onPress: () => void;
  extraPadRight?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={`flex-row items-center gap-1.5 rounded-pill bg-card py-4 pl-3 ${
        extraPadRight ? 'pr-10' : 'pr-4'
      }`}
    >
      {loading ? (
        <ActivityIndicator color={colors.brand} size="small" />
      ) : (
        <Ionicons name={icon} size={22} color="#ffffff" />
      )}
      <Text className="font-pmedium text-xs text-white">{label}</Text>
    </Pressable>
  );
}
