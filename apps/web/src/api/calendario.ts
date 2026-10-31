import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ActualizarCalendario,
  CalendarioProyecto,
  CrearFeriado,
  RespuestaCalendario,
} from '@autofix/core';
import { mostrarAvisoRecalculo } from '../tareas/aviso-recalculo';
import { ErrorSolicitud, solicitar } from './cliente-api';

export function useCalendario(proyectoId: number | null) {
  return useQuery<CalendarioProyecto>({
    queryKey: ['calendario', proyectoId],
    queryFn: ({ signal }) =>
      solicitar<CalendarioProyecto>(`/proyectos/${proyectoId}/calendario`, { signal }),
    enabled: proyectoId !== null && !Number.isNaN(proyectoId) && proyectoId > 0,
  });
}

export function useActualizarCalendario(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<RespuestaCalendario, ErrorSolicitud, ActualizarCalendario>({
    mutationFn: (datos) =>
      solicitar<RespuestaCalendario>(`/proyectos/${proyectoId}/calendario`, {
        method: 'PATCH',
        body: JSON.stringify(datos),
      }),
    onSuccess: (resultado) => {
      queryClient.setQueryData(['calendario', proyectoId], resultado.calendario);
      queryClient.invalidateQueries({ queryKey: ['tareas', proyectoId] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      mostrarAvisoRecalculo('Calendario actualizado', resultado.tareasAfectadas);
    },
  });
}

export function useCrearFeriado(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<RespuestaCalendario, ErrorSolicitud, CrearFeriado>({
    mutationFn: (datos) =>
      solicitar<RespuestaCalendario>(`/proyectos/${proyectoId}/feriados`, {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    onSuccess: (resultado) => {
      queryClient.setQueryData(['calendario', proyectoId], resultado.calendario);
      queryClient.invalidateQueries({ queryKey: ['tareas', proyectoId] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      mostrarAvisoRecalculo('Feriado agregado', resultado.tareasAfectadas);
    },
  });
}

export function useEliminarFeriado(proyectoId: number) {
  const queryClient = useQueryClient();
  return useMutation<RespuestaCalendario, ErrorSolicitud, number>({
    mutationFn: (feriadoId) =>
      solicitar<RespuestaCalendario>(`/feriados/${feriadoId}`, {
        method: 'DELETE',
      }),
    onSuccess: (resultado) => {
      queryClient.setQueryData(['calendario', proyectoId], resultado.calendario);
      queryClient.invalidateQueries({ queryKey: ['tareas', proyectoId] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      mostrarAvisoRecalculo('Feriado eliminado', resultado.tareasAfectadas);
    },
  });
}
