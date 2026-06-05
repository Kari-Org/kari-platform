import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { authApi, commsApi } from '@/api/endpoints';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/error';
import { connectSocket, getSocket } from '@/realtime/socket';
import { colors } from '@/theme/tokens';

export default function ChatScreen() {
  const { rideId: rid } = useLocalSearchParams<{ rideId: string }>();
  const rideId = String(rid);
  const qc = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const { data: me } = useQuery({ queryKey: ['auth-me'], queryFn: authApi.me });
  const { data: messages } = useQuery({
    queryKey: ['chat', rideId],
    queryFn: () => commsApi.messages(rideId),
    refetchInterval: 6000,
  });

  // Live delivery: the server emits chat:message to the recipient's user room.
  useEffect(() => {
    const socket = connectSocket();
    const handler = () => void qc.invalidateQueries({ queryKey: ['chat', rideId] });
    socket.on('chat:message', handler);
    return () => {
      getSocket().off('chat:message', handler);
    };
  }, [qc, rideId]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setText('');
    try {
      await commsApi.send(rideId, body);
      await qc.invalidateQueries({ queryKey: ['chat', rideId] });
    } catch (e) {
      setText(body);
      Alert.alert('Could not send', errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen className="px-5">
      <ScreenHeader title="Chat" />
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
                  className={`mb-2 max-w-[80%] rounded-card px-3 py-2 ${
                    mine ? 'self-end bg-brand' : 'self-start bg-card'
                  }`}
                >
                  <Text className={`font-sans text-sm ${mine ? 'text-bg' : 'text-white'}`}>{m.body}</Text>
                </View>
              );
            })
          )}
        </ScrollView>

        <View className="mb-4 flex-row items-end gap-2">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor={colors.subtle}
            multiline
            className="max-h-28 flex-1 rounded-card bg-card px-4 py-3 font-sans text-white"
          />
          <Pressable
            onPress={send}
            disabled={sending || !text.trim()}
            className={`h-11 w-11 items-center justify-center rounded-full ${text.trim() ? 'bg-brand' : 'bg-card'}`}
          >
            <Ionicons name="send" size={18} color={text.trim() ? colors.bg : colors.subtle} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
