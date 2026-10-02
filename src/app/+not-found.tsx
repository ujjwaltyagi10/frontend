import { Link, Stack } from 'expo-router';

import { Screen, Text } from '@/components/ui';

export default function NotFound() {
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: true, title: 'Not found' }} />
      <Text variant="h2">This page doesn&apos;t exist.</Text>
      <Link href="/" className="text-body text-info">
        Go to Home
      </Link>
    </Screen>
  );
}
