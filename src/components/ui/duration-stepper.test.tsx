import { fireEvent, render, screen } from '@testing-library/react-native';

import { DurationStepper } from './duration-stepper';

describe('DurationStepper', () => {
  it('steps in 30 minutes', async () => {
    const onChange = jest.fn();
    await render(<DurationStepper value={60} onChange={onChange} />);
    await fireEvent.press(screen.getByLabelText('Increase duration'));
    expect(onChange).toHaveBeenLastCalledWith(90);
    await fireEvent.press(screen.getByLabelText('Decrease duration'));
    expect(onChange).toHaveBeenLastCalledWith(30);
  });

  it('disables − at the minimum and + at the maximum', async () => {
    const onChange = jest.fn();
    const { rerender } = await render(<DurationStepper value={30} onChange={onChange} max={60} />);
    await fireEvent.press(screen.getByLabelText('Decrease duration'));
    expect(onChange).not.toHaveBeenCalled();
    await rerender(<DurationStepper value={60} onChange={onChange} max={60} />);
    await fireEvent.press(screen.getByLabelText('Increase duration'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the formatted duration', async () => {
    await render(<DurationStepper value={90} onChange={() => {}} />);
    expect(screen.getByText('1.5 hr')).toBeTruthy();
  });
});
