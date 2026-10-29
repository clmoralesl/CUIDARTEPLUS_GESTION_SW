import { Badge, NavLink, ScrollArea, Stack } from '@mantine/core';
import {
  IconActivity,
  IconChartBar,
  IconColumns,
  IconFileSpreadsheet,
  IconFlag,
  IconFolders,
  IconGitPullRequest,
  IconHistory,
  IconLayoutKanban,
  IconListCheck,
  IconUsers,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router';
import { MODULOS, Modulo } from '../app/modulos';

const ICONOS_MODULO: Record<string, typeof IconFolders> = {
  proyectos: IconFolders,
  tareas: IconListCheck,
  gantt: IconChartBar,
  recursos: IconUsers,
  hitos: IconFlag,
  kpi: IconActivity,
  cambios: IconGitPullRequest,
  'tablero-proyecto': IconLayoutKanban,
  'tablero-cambio': IconColumns,
  'importar-exportar': IconFileSpreadsheet,
  bitacora: IconHistory,
};

interface MenuLateralProps {
  alNavegar?: () => void;
}

export function MenuLateral({ alNavegar }: MenuLateralProps) {
  const ubicacion = useLocation();

  return (
    <ScrollArea style={{ height: '100%' }}>
      <Stack gap={4} p="xs">
        {MODULOS.map((modulo: Modulo) => {
          const Icono = ICONOS_MODULO[modulo.ruta] ?? IconFolders;
          const estaActivo = ubicacion.pathname.startsWith(`/${modulo.ruta}`);

          return (
            <NavLink
              key={modulo.ruta}
              component={Link}
              to={`/${modulo.ruta}`}
              label={modulo.titulo}
              leftSection={<Icono size={20} stroke={1.5} />}
              rightSection={
                !modulo.disponible ? (
                  <Badge size="xs" variant="light" color="gray">
                    Próximamente
                  </Badge>
                ) : null
              }
              active={estaActivo}
              onClick={alNavegar}
            />
          );
        })}
      </Stack>
    </ScrollArea>
  );
}
