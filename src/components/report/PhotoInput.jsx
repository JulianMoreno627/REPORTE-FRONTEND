import { useEffect, useState } from 'react';
import { Camera, ImagePlus, MapPin, Trash2 } from 'lucide-react';
import { compressPhoto } from '../../services/imageService.js';
import { formatBytes } from '../../utils/format.js';
import { Badge } from '../ui/Badges.jsx';
import { Spinner } from '../ui/Feedback.jsx';

export default function PhotoInput({ value, onChange, onError }) {
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!value?.blob) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(value.blob);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const handleFile = async (file) => {
    if (!file) return;
    setProcessing(true);
    try {
      onChange(await compressPhoto(file));
    } catch (error) {
      onError?.(error.message === 'El archivo no es una imagen' ? error.message : 'No pudimos procesar la foto. Prueba con otra imagen.');
    } finally {
      setProcessing(false);
    }
  };

  const pick = (event) => {
    const [file] = event.target.files ?? [];
    event.target.value = '';
    handleFile(file);
  };

  if (processing) {
    return (
      <div className="photo-drop photo-drop--busy" role="status">
        <Spinner size={24} />
        <p>Comprimiendo la foto…</p>
      </div>
    );
  }

  if (value && preview) {
    const saved = Math.max(0, 1 - value.bytes / value.originalBytes);
    return (
      <div className="photo-preview">
        <img src={preview} alt="Vista previa de la foto del daño" />
        <div className="photo-preview__info">
          <p><strong>{formatBytes(value.originalBytes)}</strong> → <strong>{formatBytes(value.bytes)}</strong>
            {saved > 0.05 && <span className="muted"> ({Math.round(saved * 100)} % menos datos)</span>}
          </p>
          <p className="muted small">{value.width} × {value.height} px</p>
          {value.gps
            ? <Badge tone="green"><MapPin size={12} aria-hidden="true" /> La foto tiene ubicación GPS</Badge>
            : <Badge tone="gray">La foto no tiene ubicación GPS</Badge>}
        </div>
        <button type="button" className="icon-button photo-preview__remove" onClick={() => onChange(null)} aria-label="Quitar foto">
          <Trash2 size={18} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="photo-drop"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        handleFile(event.dataTransfer.files?.[0]);
      }}
    >
      <ImagePlus size={30} aria-hidden="true" />
      <p><strong>Agrega una foto del daño</strong><br /><span className="muted small">Ayuda a la alcaldía a verificar el reporte</span></p>
      <div className="photo-drop__actions">
        <label className="button button--secondary">
          <Camera size={18} aria-hidden="true" /> Tomar foto
          <input type="file" accept="image/*" capture="environment" className="visually-hidden"
            onChange={pick} />
        </label>
        <label className="button button--ghost">
          <ImagePlus size={18} aria-hidden="true" /> Elegir de la galería
          <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="visually-hidden"
            onChange={pick} />
        </label>
      </div>
    </div>
  );
}
