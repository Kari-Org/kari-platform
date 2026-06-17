import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Image, StyleSheet, View } from 'react-native';
import { useAuthStore } from '@/stores/auth.store';
import { colors } from '@/theme/tokens';

const { width } = Dimensions.get('window');
const PIN = 152;
const BLOB = width * 1.3;

/**
 * Animated splash (RN Animated API — no Reanimated/worklets):
 * dark → yellow glow blobs bloom in → the pin slides in from the top and bounces
 * on the center like a ball dropped on a table → "Kari" appears under it (the
 * table) → tagline → a location pulse radiates → routes onward.
 */
export default function Splash() {
  const router = useRouter();

  const blob = useRef(new Animated.Value(0)).current;
  const pinY = useRef(new Animated.Value(-280)).current;
  const pinOpacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(16)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      // soft yellow glow blooms in
      Animated.timing(blob, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // pin slides from the top and bounces on the table (Easing.bounce)
      Animated.sequence([
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(pinOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.timing(pinY, {
            toValue: 0,
            duration: 1300,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // "Kari" — the table — appears just as the pin lands
      Animated.sequence([
        Animated.delay(1750),
        Animated.parallel([
          Animated.timing(textOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(textY, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(2250),
        Animated.timing(tagOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      // location pulse radiates from the pin once it settles
      Animated.sequence([
        Animated.delay(1850),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const t = setTimeout(() => {
      const status = useAuthStore.getState().status;
      router.replace(status === 'authenticated' ? '/(tabs)/home' : '/(auth)/welcome');
    }, 4200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blobOpacity = blob.interpolate({ inputRange: [0, 1], outputRange: [0, 0.22] });
  const blobOpacity2 = blob.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] });
  const blobScale = blob.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={styles.root}>
      <Animated.View
        style={[styles.blob, styles.blobTR, { opacity: blobOpacity, transform: [{ scale: blobScale }] }]}
      />
      <Animated.View
        style={[styles.blob, styles.blobBL, { opacity: blobOpacity2, transform: [{ scale: blobScale }] }]}
      />
      <View style={styles.center}>
        <View style={styles.pinWrap}>
          <Animated.View
            style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
          />
          <Animated.View style={{ opacity: pinOpacity, transform: [{ translateY: pinY }] }}>
            <Image source={require('../assets/logo.png')} style={styles.pin} resizeMode="contain" />
          </Animated.View>
        </View>
        <Animated.Text style={[styles.word, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
          Kari
        </Animated.Text>
        <Animated.Text style={[styles.tag, { opacity: tagOpacity }]}>Get there with Kari</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  blob: {
    position: 'absolute',
    width: BLOB,
    height: BLOB,
    borderRadius: BLOB / 2,
    backgroundColor: colors.brand,
  },
  blobTR: { top: -BLOB * 0.38, right: -BLOB * 0.35 },
  blobBL: { bottom: -BLOB * 0.38, left: -BLOB * 0.35 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pinWrap: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: PIN,
    height: PIN,
    borderRadius: PIN / 2,
    borderWidth: 3,
    borderColor: colors.brand,
  },
  pin: { width: PIN, height: PIN },
  word: { marginTop: 10, color: '#ffffff', fontFamily: 'ArchivoExpanded', fontSize: 36 },
  tag: { marginTop: 4, color: colors.muted, fontFamily: 'HankenGrotesk_400Regular', fontSize: 15 },
});
