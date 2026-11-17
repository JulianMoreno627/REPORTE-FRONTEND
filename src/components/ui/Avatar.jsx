import { api } from '../../api/client.js';

export default function Avatar({ user, size = 30, className = '' }) {
  const photo = api.assetUrl(user?.avatarUrl);
  return (
    <span className={`avatar ${className}`} style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">
      {photo ? <img src={photo} alt="" /> : (user?.name ?? '?').charAt(0).toUpperCase()}
    </span>
  );
}
