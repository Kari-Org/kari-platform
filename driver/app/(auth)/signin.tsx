import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { InputField, KariButton, Screen, ScreenHeader } from '@kari/mobile-core';
import { authApi } from '@/api/endpoints';
import { errorMessage } from '@/lib/error';
import { useAuthStore } from '@/stores/auth.store';

export default function SignIn() {
  const setSession = useAuthStore((s) => s.setSession);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await authApi.login({ identifier: identifier.trim(), password });
      await setSession(res.tokens, res.user);
      router.replace('/');
    } catch (e) {
      Alert.alert('Login failed', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen className="px-5">
      <ScreenHeader />
      <View className="flex-1 justify-center">
        <Text className="text-center font-pbold text-3xl text-white">Driver Login</Text>
        <Text className="mb-8 mt-2 text-center font-sans text-base text-muted">
          Sign in to start driving.
        </Text>
        <InputField
          label="Email/Phone Number"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="you@example.com"
        />
        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Your password"
        />
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
      </View>
    </Screen>
  );
}
