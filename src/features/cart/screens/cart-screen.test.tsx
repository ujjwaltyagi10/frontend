import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react-native';

import { api } from '@/api';
import { useCartDraftStore, useLocationStore, useSessionStore } from '@/stores';

import { CartScreen } from './cart-screen';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn(), back: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

const location = {
  label: 'Home',
  line: 'HSR Layout',
  lat: 12.9,
  lng: 77.6,
  serviceable: true,
  hubId: 'hub_hsr',
  addressId: 'a1',
};

function renderCart() {
  // gcTime Infinity: no garbage-collection timers left running after the test.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return render(
    <QueryClientProvider client={client}>
      <CartScreen />
    </QueryClientProvider>,
  );
}

// A real (mock) session: a fake one gets a 401, which logs out — and logging out empties the cart.
let session: Awaited<ReturnType<typeof api.auth.verifyOtp>>;
beforeAll(async () => {
  const phone = '9123456790';
  await api.auth.sendOtp({ phone, whatsappOptIn: false });
  session = await api.auth.verifyOtp({ phone, otp: '123456' });
});

beforeEach(async () => {
  await useSessionStore.getState().signIn(session, session.user); // the guest test switches it
  useCartDraftStore.getState().clear();
  useLocationStore.setState({ location });
});

describe('CartScreen (against the mock API)', () => {
  it('shows the empty state with no items', async () => {
    await renderCart();
    expect(screen.getByText('Your cart is empty')).toBeTruthy();
  });

  it('asks for a slot, then offers Pay with the server total', async () => {
    useCartDraftStore.getState().addItem('hourly', 30);
    useCartDraftStore.getState().setMode('scheduled');
    await renderCart();
    expect(await screen.findByText('Pick a slot')).toBeTruthy();

    await act(async () => useCartDraftStore.getState().setSlot('2026-10-02T04:00:00.000Z'));
    // ₹25 item + 5% fees (₹1.25) = ₹26.25, priced by the mock server
    expect(await screen.findByText('Pay ₹26.25', {}, { timeout: 3000 })).toBeTruthy();
  });

  it('asks for a flat number before paying when the location is not a saved address', async () => {
    useLocationStore.setState({ location: { ...location, addressId: null } });
    useCartDraftStore.getState().addItem('hourly', 30);
    useCartDraftStore.getState().setSlot('2026-10-02T04:00:00.000Z');
    await renderCart();
    expect(await screen.findByText('Add flat / house no.', {}, { timeout: 3000 })).toBeTruthy();
  });

  it('asks guests to log in', async () => {
    useSessionStore.setState({ status: 'guest', user: null });
    useCartDraftStore.getState().addItem('hourly', 30);
    useCartDraftStore.getState().setSlot('2026-10-02T04:00:00.000Z');
    await renderCart();
    expect(await screen.findByText('Log in to continue', {}, { timeout: 3000 })).toBeTruthy();
  });

  it('blocks paying for a location we do not serve', async () => {
    useLocationStore.setState({
      location: { ...location, addressId: null, lat: 37.33, lng: -122.03, serviceable: false, hubId: null },
    });
    useCartDraftStore.getState().addItem('hourly', 30);
    useCartDraftStore.getState().setSlot('2026-10-02T04:00:00.000Z');
    await renderCart();
    expect(await screen.findByText('Not in your area yet', {}, { timeout: 3000 })).toBeTruthy();
  });

  it('recovers when the saved address no longer exists: drops it and asks for the address again', async () => {
    useLocationStore.setState({ location: { ...location, addressId: 'deleted-elsewhere' } });
    useCartDraftStore.getState().addItem('hourly', 30);
    useCartDraftStore.getState().setSlot('2026-10-02T04:00:00.000Z');
    await renderCart();
    expect(await screen.findByText('Add flat / house no.', {}, { timeout: 4000 })).toBeTruthy();
    expect(useLocationStore.getState().location?.addressId).toBeNull();
  });
});
