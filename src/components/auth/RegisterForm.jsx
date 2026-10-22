import { useId, useState } from 'react';
import { KeyRound, UserPlus } from 'lucide-react';
import { Spinner } from '../ui/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import FormError from './FormError.jsx';
import PasswordField from './PasswordField.jsx';
import { ROLES } from './roles.js';

export default function RegisterForm({ role, onDone, headingRef }) {
  const { register } = useAuth();
  const errorId = useId();
  const groupId = useId();
  const [form, setForm] = useState({ name: '', email: '', password: '', inviteCode: '', agency: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const isOfficial = role === 'OFFICIAL';
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const describedBy = error ? errorId : undefined;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { inviteCode, agency, ...base } = form;
      const data = isOfficial ? { ...base, role, inviteCode, agency: agency || undefined } : base;
      onDone(await register(data), true);
    } catch (requestError) {
      setError(requestError.message);
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="welcome-card__title" ref={headingRef} tabIndex={-1}>Crea tu cuenta de {ROLES[role].article}</h2>
      {isOfficial && <p className="welcome-card__lead">Necesitas el código de invitación que entrega la alcaldía.</p>}
      <form className="auth-form" onSubmit={submit} aria-busy={loading}>
        <fieldset className="auth-form__fields" disabled={loading}>
          <label className="field">
            <span className="field__label">Nombre</span>
            <input required minLength={2} autoComplete="name" value={form.name} onChange={update('name')} aria-describedby={describedBy} />
          </label>
          <label className="field">
            <span className="field__label">Correo electrónico</span>
            <input type="email" required autoComplete="email" inputMode="email" value={form.email} onChange={update('email')} aria-describedby={describedBy} />
          </label>
          <PasswordField value={form.password} onChange={update('password')} autoComplete="new-password" minLength={6}
            hint="Mínimo 6 caracteres." describedBy={describedBy} />
          {isOfficial && (
            <div className="field-group" role="group" aria-labelledby={groupId}>
              <p id={groupId} className="field-group__title"><KeyRound size={15} aria-hidden="true" /> Datos de funcionario</p>
              <label className="field">
                <span className="field__label">Código de invitación</span>
                <input required autoComplete="off" value={form.inviteCode} onChange={update('inviteCode')} placeholder="Lo entrega la alcaldía" aria-describedby={describedBy} />
              </label>
              <label className="field">
                <span className="field__label">Dependencia <small>(opcional)</small></span>
                <input autoComplete="organization" value={form.agency} onChange={update('agency')} placeholder="Ej.: Secretaría de Movilidad" />
              </label>
            </div>
          )}
        </fieldset>
        <FormError id={errorId} error={error} />
        <button type="submit" className="button button--primary button--block button--large" disabled={loading}>
          {loading ? <Spinner size={18} label="Creando cuenta" /> : <UserPlus size={18} aria-hidden="true" />}
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </>
  );
}
