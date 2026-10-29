import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Badge,
  Card,
  Group,
  Loader,
  Modal,
  Progress,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import {
  coincideBusqueda,
  formatearFecha,
  formatearMonto,
  formatearPorcentaje,
  NOMBRES_ESTADO_PROYECTO,
  type EstadoProyecto,
} from '@autofix/core';
import { useProyectos } from '../api/proyectos';
import { BotonProtegido } from '../componentes/boton-protegido';
import { FormularioProyecto } from '../proyectos/formulario-proyecto';

const COLORES_ESTADO: Record<EstadoProyecto, string> = {
  PLANIFICADO: 'blue',
  EN_CURSO: 'teal',
  CERRADO: 'gray',
};

export function PaginaProyectos() {
  const navigate = useNavigate();
  const { data: proyectos, isLoading } = useProyectos();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced] = useDebouncedValue(busqueda, 200);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  const proyectosFiltrados = (proyectos ?? []).filter((proyecto) => {
    const coincideTexto =
      coincideBusqueda(proyecto.nombre, busquedaDebounced) ||
      coincideBusqueda(proyecto.responsable, busquedaDebounced);

    const coincideEst = filtroEstado === 'TODOS' || proyecto.estado === filtroEstado;

    return coincideTexto && coincideEst;
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>Proyectos</Title>
          <Text c="dimmed" size="sm">
            Gestión y portafolio de proyectos
          </Text>
        </div>
        <BotonProtegido
          permiso="editarPlanificacion"
          leftSection={<IconPlus size={16} />}
          onClick={() => setModalAbierto(true)}
        >
          Nuevo proyecto
        </BotonProtegido>
      </Group>

      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <TextInput
            placeholder="Buscar por nombre o responsable..."
            leftSection={<IconSearch size={16} />}
            value={busqueda}
            onChange={(e) => setBusqueda(e.currentTarget.value)}
            style={{ flexGrow: 1, minWidth: 260 }}
          />

          <SegmentedControl
            value={filtroEstado}
            onChange={setFiltroEstado}
            data={[
              { label: 'Todos', value: 'TODOS' },
              { label: 'Planificado', value: 'PLANIFICADO' },
              { label: 'En curso', value: 'EN_CURSO' },
              { label: 'Cerrado', value: 'CERRADO' },
            ]}
          />
        </Group>

        {isLoading ? (
          <Group justify="center" p="xl">
            <Loader size="md" />
          </Group>
        ) : !proyectos || proyectos.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No hay proyectos registrados.
          </Text>
        ) : proyectosFiltrados.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Ningún proyecto coincide con los filtros.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={700}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Responsable</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Presupuesto</Table.Th>
                  <Table.Th style={{ minWidth: 140 }}>Avance</Table.Th>
                  <Table.Th>Inicio</Table.Th>
                  <Table.Th>Fin</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {proyectosFiltrados.map((proyecto) => (
                  <Table.Tr
                    key={proyecto.id}
                    onClick={() => navigate(`/proyectos/${proyecto.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Table.Td fw={500}>{proyecto.nombre}</Table.Td>
                    <Table.Td>{proyecto.responsable}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={COLORES_ESTADO[proyecto.estado] ?? 'gray'}
                        variant="light"
                        size="sm"
                      >
                        {NOMBRES_ESTADO_PROYECTO[proyecto.estado] ?? proyecto.estado}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatearMonto(proyecto.presupuesto)}</Table.Td>
                    <Table.Td>
                      <Stack gap={4}>
                        <Text size="xs" ta="right">
                          {formatearPorcentaje(proyecto.porcentajeAvance)}
                        </Text>
                        <Progress value={proyecto.porcentajeAvance} size="sm" color="teal" />
                      </Stack>
                    </Table.Td>
                    <Table.Td>{formatearFecha(proyecto.fechaInicio)}</Table.Td>
                    <Table.Td>{formatearFecha(proyecto.fechaFin)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      <Modal
        opened={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title="Nuevo proyecto"
        size="lg"
      >
        <FormularioProyecto modo="crear" alCerrar={() => setModalAbierto(false)} />
      </Modal>
    </Stack>
  );
}
