import { Redirect, useLocalSearchParams } from 'expo-router';

import { request } from '@/api';
import { env } from '@/config/env';
import { useCartDraftStore, useLocationStore, useSessionStore } from '@/stores';
import { useState } from 'react';
import { View } from 'react-native';

import {
  Badge,
  Banner,
  Button,
  Card,
  Chip,
  ConfirmSheet,
  DurationStepper,
  EmptyState,
  Icon,
  IconButton,
  icons,
  Input,
  ListGroup,
  ListRow,
  OtpInput,
  PhoneInput,
  PriceText,
  Screen,
  SegmentedTabs,
  Skeleton,
  SkeletonText,
  Text,
  toast,
} from '@/components/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text variant="micro" tone="muted">
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

/** Every design-system component in one scroll. Development builds only. */
export function GalleryScreen() {
  const [mode, setMode] = useState<'instant' | 'scheduled' | 'recurring'>('instant');
  const [minutes, setMinutes] = useState(60);
  const [day, setDay] = useState('Today');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  // `/dev-gallery?open=sheet` (or any `sheet…` value — a new value reopens it) opens the sheet on
  // arrival, so it can be checked on a simulator without tapping.
  const { open } = useLocalSearchParams<{ open?: string }>();
  const [sheetOpen, setSheet] = useState(false);
  const [dismissedFor, setDismissedFor] = useState<string | undefined>();
  const sheet = sheetOpen || (!!open?.startsWith('sheet') && dismissedFor !== open);

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen>
      {env.useMocks && (
        <Section title="Mock backend">
          <Text variant="caption" tone="muted">
            Mock data (bookings, wallet, Pass, addresses, your profile) is saved on this device. Reset wipes
            it, logs you out and forgets the location, so the app starts like a fresh install.
          </Text>
          <Button
            title="Reset mock data"
            variant="destructive"
            onPress={async () => {
              await request({ method: 'POST', path: '/dev/mock/reset' });
              useCartDraftStore.getState().clear();
              useLocationStore.getState().clear();
              await useSessionStore.getState().signOut();
            }}
          />
        </Section>
      )}
      <Section title="Text">
        <Text variant="display">Display 32</Text>
        <Text variant="h1">Heading 1 · 24</Text>
        <Text variant="h2">Heading 2 · 20</Text>
        <Text variant="h3">Heading 3 · 17</Text>
        <Text>Body 15 — Get professional house help in minutes.</Text>
        <Text variant="caption" tone="muted">
          Caption 13 muted
        </Text>
        <Text variant="micro">MICRO 11</Text>
      </Section>
      <Section title="Buttons">
        <Button title="Primary" fullWidth />
        <Button title="Secondary" variant="secondary" fullWidth />
        <Button title="Dark" variant="dark" fullWidth />
        <Button title="Destructive" variant="destructive" fullWidth />
        <View className="flex-row flex-wrap gap-2">
          <Button title="Small" size="sm" />
          <Button title="Loading" loading />
          <Button title="Disabled" disabled />
          <Button title="Ghost" variant="ghost" />
        </View>
        <View className="flex-row gap-2">
          <IconButton icon={icons.wallet} accessibilityLabel="Wallet" variant="filled" />
          <IconButton icon={icons.gift} accessibilityLabel="Gift" variant="filled" />
          <IconButton icon={icons.share} accessibilityLabel="Share" variant="filled" />
        </View>
      </Section>
      <Section title="Prices and badges">
        <PriceText price={2500} mrp={12500} showSaving size="lg" />
        <PriceText price={19900} />
        <View className="flex-row gap-2">
          <Badge label="NEW" />
          <Badge label="Confirmed" tone="success" />
          <Badge label="Pending" tone="neutral" />
          <Badge label="+₹25" tone="dark" />
        </View>
      </Section>
      <Section title="Selection">
        <SegmentedTabs
          options={[
            { value: 'instant', label: 'Instant' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'recurring', label: 'Recurring' },
          ]}
          value={mode}
          onChange={setMode}
        />
        <View className="flex-row flex-wrap gap-2">
          {['Today', 'Tomorrow', 'Thu', 'Fri'].map((d) => (
            <Chip key={d} label={d} selected={day === d} onPress={() => setDay(d)} />
          ))}
          <Chip label="₹500" sublabel="+₹25" />
          <Chip label="9:00 AM" disabled />
        </View>
        <DurationStepper value={minutes} onChange={setMinutes} />
      </Section>
      <Section title="Inputs">
        <PhoneInput label="Mobile number" value={phone} onChangeText={setPhone} />
        <Input label="Flat / house no." placeholder="B-304" hint="Needed before you pay" />
        <Input label="Email" value="not-an-email" error="Enter a valid email" />
        <OtpInput value={otp} onChangeText={setOtp} />
        <OtpInput value="123" onChangeText={() => {}} error />
      </Section>
      <Section title="Surfaces">
        <Card>
          <Text weight="semibold">Default card</Text>
          <Text tone="muted">Flat with a 1px border.</Text>
        </Card>
        <Card tone="tint" onPress={() => toast.error('Card pressed')}>
          <Text weight="semibold">Tappable tint card</Text>
        </Card>
        <Banner tone="warning" title="No instant slots right now" message="Please schedule the order." />
        <Banner
          tone="offer"
          title="ChoreDash Pass"
          message="Save on your next 3 bookings"
          onPress={() => {}}
        />
        <Banner title="Your Pro arrives within 30 minutes of the slot" />
      </Section>
      <Section title="Rows">
        <ListGroup title="Group">
          <ListRow title="Saved addresses" icon={icons.location} onPress={() => {}} />
          <ListRow title="Help & Support" subtitle="Chat with us" icon={icons.help} onPress={() => {}} />
          <ListRow title="Delete account" destructive onPress={() => {}} />
        </ListGroup>
      </Section>
      <Section title="Loading and empty">
        <Skeleton height={72} rounded="card" />
        <SkeletonText />
        <EmptyState
          title="No bookings found"
          message="Your bookings will show here."
          actionTitle="Book a service"
          onAction={() => {}}
        />
      </Section>
      <Section title="Feedback">
        <View className="flex-row gap-2">
          <Button
            title="Success toast"
            size="sm"
            variant="secondary"
            onPress={() => toast.error('Something went wrong')}
          />
          <Button
            title="Error toast"
            size="sm"
            variant="secondary"
            onPress={() => toast.error('Coupon is not valid')}
          />
          <Button title="Sheet" size="sm" variant="secondary" onPress={() => setSheet(true)} />
        </View>
        <View className="flex-row items-center gap-2">
          <Icon name={icons.star} />
          <Icon name={icons.check} />
          <Icon name={icons.warning} />
        </View>
      </Section>
      <ConfirmSheet
        visible={sheet}
        onClose={() => {
          setSheet(false);
          setDismissedFor(open);
        }}
        title="Are you sure you want to exit?"
        message="Your payment hasn't finished."
        cancelTitle="Stay"
        confirmTitle="Yes, exit"
        onConfirm={() => {
          setSheet(false);
          setDismissedFor(open);
        }}
      />
    </Screen>
  );
}
