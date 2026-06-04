import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { BrandMark } from '@/components/BrandMark';
import { Checkbox } from '@/components/Checkbox';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { PhoneInput } from '@/components/PhoneInput';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useSignupDraft } from '@/stores/signup.store';

export default function SignUp() {
  const draft = useSignupDraft();
  const [email, setEmail] = useState(draft.email);
  const [phone, setPhone] = useState(draft.phone || '+234');
  const [password, setPassword] = useState(draft.password);
  const [agree, setAgree] = useState(false);

  const valid = /\S+@\S+\.\S+/.test(email) && phone.length >= 13 && password.length >= 8 && agree;

  const next = () => {
    draft.set({ email: email.trim(), phone: phone.trim(), password });
    router.push('/(auth)/verify-method');
  };

  return (
    <Screen className="px-5">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScreenHeader />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View className="mt-4 items-center">
            <BrandMark />
          </View>
          <Text className="mt-6 text-center font-pbold text-3xl text-white">Sign Up</Text>
          <Text className="mb-6 mt-2 text-center font-sans text-base text-muted">
            Create your account to start riding.
          </Text>
          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <PhoneInput label="Phone Number" value={phone} onChangeText={setPhone} />
          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
          />
          <View className="mb-6 mt-1">
            <Checkbox checked={agree} onChange={setAgree}>
              <Text className="font-sans text-sm text-muted">
                By signing up, you agree to Kari&apos;s <Text className="text-brand">Terms of Service</Text>{' '}
                and <Text className="text-brand">Privacy Policy</Text>.
              </Text>
            </Checkbox>
          </View>
          <View className="flex-1" />
          <KariButton label="Sign Up" onPress={next} disabled={!valid} />
          <Text
            onPress={() => router.replace('/(auth)/signin')}
            className="mb-8 mt-4 text-center font-sans text-muted"
          >
            Already have an account? <Text className="text-brand">Login</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
