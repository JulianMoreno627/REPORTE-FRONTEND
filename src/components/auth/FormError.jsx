import { TriangleAlert } from 'lucide-react';

export default function FormError({ id, error }) {
  return (
    <div id={id} className="form-error-region" aria-live="assertive" aria-atomic="true">
      {error && (
        <p className="notice notice--error form-error">
          <TriangleAlert size={18} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
