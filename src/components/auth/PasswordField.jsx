import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({ value, onChange, autoComplete, minLength, hint, describedBy }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const checkCaps = (event) => setCapsLock(event.getModifierState?.('CapsLock') ?? false);
  const hintId = hint ? `${id}-hint` : undefined;
  const capsId = capsLock ? `${id}-caps` : undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>Contraseña</label>
      <span className="input-group">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          onKeyUp={checkCaps}
          onBlur={() => setCapsLock(false)}
          aria-describedby={[hintId, capsId, describedBy].filter(Boolean).join(' ') || undefined}
        />
        <button
          type="button"
          className="icon-button icon-button--sm"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-controls={id}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </span>
      {hint && <span id={hintId} className="field__note">{hint}</span>}
      {capsLock && <span id={capsId} className="field__note field__note--warning">Bloq Mayús está activado.</span>}
    </div>
  );
}
