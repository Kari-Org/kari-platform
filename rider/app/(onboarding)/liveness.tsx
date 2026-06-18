import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { ridersApi } from '@/api/endpoints';
import { BrandMark } from '@/components/BrandMark';
import { KariButton } from '@/components/KariButton';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { errorMessage } from '@/lib/error';

export default function Liveness() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [loading, setLoading] = useState(false);

  const capture = async () => {
    setLoading(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.4 });
      const image = photo?.base64;
      if (!image) throw new Error('Could not capture photo — try again.');
      await ridersApi.liveness({ image });
      router.push('/(onboarding)/preferences');
    } catch (e) {
      Alert.alert('Liveness failed', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onNext = () => {
    if (!permission?.granted) {
      void requestPermission();
      return;
    }
    void capture();
  };

  return (
    <OnboardingScreen className="px-6">
      <View className="mb-8 mt-2 items-center">
        <BrandMark />
      </View>
      <Text className="text-center font-psemibold text-xl text-white">Liveness Verification</Text>

      <View className="mt-8 items-center">
        {/* Vertical oval face frame (Figma ellipse 249×303). */}
        <View
          className="overflow-hidden border-2 border-brand"
          style={{ width: 240, height: 300, borderRadius: 150 }}
        >
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
      </View>

      <Text
        className="mt-8 self-center text-center font-pmedium text-[15px] text-white"
        style={{ width: 328 }}
      >
        Place your face inside the circle above. Make sure your face is well lit. Go into a brighter
        environment for better lighting
      </Text>

      <View className="flex-1" />
      <View className="flex-row gap-2 pb-8">
        <View className="flex-1">
          <KariButton label="Back" variant="outline" onPress={() => router.back()} />
        </View>
        <View className="flex-1">
          <KariButton
            label={permission?.granted ? 'Next' : 'Grant access'}
            onPress={onNext}
            loading={loading}
          />
        </View>
      </View>
    </OnboardingScreen>
  );
}
