export default function BarList({ items, colorOf, total, emptyText = 'Sin datos' }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  const sum = total ?? items.reduce((acc, item) => acc + item.count, 0);
  if (items.length === 0) return <p className="muted small">{emptyText}</p>;
  return (
    <ul className="bar-list">
      {items.map((item) => {
        const share = sum ? Math.round((item.count / sum) * 100) : 0;
        return (
          <li key={item.code} className="bar-list__row" title={`${item.label}: ${item.count} (${share} %)`}>
            <span className="bar-list__label">{item.label}</span>
            <span className="bar-list__track">
              <span className="bar-list__bar" style={{ width: `${(item.count / max) * 100}%`, background: colorOf?.(item) }} />
            </span>
            <span className="bar-list__value">{item.count}</span>
          </li>
        );
      })}
    </ul>
  );
}
