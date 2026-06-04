import { create } from 'zustand';
import type { OtpChannel } from '@kari/types';

/** Transient signup draft — credentials collected before the verification
 *  channel is chosen, so the OTP is sent only after the channel pick. */
interface SignupDraft {
  email: string;
  phone: string;
  password: string;
  channel: OtpChannel | null;
  set: (patch: Partial<Pick<SignupDraft, 'email' | 'phone' | 'password' | 'channel'>>) => void;
  clear: () => void;
}

export const useSignupDraft = create<SignupDraft>((set) => ({
  email: '',
  phone: '',
  password: '',
  channel: null,
  set: (patch) => set(patch),
  clear: () => set({ email: '', phone: '', password: '', channel: null }),
}));
