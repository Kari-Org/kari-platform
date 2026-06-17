import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { colors } from '@kari/mobile-core';
import { driversApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/auth.store';

/** Splash + 3-way gate: unauthenticated → auth; authenticated but not onboarded
 *  → onboarding; ready → the app tabs. */
export default function Index() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;
    void (async () => {
      if (status === 'unauthenticated') {
        router.replace('/(auth)/welcome');
        return;
      }
      try {
        const me = await driversApi.me();
        if (cancelled) return;
        router.replace(me.onboardingComplete ? '/(tabs)/home' : '/(onboarding)');
      } catch {
        if (!cancelled) router.replace('/(onboarding)');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}
    >
      <Image source={require('../assets/logo.png')} style={{ width: 96, height: 96 }} resizeMode="contain" />
      <Text style={{ color: colors.text, fontFamily: 'ArchivoExpanded', fontSize: 24, marginTop: 12 }}>
        Kari <Text style={{ color: colors.brand }}>Driver</Text>
      </Text>
      <ActivityIndicator color={colors.brand} style={{ marginTop: 16 }} />
    </View>
  );
}
