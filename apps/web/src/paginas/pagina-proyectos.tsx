import { Badge, Card, Group, Loader, Stack, Table, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useProyectos } from '../api/proyectos';
import { BotonProtegido } from '../componentes/boton-protegido';

const NOMBRES_ESTADO: Record<string, string> = {
  PLANIFICADO: 'Planificado',
  EN_CURSO: 'En curso',
  CERRADO: 'Cerrado',
};

const COLORES_ESTADO: Record<string, string> = {
  PLANIFICADO: 'blue',
  EN_CURSO: 'green',
  CERRADO: 'gray',
};

export function PaginaProyectos() {
  const { data: proyectos, isLoading } = useProyectos();

  const manejarNuevoProyecto = () => {
    notifications.show({
      title: 'Nuevo proyecto',
      message: 'Disponible en el issue #5',
      color: 'blue',
    });
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>Proyectos</Title>
          <Text c="dimmed" size="sm">
            Gestión y portafolio de proyectos
          </Text>
        </div>
        <BotonProtegido permiso="editarPlanificacion" onClick={manejarNuevoProyecto}>
          Nuevo proyecto
        </BotonProtegido>
      </Group>

      <Card withBorder radius="md" p="md">
        {isLoading ? (
          <Group justify="center" p="xl">
            <Loader size="md" />
          </Group>
        ) : !proyectos || proyectos.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No hay proyectos registrados.
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {proyectos.map((proyecto) => (
                <Table.Tr key={proyecto.id}>
                  <Table.Td>{proyecto.id}</Table.Td>
                  <Table.Td fw={500}>{proyecto.nombre}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={COLORES_ESTADO[proyecto.estado] ?? 'gray'}
                      variant="light"
                      size="sm"
                    >
                      {NOMBRES_ESTADO[proyecto.estado] ?? proyecto.estado}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}
