import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { InputField, KariButton, Screen, ScreenHeader, colors } from '@kari/mobile-core';
import { safetyApi } from '@/api/endpoints';
import type { EmergencyContact } from '@/api/types';
import { errorMessage } from '@/lib/error';

export default function SafetyScreen() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [adding, setAdding] = useState(false);
  const [sos, setSos] = useState(false);

  const { data: contacts, isLoading } = useQuery({ queryKey: ['safety-contacts'], queryFn: safetyApi.contacts });

  const sendSos = () =>
    Alert.alert(
      'Send SOS?',
      'This alerts your emergency contacts with your live location. Use only in a real emergency.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            setSos(true);
            try {
              let lat = 6.5244;
              let lng = 3.3792;
              const perm = await Location.getForegroundPermissionsAsync();
              const granted =
                perm.status === 'granted' ||
                (await Location.requestForegroundPermissionsAsync()).status === 'granted';
              if (granted) {
                const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
              }
              const evt = await safetyApi.panic({ lat, lng });
              Alert.alert(
                'SOS sent',
                evt.contactsAlerted > 0
                  ? `${evt.contactsAlerted} emergency contact${evt.contactsAlerted > 1 ? 's' : ''} alerted with your location.`
                  : 'Help has been notified. Add emergency contacts so they’re alerted too.',
              );
            } catch (e) {
              Alert.alert('Could not send SOS', errorMessage(e));
            } finally {
              setSos(false);
            }
          },
        },
      ],
    );

  const addContact = async () => {
    if (!name.trim() || phone.trim().length < 7) {
      Alert.alert('Add a contact', 'Enter a name and a valid phone number.');
      return;
    }
    setAdding(true);
    try {
      await safetyApi.addContact({
        name: name.trim(),
        phone: phone.trim(),
        relationship: relationship.trim() || undefined,
      });
      await qc.invalidateQueries({ queryKey: ['safety-contacts'] });
      setName('');
      setPhone('');
      setRelationship('');
    } catch (e) {
      Alert.alert('Could not add contact', errorMessage(e));
    } finally {
      setAdding(false);
    }
  };

  const removeContact = (c: EmergencyContact) =>
    Alert.alert('Remove contact?', `${c.name} will no longer be alerted.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await safetyApi.removeContact(c.id);
            await qc.invalidateQueries({ queryKey: ['safety-contacts'] });
          } catch (e) {
            Alert.alert('Could not remove', errorMessage(e));
          }
        },
      },
    ]);

  return (
    <Screen className="px-5">
      <ScreenHeader title="Safety" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* SOS */}
        <Pressable
          onPress={sendSos}
          disabled={sos}
          className="mt-4 items-center rounded-card bg-danger/15 p-6"
        >
          <View className="h-20 w-20 items-center justify-center rounded-full bg-danger">
            {sos ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Ionicons name="warning" size={40} color="#ffffff" />
            )}
          </View>
          <Text className="mt-3 font-pbold text-lg text-white">Emergency SOS</Text>
          <Text className="mt-1 text-center font-sans text-sm text-muted">
            Alerts your contacts with your live location.
          </Text>
        </Pressable>

        {/* Contacts */}
        <Text className="mb-2 mt-8 font-psemibold text-lg text-white">Emergency contacts</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.brand} className="mt-4 self-start" />
        ) : !contacts || contacts.length === 0 ? (
          <Text className="font-sans text-sm text-subtle">No contacts yet — add someone who should be alerted.</Text>
        ) : (
          <View className="overflow-hidden rounded-card bg-card">
            {contacts.map((c, i) => (
              <View
                key={c.id}
                className={`flex-row items-center px-4 py-3.5 ${i === contacts.length - 1 ? '' : 'border-b border-hairline'}`}
              >
                <Ionicons name="person-circle-outline" size={24} color={colors.muted} />
                <View className="ml-3 flex-1">
                  <Text className="font-pmedium text-sm text-white">{c.name}</Text>
                  <Text className="font-sans text-xs text-subtle">
                    {c.phone}
                    {c.relationship ? ` · ${c.relationship}` : ''}
                  </Text>
                </View>
                <Pressable onPress={() => removeContact(c)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Add */}
        <Text className="mb-2 mt-6 font-psemibold text-base text-white">Add a contact</Text>
        <InputField label="Name" value={name} onChangeText={setName} placeholder="e.g. Tunde Bello" />
        <InputField
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="e.g. 08012345678"
        />
        <InputField
          label="Relationship (optional)"
          value={relationship}
          onChangeText={setRelationship}
          placeholder="e.g. Spouse"
        />
        <KariButton label="Add contact" onPress={addContact} loading={adding} />
      </ScrollView>
    </Screen>
  );
}
