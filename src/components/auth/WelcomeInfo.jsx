import { BellRing, Camera, Layers } from 'lucide-react';

const STEPS = [
  { icon: Camera, title: 'Reporta', text: 'Marca el daño en el mapa y adjunta una foto.' },
  { icon: Layers, title: 'Se agrupa', text: 'Reportes del mismo daño se unen en un solo incidente.' },
  { icon: BellRing, title: 'Sigue el avance', text: 'Te avisamos cada vez que cambia de estado.' },
];

export default function WelcomeInfo() {
  return (
    <section className="welcome__info" aria-labelledby="welcome-steps-title">
      <h2 id="welcome-steps-title" className="welcome__section-title">Cómo funciona</h2>
      <ol className="welcome-steps">
        {STEPS.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="welcome-step">
            <span className="welcome-step__icon" aria-hidden="true">
              <Icon size={18} />
              <span className="welcome-step__number">{index + 1}</span>
            </span>
            <span>
              <strong>{title}</strong>
              <span className="welcome-step__text">{text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
