/**
 * Reusable useApi Hook for PayGuard Frontend.
 * 
 * Handles loading, success, and error state transitions,
 * with optional automated execution on mount, error message formatting,
 * and callbacks.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiError } from '../services/api/http';

export interface UseApiOptions<TData> {
  immediate?: boolean;
  initialData?: TData | null;
  onSuccess?: (data: TData) => void;
  onError?: (error: ApiError | Error) => void;
}

export interface UseApiResult<TData, TParams extends unknown[]> {
  data: TData | null;
  isLoading: boolean;
  error: ApiError | Error | null;
  errorMessage: string | null;
  execute: (...args: TParams) => Promise<TData | null>;
  setData: React.Dispatch<React.SetStateAction<TData | null>>;
  reset: () => void;
}

export function useApi<TData, TParams extends unknown[] = []>(
  apiFn: (...args: TParams) => Promise<TData>,
  options: UseApiOptions<TData> = {}
): UseApiResult<TData, TParams> {
  const { immediate = false, initialData = null, onSuccess, onError } = options;

  const [data, setData] = useState<TData | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<ApiError | Error | null>(null);

  // Preserve callback references across renders
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const apiFnRef = useRef(apiFn);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    apiFnRef.current = apiFn;
  });

  const reset = useCallback(() => {
    setData(initialData);
    setIsLoading(false);
    setError(null);
  }, [initialData]);

  const execute = useCallback(
    async (...args: TParams): Promise<TData | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiFnRef.current(...args);
        setData(result);
        if (onSuccessRef.current) {
          onSuccessRef.current(result);
        }
        return result;
      } catch (err: unknown) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        if (onErrorRef.current) {
          onErrorRef.current(errorObj);
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as TParams));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  const errorMessage = error ? error.message : null;

  return {
    data,
    isLoading,
    error,
    errorMessage,
    execute,
    setData,
    reset,
  };
}
