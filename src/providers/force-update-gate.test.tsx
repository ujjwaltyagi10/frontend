import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ForceUpdateGate } from './force-update-gate';

const mockConfig = { data: undefined as undefined | { minAppVersion: string; links: object } };
jest.mock('@/api', () => ({ useAppConfig: () => mockConfig }));
jest.mock('expo-constants', () => ({ expoConfig: { version: '1.0.0' } }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));

const links = { appStore: null, playStore: 'https://play.google.com/store/apps/details?id=x' };

const app = (
  <ForceUpdateGate>
    <Text>the app</Text>
  </ForceUpdateGate>
);

describe('ForceUpdateGate', () => {
  it('never blocks startup while config is unknown', async () => {
    mockConfig.data = undefined;
    await render(app);
    expect(screen.getByText('the app')).toBeTruthy();
  });

  it('lets a supported version through', async () => {
    mockConfig.data = { minAppVersion: '1.0.0', links };
    await render(app);
    expect(screen.getByText('the app')).toBeTruthy();
  });

  it('blocks a version below the minimum', async () => {
    mockConfig.data = { minAppVersion: '1.2.0', links };
    await render(app);
    expect(screen.queryByText('the app')).toBeNull();
    expect(screen.getByText('Update ChoreDash')).toBeTruthy();
  });
});
