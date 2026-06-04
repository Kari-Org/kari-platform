import { Tabs } from 'expo-router';
import { DotTabBar } from '@/components/DotTabBar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <DotTabBar {...props} />}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="rides" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
