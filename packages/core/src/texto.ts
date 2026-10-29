export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function coincideBusqueda(texto: string, busqueda: string): boolean {
  const termino = normalizarTexto(busqueda);
  return termino === '' || normalizarTexto(texto).includes(termino);
}
