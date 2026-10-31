import { useMemo, useState } from 'react';
import {
  Alert,
  Center,
  Container,
  Group,
  Loader,
  Modal,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconPlus } from '@tabler/icons-react';
import { formatearFecha, type HitoConEstado } from '@autofix/core';
import { useEliminarHito, useHitos } from '../api/hitos';
import { useProyecto } from '../api/proyectos';
import { BotonProtegido } from '../componentes/boton-protegido';
import { FormularioHito } from '../hitos/formulario-hito';
import { TablaHitos } from '../hitos/tabla-hitos';
import { AvisoProyectoCerrado } from '../proyectos/aviso-proyecto-cerrado';
import { useSesion } from '../sesion/proveedor-sesion';
import { usePermisos } from '../sesion/use-permisos';

export function PaginaHitos() {
  const { proyectoActivoId } = useSesion();
  const { puede } = usePermisos();

  const { data: proyecto, isLoading: cargandoProyecto } = useProyecto(proyectoActivoId ?? 0);
  const {
    data: listaHitos,
    isLoading: cargandoHitos,
    isError: errorHitos,
    error: falloHitos,
  } = useHitos(proyectoActivoId);
  const eliminarMutacion = useEliminarHito(proyectoActivoId ?? 0);

  const [filtro, setFiltro] = useState<string>('TODOS');
  const [modal, setModal] = useState<{
    abierto: boolean;
    modo: 'crear' | 'editar';
    hito?: HitoConEstado;
  }>({
    abierto: false,
    modo: 'crear',
  });

  const editable = puede('editarPlanificacion', proyecto?.estado);
  const cerrarModal = () => setModal((prev) => ({ ...prev, abierto: false }));

  const hitos = useMemo(() => listaHitos?.hitos ?? [], [listaHitos]);

  const conteos = useMemo(() => {
    const c: Record<string, number> = {
      TODOS: hitos.length,
      CUMPLIDO: 0,
      EN_RIESGO: 0,
      ATRASADO: 0,
      PENDIENTE: 0,
    };
    for (const h of hitos) {
      c[h.estado] = (c[h.estado] ?? 0) + 1;
    }
    return c;
  }, [hitos]);

  const hitosFiltrados = useMemo(() => {
    if (filtro === 'TODOS') return hitos;
    return hitos.filter((h) => h.estado === filtro);
  }, [hitos, filtro]);

  if (!proyectoActivoId) {
    return (
      <Container size="xl" py="xl">
        <Alert color="blue" title="Sin proyecto activo" icon={<IconAlertCircle size={18} />}>
          Seleccione un proyecto en la barra superior.
        </Alert>
      </Container>
    );
  }

  if (cargandoProyecto || cargandoHitos) {
    return (
      <Container size="xl" py="xl">
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {proyecto?.estado === 'CERRADO' && <AvisoProyectoCerrado />}

        <Group justify="space-between" align="center" wrap="wrap">
          <Stack gap={2}>
            <Title order={2}>Hitos: {proyecto?.nombre}</Title>
            {listaHitos?.fechaCalculo && (
              <Text size="sm" c="dimmed">
                Estados calculados al {formatearFecha(listaHitos.fechaCalculo)}
              </Text>
            )}
          </Stack>

          <BotonProtegido
            permiso="editarPlanificacion"
            estadoProyecto={proyecto?.estado}
            leftSection={<IconPlus size={16} />}
            onClick={() => setModal({ abierto: true, modo: 'crear' })}
          >
            Nuevo hito
          </BotonProtegido>
        </Group>

        <Paper p="sm" withBorder>
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <SegmentedControl
              value={filtro}
              onChange={setFiltro}
              data={[
                { label: `Todos (${conteos.TODOS})`, value: 'TODOS' },
                { label: `Cumplido (${conteos.CUMPLIDO})`, value: 'CUMPLIDO' },
                { label: `En riesgo (${conteos.EN_RIESGO})`, value: 'EN_RIESGO' },
                { label: `Atrasado (${conteos.ATRASADO})`, value: 'ATRASADO' },
                { label: `Pendiente (${conteos.PENDIENTE})`, value: 'PENDIENTE' },
              ]}
            />
          </Group>
        </Paper>

        {errorHitos ? (
          <Alert color="red" title="Error al cargar hitos" icon={<IconAlertCircle size={18} />}>
            {falloHitos?.message ?? 'No se pudieron cargar los hitos del proyecto.'}
          </Alert>
        ) : (
          <TablaHitos
            hitos={hitosFiltrados}
            estadoProyecto={proyecto?.estado}
            editable={editable}
            alEditar={(hito) => setModal({ abierto: true, modo: 'editar', hito })}
            alEliminar={(hito) => eliminarMutacion.mutate(hito.id)}
          />
        )}

        <Modal
          opened={modal.abierto}
          onClose={cerrarModal}
          title={
            modal.modo === 'crear' ? 'Nuevo hito' : editable ? 'Editar hito' : 'Detalle del hito'
          }
          size="lg"
        >
          {modal.abierto && (
            <FormularioHito
              key={modal.hito?.id ?? 'nuevo'}
              modo={modal.modo}
              proyectoId={proyectoActivoId}
              hito={modal.hito}
              alCerrar={cerrarModal}
            />
          )}
        </Modal>
      </Stack>
    </Container>
  );
}
