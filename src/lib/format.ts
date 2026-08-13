export function cop(n: number): string {
  return n > 0 ? '$' + n.toLocaleString('es-CO') : 'Sin costo';
}

export function shortId(uuid: string): string {
  // Últimos 6 chars en mayúscula, prefijados según tipo.
  return uuid.replaceAll('-', '').slice(-6).toUpperCase();
}
