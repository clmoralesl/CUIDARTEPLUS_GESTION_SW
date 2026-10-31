import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ActualizarTarea,
  ArbolTareas,
  CrearTarea,
  MoverTarea,
  ResultadoRecalculo,
} from '@autofix/core';
import { mostrarAvisoRecalculo } from '../tareas/aviso-recalculo';
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
  return useMutation<ResultadoRecalculo, ErrorSolicitud, CrearTarea>({
    mutationFn: (datos) =>
      solicitar<ResultadoRecalculo>(`/proyectos/${proyectoId}/tareas`, {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    onSuccess: (resultado) => {
      queryClient.setQueryData(['tareas', proyectoId], resultado.arbol);
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      mostrarAvisoRecalculo('Tarea creada', resultado.tareasAfectadas);
    },
  });
}

export function useActualizarTarea(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<
    ResultadoRecalculo,
    ErrorSolicitud,
    { tareaId: number; datos: ActualizarTarea }
  >({
    mutationFn: ({ tareaId, datos }) =>
      solicitar<ResultadoRecalculo>(`/tareas/${tareaId}`, {
        method: 'PATCH',
        body: JSON.stringify(datos),
      }),
    onSuccess: (resultado) => {
      queryClient.setQueryData(['tareas', proyectoId], resultado.arbol);
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      mostrarAvisoRecalculo('Tarea actualizada', resultado.tareasAfectadas);
    },
  });
}

export function useMoverTarea(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<ResultadoRecalculo, ErrorSolicitud, { tareaId: number; datos: MoverTarea }>({
    mutationFn: ({ tareaId, datos }) =>
      solicitar<ResultadoRecalculo>(`/tareas/${tareaId}/mover`, {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    onSuccess: (resultado) => {
      queryClient.setQueryData(['tareas', proyectoId], resultado.arbol);
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      queryClient.invalidateQueries({ queryKey: ['dependencias', proyectoId] });
      mostrarAvisoRecalculo('Tarea movida', resultado.tareasAfectadas);
    },
  });
}

export function useEliminarTarea(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<ResultadoRecalculo, ErrorSolicitud, number>({
    mutationFn: (tareaId) =>
      solicitar<ResultadoRecalculo>(`/tareas/${tareaId}`, {
        method: 'DELETE',
      }),
    onSuccess: (resultado) => {
      queryClient.setQueryData(['tareas', proyectoId], resultado.arbol);
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      queryClient.invalidateQueries({ queryKey: ['dependencias', proyectoId] });
      mostrarAvisoRecalculo('Tarea eliminada', resultado.tareasAfectadas);
    },
  });
}
