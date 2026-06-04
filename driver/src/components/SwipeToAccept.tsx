import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Animated, type LayoutChangeEvent, PanResponder, View } from 'react-native';
import { colors } from '@kari/mobile-core';

const KNOB = 52;
const PAD = 4;

/**
 * Swipe-to-confirm slider — matches the Figma "Accept Ride" filling pill. Drag
 * the knob ≥70% of the track to fire `onAccept`; a short drag springs back.
 * Uses PanResponder + Animated (no extra gesture dep).
 */
export function SwipeToAccept({
  label = 'Swipe to accept',
  onAccept,
}: {
  label?: string;
  onAccept: () => void;
}) {
  const [trackW, setTrackW] = useState(0);
  const maxXRef = useRef(1);
  const x = useRef(new Animated.Value(0)).current;
  const done = useRef(false);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackW(w);
    maxXRef.current = Math.max(1, w - KNOB - PAD * 2);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !done.current,
      onMoveShouldSetPanResponder: (_, g) => !done.current && Math.abs(g.dx) > 4,
      onPanResponderMove: (_, g) => {
        x.setValue(Math.max(0, Math.min(maxXRef.current, g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        const nx = Math.max(0, Math.min(maxXRef.current, g.dx));
        if (nx >= maxXRef.current * 0.7) {
          done.current = true;
          Animated.timing(x, {
            toValue: maxXRef.current,
            duration: 120,
            useNativeDriver: true,
          }).start(() => onAccept());
        } else {
          Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        }
      },
    }),
  ).current;

  const labelOpacity = x.interpolate({
    inputRange: [0, Math.max(1, trackW / 2)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View
      onLayout={onLayout}
      style={{
        height: 60,
        borderRadius: 9999,
        backgroundColor: 'rgba(255,255,0,0.15)',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Animated.Text
        style={{
          opacity: labelOpacity,
          textAlign: 'center',
          color: colors.brand,
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 15,
        }}
      >
        {label}
      </Animated.Text>
      <Animated.View
        {...pan.panHandlers}
        style={{
          position: 'absolute',
          left: PAD,
          height: KNOB,
          width: KNOB,
          borderRadius: KNOB / 2,
          backgroundColor: colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ translateX: x }],
        }}
      >
        <Ionicons name="arrow-forward" size={24} color={colors.bg} />
      </Animated.View>
    </View>
  );
}
