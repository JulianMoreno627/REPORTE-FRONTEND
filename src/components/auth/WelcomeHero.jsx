import { MapPin } from 'lucide-react';
import Logo from '../layout/Logo.jsx';

export default function WelcomeHero() {
  return (
    <section className="welcome__hero" aria-labelledby="welcome-title">
      <div className="welcome__brand">
        <Logo size={36} />
        <span>Vías <strong>Seguras</strong></span>
      </div>

      <div className="welcome__copy">
        <span className="welcome__eyebrow"><MapPin size={14} aria-hidden="true" /> Bienvenido</span>
        <h1 id="welcome-title">Reporta los daños de tu vía y <em>sigue su reparación</em>.</h1>
        <p>
          Vías Seguras conecta a los ciudadanos con la alcaldía: tú reportas baches y daños viales,
          y el equipo de mantenimiento los atiende según su prioridad.
        </p>
      </div>
    </section>
  );
}
