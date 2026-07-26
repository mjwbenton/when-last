import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the When Last? heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'When Last?' })).toBeInTheDocument();
  });

  it('adds an action, opens its detail, and logs it', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Add action' }));
    const input = screen.getByPlaceholderText('e.g. Watered plants');
    await user.type(input, 'Watered plants');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    // Tile appears on the grid with a never-logged label
    const tile = await screen.findByRole('button', { name: /Watered plants/ });
    expect(tile).toHaveTextContent('Never logged');

    await user.click(tile);
    expect(screen.getByRole('heading', { name: 'Watered plants' })).toBeInTheDocument();
    expect(screen.getByText('No entries yet.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Log — done now' }));
    // History now has an entry, empty state gone
    expect(screen.queryByText('No entries yet.')).not.toBeInTheDocument();
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });
});
