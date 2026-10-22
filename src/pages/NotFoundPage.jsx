import { Link } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';
import { EmptyState } from '../components/ui/Feedback.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function NotFoundPage() {
  useDocumentTitle('Página no encontrada');
  return (
    <div className="container">
      <EmptyState icon={MapPinOff} title="Esta página no existe" action={<Link to="/mapa" className="button button--primary">Volver al mapa</Link>}>
        Puede que el enlace esté mal escrito o que el incidente se haya unificado con otro.
      </EmptyState>
    </div>
  );
}
