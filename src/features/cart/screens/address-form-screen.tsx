import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { Button, Card, Chip, Input, PhoneInput, Screen, StickyFooter, Text, toast } from '@/components/ui';
import { useErrorMessage } from '@/lib/i18n';
import { useLocationStore, useSessionStore } from '@/stores';

import { useCreateAddress } from '../hooks/use-addresses';

const LABELS = ['Home', 'Work', 'Other'] as const;

const schema = z.object({
  flatNo: z.string().trim().min(1, 'Enter your flat or house number').max(50),
  landmark: z.string().trim().max(100),
  label: z.enum(LABELS),
  contactName: z.string().trim().min(1, 'Enter a contact name').max(80),
  contactPhone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
});

type FormValues = z.infer<typeof schema>;

/**
 * Address step before Pay (CD-039). Fields from the Frontend Spec; final design is still pending,
 * so the map pin is not here yet — the location comes from the one already chosen.
 */
export function AddressFormScreen() {
  const location = useLocationStore((s) => s.location);
  const user = useSessionStore((s) => s.user);
  const create = useCreateAddress();
  const errorMessage = useErrorMessage();

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      flatNo: '',
      landmark: '',
      label: 'Home',
      contactName: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
      contactPhone: user?.phone ?? '',
    },
  });

  const onSubmit = handleSubmit((v) => {
    if (!location) return;
    create.mutate(
      {
        label: v.label,
        line1: location.line,
        flatNo: v.flatNo,
        landmark: v.landmark || null,
        lat: location.lat,
        lng: location.lng,
        contactName: v.contactName,
        contactPhone: v.contactPhone,
      },
      {
        onSuccess: () => router.back(),
        onError: (e) => toast.error(errorMessage(e)),
      },
    );
  });

  return (
    <Screen
      edges={[]}
      testID="AddressForm"
      footer={
        <StickyFooter>
          <Button
            title="Save and continue"
            size="lg"
            fullWidth
            loading={create.isPending}
            disabled={!formState.isValid && formState.isSubmitted}
            onPress={onSubmit}
          />
        </StickyFooter>
      }>
      <Card tone="muted">
        <Text variant="caption" tone="muted">
          Location
        </Text>
        <Text weight="semibold">{location?.label}</Text>
        <Text variant="caption" tone="muted">
          {location?.line}
        </Text>
        <Button size="sm" variant="ghost" title="Change" onPress={() => router.push('/change-location')} />
      </Card>

      <Controller
        control={control}
        name="flatNo"
        render={({ field, fieldState }) => (
          <Input
            label="Flat / house no., floor, building"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            autoFocus
          />
        )}
      />
      <Controller
        control={control}
        name="landmark"
        render={({ field, fieldState }) => (
          <Input
            label="Landmark (optional)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="label"
        render={({ field }) => (
          <View className="gap-2">
            <Text variant="caption" weight="medium" tone="muted">
              Save as
            </Text>
            <View className="flex-row gap-2">
              {LABELS.map((l) => (
                <Chip key={l} label={l} selected={field.value === l} onPress={() => field.onChange(l)} />
              ))}
            </View>
          </View>
        )}
      />
      <Controller
        control={control}
        name="contactName"
        render={({ field, fieldState }) => (
          <Input
            label="Contact name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            autoComplete="name"
          />
        )}
      />
      <Controller
        control={control}
        name="contactPhone"
        render={({ field, fieldState }) => (
          <PhoneInput
            label="Contact number"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
    </Screen>
  );
}
