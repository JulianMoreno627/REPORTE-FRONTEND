import { CATEGORY_META, PHOTO_CHECK_META, PRIORITY_META, STATUS_META } from '../../utils/domain.js';

export function Badge({ tone = 'gray', children, title, className = '' }) {
  return <span className={`badge badge--${tone} ${className}`} title={title}>{children}</span>;
}

export function StatusBadge({ status, label }) {
  const meta = STATUS_META[status] ?? STATUS_META.REPORTED;
  return <Badge tone={meta.tone}><span className="badge__dot" aria-hidden="true" />{label ?? meta.label}</Badge>;
}

export function PriorityBadge({ priority }) {
  if (!priority) return null;
  const meta = PRIORITY_META[priority.level] ?? PRIORITY_META.NONE;
  const text = priority.level === 'NONE' ? meta.label : `Prioridad ${meta.label.toLowerCase()}`;
  return <Badge tone={meta.tone} title={`Puntaje ${Math.round(priority.score * 100)} / 100`}>{text}</Badge>;
}

export function PhotoCheckBadge({ check }) {
  if (!check || check === 'NONE') return null;
  const meta = PHOTO_CHECK_META[check];
  return <Badge tone={meta.tone} title={meta.hint}>{meta.label}</Badge>;
}

export function CategoryIcon({ category, size = 20 }) {
  const Icon = (CATEGORY_META[category] ?? CATEGORY_META.OTHER).icon;
  return (
    <span className={`category-icon category-icon--${category}`} aria-hidden="true">
      <Icon size={size} />
    </span>
  );
}
