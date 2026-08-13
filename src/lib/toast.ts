// Toast imperativo, mismo patrón que el prototipo.
export function toast(message: string, opts?: { tone?: 'ink' | 'alert'; ms?: number }): void {
  const el = document.createElement('div');
  const tone = opts?.tone ?? 'ink';
  el.textContent = message;
  el.className = [
    'fixed left-1/2 -translate-x-1/2 bottom-6 z-50',
    'text-white text-[13.5px] px-5 py-3 rounded shadow-toast',
    tone === 'alert' ? 'bg-alert' : 'bg-ink',
  ].join(' ');
  el.setAttribute('role', 'status');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), opts?.ms ?? 3600);
}
