// Opt-in: runs the app's real API client (fetch transport, headers, idempotency, 204s) against a
// running Go backend in development mode. Skipped unless LIVE_API_URL is set:
//   LIVE_API_URL=http://localhost:8080/v1 npx jest src/api/live-backend.test.ts
const LIVE = process.env.LIVE_API_URL;
const describeLive = LIVE ? describe : describe.skip;

/**
 * The React Native Jest preset replaces global fetch with a stub, so give the app's fetchTransport a
 * minimal real one (method, headers, body → status + text) on Node's http module.
 */
function installNodeFetch() {
  // Just the bit of node:http used here — the app's tsconfig deliberately has no Node types.
  type NodeRes = { statusCode?: number; on(event: string, cb: (chunk: string) => void): void };
  type NodeReq = { on(event: 'error', cb: (e: Error) => void): void; write(body: string): void; end(): void };
  type NodeHttp = { request(url: string, opts: object, cb: (res: NodeRes) => void): NodeReq };
  const http = require('node:http') as NodeHttp;
  globalThis.fetch = ((
    url: string,
    init: { method?: string; headers?: Record<string, string>; body?: string } = {},
  ) =>
    new Promise((resolve, reject) => {
      // Content-Length like a real fetch: Node won't frame a DELETE body without it.
      const headers = {
        ...init.headers,
        ...(init.body ? { 'Content-Length': String(new TextEncoder().encode(init.body).length) } : {}),
      };
      const req = http.request(url, { method: init.method ?? 'GET', headers }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, text: async () => data } as Response));
      });
      req.on('error', reject);
      if (init.body) req.write(init.body);
      req.end();
    })) as typeof fetch;
}

describeLive('live backend contract', () => {
  installNodeFetch();

  // env.ts reads these at import time, so set them before loading the API layer.
  process.env.EXPO_PUBLIC_USE_MOCKS = 'false';
  process.env.EXPO_PUBLIC_API_URL = LIVE ?? '';
  process.env.EXPO_PUBLIC_APP_ENV = 'development';

  const { api, request } = require('./index') as typeof import('./index');
  const { useSessionStore } = require('@/stores') as typeof import('@/stores');
  const { istDateKey } = require('@/lib/format/date') as typeof import('@/lib/format/date');

  const phone = `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;

  it('books and pays a scheduled visit end to end', async () => {
    expect((await api.config.get()).minAppVersion).toBeTruthy();

    await api.auth.sendOtp({ phone, whatsappOptIn: false });
    const r = await api.auth.verifyOtp({ phone, otp: '123456' });
    await useSessionStore.getState().signIn(r, r.user);

    const geo = await api.geo.serviceability(12.9116, 77.6474);
    expect(geo.serviceable).toBe(true);
    const address = await api.addresses.create({
      label: 'Home',
      line1: 'HSR Layout',
      flatNo: 'B-304',
      landmark: null,
      lat: 12.9116,
      lng: 77.6474,
      contactName: 'Live Test',
      contactPhone: phone,
    });

    const day = await api.cart.slots(geo.hubId!, istDateKey(new Date(), 5), 60);
    const slot = day.slots.find((s) => s.available);
    expect(slot).toBeDefined();

    const quote = await api.cart.put({
      mode: 'scheduled',
      items: [{ serviceSlug: 'hourly', durationMin: 60 }],
      addressId: address.id,
      location: null,
      slotStart: slot!.start,
      recurrence: null,
      couponCode: null,
    });
    expect(quote.totalPaise).toBeGreaterThan(0);

    const booking = await api.checkout.createBooking({ quoteId: quote.quoteId }, `live-b-${phone}`);
    const again = await api.checkout.createBooking({ quoteId: quote.quoteId }, `live-b-${phone}`);
    expect(again.id).toBe(booking.id);

    const payment = await api.checkout.createPayment(
      { purpose: 'booking', bookingId: booking.id },
      `live-p-${phone}`,
    );
    expect(payment.amountPaise).toBe(quote.totalPaise);

    // 204 No Content must come back as a resolved request, not a JSON parse error.
    await request({
      method: 'POST',
      path: `/dev/payments/${payment.id}/outcome`,
      body: { outcome: 'success', delayMs: 0 },
    });
    const final = await api.checkout.getPayment(payment.id);
    expect(final.status).toBe('succeeded');
    expect(final.booking?.status).toBe('confirmed');

    const upcoming = await api.bookings.list('upcoming');
    expect(upcoming.items.map((b) => b.id)).toContain(booking.id);
  }, 30_000);

  it('tops up the wallet, claims nothing twice, and buys a Pass', async () => {
    const before = await api.wallet.get();
    expect(before.topup.bonus).toEqual({ minPaise: 25_000, bps: 500 });

    const topup = await api.checkout.createPayment(
      { purpose: 'topup', amountPaise: 50_000 },
      `live-t-${phone}`,
    );
    await request({
      method: 'POST',
      path: `/dev/payments/${topup.id}/outcome`,
      body: { outcome: 'success', delayMs: 0 },
    });
    expect((await api.checkout.getPayment(topup.id)).status).toBe('succeeded');

    const after = await api.wallet.get();
    expect(after.cashBalancePaise - before.cashBalancePaise).toBe(50_000);
    expect(after.promoBalancePaise - before.promoBalancePaise).toBe(2_500);
    const history = await api.wallet.transactions();
    expect(
      history.items
        .slice(0, 2)
        .map((t) => t.kind)
        .sort(),
    ).toEqual(['bonus', 'topup']);

    const offer = await api.pass.offer();
    const mine = await api.pass.mine();
    if (!mine) {
      const pay = await api.checkout.createPayment(
        { purpose: 'pass', offerId: offer.id },
        `live-pass-${phone}`,
      );
      expect(pay.amountPaise).toBe(offer.totalWithTaxPaise);
      await request({
        method: 'POST',
        path: `/dev/payments/${pay.id}/outcome`,
        body: { outcome: 'success', delayMs: 0 },
      });
    }
    expect(await api.pass.mine()).toMatchObject({ status: 'active', visitsTotal: offer.visits });
  }, 30_000);

  it('edits the profile, shows booking detail, and deletes the account', async () => {
    const me = await api.profile.update({ firstName: 'Live', email: 'live@example.com' });
    expect(me).toMatchObject({ firstName: 'Live', email: 'live@example.com', phone });

    const upcoming = await api.bookings.list('upcoming');
    const detail = await api.bookings.detail(upcoming.items[0].id);
    expect(detail.timeline.map((t) => t.status)).toEqual(['pending_payment', 'confirmed']);
    expect(detail.bill.totalPaise).toBe(detail.totalPaise);

    // A confirmed upcoming booking blocks deletion.
    const blocked = await api.profile.remove('123456').catch((e: unknown) => e);
    expect((blocked as { code?: string }).code).toBe('CONFLICT');
  }, 30_000);
});
