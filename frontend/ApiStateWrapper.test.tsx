import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiStateWrapper } from './ApiStateWrapper';

describe('ApiStateWrapper', () => {
  it('shows loading state', () => {
    render(<ApiStateWrapper isLoading>Content</ApiStateWrapper>);
    expect(screen.getByText('Loading data from server...')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<ApiStateWrapper error="Network error">Content</ApiStateWrapper>);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('calls retry callback', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();

    render(<ApiStateWrapper error="Failed" onRetry={retry}>Content</ApiStateWrapper>);
    await user.click(screen.getByRole('button', { name: /Retry Request/i }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('shows empty state', () => {
    render(<ApiStateWrapper isEmpty>Content</ApiStateWrapper>);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders children when there is no loading or error', () => {
    render(<ApiStateWrapper><p>Dashboard content</p></ApiStateWrapper>);
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });
});
