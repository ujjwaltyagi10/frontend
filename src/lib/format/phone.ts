import { PHONE_COUNTRY_CODE } from '@/config/constants';

/** "9876543210" → "+91 98765 43210" */
export function formatPhone(phone: string): string {
  return `${PHONE_COUNTRY_CODE} ${phone.slice(0, 5)} ${phone.slice(5)}`;
}

/** Mask a number that isn't the viewer's own: "9876543210" → "98×××××210". */
export function maskPhone(phone: string): string {
  return `${phone.slice(0, 2)}×××××${phone.slice(-3)}`;
}
