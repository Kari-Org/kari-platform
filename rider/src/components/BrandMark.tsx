import { Image, Text, View } from 'react-native';

/** The small Kari pin + wordmark shown at the top of auth/onboarding screens. */
export function BrandMark({ size = 40, showWordmark = true }: { size?: number; showWordmark?: boolean }) {
  return (
    <View className="items-center">
      <Image
        source={require('../../assets/logo.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
      {showWordmark ? (
        <Text className="mt-1 font-pbold text-lg text-white">
          Kari<Text className="font-pmedium text-xs text-subtle"> Rider</Text>
        </Text>
      ) : null}
    </View>
  );
}
