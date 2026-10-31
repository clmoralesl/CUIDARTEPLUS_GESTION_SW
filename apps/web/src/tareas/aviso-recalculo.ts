import { notifications } from '@mantine/notifications';
import { formatearFecha, resumirTareasAfectadas, type TareaAfectada } from '@autofix/core';

export function formatearDetalleTareaAfectada(t: TareaAfectada): string {
  if (t.inicioAnterior !== t.inicioNuevo) {
    return `${t.codigo}: ${formatearFecha(t.inicioAnterior)} → ${formatearFecha(t.inicioNuevo)}`;
  }
  return `${t.codigo}: ${formatearFecha(t.finAnterior)} → ${formatearFecha(t.finNuevo)}`;
}

export function formatearTextoAviso(tareasAfectadas: readonly TareaAfectada[]): string {
  if (tareasAfectadas.length === 0) {
    return 'Sin cambios en el cronograma.';
  }
  const maxLineas = 5;
  const lineas: string[] = [resumirTareasAfectadas(tareasAfectadas)];
  const total = tareasAfectadas.length;
  const visibles = tareasAfectadas.slice(0, maxLineas);

  for (const t of visibles) {
    lineas.push(formatearDetalleTareaAfectada(t));
  }

  if (total > maxLineas) {
    lineas.push(`y ${total - maxLineas} más`);
  }

  return lineas.join('\n');
}

export function mostrarAvisoRecalculo(
  titulo: string,
  tareasAfectadas: readonly TareaAfectada[],
): void {
  notifications.show({
    color: 'green',
    title: titulo,
    message: formatearTextoAviso(tareasAfectadas),
    styles: { description: { whiteSpace: 'pre-line' } },
  });
}
