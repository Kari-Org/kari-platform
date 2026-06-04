import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { AccessibilityNeed, BehaviorPreference, MusicPreference } from '@kari/types';
import { ridersApi } from '@/api/endpoints';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { BrandMark } from '@/components/BrandMark';
import { KariButton } from '@/components/KariButton';
import { OptionRow } from '@/components/OptionRow';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StepDots } from '@/components/StepDots';
import { errorMessage } from '@/lib/error';

const TOTAL = 5;

export default function Preferences() {
  const [step, setStep] = useState(1);
  const [behavior, setBehavior] = useState<BehaviorPreference>();
  const [music, setMusic] = useState<MusicPreference>();
  const [access, setAccess] = useState<AccessibilityNeed>();
  const [home, setHome] = useState('');
  const [promos, setPromos] = useState<boolean>();
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    setLoading(true);
    try {
      await ridersApi.setPreferences({
        preferredDriverBehavior: behavior,
        musicPreference: music,
        accessibilityNeed: access,
        promotionsOptIn: promos,
        homeAddress: home.trim() || undefined,
      });
      router.replace({
        pathname: '/success',
        params: {
          title: 'Sign Up Successful',
          subtitle: 'Your account is all set. Welcome to Kari!',
          next: 'home',
        },
      });
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const canNext =
    (step === 1 && !!behavior) ||
    (step === 2 && !!music) ||
    (step === 3 && !!access) ||
    step === 4 ||
    (step === 5 && promos !== undefined);

  const onNext = () => {
    if (step < TOTAL) setStep(step + 1);
    else void finish();
  };
  const onBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="Ride Preferences" onBack={onBack} />
      <View className="mt-4 items-center">
        <BrandMark />
      </View>
      <View className="mt-4">
        <StepDots current={step} total={TOTAL} />
      </View>

      <View className="mt-8 flex-1">
        {step === 1 && (
          <Question title="What type of driver interaction do you prefer?">
            <OptionRow label="Talkative" selected={behavior === BehaviorPreference.TALKATIVE} onPress={() => setBehavior(BehaviorPreference.TALKATIVE)} />
            <OptionRow label="Quiet" selected={behavior === BehaviorPreference.RESERVED} onPress={() => setBehavior(BehaviorPreference.RESERVED)} />
            <OptionRow label="Neutral" selected={behavior === BehaviorPreference.NEUTRAL} onPress={() => setBehavior(BehaviorPreference.NEUTRAL)} />
          </Question>
        )}
        {step === 2 && (
          <Question title="Would you like to listen to music during your rides?">
            <OptionRow label="Yes, I'll choose my own playlist" selected={music === MusicPreference.OWN_PLAYLIST} onPress={() => setMusic(MusicPreference.OWN_PLAYLIST)} />
            <OptionRow label="Yes, I'm open to the driver's choice" selected={music === MusicPreference.DRIVER_CHOICE} onPress={() => setMusic(MusicPreference.DRIVER_CHOICE)} />
            <OptionRow label="No, I prefer silence" selected={music === MusicPreference.SILENCE} onPress={() => setMusic(MusicPreference.SILENCE)} />
          </Question>
        )}
        {step === 3 && (
          <Question title="Do you have any specific accessibility needs?">
            <OptionRow label="Wheelchair-accessible vehicle" selected={access === AccessibilityNeed.WHEELCHAIR} onPress={() => setAccess(AccessibilityNeed.WHEELCHAIR)} />
            <OptionRow label="Child car seat" selected={access === AccessibilityNeed.CHILD_SEAT} onPress={() => setAccess(AccessibilityNeed.CHILD_SEAT)} />
            <OptionRow label="No specific needs" selected={access === AccessibilityNeed.NONE} onPress={() => setAccess(AccessibilityNeed.NONE)} />
          </Question>
        )}
        {step === 4 && (
          <Question title="Do you have frequent destinations (e.g., home, work)?">
            <AddressAutocomplete
              label="Address"
              value={home}
              onChangeText={setHome}
              onSelect={(p) => setHome(p.description)}
              placeholder="Search your home or work address"
            />
          </Question>
        )}
        {step === 5 && (
          <Question title="Would you like notifications for discounts or promotions?">
            <OptionRow label="Yes, send me offers" selected={promos === true} onPress={() => setPromos(true)} />
            <OptionRow label="No, I'm not interested" selected={promos === false} onPress={() => setPromos(false)} />
          </Question>
        )}
      </View>

      <View className="flex-row gap-3 pb-8">
        <View className="flex-1">
          <KariButton label="Back" variant="outline" onPress={onBack} />
        </View>
        <View className="flex-1">
          <KariButton
            label={step === TOTAL ? 'Finish' : 'Next'}
            onPress={onNext}
            loading={loading}
            disabled={!canNext}
          />
        </View>
      </View>
    </Screen>
  );
}

function Question({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text className="mb-6 text-center font-psemibold text-xl text-white">{title}</Text>
      {children}
    </View>
  );
}
