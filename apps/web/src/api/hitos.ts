import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActualizarHito, CrearHito, ListaHitos } from '@autofix/core';
import { ErrorSolicitud, solicitar } from './cliente-api';

export function useHitos(proyectoId: number | null) {
  return useQuery<ListaHitos>({
    queryKey: ['hitos', proyectoId],
    queryFn: ({ signal }) => solicitar<ListaHitos>(`/proyectos/${proyectoId}/hitos`, { signal }),
    enabled: proyectoId !== null && !Number.isNaN(proyectoId) && proyectoId > 0,
    staleTime: 30_000,
  });
}

export function useCrearHito(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<ListaHitos, ErrorSolicitud, CrearHito>({
    mutationFn: (datos) =>
      solicitar<ListaHitos>(`/proyectos/${proyectoId}/hitos`, {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    onSuccess: (resultado) => {
      queryClient.setQueryData(['hitos', proyectoId], resultado);
      notifications.show({
        color: 'green',
        title: 'Hito creado',
        message: 'El hito fue creado exitosamente.',
      });
    },
  });
}

export function useActualizarHito(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<ListaHitos, ErrorSolicitud, { hitoId: number; datos: ActualizarHito }>({
    mutationFn: ({ hitoId, datos }) =>
      solicitar<ListaHitos>(`/hitos/${hitoId}`, {
        method: 'PATCH',
        body: JSON.stringify(datos),
      }),
    onSuccess: (resultado) => {
      queryClient.setQueryData(['hitos', proyectoId], resultado);
      notifications.show({
        color: 'green',
        title: 'Hito actualizado',
        message: 'El hito fue actualizado exitosamente.',
      });
    },
  });
}

export function useEliminarHito(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<ListaHitos, ErrorSolicitud, number>({
    mutationFn: (hitoId) =>
      solicitar<ListaHitos>(`/hitos/${hitoId}`, {
        method: 'DELETE',
      }),
    onSuccess: (resultado) => {
      queryClient.setQueryData(['hitos', proyectoId], resultado);
      notifications.show({
        color: 'green',
        title: 'Hito eliminado',
        message: 'El hito fue eliminado exitosamente.',
      });
    },
    onError: (error) => {
      notifications.show({
        color: 'red',
        title: 'No se pudo eliminar el hito',
        message: error.message,
      });
    },
  });
}
