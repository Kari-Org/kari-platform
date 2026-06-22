import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { colors } from '@/theme/tokens';

export type LatLng = { lat: number; lng: number };

const LAGOS = { latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.06, longitudeDelta: 0.06 };

// Dark map theme (Google/Android via customMapStyle; iOS uses userInterfaceStyle).
const DARK_MAP = [
  { elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8f8f8f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0e0e0e' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2b2b2b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#46422a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#3a371f' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#060606' }] },
];

interface Props {
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  driver?: LatLng | null;
  showsUserLocation?: boolean;
  /** Extra bottom inset (e.g. a sheet height) so fitted routes aren't hidden. */
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
}

/** Full-bleed dark map with pickup / dropoff / driver markers + a route line.
 *  Reused across booking and the active-ride states. */
export function RideMap({
  pickup,
  dropoff,
  driver,
  showsUserLocation = true,
  bottomInset = 320,
  style,
}: Props) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const pts = [pickup, dropoff, driver].filter(Boolean) as LatLng[];
    if (pts.length === 0) return;
    if (pts.length === 1) {
      mapRef.current?.animateToRegion(
        { latitude: pts[0].lat, longitude: pts[0].lng, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        600,
      );
    } else {
      mapRef.current?.fitToCoordinates(
        pts.map((p) => ({ latitude: p.lat, longitude: p.lng })),
        { edgePadding: { top: 90, right: 70, bottom: bottomInset, left: 70 }, animated: true },
      );
    }
  }, [pickup, dropoff, driver, bottomInset]);

  return (
    <View style={[{ flex: 1 }, style]}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={LAGOS}
        customMapStyle={DARK_MAP}
        userInterfaceStyle="dark"
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {pickup ? (
          <Marker
            coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View className="h-4 w-4 items-center justify-center rounded-full bg-brand">
              <View className="h-1.5 w-1.5 rounded-full bg-bg" />
            </View>
          </Marker>
        ) : null}
        {dropoff ? (
          <Marker
            coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <Ionicons name="location" size={30} color={colors.danger} />
          </Marker>
        ) : null}
        {driver ? (
          <Marker
            coordinate={{ latitude: driver.lat, longitude: driver.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View className="rounded-full bg-brand p-1.5">
              <Ionicons name="car" size={16} color={colors.bg} />
            </View>
          </Marker>
        ) : null}
        {pickup && dropoff ? (
          <Polyline
            coordinates={[
              { latitude: pickup.lat, longitude: pickup.lng },
              { latitude: dropoff.lat, longitude: dropoff.lng },
            ]}
            strokeColor={colors.brand}
            strokeWidth={3}
          />
        ) : null}
      </MapView>
    </View>
  );
}
