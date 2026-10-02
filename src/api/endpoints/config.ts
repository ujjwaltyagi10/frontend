import { request } from '../client';
import type { AppConfig } from '../types';

export const configApi = {
  get: () => request<AppConfig>({ method: 'GET', path: '/config', auth: false }),
};
