import { notifications } from '@mantine/notifications';
import { NOMBRES_ESTADO_HITO, type EstadoHito, type ListaHitos } from '@autofix/core';
import { COLOR_ESTADO_HITO } from './estado-hito';

export interface CambioHito {
  mensaje: string;
  estadoNuevo: EstadoHito;
  cambioEstado: boolean;
}

export function resumirCambiosHitos(
  antes: ListaHitos | undefined,
  despues: ListaHitos,
): CambioHito[] {
  if (!antes) return [];
  const previosPorId = new Map(antes.hitos.map((h) => [h.id, h]));
  const cambios: CambioHito[] = [];

  for (const actual of despues.hitos) {
    const previo = previosPorId.get(actual.id);
    if (!previo) continue;

    const cambioEstado = previo.estado !== actual.estado;
    const perdioTarea = previo.tarea !== null && actual.tarea === null;

    if (cambioEstado && perdioTarea) {
      cambios.push({
        mensaje: `${actual.nombre}: ${NOMBRES_ESTADO_HITO[previo.estado]} → ${NOMBRES_ESTADO_HITO[actual.estado]} (quedó sin tarea vinculada)`,
        estadoNuevo: actual.estado,
        cambioEstado: true,
      });
    } else if (cambioEstado) {
      cambios.push({
        mensaje: `${actual.nombre}: ${NOMBRES_ESTADO_HITO[previo.estado]} → ${NOMBRES_ESTADO_HITO[actual.estado]}`,
        estadoNuevo: actual.estado,
        cambioEstado: true,
      });
    } else if (perdioTarea) {
      cambios.push({
        mensaje: `${actual.nombre}: quedó sin tarea vinculada`,
        estadoNuevo: actual.estado,
        cambioEstado: false,
      });
    }
  }

  return cambios;
}

export function mostrarAvisosHitos(antes: ListaHitos | undefined, despues: ListaHitos): void {
  const cambios = resumirCambiosHitos(antes, despues);
  for (const cambio of cambios) {
    notifications.show({
      color: cambio.cambioEstado ? COLOR_ESTADO_HITO[cambio.estadoNuevo] : 'blue',
      title: 'Hito afectado por recálculo',
      message: cambio.mensaje,
    });
  }
}
