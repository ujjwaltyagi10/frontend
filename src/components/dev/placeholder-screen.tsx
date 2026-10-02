import { Link, type Href } from 'expo-router';
import { View } from 'react-native';

import { Screen, Text } from '@/components/ui';

type Props = {
  /** Screen ID(s) from the Screen Flow doc, e.g. "C1–C7". */
  id: string;
  title: string;
  ticket?: string;
  links?: { label: string; href: Href }[];
};

/** Temporary body for screens not built yet. Delete each use as its ticket lands. */
export function PlaceholderScreen({ id, title, ticket, links = [] }: Props) {
  return (
    <Screen testID={id}>
      <View className="gap-1 rounded-card border border-line bg-card p-4">
        <Text variant="micro" tone="muted">
          {id}
          {ticket ? ` · ${ticket}` : ''}
        </Text>
        <Text variant="h2">{title}</Text>
        <Text tone="muted">Not built yet.</Text>
      </View>
      {links.map((l) => (
        <Link key={l.label} href={l.href} className="py-2 text-body text-info">
          {l.label} →
        </Link>
      ))}
    </Screen>
  );
}
