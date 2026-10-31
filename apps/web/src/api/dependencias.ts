import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CrearDependencia,
  DependenciaTarea,
  ListaHitos,
  ResultadoRecalculo,
} from '@autofix/core';
import { mostrarAvisosHitos } from '../hitos/aviso-hitos';
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
      const hitosPrevios = queryClient.getQueryData<ListaHitos>(['hitos', proyectoId]);
      queryClient.setQueryData(['tareas', proyectoId], resultado.arbol);
      queryClient.setQueryData(['hitos', proyectoId], resultado.hitos);
      queryClient.invalidateQueries({ queryKey: ['dependencias', proyectoId] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      mostrarAvisoRecalculo('Dependencia agregada', resultado.tareasAfectadas);
      mostrarAvisosHitos(hitosPrevios, resultado.hitos);
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
      const hitosPrevios = queryClient.getQueryData<ListaHitos>(['hitos', proyectoId]);
      queryClient.setQueryData(['tareas', proyectoId], resultado.arbol);
      queryClient.setQueryData(['hitos', proyectoId], resultado.hitos);
      queryClient.invalidateQueries({ queryKey: ['dependencias', proyectoId] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      mostrarAvisoRecalculo('Dependencia eliminada', resultado.tareasAfectadas);
      mostrarAvisosHitos(hitosPrevios, resultado.hitos);
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
