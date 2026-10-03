// Who is using the app: nobody yet, a guest, or a verified user. Tokens themselves live in
// secure storage (lib/auth); this store holds only the derived status for routing and UI.
import { create } from 'zustand';

import { queryClient, setAuthFailureHandler, type AuthTokens, type User } from '@/api';
import { tokenStorage } from '@/lib/auth/token-storage';
import { secureStorage } from '@/lib/storage/secure-storage';

import { useCartDraftStore } from './cart-draft-store';
import { useLocationStore } from './location-store';

type Status = 'loading' | 'signedOut' | 'guest' | 'authenticated';

type SessionState = {
  status: Status;
  user: User | null;
  /** A brand-new account just signed in: offer "Have a referral code?" once before moving on. */
  offerReferral: boolean;
  setOfferReferral: (offer: boolean) => void;
  hydrate: () => Promise<void>;
  signIn: (tokens: AuthTokens, user: User, opts?: { isNewUser?: boolean }) => Promise<void>;
  continueAsGuest: (tokens: AuthTokens) => Promise<void>;
  /** After a profile edit: keep the cached user in step with the server. */
  setUser: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
};

const USER_KEY = 'auth.user';

export const useSessionStore = create<SessionState>()((set) => ({
  status: 'loading',
  user: null,
  offerReferral: false,
  setOfferReferral: (offerReferral) => set({ offerReferral }),

  hydrate: async () => {
    const [tokens, rawUser] = await Promise.all([tokenStorage.get(), secureStorage.get(USER_KEY)]);
    if (!tokens) return set({ status: 'signedOut', user: null });
    const user = rawUser ? (JSON.parse(rawUser) as User) : null;
    set({ status: user ? 'authenticated' : 'guest', user });
  },

  signIn: async (tokens, user, opts) => {
    await Promise.all([tokenStorage.set(tokens), secureStorage.set(USER_KEY, JSON.stringify(user))]);
    // Set together, so no screen ever sees "signed in" without knowing whether to ask first.
    set({ status: 'authenticated', user, offerReferral: !!opts?.isNewUser });
  },

  continueAsGuest: async (tokens) => {
    await Promise.all([tokenStorage.set(tokens), secureStorage.remove(USER_KEY)]);
    set({ status: 'guest', user: null });
  },

  setUser: async (user) => {
    await secureStorage.set(USER_KEY, JSON.stringify(user));
    set({ user });
  },

  // Logout clears tokens, the query cache and persisted client state (Frontend Spec → H11) —
  // including the cart and the location, which belong to this user. The next login then goes
  // through fetching the location (A4) again. A guest's cart is kept when they log in.
  signOut: async () => {
    await Promise.all([tokenStorage.clear(), secureStorage.remove(USER_KEY)]);
    queryClient.clear();
    useCartDraftStore.getState().clear();
    useLocationStore.getState().clear();
    set({ status: 'signedOut', user: null, offerReferral: false });
  },
}));

// A failed silent refresh anywhere in the API layer logs the user out.
setAuthFailureHandler(() => void useSessionStore.getState().signOut());
