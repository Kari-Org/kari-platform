import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { authApi } from '@/api/endpoints';
import type { AuthTokens, PublicUser } from '@/api/types';
import { BrandMark } from '@/components/BrandMark';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { errorMessage } from '@/lib/error';
import { useAuthStore } from '@/stores/auth.store';

WebBrowser.maybeCompleteAuthSession();

const extra = (Constants.expoConfig?.extra ?? {}) as {
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};

// White 13px labels + 13px input text, per the Figma "Customer Onboarding" form spec.
const LABEL = 'text-[13px] text-white';
const INPUT = 'text-[13px] text-white';

export default function SignIn() {
  const setSession = useAuthStore((s) => s.setSession);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const configured = !!(
    extra.googleWebClientId || extra.googleIosClientId || extra.googleAndroidClientId
  );
  const [, response, promptAsync] = Google.useAuthRequest({
    iosClientId: extra.googleIosClientId || undefined,
    androidClientId: extra.googleAndroidClientId || undefined,
    webClientId: extra.googleWebClientId || undefined,
    scopes: ['openid', 'profile', 'email'],
  });

  const finishAuth = async (tokens: AuthTokens, user: PublicUser) => {
    await setSession(tokens, user);
    router.replace({ pathname: '/success', params: { title: 'Login Successful', next: 'home' } });
  };

  const googleSignIn = async (idToken: string) => {
    try {
      const res = await authApi.google({ idToken });
      await finishAuth(res.tokens, res.user);
    } catch (e) {
      Alert.alert('Google sign-in failed', errorMessage(e));
    }
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token ?? response.authentication?.idToken;
      if (idToken) void googleSignIn(idToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await authApi.login({ identifier: identifier.trim(), password });
      // Password is valid and an OTP was sent; tokens are issued after it's verified
      // on the OTP screen (login mode). This is the re-login 2FA step.
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: res.phone, channel: res.channel, mode: 'login' },
      });
    } catch (e) {
      Alert.alert('Login failed', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = () => {
    if (!configured) {
      Alert.alert('Google sign-in', 'Add your Google OAuth client IDs to app.json to enable this.');
      return;
    }
    void promptAsync();
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
          <Text className="mb-7 text-center font-psemibold text-[28px] text-white">Login</Text>

          <InputField
            label="Email/Phone Number"
            labelClassName={LABEL}
            inputClassName={INPUT}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="eg. musaadamu@gmail.com"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <InputField
            label="Password"
            labelClassName={LABEL}
            inputClassName={INPUT}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••••••"
            secureTextEntry
          />
          <Text
            onPress={() => router.push('/(auth)/forgot-password')}
            className="mb-7 text-right font-pmedium text-[13px] text-brand"
          >
            forgot password?
          </Text>

          <KariButton
            label="Login"
            onPress={submit}
            loading={loading}
            disabled={!identifier || !password}
          />
          <Text
            onPress={() => router.replace('/(auth)/signup')}
            className="mt-4 text-center font-pmedium text-xs text-white"
          >
            Don&apos;t have an account? <Text className="text-brand">Sign up</Text>
          </Text>

          <View className="my-7 flex-row items-center">
            <View className="h-px flex-1 bg-white/15" />
            <Text className="mx-3 font-pmedium text-xs text-white/60">or login with</Text>
            <View className="h-px flex-1 bg-white/15" />
          </View>
          <Pressable
            onPress={onGoogle}
            className="h-[47px] flex-row items-center justify-center rounded-pill bg-white"
          >
            <Image
              source={require('../../assets/brand/google.png')}
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
            />
            <Text className="ml-2.5 font-pmedium text-sm text-black">Google</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </OnboardingScreen>
  );
}
