import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Alert,
  Anchor,
  Badge,
  Card,
  Center,
  Container,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconAlertCircle, IconPlus } from '@tabler/icons-react';
import {
  contarDescendientes,
  formatearPorcentaje,
  type NivelTarea,
  type TareaArbol,
} from '@autofix/core';
import { useCalendario } from '../api/calendario';
import { useProyecto } from '../api/proyectos';
import { useArbolTareas, useEliminarTarea, useMoverTarea } from '../api/tareas';
import { BotonProtegido } from '../componentes/boton-protegido';
import { AvisoProyectoCerrado } from '../proyectos/aviso-proyecto-cerrado';
import { useSesion } from '../sesion/proveedor-sesion';
import { DetalleTarea } from '../tareas/detalle-tarea';
import { FormularioTarea } from '../tareas/formulario-tarea';
import { ModalMoverTarea } from '../tareas/modal-mover-tarea';
import { TablaArbolTareas } from '../tareas/tabla-arbol-tareas';

export function PaginaTareas() {
  const { proyectoActivoId } = useSesion();

  const { data: proyecto, isLoading: cargandoProyecto } = useProyecto(proyectoActivoId ?? 0);
  const { data: arbol, isLoading: cargandoArbol } = useArbolTareas(proyectoActivoId);
  const { data: calendario } = useCalendario(proyectoActivoId);

  const moverMutacion = useMoverTarea(proyectoActivoId ?? 0);
  const eliminarMutacion = useEliminarTarea(proyectoActivoId ?? 0);

  const [colapsadas, setColapsadas] = useState<Set<number>>(new Set());
  const [tareaDetalleId, setTareaDetalleId] = useState<number | null>(null);

  useEffect(() => {
    setColapsadas(new Set());
    setTareaDetalleId(null);
  }, [proyectoActivoId]);

  const [modalCrear, setModalCrear] = useState<{
    abierto: boolean;
    nivel: NivelTarea;
    padreId: number | null;
    padreEsHoja: boolean;
    titulo: string;
  }>({
    abierto: false,
    nivel: 'ETAPA',
    padreId: null,
    padreEsHoja: false,
    titulo: 'Nueva etapa',
  });

  const [modalEditar, setModalEditar] = useState<{
    abierto: boolean;
    tarea: TareaArbol | null;
  }>({
    abierto: false,
    tarea: null,
  });

  const [modalMover, setModalMover] = useState<{
    abierto: boolean;
    tarea: TareaArbol | null;
  }>({
    abierto: false,
    tarea: null,
  });

  const onToggleColapso = (id: number) => {
    setColapsadas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  };

  const onAgregarHija = (tareaPadre: TareaArbol) => {
    const siguienteNivel: NivelTarea = tareaPadre.nivel === 'ETAPA' ? 'ACTIVIDAD' : 'SUBACTIVIDAD';
    setModalCrear({
      abierto: true,
      nivel: siguienteNivel,
      padreId: tareaPadre.id,
      padreEsHoja: !tareaPadre.tieneHijas,
      titulo:
        siguienteNivel === 'ACTIVIDAD'
          ? `Nueva actividad en ${tareaPadre.codigo} · ${tareaPadre.nombre}`
          : `Nueva subactividad en ${tareaPadre.codigo} · ${tareaPadre.nombre}`,
    });
  };

  const onEditar = (tarea: TareaArbol) => {
    setModalEditar({
      abierto: true,
      tarea,
    });
  };

  const onMover = (tarea: TareaArbol) => {
    setModalMover({
      abierto: true,
      tarea,
    });
  };

  const onSubir = (tarea: TareaArbol) => {
    if (!arbol) return;
    const hermanas = arbol.tareas
      .filter((t) => t.padreId === tarea.padreId)
      .sort((a, b) => a.orden - b.orden || a.id - b.id);
    const indice = hermanas.findIndex((t) => t.id === tarea.id);
    if (indice > 0) {
      moverMutacion.mutate({
        tareaId: tarea.id,
        datos: {
          padreId: tarea.padreId,
          posicion: indice,
        },
      });
    }
  };

  const onBajar = (tarea: TareaArbol) => {
    if (!arbol) return;
    const hermanas = arbol.tareas
      .filter((t) => t.padreId === tarea.padreId)
      .sort((a, b) => a.orden - b.orden || a.id - b.id);
    const indice = hermanas.findIndex((t) => t.id === tarea.id);
    if (indice >= 0 && indice < hermanas.length - 1) {
      moverMutacion.mutate({
        tareaId: tarea.id,
        datos: {
          padreId: tarea.padreId,
          posicion: indice + 2,
        },
      });
    }
  };

  const onEliminar = (tarea: TareaArbol) => {
    if (!arbol) return;
    const descendientes = contarDescendientes(arbol.tareas, tarea.id);
    const mensaje =
      descendientes > 0
        ? `Se eliminarán ${descendientes + 1} tareas en total (la tarea «${tarea.nombre}» y sus ${descendientes} subtareas). Esta acción no se puede deshacer.`
        : `¿Está seguro de eliminar la tarea «${tarea.nombre}»? Esta acción no se puede deshacer.`;

    modals.openConfirmModal({
      title: 'Confirmar eliminación',
      children: <Text size="sm">{mensaje}</Text>,
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: () => eliminarMutacion.mutate(tarea.id),
    });
  };

  if (!proyectoActivoId) {
    return (
      <Container size="xl" py="xl">
        <Alert color="blue" title="Sin proyecto activo" icon={<IconAlertCircle size={18} />}>
          Seleccione un proyecto en la barra superior.
        </Alert>
      </Container>
    );
  }

  if (cargandoProyecto || cargandoArbol) {
    return (
      <Container size="xl" py="xl">
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  const tareas = arbol?.tareas ?? [];
  const porcentajeAvance = arbol?.porcentajeAvanceProyecto ?? 0;
  const tareaDetalle = tareas.find((t) => t.id === tareaDetalleId) ?? null;

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {proyecto?.estado === 'CERRADO' && <AvisoProyectoCerrado />}

        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="md" align="center">
            <Title order={2}>Tareas: {proyecto?.nombre}</Title>
            <Badge size="lg" variant="light" color="blue">
              Avance: {formatearPorcentaje(porcentajeAvance)}
            </Badge>
            {proyectoActivoId && (
              <Anchor
                component={Link}
                to={`/proyectos/${proyectoActivoId}/calendario`}
                size="sm"
                c="dimmed"
              >
                {calendario
                  ? `Calendario: ${calendario.diasLaborables.join(',') === '1,2,3,4,5' ? 'lunes a viernes' : `${calendario.diasLaborables.length} días laborables`}, ${calendario.feriados.length} feriados`
                  : 'Calendario laboral'}
              </Anchor>
            )}
          </Group>

          <BotonProtegido
            permiso="editarPlanificacion"
            estadoProyecto={proyecto?.estado}
            leftSection={<IconPlus size={16} />}
            onClick={() =>
              setModalCrear({
                abierto: true,
                nivel: 'ETAPA',
                padreId: null,
                padreEsHoja: false,
                titulo: 'Nueva etapa',
              })
            }
          >
            Nueva etapa
          </BotonProtegido>
        </Group>

        {tareas.length === 0 ? (
          <Card withBorder padding="xl">
            <Center py="xl">
              <Stack align="center" gap="xs">
                <Text c="dimmed">Este proyecto aún no tiene tareas.</Text>
                <BotonProtegido
                  permiso="editarPlanificacion"
                  estadoProyecto={proyecto?.estado}
                  leftSection={<IconPlus size={16} />}
                  onClick={() =>
                    setModalCrear({
                      abierto: true,
                      nivel: 'ETAPA',
                      padreId: null,
                      padreEsHoja: false,
                      titulo: 'Nueva etapa',
                    })
                  }
                >
                  Crear primera etapa
                </BotonProtegido>
              </Stack>
            </Center>
          </Card>
        ) : (
          <Card withBorder padding="md">
            <TablaArbolTareas
              tareas={tareas}
              colapsadas={colapsadas}
              estadoProyecto={proyecto?.estado}
              onToggleColapso={onToggleColapso}
              onAgregarHija={onAgregarHija}
              onEditar={onEditar}
              onSubir={onSubir}
              onBajar={onBajar}
              onMover={onMover}
              onEliminar={onEliminar}
              onVerDetalle={(t) => setTareaDetalleId(t.id)}
            />
          </Card>
        )}
      </Stack>

      <Modal
        opened={modalCrear.abierto}
        onClose={() => setModalCrear((prev) => ({ ...prev, abierto: false }))}
        title={modalCrear.titulo}
        size="lg"
      >
        <FormularioTarea
          modo="crear"
          proyectoId={proyectoActivoId}
          nivel={modalCrear.nivel}
          padreId={modalCrear.padreId}
          padreEsHoja={modalCrear.padreEsHoja}
          alCerrar={() => setModalCrear((prev) => ({ ...prev, abierto: false }))}
        />
      </Modal>

      <Modal
        opened={modalEditar.abierto}
        onClose={() => setModalEditar({ abierto: false, tarea: null })}
        title={
          modalEditar.tarea
            ? `Editar tarea: ${modalEditar.tarea.codigo} · ${modalEditar.tarea.nombre}`
            : 'Editar tarea'
        }
        size="lg"
      >
        {modalEditar.tarea && (
          <FormularioTarea
            modo="editar"
            proyectoId={proyectoActivoId}
            tarea={modalEditar.tarea}
            alCerrar={() => setModalEditar({ abierto: false, tarea: null })}
          />
        )}
      </Modal>

      <Modal
        opened={modalMover.abierto}
        onClose={() => setModalMover({ abierto: false, tarea: null })}
        title={
          modalMover.tarea
            ? `Mover tarea: ${modalMover.tarea.codigo} · ${modalMover.tarea.nombre}`
            : 'Mover tarea'
        }
      >
        {modalMover.tarea && (
          <ModalMoverTarea
            tarea={modalMover.tarea}
            tareas={tareas}
            proyectoId={proyectoActivoId}
            alCerrar={() => setModalMover({ abierto: false, tarea: null })}
          />
        )}
      </Modal>

      <DetalleTarea
        tarea={tareaDetalle}
        todasLasTareas={tareas}
        proyectoId={proyectoActivoId}
        estadoProyecto={proyecto?.estado}
        abierto={tareaDetalle !== null}
        alCerrar={() => setTareaDetalleId(null)}
      />
    </Container>
  );
}
