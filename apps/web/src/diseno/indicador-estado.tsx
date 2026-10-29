import { Badge, Tooltip } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { ErrorSolicitud, solicitar } from '../api/cliente-api';

interface RespuestaSalud {
  estado: 'ok' | 'error';
  bd: string;
}

export function IndicadorEstado() {
  const { data, error, isLoading } = useQuery<RespuestaSalud, ErrorSolicitud>({
    queryKey: ['salud'],
    queryFn: () => solicitar<RespuestaSalud>('/salud'),
    refetchInterval: 15_000,
    meta: { silenciarError: true },
  });

  if (isLoading) {
    return (
      <Badge color="gray" variant="light" size="sm">
        Comprobando...
      </Badge>
    );
  }

  if (error?.estado === 503) {
    return (
      <Tooltip label="La API responde pero la base de datos no está disponible">
        <Badge color="yellow" variant="light" size="sm">
          BD caída
        </Badge>
      </Tooltip>
    );
  }

  if (!error && data?.estado === 'ok') {
    return (
      <Badge color="green" variant="light" size="sm">
        API y BD operativas
      </Badge>
    );
  }

  return (
    <Tooltip label="No se puede establecer conexión con el backend local">
      <Badge color="red" variant="light" size="sm">
        Sin conexión con la API
      </Badge>
    </Tooltip>
  );
}
