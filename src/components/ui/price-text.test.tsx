import { render, screen } from '@testing-library/react-native';

import { PriceText } from './price-text';

describe('PriceText', () => {
  it('shows price, struck MRP and saving', async () => {
    await render(<PriceText price={2500} mrp={12500} showSaving />);
    expect(screen.getByText('₹25')).toBeTruthy();
    expect(screen.getByText('₹125')).toBeTruthy();
    expect(screen.getByText('Save ₹100')).toBeTruthy();
  });

  it('hides MRP when it is missing or not higher than the price', async () => {
    await render(<PriceText price={19900} mrp={null} showSaving />);
    expect(screen.getByText('₹199')).toBeTruthy();
    expect(screen.queryByText(/Save/)).toBeNull();
  });
});
