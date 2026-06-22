import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { authApi, commsApi, ridesApi } from '@/api/endpoints';
import { Screen } from '@/components/Screen';
import { errorMessage } from '@/lib/error';
import { connectSocket, getSocket } from '@/realtime/socket';
import { colors } from '@/theme/tokens';

const QUICK_REPLIES = ['Tell me when you get here', 'How far are you?'];

export default function ChatScreen() {
  const { rideId: rid } = useLocalSearchParams<{ rideId: string }>();
  const rideId = String(rid);
  const router = useRouter();
  const qc = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const { data: me } = useQuery({ queryKey: ['auth-me'], queryFn: authApi.me });
  const { data: ride } = useQuery({ queryKey: ['ride', rideId], queryFn: () => ridesApi.get(rideId) });
  const { data: messages } = useQuery({
    queryKey: ['chat', rideId],
    queryFn: () => commsApi.messages(rideId),
    refetchInterval: 6000,
  });
  const driverName = ride?.driver?.name ?? 'Driver';

  // Live delivery: the server emits chat:message to the recipient's user room.
  useEffect(() => {
    const socket = connectSocket();
    const handler = () => void qc.invalidateQueries({ queryKey: ['chat', rideId] });
    socket.on('chat:message', handler);
    return () => {
      getSocket().off('chat:message', handler);
    };
  }, [qc, rideId]);

  const send = async (override?: string) => {
    const body = (override ?? text).trim();
    if (!body) return;
    setSending(true);
    if (!override) setText('');
    try {
      await commsApi.send(rideId, body);
      await qc.invalidateQueries({ queryKey: ['chat', rideId] });
    } catch (e) {
      if (!override) setText(body);
      Alert.alert('Could not send', errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const sharePlaylist = () => {
    setText('🎵 My playlist: ');
    inputRef.current?.focus();
  };

  const call = async () => {
    try {
      const c = await commsApi.call(rideId);
      Alert.alert('Connecting call', `Dial ${c.proxyNumber} to reach your driver — both numbers stay private.`, [
        { text: 'Close', style: 'cancel' },
        { text: 'Call', onPress: () => void Linking.openURL(`tel:${c.proxyNumber}`) },
      ]);
    } catch (e) {
      Alert.alert('Could not start call', errorMessage(e));
    }
  };

  return (
    <Screen className="px-5">
      {/* Header */}
      <View className="flex-row items-center pb-3 pt-1">
        <Pressable onPress={() => router.back()} hitSlop={8} className="mr-1 -ml-1 p-1">
          <Ionicons name="chevron-back" size={24} color={colors.brand} />
        </Pressable>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-card">
          <Ionicons name="person" size={18} color={colors.brand} />
        </View>
        <Text numberOfLines={1} className="ml-2.5 flex-1 font-psemibold text-base text-white">
          {driverName}
        </Text>
        <Pressable onPress={call} hitSlop={8}>
          <Ionicons name="call" size={22} color={colors.brand} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 12 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {!messages || messages.length === 0 ? (
            <Text className="mt-8 text-center font-sans text-sm text-subtle">
              Say hello to your driver 👋
            </Text>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === me?.id;
              return (
                <View
                  key={m.id}
                  className={`mb-2 max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    mine ? 'self-end bg-[#E6E6E6]' : 'self-start bg-brand'
                  }`}
                >
                  <Text className="font-sans text-sm text-black">{m.body}</Text>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Quick replies + playlist */}
        <View className="mb-2 flex-row flex-wrap gap-2">
          {QUICK_REPLIES.map((q) => (
            <Pressable
              key={q}
              onPress={() => void send(q)}
              disabled={sending}
              className="rounded-pill bg-brand px-3.5 py-1.5"
            >
              <Text className="font-pmedium text-xs text-black">{q}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={sharePlaylist}
            className="flex-row items-center rounded-pill border border-hairline bg-card px-3.5 py-1.5"
          >
            <Ionicons name="musical-notes" size={12} color={colors.brand} />
            <Text className="ml-1 font-pmedium text-xs text-white">Playlist</Text>
          </Pressable>
        </View>

        {/* Input pill */}
        <View className="mb-4 flex-row items-center rounded-pill bg-card pl-4 pr-2 py-1">
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor={colors.subtle}
            multiline
            className="max-h-24 flex-1 py-2.5 font-sans text-white"
          />
          <Pressable
            onPress={() => void send()}
            disabled={sending || !text.trim()}
            className="h-9 w-9 items-center justify-center rounded-full"
          >
            <Ionicons name="send" size={20} color={text.trim() ? colors.brand : colors.subtle} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
