import { Inbox, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react';

export function Spinner({ size = 20, label = 'Cargando' }) {
  return <LoaderCircle size={size} className="spin" role="status" aria-label={label} />;
}

export function PageLoader({ label = 'Cargando…' }) {
  return (
    <div className="page-loader">
      <Spinner size={28} />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, children, action, secondaryAction, tone = 'neutral', variant, level = 3, extra }) {
  const Heading = `h${level}`;
  const classes = ['empty-state', `empty-state--${tone}`, variant && `empty-state--${variant}`].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <span className="empty-state__icon"><Icon size={variant === 'compact' ? 24 : 28} aria-hidden="true" /></span>
      <Heading className="empty-state__title">{title}</Heading>
      {children && <p>{children}</p>}
      {extra}
      {(action || secondaryAction) && <div className="empty-state__actions">{action}{secondaryAction}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'No pudimos cargar la información' }) {
  return (
    <div className="empty-state empty-state--error" role="alert">
      <span className="empty-state__icon"><TriangleAlert size={28} aria-hidden="true" /></span>
      <h3 className="empty-state__title">{title}</h3>
      <p>{error?.message ?? 'Intenta de nuevo en un momento.'}</p>
      {onRetry && (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" /> Reintentar
        </button>
      )}
    </div>
  );
}

export function Skeleton({ lines = 3 }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => <span key={index} style={{ width: `${90 - index * 15}%` }} />)}
    </div>
  );
}
