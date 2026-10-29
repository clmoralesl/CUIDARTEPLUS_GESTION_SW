import { Alert } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';

export function AvisoProyectoCerrado() {
  return (
    <Alert variant="light" color="gray" title="Proyecto cerrado" icon={<IconLock size={16} />}>
      Este proyecto se encuentra cerrado y opera en modo de solo lectura. No admite modificaciones
      ni puede ser reabierto.
    </Alert>
  );
}
