import { useTranslation } from 'react-i18next';

import { isApiError, toErrorCode } from '@/api/errors';

/** Turns a thrown value — or an error code string from a response body — into user-facing text. */
export function useErrorMessage() {
  const { t } = useTranslation('errors');
  return (error: unknown) => t(isApiError(error) ? error.code : toErrorCode(error));
}
