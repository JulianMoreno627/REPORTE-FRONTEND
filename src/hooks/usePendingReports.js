import { useEffect, useState } from 'react';
import { subscribePending } from '../services/offlineQueue.js';

export function usePendingReports() {
  const [pending, setPending] = useState([]);
  useEffect(() => subscribePending(setPending), []);
  return pending;
}
