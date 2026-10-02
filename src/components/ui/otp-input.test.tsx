import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { OtpInput } from './otp-input';

function Harness({ onComplete }: { onComplete: (code: string) => void }) {
  const [value, setValue] = useState('');
  return <OtpInput value={value} onChangeText={setValue} onComplete={onComplete} />;
}

describe('OtpInput', () => {
  it('keeps digits only and caps at 6', async () => {
    const onChange = jest.fn();
    await render(<OtpInput value="" onChangeText={onChange} />);
    await fireEvent.changeText(screen.getByTestId('otp-input'), '12a3-45678');
    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('auto-submits once when the 6th digit arrives (typing or paste)', async () => {
    const onComplete = jest.fn();
    await render(<Harness onComplete={onComplete} />);
    const input = screen.getByTestId('otp-input');
    await fireEvent.changeText(input, '12345');
    expect(onComplete).not.toHaveBeenCalled();
    await fireEvent.changeText(input, '123456');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('reads as a single labelled field', async () => {
    await render(<OtpInput value="" onChangeText={() => {}} />);
    expect(screen.getByLabelText('One-time password, 6 digits')).toBeTruthy();
  });
});
