import { ActionIcon, Badge, Group, Table, Text, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconEye, IconPencil, IconTrash } from '@tabler/icons-react';
import {
  formatearFecha,
  NOMBRES_ESTADO_HITO,
  type EstadoProyecto,
  type HitoConEstado,
} from '@autofix/core';
import { AccionProtegida } from '../componentes/boton-protegido';
import { COLOR_ESTADO_HITO } from './estado-hito';

interface TablaHitosProps {
  hitos: readonly HitoConEstado[];
  estadoProyecto?: EstadoProyecto;
  editable: boolean;
  alEditar: (hito: HitoConEstado) => void;
  alEliminar: (hito: HitoConEstado) => void;
}

export function TablaHitos({
  hitos,
  estadoProyecto,
  editable,
  alEditar,
  alEliminar,
}: TablaHitosProps) {
  if (hitos.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No hay hitos registrados para este filtro.
      </Text>
    );
  }

  const confirmarEliminar = (hito: HitoConEstado) => {
    modals.openConfirmModal({
      title: 'Eliminar hito',
      children: (
        <Text size="sm">
          ¿Está seguro de que desea eliminar el hito «{hito.nombre}»? Esta acción no se puede
          deshacer.
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: () => alEliminar(hito),
    });
  };

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Tarea vinculada</Table.Th>
            <Table.Th>Fecha objetivo</Table.Th>
            <Table.Th>Cumplimiento</Table.Th>
            <Table.Th>Responsable</Table.Th>
            <Table.Th>Días hábiles</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th style={{ width: 90 }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {hitos.map((hito) => {
            const diasTexto =
              hito.estado === 'CUMPLIDO'
                ? '—'
                : hito.estado === 'ATRASADO' && hito.diasHabilesRestantes <= 0
                  ? 'Vencido'
                  : `${hito.diasHabilesRestantes} ${hito.diasHabilesRestantes === 1 ? 'día hábil' : 'días hábiles'}`;

            return (
              <Table.Tr key={hito.id}>
                <Table.Td>
                  <Text fw={500}>{hito.nombre}</Text>
                  {hito.criterio && (
                    <Text size="xs" c="dimmed">
                      {hito.criterio}
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {hito.tarea ? (
                    <Text size="sm">
                      {hito.tarea.codigo} · {hito.tarea.nombre}
                    </Text>
                  ) : (
                    <Text size="sm" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>{formatearFecha(hito.fechaObjetivo)}</Table.Td>
                <Table.Td>
                  {hito.fechaCumplimiento ? formatearFecha(hito.fechaCumplimiento) : '—'}
                </Table.Td>
                <Table.Td>{hito.responsable || '—'}</Table.Td>
                <Table.Td>
                  <Text
                    size="sm"
                    c={diasTexto === 'Vencido' ? 'red' : undefined}
                    fw={diasTexto === 'Vencido' ? 600 : undefined}
                  >
                    {diasTexto}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap={6}>
                    <Badge color={COLOR_ESTADO_HITO[hito.estado]}>
                      {NOMBRES_ESTADO_HITO[hito.estado]}
                    </Badge>
                    {hito.estado === 'CUMPLIDO' && hito.aTiempo === false && (
                      <Badge color="red" variant="light" size="xs">
                        fuera de plazo
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <Tooltip label={editable ? 'Editar hito' : 'Ver hito'}>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        aria-label={
                          editable ? `Editar hito ${hito.nombre}` : `Ver hito ${hito.nombre}`
                        }
                        onClick={() => alEditar(hito)}
                      >
                        {editable ? <IconPencil size={16} /> : <IconEye size={16} />}
                      </ActionIcon>
                    </Tooltip>
                    <AccionProtegida
                      variant="subtle"
                      color="red"
                      permiso="editarPlanificacion"
                      estadoProyecto={estadoProyecto}
                      tooltip={`Eliminar hito ${hito.nombre}`}
                      aria-label={`Eliminar hito ${hito.nombre}`}
                      onClick={() => confirmarEliminar(hito)}
                    >
                      <IconTrash size={16} />
                    </AccionProtegida>
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
