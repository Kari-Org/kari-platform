import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/stores/auth.store';
import { colors } from '@/theme/tokens';

/**
 * Animated splash matching the Figma "Customer Onboarding" splash: the blob
 * backdrop (ImageBackground) is present, the Kari pin drops and bounces in, the
 * "Kari Rider" wordmark rises, then the italic tagline fades in → routes onward.
 */
export default function Splash() {
  const router = useRouter();

  const pinY = useRef(new Animated.Value(-240)).current;
  const pinOpacity = useRef(new Animated.Value(0)).current;
  const wordY = useRef(new Animated.Value(14)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(pinOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
          Animated.timing(pinY, { toValue: 0, duration: 1100, easing: Easing.bounce, useNativeDriver: true }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(1300),
        Animated.parallel([
          Animated.timing(wordOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(wordY, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(1750),
        Animated.timing(tagOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      ]),
    ]).start();

    const t = setTimeout(() => {
      const status = useAuthStore.getState().status;
      router.replace(status === 'authenticated' ? '/(tabs)/home' : '/(auth)/welcome');
    }, 3400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ImageBackground
      source={require('../assets/onboarding/onboarding-blobs.png')}
      resizeMode="cover"
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <View style={styles.center}>
        <Animated.Image
          source={require('../assets/logo.png')}
          resizeMode="contain"
          style={[styles.pin, { opacity: pinOpacity, transform: [{ translateY: pinY }] }]}
        />
        <Animated.View
          style={[styles.wordRow, { opacity: wordOpacity, transform: [{ translateY: wordY }] }]}
        >
          <Text style={styles.word}>Kari</Text>
          <Text style={styles.rider}> Rider</Text>
        </Animated.View>
        <Animated.Text style={[styles.tag, { opacity: tagOpacity }]}>Get there with kari</Animated.Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pin: { width: 96, height: 96, marginBottom: 12 },
  wordRow: { flexDirection: 'row', alignItems: 'flex-end' },
  word: { color: colors.text, fontFamily: 'ArchivoExpanded', fontSize: 28, lineHeight: 30 },
  rider: { color: colors.text, fontFamily: 'HankenGrotesk_400Regular', fontSize: 12, marginBottom: 3 },
  tag: {
    marginTop: 14,
    color: colors.text,
    fontFamily: 'HankenGrotesk_400Regular',
    fontStyle: 'italic',
    fontSize: 18,
  },
});
