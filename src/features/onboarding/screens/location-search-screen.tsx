import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';

import { api, queryKeys } from '@/api';
import { Card, Icon, icons, Input, Screen, Text } from '@/components/ui';
import { LOCATION_SEARCH_DEBOUNCE_MS, LOCATION_SEARCH_MIN_CHARS } from '@/config/constants';
import { useTranslation } from '@/lib/i18n';

import { useResolveLocation } from '../hooks/use-resolve-location';

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

/** A5 / A6 — search a locality. (Saved addresses for logged-in users: CD-020.) */
export function LocationSearchScreen() {
  const { t } = useTranslation('onboarding');
  const [q, setQ] = useState('');
  const term = useDebounced(q.trim(), LOCATION_SEARCH_DEBOUNCE_MS);
  const results = useQuery({
    queryKey: queryKeys.geoSearch(term),
    queryFn: () => api.geo.search(term),
    enabled: term.length >= LOCATION_SEARCH_MIN_CHARS,
  });
  const resolve = useResolveLocation();

  return (
    <Screen testID="A5">
      <Input
        autoFocus
        value={q}
        onChangeText={setQ}
        placeholder="Search for locality, sector or area"
        returnKeyType="search"
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace('/locating')}
        className="min-h-11 flex-row items-center gap-2 active:opacity-60">
        <Icon name={icons.location} />
        <Text weight="semibold">{t('location.useCurrent')}</Text>
      </Pressable>
      {results.data?.map((p) => (
        <Card
          key={p.id}
          accessibilityLabel={`${p.title}, ${p.line}`}
          onPress={
            resolve.isPending ? undefined : () => resolve.mutate({ lat: p.lat, lng: p.lng, method: 'search' })
          }>
          <Text weight="semibold">{p.title}</Text>
          <Text variant="caption" tone="muted">
            {p.line}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
