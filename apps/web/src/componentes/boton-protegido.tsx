import { Button, Tooltip, type ButtonProps } from '@mantine/core';
import type { ComponentPropsWithoutRef } from 'react';
import type { Permiso } from '@autofix/core';
import { usePermisos } from '../sesion/use-permisos';

type BotonProtegidoProps = ButtonProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof ButtonProps> & { permiso: Permiso };

export function BotonProtegido({ permiso, onClick, ...props }: BotonProtegidoProps) {
  const { puede, motivo } = usePermisos();
  if (puede(permiso)) return <Button onClick={onClick} {...props} />;
  return (
    <Tooltip label={motivo(permiso)}>
      <Button
        {...props}
        data-disabled
        aria-disabled
        onClick={(evento) => evento.preventDefault()}
      />
    </Tooltip>
  );
}
