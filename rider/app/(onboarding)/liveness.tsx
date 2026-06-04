import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { ridersApi } from '@/api/endpoints';
import { BrandMark } from '@/components/BrandMark';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
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

  return (
    <Screen className="px-5">
      <ScreenHeader title="Liveness Verification" />
      <View className="mt-4 items-center">
        <BrandMark />
      </View>
      <Text className="mt-6 text-center font-pbold text-2xl text-white">Liveness Verification</Text>
      <Text className="mb-6 mt-2 text-center font-sans text-sm text-muted">
        Place your face inside the circle. Make sure your face is well lit and you&apos;re in a bright
        spot.
      </Text>

      <View className="flex-1 items-center justify-center">
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
      </View>

      <View className="pb-8">
        {permission?.granted ? (
          <KariButton label="Capture" onPress={capture} loading={loading} />
        ) : (
          <KariButton label="Grant camera access" onPress={() => void requestPermission()} />
        )}
        <Text
          onPress={() => router.push('/(onboarding)/preferences')}
          className="mt-4 text-center font-sans text-subtle"
        >
          Skip for now
        </Text>
      </View>
    </Screen>
  );
}
