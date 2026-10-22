import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm.jsx';
import RegisterForm from '../components/auth/RegisterForm.jsx';
import RolePicker from '../components/auth/RolePicker.jsx';
import WelcomeHero from '../components/auth/WelcomeHero.jsx';
import WelcomeInfo from '../components/auth/WelcomeInfo.jsx';
import { ROLES } from '../components/auth/roles.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import '../styles/welcome.css';

const HOME = '/mapa';

const MODES = [
  { value: 'login', label: 'Ingresar' },
  { value: 'register', label: 'Crear cuenta' },
];

export default function WelcomePage() {
  useDocumentTitle('Bienvenido');
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const [role, setRole] = useState(null);
  const [mode, setMode] = useState('login');
  const headingRef = useRef(null);
  const touched = useRef(false);

  const step = role ? `${role}-${mode}` : 'role';

  useEffect(() => {
    if (touched.current) headingRef.current?.focus();
  }, [step]);

  if (isAuthenticated) return <Navigate to={from ?? HOME} replace />;

  const go = (nextRole, nextMode) => {
    touched.current = true;
    setRole(nextRole);
    setMode(nextMode);
  };

  const done = (account, isNew) => {
    const firstName = account.name.split(' ')[0];
    if (isNew) toast.success('Tu cuenta está lista.', { title: `Bienvenido, ${firstName}` });
    else toast.success(`Hola, ${firstName}.`);
    navigate(from ?? HOME, { replace: true });
  };

  const RoleIcon = role ? ROLES[role].icon : null;
  const formProps = { role, onDone: done, headingRef };

  return (
    <div className="welcome">
      <WelcomeHero />

      <main className="welcome__panel">
        <div key={role ?? 'role'} className="welcome-card">
          {role ? (
            <>
              <div className="welcome-card__top">
                <button type="button" className="link-button link-button--muted" onClick={() => go(null, 'login')}>
                  <ArrowLeft size={16} aria-hidden="true" /> Cambiar perfil
                </button>
                <span className="role-chip"><RoleIcon size={14} aria-hidden="true" /> {ROLES[role].label}</span>
              </div>
              <div className="mode-switch" role="group" aria-label="Tipo de acceso">
                {MODES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className="mode-switch__option"
                    aria-pressed={mode === value}
                    onClick={() => mode !== value && go(role, value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {mode === 'login'
                ? <LoginForm key={`${role}-login`} {...formProps} />
                : <RegisterForm key={`${role}-register`} {...formProps} />}
            </>
          ) : (
            <RolePicker headingRef={headingRef} onPick={(picked) => go(picked, 'login')} />
          )}
        </div>
      </main>

      <WelcomeInfo />
    </div>
  );
}
