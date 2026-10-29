import { useQuery } from '@tanstack/react-query';
import { solicitar } from './cliente-api';

export type EstadoProyecto = 'PLANIFICADO' | 'EN_CURSO' | 'CERRADO';

export interface ResumenProyecto {
  id: number;
  nombre: string;
  estado: EstadoProyecto;
}

export function useProyectos() {
  return useQuery<ResumenProyecto[]>({
    queryKey: ['proyectos'],
    queryFn: () => solicitar<ResumenProyecto[]>('/proyectos'),
  });
}
