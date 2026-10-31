import type { MantineColor } from '@mantine/core';
import type { EstadoHito } from '@autofix/core';

export const COLOR_ESTADO_HITO: Record<EstadoHito, MantineColor> = {
  CUMPLIDO: 'green',
  EN_RIESGO: 'yellow',
  ATRASADO: 'red',
  PENDIENTE: 'gray',
};
