import { Button, Tooltip, type ButtonProps } from '@mantine/core';
import type { ComponentPropsWithoutRef } from 'react';
import type { EstadoProyecto, Permiso } from '@autofix/core';
import { usePermisos } from '../sesion/use-permisos';

type BotonProtegidoProps = ButtonProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof ButtonProps> & {
    permiso: Permiso;
    estadoProyecto?: EstadoProyecto;
  };

export function BotonProtegido({
  permiso,
  estadoProyecto,
  onClick,
  ...props
}: BotonProtegidoProps) {
  const { motivoBloqueo } = usePermisos();
  const bloqueo = motivoBloqueo(permiso, estadoProyecto);

  if (!bloqueo) return <Button onClick={onClick} {...props} />;

  return (
    <Tooltip label={bloqueo}>
      <Button
        {...props}
        data-disabled
        aria-disabled
        onClick={(evento) => evento.preventDefault()}
      />
    </Tooltip>
  );
}
