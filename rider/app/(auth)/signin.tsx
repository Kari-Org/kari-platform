import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { authApi } from '@/api/endpoints';
import type { AuthTokens, PublicUser } from '@/api/types';
import { BrandMark } from '@/components/BrandMark';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';
import { useAuthStore } from '@/stores/auth.store';

WebBrowser.maybeCompleteAuthSession();

const extra = (Constants.expoConfig?.extra ?? {}) as {
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};

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
      await finishAuth(res.tokens, res.user);
    } catch (e) {
      Alert.alert('Login failed', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = () => {
    if (!configured) {
      Alert.alert(
        'Google sign-in',
        'Add your Google OAuth client IDs to app.json (extra.googleWebClientId / googleIosClientId / googleAndroidClientId) to enable this.',
      );
      return;
    }
    void promptAsync();
  };

  return (
    <Screen className="px-5">
      <ScreenHeader />
      <View className="flex-1 justify-center">
        <View className="mb-6 items-center">
          <BrandMark />
        </View>
        <Text className="text-center font-pbold text-3xl text-white">Login</Text>
        <Text className="mb-8 mt-2 text-center font-sans text-base text-muted">
          Welcome back — sign in to continue.
        </Text>
        <InputField
          label="Email/Phone Number"
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
        />
        <Text
          onPress={() => router.push('/(auth)/forgot-password')}
          className="mb-6 text-right font-pmedium text-sm text-brand"
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
          className="mt-4 text-center font-sans text-muted"
        >
          Don&apos;t have an account? <Text className="text-brand">Sign up</Text>
        </Text>

        <View className="my-6 flex-row items-center">
          <View className="h-px flex-1 bg-hairline" />
          <Text className="mx-3 font-sans text-sm text-subtle">or login with</Text>
          <View className="h-px flex-1 bg-hairline" />
        </View>
        <Pressable
          onPress={onGoogle}
          className="h-[52px] flex-row items-center justify-center rounded-pill bg-white"
        >
          <Ionicons name="logo-google" size={20} color="#000000" />
          <Text className="ml-3 font-psemibold text-base text-black">Google</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
