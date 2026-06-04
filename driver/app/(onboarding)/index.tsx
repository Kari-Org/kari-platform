import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { type ReactNode, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { CarCategory } from '@kari/types';
import {
  InputField,
  KariButton,
  PhoneInput,
  Screen,
  ScreenHeader,
  Select,
  StepDots,
  type SelectOption,
  colors,
} from '@kari/mobile-core';
import { driversApi } from '@/api/endpoints';
import { errorMessage } from '@/lib/error';
import { useAuthStore } from '@/stores/auth.store';

const TOTAL = 6;

const STATES: SelectOption[] = [
  'Lagos', 'Rivers', 'FCT Abuja', 'Oyo', 'Kano', 'Anambra', 'Enugu', 'Kaduna', 'Other',
].map((s) => ({ label: s, value: s }));

const CATEGORIES: SelectOption[] = [
  { label: 'Economy', value: CarCategory.ECONOMY },
  { label: 'Comfort', value: CarCategory.COMFORT },
  { label: 'Premium', value: CarCategory.PREMIUM },
];

// Talkative-positive statements rated on a 1–5 Likert (agree = more talkative).
const QUIZ = [
  'I enjoy chatting with my riders.',
  'I like recommending spots along the route.',
  'I greet every rider with a bit of small talk.',
  'I happily keep the conversation going on long trips.',
  'I’d rather have lively company than a silent ride.',
];
const SCALE = [1, 2, 3, 4, 5];

export default function Onboarding() {
  const logout = useAuthStore((s) => s.logout);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // 1 · personal
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [origin, setOrigin] = useState<string | null>(null);
  // 2 · quiz
  const [answers, setAnswers] = useState<number[]>(Array(QUIZ.length).fill(3));
  // 3 · vehicle
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState<string | null>(CarCategory.ECONOMY);
  // 4 · NIN
  const [nin, setNin] = useState('');
  // 5 · liveness
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [livenessOk, setLivenessOk] = useState(false);
  // 6 · payout + next of kin
  const [bankAccountNumber, setBankAcc] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccName] = useState('');
  const [nokName, setNokName] = useState('');
  const [nokPhone, setNokPhone] = useState('+234');
  const [nokRelationship, setNokRel] = useState('');

  const setAnswer = (i: number, v: number) =>
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? v : a)));

  const canNext =
    (step === 1 && !!firstName.trim() && !!lastName.trim() && /^\d{4}-\d{2}-\d{2}$/.test(dob) && !!origin) ||
    step === 2 ||
    (step === 3 && !!model.trim() && !!plate.trim()) ||
    (step === 4 && /^[0-9]{11}$/.test(nin)) ||
    (step === 5 && livenessOk) ||
    (step === 6 &&
      !!bankAccountNumber.trim() &&
      !!bankName.trim() &&
      !!bankAccountName.trim() &&
      !!nokName.trim() &&
      nokPhone.length >= 13 &&
      !!nokRelationship.trim());

  const onBack = () => (step > 1 ? setStep(step - 1) : void logout());

  const next = async () => {
    setLoading(true);
    try {
      if (step === 1) {
        await driversApi.setPersonal({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dob.trim(),
          origin: origin ?? '',
        });
        setStep(2);
      } else if (step === 2) {
        await driversApi.setQuiz({ answers });
        setStep(3);
      } else if (step === 3) {
        await driversApi.setVehicle({
          brand: brand.trim() || undefined,
          model: model.trim(),
          year: year ? Number(year) : undefined,
          plateNumber: plate.trim(),
          color: color.trim() || undefined,
          category: (category as CarCategory) ?? CarCategory.ECONOMY,
        });
        setStep(4);
      } else if (step === 4) {
        await driversApi.submitNin({ nin: nin.trim() });
        setStep(5);
      } else if (step === 5) {
        setStep(6);
      } else {
        await driversApi.setDetails({
          bankAccountNumber: bankAccountNumber.trim(),
          bankName: bankName.trim(),
          bankAccountName: bankAccountName.trim(),
          nokName: nokName.trim(),
          nokPhone: nokPhone.trim(),
          nokRelationship: nokRelationship.trim(),
        });
        await driversApi.completeOnboarding();
        router.replace({
          pathname: '/success',
          params: {
            title: 'You’re all set!',
            subtitle: 'Your driver account is ready — go online to start earning.',
            next: 'home',
          },
        });
      }
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const capture = async () => {
    setLoading(true);
    try {
      await cameraRef.current?.takePictureAsync({ quality: 0.4 });
      const sessionRes = await driversApi.livenessSession();
      const result = await driversApi.livenessCheck({ sessionId: sessionRes.sessionId });
      setLivenessOk(result.isLive);
      Alert.alert(
        result.isLive ? 'Liveness passed' : 'Try again',
        result.isLive ? 'You can continue.' : 'Face not detected — make sure you’re well lit.',
      );
    } catch (e) {
      Alert.alert('Liveness failed', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen className="px-5">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScreenHeader title="Driver Onboarding" onBack={onBack} />
        <View className="my-3">
          <StepDots current={step} total={TOTAL} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          {step === 1 && (
            <Section title="Personal Information">
              <InputField label="First name" value={firstName} onChangeText={setFirstName} placeholder="Ada" />
              <InputField label="Last name" value={lastName} onChangeText={setLastName} placeholder="Okafor" />
              <InputField label="Date of birth" value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" />
              <Select label="State of origin" placeholder="Select state" value={origin} options={STATES} onChange={setOrigin} />
            </Section>
          )}

          {step === 2 && (
            <Section title="A quick personality check" subtitle="Helps us match you with the right riders.">
              {QUIZ.map((q, i) => (
                <View key={q} className="mb-6">
                  <Text className="mb-3 font-pmedium text-sm text-white">{q}</Text>
                  <View className="flex-row items-center justify-between">
                    {SCALE.map((n) => {
                      const active = answers[i] === n;
                      return (
                        <Pressable
                          key={n}
                          onPress={() => setAnswer(i, n)}
                          className={`h-11 w-11 items-center justify-center rounded-full border ${
                            active ? 'border-brand bg-brand' : 'border-hairline'
                          }`}
                        >
                          <Text className={`font-pmedium ${active ? 'text-bg' : 'text-muted'}`}>{n}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View className="mt-1 flex-row justify-between">
                    <Text className="font-sans text-[11px] text-subtle">Disagree</Text>
                    <Text className="font-sans text-[11px] text-subtle">Agree</Text>
                  </View>
                </View>
              ))}
            </Section>
          )}

          {step === 3 && (
            <Section title="Vehicle details">
              <InputField label="Brand" value={brand} onChangeText={setBrand} placeholder="Toyota" />
              <InputField label="Model" value={model} onChangeText={setModel} placeholder="Corolla" />
              <InputField label="Year" value={year} onChangeText={setYear} placeholder="2018" keyboardType="number-pad" maxLength={4} />
              <InputField label="Plate number" value={plate} onChangeText={setPlate} placeholder="LAG-123-XY" autoCapitalize="characters" />
              <InputField label="Color" value={color} onChangeText={setColor} placeholder="Silver" />
              <Select label="Class" value={category} options={CATEGORIES} onChange={setCategory} />
            </Section>
          )}

          {step === 4 && (
            <Section title="Identity verification" subtitle="Your NIN keeps riders safe (required to drive).">
              <InputField
                label="National Identification Number (NIN)"
                value={nin}
                onChangeText={setNin}
                placeholder="11-digit NIN"
                keyboardType="number-pad"
                maxLength={11}
              />
            </Section>
          )}

          {step === 5 && (
            <Section title="Liveness check" subtitle="Place your face inside the circle in good light.">
              <View className="mt-2 items-center">
                <View className="h-72 w-72 overflow-hidden rounded-full border-2 border-brand">
                  {permission?.granted ? (
                    <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />
                  ) : (
                    <View className="flex-1 items-center justify-center bg-card px-6">
                      <Text className="text-center font-sans text-sm text-muted">
                        We need camera access to verify it&apos;s really you.
                      </Text>
                    </View>
                  )}
                </View>
                <View className="mt-5 w-full">
                  {permission?.granted ? (
                    <KariButton
                      label={livenessOk ? 'Re-capture' : 'Capture'}
                      onPress={capture}
                      loading={loading}
                    />
                  ) : (
                    <KariButton label="Grant camera access" onPress={() => void requestPermission()} />
                  )}
                  {livenessOk ? (
                    <Text className="mt-3 text-center font-pmedium text-sm text-success">
                      ✓ Liveness verified — tap Next.
                    </Text>
                  ) : null}
                </View>
              </View>
            </Section>
          )}

          {step === 6 && (
            <Section title="Payout & next of kin">
              <InputField label="Bank account number" value={bankAccountNumber} onChangeText={setBankAcc} placeholder="0123456789" keyboardType="number-pad" />
              <InputField label="Bank name" value={bankName} onChangeText={setBankName} placeholder="GTBank" />
              <InputField label="Account name" value={bankAccountName} onChangeText={setBankAccName} placeholder="Ada Okafor" />
              <InputField label="Next of kin name" value={nokName} onChangeText={setNokName} placeholder="Chidi Okafor" />
              <PhoneInput label="Next of kin phone" value={nokPhone} onChangeText={setNokPhone} />
              <InputField label="Relationship" value={nokRelationship} onChangeText={setNokRel} placeholder="Brother" />
            </Section>
          )}
        </ScrollView>

        <View className="flex-row gap-3 pb-8 pt-2">
          <View className="flex-1">
            <KariButton label={step > 1 ? 'Back' : 'Log out'} variant="outline" onPress={onBack} />
          </View>
          <View className="flex-1">
            <KariButton
              label={step === TOTAL ? 'Finish' : 'Next'}
              onPress={next}
              loading={loading}
              disabled={!canNext}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View>
      <Text className="mb-1 font-pbold text-2xl text-white">{title}</Text>
      {subtitle ? <Text className="mb-5 font-sans text-sm text-muted">{subtitle}</Text> : <View className="mb-5" />}
      {children}
    </View>
  );
}
