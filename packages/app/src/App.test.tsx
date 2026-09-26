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

  it('creates a category inline and groups the action under it', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Add action' }));
    await user.type(screen.getByPlaceholderText('e.g. Watered plants'), 'Watered plants');
    await user.click(screen.getByRole('button', { name: '+ New' }));
    await user.type(screen.getByLabelText('New category name'), 'Household');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    // Category section heading and the tile under it
    expect(await screen.findByText('Household')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Watered plants/ })).toBeInTheDocument();
  });

  it('reassigns an action from the detail view', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Seed a category through the manage sheet
    await user.click(screen.getByRole('button', { name: 'Categories' }));
    await user.type(screen.getByLabelText('New category name'), 'Car');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByText('Car')).toBeInTheDocument();
    // Close the categories sheet
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await user.click(screen.getByRole('button', { name: 'Add action' }));
    await user.type(screen.getByPlaceholderText('e.g. Watered plants'), 'Oil change');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await user.click(screen.getByRole('button', { name: /Oil change/ }));
    await user.click(screen.getByRole('button', { name: 'Car' }));

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Car')).toBeInTheDocument();
  });

  it('lets you pick a colour when creating a category', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Categories' }));
    await user.type(screen.getByLabelText('New category name'), 'Home');
    await user.click(screen.getByRole('button', { name: 'Violet' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const dot = await screen.findByRole('button', { name: 'Colour for Home' });
    expect(dot).toHaveStyle({ backgroundColor: 'rgb(122, 69, 168)' });
  });
});
