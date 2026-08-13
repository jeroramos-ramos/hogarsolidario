// Ícono neutro cuando el inmueble no tiene foto. Casa de línea sobre paper,
// mantiene el aire sobrio y no deja un hueco vacío.
export function PlaceholderPhoto() {
  return (
    <div className="w-full h-full flex items-center justify-center text-line" aria-hidden="true">
      <svg
        width="40%"
        height="40%"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" />
        <path d="M9 21v-6h6v6" />
      </svg>
    </div>
  );
}
