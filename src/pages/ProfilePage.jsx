import { useState } from 'react';
import { Camera, KeyRound, LogOut, Save, Trash2, UserRound } from 'lucide-react';
import PasswordField from '../components/auth/PasswordField.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Badge } from '../components/ui/Badges.jsx';
import { Spinner } from '../components/ui/Feedback.jsx';
import { profileApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { compressPhoto } from '../services/imageService.js';
import { formatDate } from '../utils/format.js';

const MIN_PASSWORD = 6;

function PhotoSection({ user, onUpdated }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const upload = async (event) => {
    const [file] = event.target.files ?? [];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const compressed = await compressPhoto(file);
      onUpdated((await profileApi.uploadAvatar(compressed.blob)).user, 'Foto de perfil actualizada');
    } catch (error) {
      toast.error(error.message === 'El archivo no es una imagen' ? error.message : `No pudimos subir la foto: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      onUpdated((await profileApi.removeAvatar()).user, 'Quitamos tu foto de perfil');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="form-section profile-card">
      <div className="profile-card__photo">
        <Avatar user={user} size={96} />
        {busy && <span className="profile-card__busy"><Spinner size={22} /></span>}
      </div>
      <div className="profile-card__info">
        <h2>{user.name}</h2>
        <p className="muted">{user.email}</p>
        <div className="profile-card__badges">
          <Badge tone={user.role === 'OFFICIAL' ? 'blue' : 'slate'}>{user.roleLabel}</Badge>
          {user.agency && <Badge tone="gray">{user.agency}</Badge>}
          {user.createdAt && <span className="muted small">Desde el {formatDate(user.createdAt)}</span>}
        </div>
        <div className="profile-card__actions">
          <label className={`button button--secondary button--small${busy ? ' is-disabled' : ''}`}>
            <Camera size={16} aria-hidden="true" /> {user.avatarUrl ? 'Cambiar foto' : 'Subir foto'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="visually-hidden" onChange={upload} disabled={busy} />
          </label>
          {user.avatarUrl && (
            <button type="button" className="button button--ghost button--small" onClick={remove} disabled={busy}>
              <Trash2 size={16} aria-hidden="true" /> Quitar foto
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function DataSection({ user, isOfficial, onUpdated }) {
  const toast = useToast();
  const initial = { name: user.name, email: user.email, phone: user.phone ?? '', agency: user.agency ?? '' };
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const changes = Object.fromEntries(Object.entries(form)
    .filter(([field, value]) => (field !== 'agency' || isOfficial) && value.trim() !== (initial[field] ?? '').trim())
    .map(([field, value]) => [field, field === 'phone' && !value.trim() ? null : value.trim()]));
  const dirty = Object.keys(changes).length > 0;

  const submit = async (event) => {
    event.preventDefault();
    if (!dirty) return;
    setSaving(true);
    try {
      const { user: updated } = await profileApi.update(changes);
      setForm({ name: updated.name, email: updated.email, phone: updated.phone ?? '', agency: updated.agency ?? '' });
      onUpdated(updated, 'Guardamos tus datos');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-section" onSubmit={submit}>
      <header className="form-section__head">
        <span className="form-section__step"><UserRound size={16} aria-hidden="true" /></span>
        <div>
          <h2>Datos personales</h2>
          <p>Tu nombre aparece en las notificaciones y en el panel de la alcaldía.</p>
        </div>
      </header>
      <div className="profile-grid">
        <label className="field">
          <span className="field__label">Nombre completo</span>
          <input value={form.name} onChange={set('name')} required minLength={2} maxLength={100} autoComplete="name" />
        </label>
        <label className="field">
          <span className="field__label">Correo electrónico</span>
          <input type="email" value={form.email} onChange={set('email')} required maxLength={200} autoComplete="email" />
        </label>
        <label className="field">
          <span className="field__label">Teléfono <small>(opcional)</small></span>
          <input type="tel" value={form.phone} onChange={set('phone')} maxLength={20} autoComplete="tel" placeholder="+57 300 123 4567" />
        </label>
        {isOfficial && (
          <label className="field">
            <span className="field__label">Dependencia</span>
            <input value={form.agency} onChange={set('agency')} required minLength={2} maxLength={100} placeholder="Secretaría de Infraestructura" />
          </label>
        )}
      </div>
      <div className="profile-actions">
        {dirty && <button type="button" className="button button--ghost" onClick={() => setForm(initial)} disabled={saving}>Descartar cambios</button>}
        <button type="submit" className="button button--primary" disabled={!dirty || saving}>
          {saving ? <Spinner size={16} /> : <Save size={16} aria-hidden="true" />} Guardar cambios
        </button>
      </div>
    </form>
  );
}

function PasswordSection({ onUpdated }) {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const mismatch = form.confirm.length > 0 && form.confirm !== form.newPassword;
  const ready = form.currentPassword && form.newPassword.length >= MIN_PASSWORD && form.confirm === form.newPassword;

  const submit = async (event) => {
    event.preventDefault();
    if (!ready) return;
    setSaving(true);
    try {
      const { user } = await profileApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      onUpdated(user, 'Cambiamos tu contraseña');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-section" onSubmit={submit}>
      <header className="form-section__head">
        <span className="form-section__step"><KeyRound size={16} aria-hidden="true" /></span>
        <div>
          <h2>Contraseña</h2>
          <p>Para cambiarla escribe primero la actual.</p>
        </div>
      </header>
      <div className="profile-grid">
        <PasswordField label="Contraseña actual" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" />
        <PasswordField label="Nueva contraseña" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" minLength={MIN_PASSWORD} hint={`Mínimo ${MIN_PASSWORD} caracteres.`} />
        <PasswordField label="Confirmar nueva contraseña" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" minLength={MIN_PASSWORD} />
      </div>
      {mismatch && <p className="field__error">Las contraseñas nuevas no coinciden.</p>}
      <div className="profile-actions">
        <button type="submit" className="button button--primary" disabled={!ready || saving}>
          {saving ? <Spinner size={16} /> : <KeyRound size={16} aria-hidden="true" />} Cambiar contraseña
        </button>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  useDocumentTitle('Mi perfil');
  const { user, isOfficial, updateUser, logout } = useAuth();
  const toast = useToast();

  const onUpdated = (updated, message) => {
    updateUser(updated);
    toast.success(message);
  };

  return (
    <div className="container container--narrow profile-page">
      <PageHeader
        eyebrow={isOfficial ? 'Cuenta de funcionario' : 'Cuenta de ciudadano'}
        title="Mi perfil"
        description="Actualiza tus datos, tu foto y tu contraseña."
      />
      <PhotoSection user={user} onUpdated={onUpdated} />
      <DataSection key={user.id} user={user} isOfficial={isOfficial} onUpdated={onUpdated} />
      <PasswordSection onUpdated={onUpdated} />
      <button type="button" className="button button--ghost profile-logout" onClick={logout}>
        <LogOut size={18} aria-hidden="true" /> Cerrar sesión
      </button>
    </div>
  );
}
