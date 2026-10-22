import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CircleCheckBig, Info, TriangleAlert, X } from 'lucide-react';

const ToastContext = createContext(null);
const ICONS = { success: CircleCheckBig, error: TriangleAlert, info: Info };
let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((toast) => toast.id !== id)), []);

  const show = useCallback((message, { type = 'info', title, duration = 5000 } = {}) => {
    const id = ++nextId;
    setToasts((list) => [...list.slice(-3), { id, type, title, message }]);
    if (duration) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const value = useMemo(() => ({
    show,
    success: (message, options) => show(message, { ...options, type: 'success' }),
    error: (message, options) => show(message, { duration: 7000, ...options, type: 'error' }),
    info: (message, options) => show(message, { ...options, type: 'info' }),
  }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="region" aria-live="polite" aria-label="Avisos">
        {toasts.map(({ id, type, title, message }) => {
          const Icon = ICONS[type];
          return (
            <div key={id} className={`toast toast--${type}`} role={type === 'error' ? 'alert' : 'status'}>
              <Icon size={20} aria-hidden="true" />
              <div className="toast__body">
                {title && <strong>{title}</strong>}
                <p>{message}</p>
              </div>
              <button type="button" className="icon-button icon-button--sm" onClick={() => dismiss(id)} aria-label="Cerrar aviso">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
