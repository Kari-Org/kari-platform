import '../global.css';
import 'react-native-gesture-handler';
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import { useFonts } from 'expo-font';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/api/queryClient';
import { useAuthStore } from '@/stores/auth.store';
import { colors } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const status = useAuthStore((s) => s.status);
  const segments = useSegments();
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    GeistMono_400Regular,
    ArchivoExpanded: require('../assets/fonts/ArchivoExpanded.ttf'),
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (fontsLoaded && status !== 'loading') {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, status]);

  // Global auth guard: keep the visible route group in sync with auth status,
  // so logout (or a token-expiry logout) returns the user to the auth flow.
  useEffect(() => {
    if (status === 'loading') return;
    const segs = segments as string[];
    // The root index ("/") plays the animated splash and routes itself.
    if (segs.length === 0) return;
    const inAuth = segs[0] === '(auth)';
    if (status === 'unauthenticated' && !inAuth) {
      router.replace('/(auth)/welcome');
    } else if (status === 'authenticated' && inAuth) {
      router.replace('/(tabs)/home');
    }
  }, [status, segments, router]);

  if (!fontsLoaded || status === 'loading') {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
