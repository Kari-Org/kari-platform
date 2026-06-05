import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ticketsApi } from '@/api/endpoints';
import type { SupportTicket } from '@/api/types';
import { KariButton } from '@/components/KariButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { errorMessage } from '@/lib/error';
import { colors } from '@/theme/tokens';

const CATEGORIES = ['GENERAL', 'PAYMENT', 'RIDE', 'ACCOUNT', 'SAFETY'] as const;
const STATUS_COLOR: Record<string, string> = {
  OPEN: colors.brand,
  IN_PROGRESS: colors.brand,
  RESOLVED: colors.success,
  CLOSED: colors.subtle,
};
const label = (c: string) => c[0] + c.slice(1).toLowerCase();

export default function SupportScreen() {
  const qc = useQueryClient();
  const [category, setCategory] = useState<string>('GENERAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const { data: tickets } = useQuery({ queryKey: ['my-tickets'], queryFn: ticketsApi.mine });
  const submit = useMutation({
    mutationFn: () => ticketsApi.create({ subject: subject.trim(), message: message.trim(), category }),
    onSuccess: () => {
      setSubject('');
      setMessage('');
      setCategory('GENERAL');
      void qc.invalidateQueries({ queryKey: ['my-tickets'] });
      Alert.alert('Submitted', 'Our support team will get back to you shortly.');
    },
    onError: (e) => Alert.alert('Could not submit', errorMessage(e)),
  });

  const canSubmit = subject.trim().length >= 3 && message.trim().length >= 5;

  return (
    <Screen className="px-5">
      <ScreenHeader title="Help & support" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mb-2 mt-2 font-psemibold text-base text-white">Submit a request</Text>
        <View className="mb-3 flex-row flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                className={`rounded-pill border px-3 py-1.5 ${active ? 'border-brand bg-brand' : 'border-hairline'}`}
              >
                <Text className={`font-pmedium text-xs ${active ? 'text-bg' : 'text-muted'}`}>{label(c)}</Text>
              </Pressable>
            );
          })}
        </View>
        <InputField label="Subject" value={subject} onChangeText={setSubject} placeholder="Brief summary" />
        <Text className="mb-1 font-sans text-sm text-muted">Message</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Tell us what happened…"
          placeholderTextColor={colors.subtle}
          multiline
          textAlignVertical="top"
          className="mb-3 min-h-[100px] rounded-card bg-card px-4 py-3 font-sans text-white"
        />
        <KariButton label="Submit request" onPress={() => submit.mutate()} loading={submit.isPending} disabled={!canSubmit} />

        <Text className="mb-2 mt-8 font-psemibold text-base text-white">Your requests</Text>
        {!tickets || tickets.length === 0 ? (
          <Text className="font-sans text-sm text-subtle">No requests yet.</Text>
        ) : (
          tickets.map((t) => <TicketCard key={t.id} ticket={t} />)
        )}
      </ScrollView>
    </Screen>
  );
}

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  return (
    <View className="mb-2 rounded-card bg-card p-4">
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 font-psemibold text-sm text-white" numberOfLines={1}>
          {ticket.subject}
        </Text>
        <View className="ml-2 flex-row items-center">
          <View
            className="mr-1.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: STATUS_COLOR[ticket.status] ?? colors.subtle }}
          />
          <Text className="font-pmedium text-xs text-muted">{ticket.status.replace(/_/g, ' ')}</Text>
        </View>
      </View>
      <Text className="mt-1 font-sans text-xs text-muted" numberOfLines={3}>
        {ticket.message}
      </Text>
      {ticket.adminReply ? (
        <View className="mt-2 rounded-md bg-surface p-2">
          <Text className="font-sans text-[10px] text-subtle">SUPPORT REPLIED</Text>
          <Text className="mt-0.5 font-sans text-xs text-white">{ticket.adminReply}</Text>
        </View>
      ) : null}
    </View>
  );
}
