import { useCallback, useEffect, useRef, useState } from 'react';

export function useApi(fetcher, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled });
  const controllerRef = useRef(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((previous) => ({ ...previous, error: null, loading: true }));
    try {
      const data = await fetcherRef.current(controller.signal);
      if (!controller.signal.aborted) setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      if (error.name !== 'AbortError' && !controller.signal.aborted) {
        setState((previous) => ({ ...previous, error, loading: false }));
      }
      return null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    load();
    return () => controllerRef.current?.abort();
  }, [enabled, load, ...deps]);

  const setData = useCallback((updater) => setState((previous) => ({
    ...previous,
    data: typeof updater === 'function' ? updater(previous.data) : updater,
  })), []);

  return { ...state, reload: load, setData };
}
