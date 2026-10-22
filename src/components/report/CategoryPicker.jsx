import { CATEGORY_META } from '../../utils/domain.js';

const HINTS = {
  POTHOLE: 'Hueco en el pavimento',
  SINKHOLE: 'La vía se hundió',
  MANHOLE: 'Tapa rota o faltante',
  SIGNAGE: 'Señal caída o borrada',
  CRACK: 'Fisuras en la vía',
  OTHER: 'Otro problema',
};

export default function CategoryPicker({ categories, value, onChange }) {
  return (
    <div className="category-grid" role="radiogroup" aria-label="Tipo de daño">
      {categories.map(({ code, label }) => {
        const Icon = (CATEGORY_META[code] ?? CATEGORY_META.OTHER).icon;
        const checked = value === code;
        return (
          <label key={code} className={`category-card category-card--${code}${checked ? ' is-checked' : ''}`}>
            <input type="radio" name="category" value={code} checked={checked} onChange={() => onChange(code)} />
            <span className="category-card__icon"><Icon size={24} aria-hidden="true" /></span>
            <span className="category-card__label">{label}</span>
            <span className="category-card__hint">{HINTS[code]}</span>
          </label>
        );
      })}
    </div>
  );
}
