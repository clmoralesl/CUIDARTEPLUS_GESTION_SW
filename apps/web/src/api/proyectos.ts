import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ActualizarProyecto,
  CrearProyecto,
  ProyectoDetalle,
  ProyectoResumen,
} from '@autofix/core';
import { ErrorSolicitud, solicitar } from './cliente-api';

export function useProyectos() {
  return useQuery<ProyectoResumen[]>({
    queryKey: ['proyectos'],
    queryFn: ({ signal }) => solicitar<ProyectoResumen[]>('/proyectos', { signal }),
  });
}

export function useProyecto(id: number, opciones?: { silenciarError?: boolean }) {
  return useQuery<ProyectoDetalle>({
    queryKey: ['proyectos', id],
    queryFn: ({ signal }) => solicitar<ProyectoDetalle>(`/proyectos/${id}`, { signal }),
    enabled: !Number.isNaN(id) && id > 0,
    meta: opciones?.silenciarError ? { silenciarError: true } : undefined,
  });
}

export function useCrearProyecto() {
  const queryClient = useQueryClient();
  return useMutation<ProyectoDetalle, ErrorSolicitud, CrearProyecto>({
    mutationFn: (datos) =>
      solicitar<ProyectoDetalle>('/proyectos', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    onSuccess: (proyecto) => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      notifications.show({
        color: 'green',
        title: 'Proyecto creado',
        message: `El proyecto «${proyecto.nombre}» fue creado exitosamente.`,
      });
    },
  });
}

export function useActualizarProyecto(id: number) {
  const queryClient = useQueryClient();
  return useMutation<ProyectoDetalle, ErrorSolicitud, ActualizarProyecto>({
    mutationFn: (datos) =>
      solicitar<ProyectoDetalle>(`/proyectos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(datos),
      }),
    onSuccess: (proyecto) => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      notifications.show({
        color: 'green',
        title: 'Proyecto actualizado',
        message: `El proyecto «${proyecto.nombre}» fue actualizado exitosamente.`,
      });
    },
  });
}

export function useCambiarEstadoProyecto(id: number) {
  const queryClient = useQueryClient();
  return useMutation<ProyectoDetalle, ErrorSolicitud, 'iniciar' | 'cerrar'>({
    mutationFn: (accion) =>
      solicitar<ProyectoDetalle>(`/proyectos/${id}/${accion}`, {
        method: 'POST',
      }),
    onSuccess: (proyecto, accion) => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      notifications.show({
        color: 'green',
        title: accion === 'iniciar' ? 'Proyecto iniciado' : 'Proyecto cerrado',
        message:
          accion === 'iniciar'
            ? `El proyecto «${proyecto.nombre}» ha pasado a En curso.`
            : `El proyecto «${proyecto.nombre}» ha sido cerrado.`,
      });
    },
  });
}
