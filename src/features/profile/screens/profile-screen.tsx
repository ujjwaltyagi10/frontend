import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAppConfig, type User } from '@/api';
import {
  Banner,
  ConfirmSheet,
  Icon,
  icons,
  ListGroup,
  ListRow,
  Screen,
  Text,
  type IconName,
} from '@/components/ui';
import { useMyPass } from '@/hooks';
import { formatDay, formatPhone } from '@/lib/format';
import { useSessionStore } from '@/stores';
import { colors } from '@/theme';

import { useLogout } from '../hooks/use-logout';
import { useMe } from '../hooks/use-me';

const SHORTCUTS: { label: string; href: Href; icon: IconName }[] = [
  {
    label: 'My Bookings',
    href: '/profile/bookings',
    icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  },
  { label: 'ChoreDash Money', href: '/wallet', icon: icons.wallet },
  { label: 'Help & Support', href: '/support', icon: icons.help },
];

const openPage = (url: string) =>
  void openBrowserAsync(url, { presentationStyle: WebBrowserPresentationStyle.AUTOMATIC });

/** H1–H2 Profile (CD-064): header, Pass, shortcuts, grouped settings, legal pages (H7–H9), logout. */
export function ProfileScreen() {
  const cached = useSessionStore((s) => s.user);
  const me = useMe();
  const user = me.data ?? cached; // cached copy renders instantly; /me refreshes it
  const pass = useMyPass();
  const links = useAppConfig().data?.links;
  const logout = useLogout();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <Screen edges={[]} testID="H1">
      <ProfileHeader user={user} />

      {user &&
        (pass.data ? (
          <Banner
            tone="offer"
            title={`ChoreDash Pass · ${pass.data.visitsTotal - pass.data.visitsUsed} visits left`}
            message={`Valid till ${formatDay(pass.data.expiresAt)}. Applied automatically when you book.`}
            onPress={() => router.push('/pass')}
          />
        ) : (
          <Banner
            tone="offer"
            title="ChoreDash Pass"
            message="Save on your next 3 bookings"
            onPress={() => router.push('/pass')}
          />
        ))}

      <View className="flex-row gap-3">
        {SHORTCUTS.map((s) => (
          <Pressable
            key={s.label}
            accessibilityRole="button"
            accessibilityLabel={s.label}
            onPress={() => router.push(s.href)}
            className="flex-1 items-center gap-2 rounded-card border border-line bg-card px-2 py-4 active:bg-muted">
            <View className="h-10 w-10 items-center justify-center rounded-pill bg-muted">
              <Icon name={s.icon} size={20} />
            </View>
            <Text variant="caption" weight="medium" className="text-center" numberOfLines={2}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ListGroup title="Account">
        <ListRow
          title="Saved addresses"
          icon={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
          onPress={() => router.push('/profile/addresses')}
        />
        <ListRow
          title="Refer & earn"
          subtitle="Your friend gets ₹50 off"
          icon={icons.gift}
          onPress={() => router.push('/referral')}
        />
      </ListGroup>

      {links && (
        <ListGroup title="About">
          <ListRow title="About us" icon={icons.info} onPress={() => openPage(links.about)} />
          <ListRow
            title="Terms of service"
            icon={{ ios: 'doc.text', android: 'description', web: 'description' }}
            onPress={() => openPage(links.terms)}
          />
          <ListRow
            title="Privacy policy"
            icon={{ ios: 'lock.shield', android: 'shield', web: 'shield' }}
            onPress={() => openPage(links.privacy)}
          />
        </ListGroup>
      )}

      {user && (
        <ListGroup>
          <ListRow
            title="Log out"
            icon={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
            showChevron={false}
            onPress={() => setConfirmLogout(true)}
          />
          <ListRow
            title="Delete account"
            icon={{ ios: 'trash', android: 'delete', web: 'delete' }}
            destructive
            onPress={() => router.push('/profile/delete-account')}
          />
        </ListGroup>
      )}

      {__DEV__ && (
        <ListGroup title="Developer">
          <ListRow
            title="Component gallery"
            icon={{ ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' }}
            onPress={() => router.push('/dev-gallery')}
          />
        </ListGroup>
      )}

      <Text variant="micro" tone="muted" className="pb-4 text-center">
        ChoreDash v{Constants.expoConfig?.version}
      </Text>

      <ConfirmSheet
        visible={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Log out?"
        message="You'll need your phone number and an OTP to log back in."
        cancelTitle="Cancel"
        confirmTitle="Log out"
        destructive
        loading={logout.isPending}
        onConfirm={() => logout.mutate()}
      />
    </Screen>
  );
}

function initials(user: User) {
  const letters = [user.firstName, user.lastName].filter(Boolean).map((n) => n![0]);
  return (letters.join('') || user.phone.slice(-2)).toUpperCase();
}

/** Cyan header card: avatar, name and phone; tapping edits the profile (or logs a guest in). */
function ProfileHeader({ user }: { user: User | null }) {
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : '';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={user ? `${name || 'Your profile'}. Edit profile` : 'Log in or sign up'}
      onPress={() => router.push(user ? '/profile/edit' : '/login-modal')}
      className="flex-row items-center gap-4 rounded-hero bg-primary p-4 active:opacity-90">
      <View className="h-14 w-14 items-center justify-center rounded-pill bg-card">
        {user ? (
          <Text variant="h3" tone="accent">
            {initials(user)}
          </Text>
        ) : (
          <Icon name={icons.profile} size={26} color={colors.brand.primaryStrong} />
        )}
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="h2" tone="onPrimary" numberOfLines={1}>
          {user ? name || 'Add your name' : 'Guest'}
        </Text>
        <Text variant="caption" tone="onPrimaryMuted">
          {user ? formatPhone(user.phone) : 'Log in to book, pay and see your bookings'}
        </Text>
      </View>
      <Icon name={icons.chevronRight} size={14} color={colors.brand.onPrimary} />
    </Pressable>
  );
}
