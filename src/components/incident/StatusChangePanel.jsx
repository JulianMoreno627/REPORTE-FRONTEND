import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { incidentsApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { STATUS_META } from '../../utils/domain.js';
import { Spinner } from '../ui/Feedback.jsx';

const NOTE_PLACEHOLDER = {
  IN_REVIEW: 'Ej.: Una cuadrilla visitará el punto esta semana.',
  IN_REPAIR: 'Ej.: Reparación programada para el martes, carril derecho cerrado.',
  RESOLVED: 'Ej.: Se reparó el pavimento con mezcla asfáltica.',
  REJECTED: 'Explica por qué se descarta (duplicado, fuera de la ciudad, foto no corresponde…).',
};

export default function StatusChangePanel({ incident, onChanged }) {
  const toast = useToast();
  const [target, setTarget] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const options = incident.nextStatuses ?? [];

  if (options.length === 0) {
    return (
      <div className="official-panel official-panel--closed">
        <ShieldCheck size={18} aria-hidden="true" />
        <p>Este incidente está cerrado ({incident.statusLabel.toLowerCase()}). No admite más cambios.</p>
      </div>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    if (!target) return;
    if (target === 'REJECTED' && note.trim().length < 5) {
      toast.error('Escribe el motivo para descartar el incidente.');
      return;
    }
    setSaving(true);
    try {
      const updated = await incidentsApi.changeStatus(incident.id, target, note.trim());
      toast.success(`Se notificó a ${updated.reporterCount} ciudadano(s).`, { title: `Estado: ${updated.statusLabel}` });
      setTarget(null);
      setNote('');
      onChanged?.(updated);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="official-panel" onSubmit={submit}>
      <p className="official-panel__title"><ShieldCheck size={18} aria-hidden="true" /> Gestión de la alcaldía</p>
      <fieldset className="status-options">
        <legend>Cambiar estado a</legend>
        {options.map((option) => (
          <label key={option.code} className={`status-option status-option--${STATUS_META[option.code]?.tone ?? 'gray'}`}>
            <input type="radio" name="status" value={option.code} checked={target === option.code} onChange={() => setTarget(option.code)} />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      {target && (
        <label className="field">
          <span className="field__label">Nota para los ciudadanos {target !== 'REJECTED' && <small>(opcional)</small>}</span>
          <textarea rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder={NOTE_PLACEHOLDER[target]} />
        </label>
      )}
      <button type="submit" className="button button--primary button--block" disabled={!target || saving}>
        {saving ? <Spinner size={16} /> : null} Actualizar y notificar
      </button>
    </form>
  );
}
