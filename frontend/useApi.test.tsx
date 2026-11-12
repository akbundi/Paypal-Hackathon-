import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi } from './useApi';

describe('useApi hook', () => {
  it('starts with initial data and no loading', () => {
    const { result } = renderHook(() => useApi(async () => 'success'));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('stores data after successful API call', async () => {
    const apiFn = vi.fn().mockResolvedValue('API success');
    const { result } = renderHook(() => useApi(apiFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBe('API success');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles API errors', async () => {
    const apiFn = vi.fn().mockRejectedValue(new Error('Network failed'));
    const { result } = renderHook(() => useApi(apiFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.errorMessage).toBe('Network failed');
    expect(result.current.data).toBeNull();
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useApi(async () => 'Done', { onSuccess })
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(onSuccess).toHaveBeenCalledWith('Done');
  });

  it('resets hook state', async () => {
    const { result } = renderHook(() =>
      useApi(async () => 'Done', { initialData: 'Initial' })
    );

    await act(async () => {
      await result.current.execute();
    });

    act(() => result.current.reset());

    expect(result.current.data).toBe('Initial');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
