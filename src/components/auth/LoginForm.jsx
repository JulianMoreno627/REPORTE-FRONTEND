import { useId, useState } from 'react';
import { LogIn } from 'lucide-react';
import { Spinner } from '../ui/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import FormError from './FormError.jsx';
import PasswordField from './PasswordField.jsx';
import { ROLES } from './roles.js';

export default function LoginForm({ role, onDone, headingRef }) {
  const { login } = useAuth();
  const errorId = useId();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const describedBy = error ? errorId : undefined;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      onDone(await login({ ...form, role }), false);
    } catch (requestError) {
      setError(requestError.message);
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="welcome-card__title" ref={headingRef} tabIndex={-1}>Ingresa como {ROLES[role].article}</h2>
      <form className="auth-form" onSubmit={submit} aria-busy={loading}>
        <fieldset className="auth-form__fields" disabled={loading}>
          <label className="field">
            <span className="field__label">Correo electrónico</span>
            <input type="email" required autoComplete="email" inputMode="email" value={form.email} onChange={update('email')} aria-describedby={describedBy} />
          </label>
          <PasswordField value={form.password} onChange={update('password')} autoComplete="current-password" describedBy={describedBy} />
        </fieldset>
        <FormError id={errorId} error={error} />
        <button type="submit" className="button button--primary button--block button--large" disabled={loading}>
          {loading ? <Spinner size={18} label="Ingresando" /> : <LogIn size={18} aria-hidden="true" />}
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </>
  );
}
