import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../utils/apiError';

export function useAsyncResource(loader, deps = []) {
  const [state, setState] = useState({
    status: 'idle',
    data: null,
    error: null,
  });

  const run = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }));

    try {
      const data = await loader();
      setState({ status: 'success', data, error: null });
      return data;
    } catch (error) {
      const normalized = {
        message: getErrorMessage(error),
        code: error.code,
        status: error.status,
      };
      setState({ status: 'error', data: null, error: normalized });
      throw error;
    }
  }, deps);

  useEffect(() => {
    let cancelled = false;

    setState((current) => ({ ...current, status: 'loading', error: null }));

    loader()
      .then((data) => {
        if (!cancelled) {
          setState({ status: 'success', data, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: {
              message: getErrorMessage(error),
              code: error.code,
              status: error.status,
            },
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return {
    ...state,
    isLoading: state.status === 'loading' || state.status === 'idle',
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
    reload: run,
  };
}
