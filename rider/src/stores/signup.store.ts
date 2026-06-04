import { create } from 'zustand';
import type { OtpChannel } from '@kari/types';

/**
 * Transient signup draft. The Figma flow collects credentials on the Sign Up
 * screen, then lets the user pick a verification channel BEFORE the OTP is sent,
 * so we defer the actual /auth/signup call until the channel is chosen.
 */
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
