import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Button,
  Input,
  PhoneInput,
  Screen,
  SkeletonText,
  StateView,
  StickyFooter,
  Text,
  toast,
} from '@/components/ui';
import { useErrorMessage } from '@/lib/i18n';

import { useMe, useUpdateMe } from '../hooks/use-me';

const schema = z.object({
  firstName: z.string().trim().max(50, 'At most 50 characters'),
  lastName: z.string().trim().max(50, 'At most 50 characters'),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email address')]),
});
type FormValues = z.infer<typeof schema>;

/** H3 Profile details (CD-064): name and email; the mobile number can't be changed here. */
export function EditProfileScreen() {
  const me = useMe();
  if (me.isPending)
    return (
      <Screen edges={[]}>
        <SkeletonText lines={6} />
      </Screen>
    );
  if (me.isError) return <StateView state="error" error={me.error} onRetry={me.refetch} />;
  return (
    <Form
      phone={me.data.phone}
      defaults={{
        firstName: me.data.firstName ?? '',
        lastName: me.data.lastName ?? '',
        email: me.data.email ?? '',
      }}
    />
  );
}

function Form({ phone, defaults }: { phone: string; defaults: FormValues }) {
  const update = useUpdateMe();
  const errorMessage = useErrorMessage();
  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: defaults,
  });

  const save = handleSubmit((v) =>
    update.mutate(
      { firstName: v.firstName.trim(), lastName: v.lastName.trim(), email: v.email.trim() },
      {
        onSuccess: () => router.back(),
        onError: (e) => toast.error(errorMessage(e)),
      },
    ),
  );

  const field = (name: keyof FormValues, label: string, extra: object = {}) => (
    <Controller
      control={control}
      name={name}
      render={({ field: f, fieldState }) => (
        <Input
          label={label}
          value={f.value}
          onChangeText={f.onChange}
          onBlur={f.onBlur}
          error={fieldState.error?.message}
          {...extra}
        />
      )}
    />
  );

  return (
    <Screen
      edges={[]}
      testID="H3"
      footer={
        <StickyFooter>
          <Button
            title="Update profile"
            size="lg"
            fullWidth
            loading={update.isPending}
            disabled={!formState.isDirty}
            onPress={save}
          />
        </StickyFooter>
      }>
      {field('firstName', 'First name', { autoComplete: 'given-name', textContentType: 'givenName' })}
      {field('lastName', 'Last name', { autoComplete: 'family-name', textContentType: 'familyName' })}
      {field('email', 'Email', {
        autoComplete: 'email',
        keyboardType: 'email-address',
        autoCapitalize: 'none',
        textContentType: 'emailAddress',
      })}
      <PhoneInput label="Mobile number" value={phone} onChangeText={() => {}} editable={false} />
      <Text variant="caption" tone="muted">
        Your mobile number is how you log in, so it can&apos;t be changed here.
      </Text>
    </Screen>
  );
}
