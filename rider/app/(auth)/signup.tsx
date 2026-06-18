import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { authApi } from '@/api/endpoints';
import { BrandMark } from '@/components/BrandMark';
import { Checkbox } from '@/components/Checkbox';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { PhoneInput } from '@/components/PhoneInput';
import { errorMessage } from '@/lib/error';
import { useAuthStore } from '@/stores/auth.store';
import { useSignupDraft } from '@/stores/signup.store';

WebBrowser.maybeCompleteAuthSession();

const extra = (Constants.expoConfig?.extra ?? {}) as {
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};

const LABEL = 'text-[13px] text-white';
const INPUT = 'text-[13px] text-white';
const TERMS_URL = 'https://kari.ng/legal/terms'; // TODO: replace with the real Terms URL
const PRIVACY_URL = 'https://kari.ng/legal/privacy'; // TODO: replace with the real Privacy URL

export default function SignUp() {
  const draft = useSignupDraft();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState(draft.email);
  const [phone, setPhone] = useState(draft.phone || '+234');
  const [password, setPassword] = useState(draft.password);
  const [agree, setAgree] = useState(false);

  const valid = /\S+@\S+\.\S+/.test(email) && phone.length >= 13 && password.length >= 8 && agree;

  const configured = !!(
    extra.googleWebClientId || extra.googleIosClientId || extra.googleAndroidClientId
  );
  const [, response, promptAsync] = Google.useAuthRequest({
    iosClientId: extra.googleIosClientId || undefined,
    androidClientId: extra.googleAndroidClientId || undefined,
    webClientId: extra.googleWebClientId || undefined,
    scopes: ['openid', 'profile', 'email'],
  });

  const googleSignUp = async (idToken: string) => {
    try {
      const res = await authApi.google({ idToken });
      await setSession(res.tokens, res.user);
      // New Google users still need a verified phone + onboarding. The phone-capture
      // step is added in Chunk 3; for now route new users straight into onboarding.
      router.replace(
        res.isNewUser
          ? { pathname: '/success', params: { title: 'Account Created', next: 'profile' } }
          : { pathname: '/success', params: { title: 'Login Successful', next: 'home' } },
      );
    } catch (e) {
      Alert.alert('Google sign-up failed', errorMessage(e));
    }
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token ?? response.authentication?.idToken;
      if (idToken) void googleSignUp(idToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const onGoogle = () => {
    if (!configured) {
      Alert.alert('Google sign-up', 'Add your Google OAuth client IDs to app.json to enable this.');
      return;
    }
    void promptAsync();
  };

  const next = () => {
    draft.set({ email: email.trim(), phone: phone.trim(), password });
    router.push('/(auth)/verify-method');
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
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="mb-8 mt-2 items-center">
            <BrandMark />
          </View>
          <Text className="mb-7 text-center font-psemibold text-xl text-white">Sign Up</Text>

          <InputField
            label="Email"
            labelClassName={LABEL}
            inputClassName={INPUT}
            value={email}
            onChangeText={setEmail}
            placeholder="eg. musaadamu@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <PhoneInput label="Phone Number" value={phone} onChangeText={setPhone} />
          <InputField
            label="Password"
            labelClassName={LABEL}
            inputClassName={INPUT}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••••••"
            secureTextEntry
          />

          {/* Box toggles on its own; the Terms/Privacy spans open links without toggling it. */}
          <View className="mb-7 mt-1 flex-row items-start">
            <Checkbox checked={agree} onChange={setAgree} />
            <Text className="ml-3 flex-1 font-pmedium text-[10px] leading-[16px] text-white">
              By signing up, you confirm that you have read and agree to Kari&apos;s{' '}
              <Text className="text-brand underline" onPress={() => void Linking.openURL(TERMS_URL)}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                className="text-brand underline"
                onPress={() => void Linking.openURL(PRIVACY_URL)}
              >
                Privacy Policy
              </Text>
              , including important guidelines on driver responsibilities, payment policies, and the
              use of your personal data.
            </Text>
          </View>

          <KariButton label="Sign Up" onPress={next} disabled={!valid} />

          <View className="my-6 flex-row items-center">
            <View className="h-px flex-1 bg-white/15" />
            <Text className="mx-3 font-pmedium text-xs text-white/60">or sign up with</Text>
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

          <Text
            onPress={() => router.replace('/(auth)/signin')}
            className="mb-6 mt-5 text-center font-pmedium text-xs text-white"
          >
            Already have an account? <Text className="text-brand">Login</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </OnboardingScreen>
  );
}
