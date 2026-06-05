import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { colors } from '@kari/mobile-core';
import { IncomingRequest } from '@/components/IncomingRequest';
import { registerForPush } from '@/lib/push';
import { useDriverDispatch } from '@/realtime/useDriverDispatch';
import { useRideStore } from '@/stores/ride.store';

export default function TabsLayout() {
  // Global dispatch listener — surfaces incoming requests on any tab.
  useDriverDispatch();
  const incomingOffer = useRideStore((s) => s.incomingOffer);

  // Register for push-for-dispatch once (best-effort; no-op in Expo Go).
  useEffect(() => {
    void registerForPush();
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.hairline },
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.subtle,
          tabBarLabelStyle: { fontFamily: 'Poppins_500Medium', fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: 'Trips',
            tabBarIcon: ({ color, size }) => <Ionicons name="car" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Account',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          }}
        />
      </Tabs>

      {incomingOffer && <IncomingRequest offer={incomingOffer} />}
    </>
  );
}
