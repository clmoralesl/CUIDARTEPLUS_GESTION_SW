import { ActionIcon, Badge, Box, Group, Progress, Table, Text, Tooltip } from '@mantine/core';
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsMove,
  IconChevronDown,
  IconChevronRight,
  IconPencil,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import {
  formatearDuracion,
  formatearFecha,
  formatearPorcentaje,
  NOMBRES_NIVEL,
  type EstadoProyecto,
  type TareaArbol,
} from '@autofix/core';
import { AccionProtegida } from '../componentes/boton-protegido';

interface FilaTareaProps {
  tarea: TareaArbol;
  colapsada: boolean;
  estadoProyecto?: EstadoProyecto;
  esPrimera: boolean;
  esUltima: boolean;
  onToggleColapso: (id: number) => void;
  onAgregarHija: (tarea: TareaArbol) => void;
  onEditar: (tarea: TareaArbol) => void;
  onSubir: (tarea: TareaArbol) => void;
  onBajar: (tarea: TareaArbol) => void;
  onMover: (tarea: TareaArbol) => void;
  onEliminar: (tarea: TareaArbol) => void;
}

const colorNivel = (nivel: string) => {
  if (nivel === 'ETAPA') return 'blue';
  if (nivel === 'ACTIVIDAD') return 'cyan';
  return 'teal';
};

export function FilaTarea({
  tarea,
  colapsada,
  estadoProyecto,
  esPrimera,
  esUltima,
  onToggleColapso,
  onAgregarHija,
  onEditar,
  onSubir,
  onBajar,
  onMover,
  onEliminar,
}: FilaTareaProps) {
  const sangria = tarea.nivel === 'ETAPA' ? 0 : tarea.nivel === 'ACTIVIDAD' ? 24 : 48;

  const renderDatoCalculado = (valor: string | null) => {
    const texto = valor ?? '—';
    if (!tarea.tieneHijas) {
      return (
        <Text size="sm" style={{ whiteSpace: 'nowrap' }}>
          {texto}
        </Text>
      );
    }
    return (
      <Tooltip label="Calculado a partir de sus subtareas, en días hábiles">
        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {texto}
        </Text>
      </Tooltip>
    );
  };

  return (
    <Table.Tr>
      <Table.Td>
        <Text size="sm" fw={500}>
          {tarea.codigo}
        </Text>
      </Table.Td>

      <Table.Td>
        <Group gap="xs" wrap="nowrap" style={{ paddingLeft: `${sangria}px` }}>
          {tarea.tieneHijas ? (
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={() => onToggleColapso(tarea.id)}
              aria-label={colapsada ? 'Expandir subtareas' : 'Colapsar subtareas'}
            >
              {colapsada ? <IconChevronRight size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          ) : (
            <Box w={22} />
          )}
          <Text
            size="sm"
            fw={tarea.nivel === 'ETAPA' ? 600 : tarea.nivel === 'ACTIVIDAD' ? 500 : 400}
          >
            {tarea.nombre}
          </Text>
        </Group>
      </Table.Td>

      <Table.Td>
        <Badge
          size="sm"
          variant="light"
          color={colorNivel(tarea.nivel)}
          style={{ whiteSpace: 'nowrap' }}
        >
          {NOMBRES_NIVEL[tarea.nivel]}
        </Badge>
      </Table.Td>

      <Table.Td>{renderDatoCalculado(formatearFecha(tarea.inicioPlan))}</Table.Td>

      <Table.Td>{renderDatoCalculado(formatearFecha(tarea.finPlan))}</Table.Td>

      <Table.Td>{renderDatoCalculado(formatearDuracion(tarea.duracionDias))}</Table.Td>

      <Table.Td>{renderDatoCalculado(formatearFecha(tarea.inicioReal))}</Table.Td>

      <Table.Td>{renderDatoCalculado(formatearFecha(tarea.finReal))}</Table.Td>

      <Table.Td>
        <Group gap="xs" wrap="nowrap" style={{ minWidth: 100 }}>
          <Progress value={tarea.porcentajeAvance} size="sm" style={{ flex: 1 }} />
          {tarea.tieneHijas ? (
            <Tooltip label="Calculado a partir de sus subtareas">
              <Text size="xs" c="dimmed" style={{ minWidth: 42 }}>
                {formatearPorcentaje(tarea.porcentajeAvance)}
              </Text>
            </Tooltip>
          ) : (
            <Text size="xs" style={{ minWidth: 42 }}>
              {formatearPorcentaje(tarea.porcentajeAvance)}
            </Text>
          )}
        </Group>
      </Table.Td>

      <Table.Td>
        <Text size="sm">{tarea.responsable ?? '—'}</Text>
      </Table.Td>

      <Table.Td>
        <Group gap={4} wrap="nowrap">
          {tarea.nivel === 'ETAPA' && (
            <AccionProtegida
              size="sm"
              variant="subtle"
              color="blue"
              permiso="editarPlanificacion"
              estadoProyecto={estadoProyecto}
              tooltip="Agregar actividad"
              onClick={() => onAgregarHija(tarea)}
            >
              <IconPlus size={16} />
            </AccionProtegida>
          )}

          {tarea.nivel === 'ACTIVIDAD' && (
            <AccionProtegida
              size="sm"
              variant="subtle"
              color="blue"
              permiso="editarPlanificacion"
              estadoProyecto={estadoProyecto}
              tooltip="Agregar subactividad"
              onClick={() => onAgregarHija(tarea)}
            >
              <IconPlus size={16} />
            </AccionProtegida>
          )}

          <AccionProtegida
            size="sm"
            variant="subtle"
            permiso="editarPlanificacion"
            estadoProyecto={estadoProyecto}
            tooltip="Editar"
            onClick={() => onEditar(tarea)}
          >
            <IconPencil size={16} />
          </AccionProtegida>

          <AccionProtegida
            size="sm"
            variant="subtle"
            permiso="editarPlanificacion"
            estadoProyecto={estadoProyecto}
            tooltip="Subir"
            disabled={esPrimera}
            onClick={() => onSubir(tarea)}
          >
            <IconArrowUp size={16} />
          </AccionProtegida>

          <AccionProtegida
            size="sm"
            variant="subtle"
            permiso="editarPlanificacion"
            estadoProyecto={estadoProyecto}
            tooltip="Bajar"
            disabled={esUltima}
            onClick={() => onBajar(tarea)}
          >
            <IconArrowDown size={16} />
          </AccionProtegida>

          {tarea.nivel !== 'ETAPA' && (
            <AccionProtegida
              size="sm"
              variant="subtle"
              permiso="editarPlanificacion"
              estadoProyecto={estadoProyecto}
              tooltip="Mover a..."
              onClick={() => onMover(tarea)}
            >
              <IconArrowsMove size={16} />
            </AccionProtegida>
          )}

          <AccionProtegida
            size="sm"
            variant="subtle"
            color="red"
            permiso="editarPlanificacion"
            estadoProyecto={estadoProyecto}
            tooltip="Eliminar"
            onClick={() => onEliminar(tarea)}
          >
            <IconTrash size={16} />
          </AccionProtegida>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
