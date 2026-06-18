import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { AccessibilityNeed, BehaviorPreference, MusicPreference } from '@kari/types';
import { ridersApi } from '@/api/endpoints';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { BrandMark } from '@/components/BrandMark';
import { KariButton } from '@/components/KariButton';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { OptionRow } from '@/components/OptionRow';
import { errorMessage } from '@/lib/error';

const TOTAL = 5;

/** 5-segment progress row: active = wide white pill, the rest small + dim. */
function Dots({ current }: { current: number }) {
  return (
    <View className="flex-row justify-center gap-1.5">
      {Array.from({ length: TOTAL }).map((_, i) => (
        <View
          key={i}
          className={`h-[7px] rounded-pill ${i + 1 === current ? 'w-8 bg-white' : 'w-[7px] bg-white/40'}`}
        />
      ))}
    </View>
  );
}

export default function Preferences() {
  const [step, setStep] = useState(0); // 0 = intro, 1..5 = questions
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
    step === 0 ||
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
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  return (
    <OnboardingScreen className="px-6">
      {step === 0 ? (
        <View className="flex-1">
          <View className="mb-2 mt-2 items-center">
            <BrandMark />
          </View>
          <Text className="mt-12 text-center font-psemibold text-xl text-white">
            Ride Preferences
          </Text>
          <Text
            className="mt-10 self-center text-center font-pmedium text-[15px] text-white"
            style={{ width: 328 }}
          >
            To ensure you have the best experience using our app, we would like to know what your
            preferences are so we can tailor your rides just for you
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <View className="mb-5 mt-2 items-center">
            <BrandMark size={28} />
          </View>
          <Dots current={step} />
          <Text className="mt-5 text-center font-pmedium text-sm text-white/50">
            <Text className="text-white">{step}</Text> of {TOTAL}
          </Text>

          <Text
            className="mb-9 mt-8 self-center text-center font-psemibold text-xl text-white"
            style={{ width: 307 }}
          >
            {step === 1 && '“What type of driver interaction do you prefer?”'}
            {step === 2 && '“Would you like to listen to music during your rides?”'}
            {step === 3 && '“Do you have any specific accessibility needs?”'}
            {step === 4 && '“Do you have frequent destinations (e.g., home, work)?”'}
            {step === 5 && '“Would you like notifications for discounts or promotions?”'}
          </Text>

          {step === 1 && (
            <>
              <OptionRow
                label="Talkative"
                selected={behavior === BehaviorPreference.TALKATIVE}
                onPress={() => setBehavior(BehaviorPreference.TALKATIVE)}
              />
              <OptionRow
                label="Quiet"
                selected={behavior === BehaviorPreference.RESERVED}
                onPress={() => setBehavior(BehaviorPreference.RESERVED)}
              />
              <OptionRow
                label="Neutral"
                selected={behavior === BehaviorPreference.NEUTRAL}
                onPress={() => setBehavior(BehaviorPreference.NEUTRAL)}
              />
            </>
          )}
          {step === 2 && (
            <>
              <OptionRow
                label="Yes, I'll choose my own playlist."
                selected={music === MusicPreference.OWN_PLAYLIST}
                onPress={() => setMusic(MusicPreference.OWN_PLAYLIST)}
              />
              <OptionRow
                label="Yes, I'm open to the driver's choice."
                selected={music === MusicPreference.DRIVER_CHOICE}
                onPress={() => setMusic(MusicPreference.DRIVER_CHOICE)}
              />
              <OptionRow
                label="No, I prefer silence."
                selected={music === MusicPreference.SILENCE}
                onPress={() => setMusic(MusicPreference.SILENCE)}
              />
            </>
          )}
          {step === 3 && (
            <>
              <OptionRow
                label="Wheelchair-accessible vehicle."
                selected={access === AccessibilityNeed.WHEELCHAIR}
                onPress={() => setAccess(AccessibilityNeed.WHEELCHAIR)}
              />
              <OptionRow
                label="Child car seat."
                selected={access === AccessibilityNeed.CHILD_SEAT}
                onPress={() => setAccess(AccessibilityNeed.CHILD_SEAT)}
              />
              <OptionRow
                label="No specific needs."
                selected={access === AccessibilityNeed.NONE}
                onPress={() => setAccess(AccessibilityNeed.NONE)}
              />
            </>
          )}
          {step === 4 && (
            <AddressAutocomplete
              value={home}
              onChangeText={setHome}
              onSelect={(p) => setHome(p.description)}
              placeholder="Enter your address"
            />
          )}
          {step === 5 && (
            <>
              <OptionRow
                label="Yes, send me offers."
                selected={promos === true}
                onPress={() => setPromos(true)}
              />
              <OptionRow
                label="No, I'm not interested."
                selected={promos === false}
                onPress={() => setPromos(false)}
              />
            </>
          )}
        </View>
      )}

      <View className="flex-row gap-2 pb-8">
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
    </OnboardingScreen>
  );
}
