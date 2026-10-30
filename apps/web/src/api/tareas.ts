import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActualizarTarea, ArbolTareas, CrearTarea, MoverTarea } from '@autofix/core';
import { ErrorSolicitud, solicitar } from './cliente-api';

export function useArbolTareas(proyectoId: number | null) {
  return useQuery<ArbolTareas>({
    queryKey: ['tareas', proyectoId],
    queryFn: ({ signal }) => solicitar<ArbolTareas>(`/proyectos/${proyectoId}/tareas`, { signal }),
    enabled: proyectoId !== null && !Number.isNaN(proyectoId) && proyectoId > 0,
  });
}

export function useCrearTarea(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<ArbolTareas, ErrorSolicitud, CrearTarea>({
    mutationFn: (datos) =>
      solicitar<ArbolTareas>(`/proyectos/${proyectoId}/tareas`, {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    onSuccess: (arbol) => {
      queryClient.setQueryData(['tareas', proyectoId], arbol);
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      notifications.show({
        color: 'green',
        title: 'Tarea creada',
        message: 'La tarea fue creada exitosamente.',
      });
    },
  });
}

export function useActualizarTarea(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<ArbolTareas, ErrorSolicitud, { tareaId: number; datos: ActualizarTarea }>({
    mutationFn: ({ tareaId, datos }) =>
      solicitar<ArbolTareas>(`/tareas/${tareaId}`, {
        method: 'PATCH',
        body: JSON.stringify(datos),
      }),
    onSuccess: (arbol) => {
      queryClient.setQueryData(['tareas', proyectoId], arbol);
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      notifications.show({
        color: 'green',
        title: 'Tarea actualizada',
        message: 'La tarea fue actualizada exitosamente.',
      });
    },
  });
}

export function useMoverTarea(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<ArbolTareas, ErrorSolicitud, { tareaId: number; datos: MoverTarea }>({
    mutationFn: ({ tareaId, datos }) =>
      solicitar<ArbolTareas>(`/tareas/${tareaId}/mover`, {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    onSuccess: (arbol) => {
      queryClient.setQueryData(['tareas', proyectoId], arbol);
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      notifications.show({
        color: 'green',
        title: 'Tarea movida',
        message: 'La ubicación de la tarea fue actualizada.',
      });
    },
  });
}

export function useEliminarTarea(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<ArbolTareas, ErrorSolicitud, number>({
    mutationFn: (tareaId) =>
      solicitar<ArbolTareas>(`/tareas/${tareaId}`, {
        method: 'DELETE',
      }),
    onSuccess: (arbol) => {
      queryClient.setQueryData(['tareas', proyectoId], arbol);
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      notifications.show({
        color: 'green',
        title: 'Tarea eliminada',
        message: 'La tarea fue eliminada exitosamente.',
      });
    },
  });
}
