import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { OptionRow } from '@/components/OptionRow';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';

// Only English is wired today; the others are placeholders for future localization.
const LANGUAGES = ['English', 'Français', 'Yorùbá', 'Igbo', 'Hausa'];

export default function Language() {
  const router = useRouter();
  const [selected, setSelected] = useState('English');

  const pick = (lang: string) => {
    if (lang !== 'English') {
      Alert.alert('Coming soon', `${lang} isn’t available yet — only English for now.`);
      return;
    }
    setSelected(lang);
    router.back();
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="Language Preference" />
      <View className="mt-4">
        <Text className="mb-4 font-sans text-sm text-muted">
          More languages are on the way — English is available today.
        </Text>
        {LANGUAGES.map((lang) => (
          <OptionRow key={lang} label={lang} selected={selected === lang} onPress={() => pick(lang)} />
        ))}
      </View>
    </Screen>
  );
}
