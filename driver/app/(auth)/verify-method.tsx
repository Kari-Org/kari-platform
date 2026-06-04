import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { OtpChannel, UserRole } from '@kari/types';
import { Screen, ScreenHeader, colors } from '@kari/mobile-core';
import { authApi } from '@/api/endpoints';
import { BrandMark } from '@/components/BrandMark';
import { errorMessage } from '@/lib/error';
import { useSignupDraft } from '@/stores/signup.store';

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
          role: UserRole.DRIVER,
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
    <Screen className="px-5">
      <ScreenHeader />
      <View className="mt-2 items-center">
        <BrandMark />
      </View>
      <Text className="mt-8 text-center font-pbold text-3xl text-white">Verification</Text>
      <Text className="mt-2 text-center font-sans text-base text-muted">
        Kindly choose a verification method
      </Text>
      <Text className="mb-8 mt-1 text-center font-sans text-sm text-subtle">
        The code will be sent to: {draft.phone}
      </Text>

      <MethodCard
        icon="chatbubble-ellipses"
        label="Get code via SMS"
        loading={loading === OtpChannel.SMS}
        onPress={() => choose(OtpChannel.SMS)}
      />
      <MethodCard
        icon="logo-whatsapp"
        label="Get code via WhatsApp"
        loading={loading === OtpChannel.WHATSAPP}
        onPress={() => choose(OtpChannel.WHATSAPP)}
      />
    </Screen>
  );
}

function MethodCard({
  icon,
  label,
  loading,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="mb-4 flex-row items-center rounded-card bg-card px-5 py-5"
    >
      <Ionicons name={icon} size={22} color={colors.brand} />
      <Text className="ml-4 flex-1 font-pmedium text-base text-white">{label}</Text>
      {loading ? (
        <ActivityIndicator color={colors.brand} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
      )}
    </Pressable>
  );
}
