import { useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { ROLES } from './roles.js';

export default function RolePicker({ onPick, headingRef }) {
  const listRef = useRef(null);

  const moveFocus = (event) => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const options = [...listRef.current.querySelectorAll('.role-option')];
    const index = options.indexOf(document.activeElement);
    if (index === -1) return;
    event.preventDefault();
    const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[next].focus();
  };

  return (
    <>
      <h2 className="welcome-card__title" ref={headingRef} tabIndex={-1}>¿Cómo quieres ingresar?</h2>
      <p className="welcome-card__lead">Elige tu perfil para continuar.</p>
      <ul className="role-options" ref={listRef} onKeyDown={moveFocus}>
        {Object.entries(ROLES).map(([role, { icon: Icon, label, description }]) => (
          <li key={role}>
            <button type="button" className="role-option" onClick={() => onPick(role)}>
              <span className="role-option__icon"><Icon size={22} aria-hidden="true" /></span>
              <span className="role-option__text">
                <span className="role-option__label">{label}</span>
                <span className="role-option__description">{description}</span>
              </span>
              <ChevronRight size={18} aria-hidden="true" className="role-option__chevron" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
