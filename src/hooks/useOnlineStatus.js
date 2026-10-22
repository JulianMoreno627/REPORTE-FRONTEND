import { useSyncExternalStore } from 'react';

const subscribe = (callback) => {
  addEventListener('online', callback);
  addEventListener('offline', callback);
  return () => {
    removeEventListener('online', callback);
    removeEventListener('offline', callback);
  };
};

export const useOnlineStatus = () => useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
