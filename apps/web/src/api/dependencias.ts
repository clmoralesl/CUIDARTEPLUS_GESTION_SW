import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CrearDependencia, DependenciaTarea, ResultadoRecalculo } from '@autofix/core';
import { mostrarAvisoRecalculo } from '../tareas/aviso-recalculo';
import { ErrorSolicitud, solicitar } from './cliente-api';

export function useDependencias(proyectoId: number | null) {
  return useQuery<DependenciaTarea[]>({
    queryKey: ['dependencias', proyectoId],
    queryFn: ({ signal }) =>
      solicitar<DependenciaTarea[]>(`/proyectos/${proyectoId}/dependencias`, { signal }),
    enabled: proyectoId !== null && !Number.isNaN(proyectoId) && proyectoId > 0,
  });
}

export function useCrearDependencia(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<ResultadoRecalculo, ErrorSolicitud, CrearDependencia>({
    mutationFn: (datos) =>
      solicitar<ResultadoRecalculo>(`/proyectos/${proyectoId}/dependencias`, {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    onSuccess: (resultado) => {
      queryClient.setQueryData(['tareas', proyectoId], resultado.arbol);
      queryClient.invalidateQueries({ queryKey: ['dependencias', proyectoId] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      mostrarAvisoRecalculo('Dependencia agregada', resultado.tareasAfectadas);
    },
  });
}

export function useEliminarDependencia(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<ResultadoRecalculo, ErrorSolicitud, number>({
    mutationFn: (dependenciaId) =>
      solicitar<ResultadoRecalculo>(`/dependencias/${dependenciaId}`, {
        method: 'DELETE',
      }),
    onSuccess: (resultado) => {
      queryClient.setQueryData(['tareas', proyectoId], resultado.arbol);
      queryClient.invalidateQueries({ queryKey: ['dependencias', proyectoId] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      mostrarAvisoRecalculo('Dependencia eliminada', resultado.tareasAfectadas);
    },
    onError: (error) => {
      notifications.show({
        color: 'red',
        title: 'No se pudo eliminar la dependencia',
        message: error.cuerpo?.mensaje ?? error.message,
      });
    },
  });
}
