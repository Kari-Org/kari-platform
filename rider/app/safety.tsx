import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { safetyApi } from '@/api/endpoints';
import { InputField } from '@/components/InputField';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';
import { useLocationStore } from '@/stores/location.store';
import { colors } from '@/theme/tokens';

export default function SafetyScreen() {
  const qc = useQueryClient();
  const current = useLocationStore((s) => s.current);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [adding, setAdding] = useState(false);
  const [sosing, setSosing] = useState(false);

  const { data: contacts, isLoading } = useQuery({ queryKey: ['contacts'], queryFn: safetyApi.contacts });

  const add = async () => {
    if (!name.trim() || phone.trim().length < 7) return;
    setAdding(true);
    try {
      await safetyApi.addContact({ name: name.trim(), phone: phone.trim(), relationship: relationship.trim() || undefined });
      await qc.invalidateQueries({ queryKey: ['contacts'] });
      setName('');
      setPhone('');
      setRelationship('');
    } catch (e) {
      Alert.alert('Could not add contact', errorMessage(e));
    } finally {
      setAdding(false);
    }
  };

  const remove = (id: string) =>
    Alert.alert('Remove contact?', undefined, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await safetyApi.removeContact(id);
            await qc.invalidateQueries({ queryKey: ['contacts'] });
          } catch (e) {
            Alert.alert('Could not remove', errorMessage(e));
          }
        },
      },
    ]);

  const sendSos = async () => {
    setSosing(true);
    try {
      let loc = current ? { lat: current.lat, lng: current.lng } : null;
      if (!loc) {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status === 'granted') {
          const p = await Location.getCurrentPositionAsync({});
          loc = { lat: p.coords.latitude, lng: p.coords.longitude };
        }
      }
      if (!loc) {
        Alert.alert('Location needed', 'Enable location so we can send your position with the alert.');
        return;
      }
      const ev = await safetyApi.panic(loc);
      Alert.alert('SOS sent', `${ev.contactsAlerted} emergency contact${ev.contactsAlerted === 1 ? '' : 's'} and our safety team were alerted.`);
    } catch (e) {
      Alert.alert('Could not send SOS', errorMessage(e));
    } finally {
      setSosing(false);
    }
  };

  const confirmSos = () =>
    Alert.alert('Send SOS?', 'This alerts your emergency contacts and our safety team with your location.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send SOS', style: 'destructive', onPress: () => void sendSos() },
    ]);

  return (
    <Screen className="px-5">
      <ScreenHeader title="Safety" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* SOS */}
        <Pressable
          onPress={confirmSos}
          disabled={sosing}
          className="mt-4 items-center rounded-card border border-danger bg-danger/10 py-6"
        >
          <Ionicons name="alert-circle" size={40} color={colors.danger} />
          <Text className="mt-2 font-pbold text-lg text-white">{sosing ? 'Sending…' : 'Send SOS'}</Text>
          <Text className="mt-1 font-sans text-xs text-subtle">Alerts your contacts + safety team</Text>
        </Pressable>

        {/* Contacts */}
        <Text className="mb-2 mt-8 font-psemibold text-base text-white">Emergency contacts</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.brand} className="self-start" />
        ) : !contacts || contacts.length === 0 ? (
          <Text className="font-sans text-sm text-subtle">No contacts yet — add someone who should be alerted.</Text>
        ) : (
          <View className="overflow-hidden rounded-card bg-card">
            {contacts.map((c, i) => (
              <View
                key={c.id}
                className={`flex-row items-center px-4 py-3 ${i === contacts.length - 1 ? '' : 'border-b border-hairline'}`}
              >
                <Ionicons name="person-outline" size={20} color={colors.muted} />
                <View className="ml-3 flex-1">
                  <Text className="font-pmedium text-sm text-white">{c.name}</Text>
                  <Text className="font-sans text-xs text-subtle">
                    {c.phone}
                    {c.relationship ? ` · ${c.relationship}` : ''}
                  </Text>
                </View>
                <Pressable onPress={() => remove(c.id)} hitSlop={6}>
                  <Ionicons name="trash-outline" size={18} color={colors.subtle} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Add */}
        <Text className="mb-1 mt-6 font-pmedium text-sm text-muted">Add a contact</Text>
        <InputField label="Name" value={name} onChangeText={setName} placeholder="e.g. Ada Eze" />
        <InputField
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+234…"
        />
        <InputField
          label="Relationship (optional)"
          value={relationship}
          onChangeText={setRelationship}
          placeholder="e.g. Sister"
        />
        <KariButton label="Add contact" variant="outline" onPress={add} loading={adding} disabled={!name.trim() || phone.trim().length < 7} />
      </ScrollView>
    </Screen>
  );
}
