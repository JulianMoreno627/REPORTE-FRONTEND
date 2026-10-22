export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" className="logo">
      <rect width="512" height="512" rx="112" fill="#0f172a" />
      <path d="M196 96h120l72 320H124z" fill="#334155" />
      <path d="M250 130h12l2 50h-16zM246 220h20l3 60h-26zM241 320h30l4 70h-38z" fill="#f8fafc" />
      <ellipse cx="318" cy="300" rx="62" ry="30" fill="#0f172a" stroke="#f59e0b" strokeWidth="12" />
      <circle cx="318" cy="170" r="54" fill="#f59e0b" />
      <path d="M318 140v38" stroke="#0f172a" strokeWidth="14" strokeLinecap="round" />
      <circle cx="318" cy="200" r="8" fill="#0f172a" />
    </svg>
  );
}
