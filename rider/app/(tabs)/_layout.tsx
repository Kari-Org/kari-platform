import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { DotTabBar } from '@/components/DotTabBar';
import { registerForPush } from '@/lib/push';

export default function TabsLayout() {
  useEffect(() => {
    void registerForPush();
  }, []);
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <DotTabBar {...props} />}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="rides" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
