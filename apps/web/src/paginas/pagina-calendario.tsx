import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Alert,
  Button,
  Card,
  Center,
  Checkbox,
  Container,
  Divider,
  Group,
  Loader,
  NumberInput,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCalendar,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import {
  DIAS_SEMANA_EN_PANTALLA,
  esquemaActualizarCalendario,
  esquemaCrearFeriado,
  formatearFecha,
  validar,
  type FeriadoCalendario,
} from '@autofix/core';
import {
  useActualizarCalendario,
  useCalendario,
  useCrearFeriado,
  useEliminarFeriado,
} from '../api/calendario';
import { useProyecto } from '../api/proyectos';
import { AccionProtegida, BotonProtegido } from '../componentes/boton-protegido';
import { cargarErroresServidor } from '../componentes/formularios/validador-formulario';
import { AvisoProyectoCerrado } from '../proyectos/aviso-proyecto-cerrado';
import { useSesion } from '../sesion/proveedor-sesion';
import { usePermisos } from '../sesion/use-permisos';

const aFechaString = (val: unknown): string | null => {
  if (!val) return null;
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'string') return val.slice(0, 10);
  return null;
};

export function PaginaCalendario() {
  const { proyectoId } = useParams();
  const navigate = useNavigate();
  const idNumerico = Number(proyectoId);

  const {
    data: proyecto,
    isLoading: cargandoProyecto,
    isError: errorProyecto,
  } = useProyecto(idNumerico, { silenciarError: true });
  const { data: calendario, isLoading: cargandoCalendario } = useCalendario(idNumerico);

  const actualizarMutacion = useActualizarCalendario(idNumerico);
  const crearFeriadoMutacion = useCrearFeriado(idNumerico);
  const eliminarFeriadoMutacion = useEliminarFeriado(idNumerico);

  const { cambiarProyecto } = useSesion();

  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [horasPorDia, setHorasPorDia] = useState<number | string>(8);

  const formFeriado = useForm<{ fecha: string | null; descripcion: string }>({
    initialValues: {
      fecha: null,
      descripcion: '',
    },
    validate: (valores) => {
      const res = validar(esquemaCrearFeriado, {
        fecha: valores.fecha ?? '',
        descripcion: valores.descripcion,
      });
      if (res.ok) return {};
      const err: Record<string, string> = {};
      for (const d of res.detalles) {
        err[d.campo] ??= d.mensaje;
      }
      return err;
    },
  });

  const { puede } = usePermisos();

  const idCargado = proyecto?.id;
  useEffect(() => {
    if (idCargado !== undefined) cambiarProyecto(idCargado);
  }, [idCargado, cambiarProyecto]);

  const diasGuardados = calendario?.diasLaborables.join(',');
  const horasGuardadas = calendario?.horasPorDia;

  useEffect(() => {
    if (diasGuardados !== undefined) setDiasSeleccionados(diasGuardados.split(','));
    if (horasGuardadas !== undefined) setHorasPorDia(horasGuardadas);
  }, [diasGuardados, horasGuardadas]);

  if (cargandoProyecto || cargandoCalendario) {
    return (
      <Container size="xl" py="xl">
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (errorProyecto || !proyecto || Number.isNaN(idNumerico) || idNumerico <= 0) {
    return (
      <Container size="xl" py="xl">
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/proyectos')}
            w="fit-content"
          >
            Volver a proyectos
          </Button>
          <Alert color="red" title="Proyecto no encontrado" icon={<IconAlertCircle size={16} />}>
            El proyecto solicitado no existe o el identificador es inválido.
          </Alert>
        </Stack>
      </Container>
    );
  }

  const soloLectura = !puede('editarPlanificacion', proyecto.estado);

  const onGuardarCalendario = () => {
    const diasNumeros = diasSeleccionados.map(Number);
    const horasNum = typeof horasPorDia === 'string' ? parseFloat(horasPorDia) : horasPorDia;

    const resValidacion = validar(esquemaActualizarCalendario, {
      diasLaborables: diasNumeros,
      horasPorDia: horasNum,
    });
    if (!resValidacion.ok) {
      notifications.show({
        color: 'red',
        title: 'Validación fallida',
        message: resValidacion.detalles[0]?.mensaje ?? 'Revise los campos.',
      });
      return;
    }

    actualizarMutacion.mutate({
      diasLaborables: diasNumeros,
      horasPorDia: horasNum,
    });
  };

  const onAgregarFeriado = (valores: { fecha: string | null; descripcion: string }) => {
    if (!valores.fecha) {
      formFeriado.setFieldError('fecha', 'Ingrese la fecha.');
      return;
    }
    crearFeriadoMutacion.mutate(
      {
        fecha: valores.fecha,
        descripcion: valores.descripcion,
      },
      {
        onSuccess: () => {
          formFeriado.reset();
        },
        onError: (err) => {
          cargarErroresServidor(formFeriado, err);
        },
      },
    );
  };

  const onEliminarFeriado = (feriado: FeriadoCalendario) => {
    modals.openConfirmModal({
      title: 'Confirmar eliminación de feriado',
      children: (
        <Text size="sm">
          ¿Está seguro de eliminar el feriado «{feriado.descripcion}» del{' '}
          {formatearFecha(feriado.fecha)}?
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: () => eliminarFeriadoMutacion.mutate(feriado.id),
    });
  };

  const feriados = calendario?.feriados ?? [];

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {proyecto.estado === 'CERRADO' && <AvisoProyectoCerrado />}

        <div>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate(`/proyectos/${proyecto.id}`)}
            size="xs"
            mb="xs"
          >
            Volver al proyecto
          </Button>
          <Group gap="sm" align="center">
            <IconCalendar size={28} />
            <Title order={2}>Calendario laboral: {proyecto.nombre}</Title>
          </Group>
        </div>

        <Card withBorder padding="lg">
          <Stack gap="md">
            <Title order={4}>Días laborables y jornada</Title>
            <Text size="sm" c="dimmed">
              Configure los días de la semana en los que se trabaja y la duración habitual de la
              jornada diaria.
            </Text>

            <Checkbox.Group
              label="Días laborables"
              value={diasSeleccionados}
              onChange={setDiasSeleccionados}
            >
              <Group mt="xs" wrap="wrap" gap="md">
                {DIAS_SEMANA_EN_PANTALLA.map((dia) => (
                  <Checkbox
                    key={dia.valor}
                    value={String(dia.valor)}
                    label={dia.nombre}
                    disabled={soloLectura}
                  />
                ))}
              </Group>
            </Checkbox.Group>

            <NumberInput
              label="Horas por día"
              description="Se usará en el cálculo de costos"
              value={horasPorDia}
              onChange={setHorasPorDia}
              min={0.01}
              max={24}
              decimalScale={2}
              style={{ maxWidth: 260 }}
              disabled={soloLectura}
            />

            <Group justify="flex-start" mt="xs">
              <BotonProtegido
                permiso="editarPlanificacion"
                estadoProyecto={proyecto.estado}
                loading={actualizarMutacion.isPending}
                onClick={onGuardarCalendario}
              >
                Guardar calendario
              </BotonProtegido>
            </Group>
          </Stack>
        </Card>

        <Card withBorder padding="lg">
          <Stack gap="md">
            <Title order={4}>Feriados del proyecto</Title>
            <Text size="sm" c="dimmed">
              Los feriados excluyen días laborables en la planificación de tareas y recálculos.
            </Text>

            <form onSubmit={formFeriado.onSubmit(onAgregarFeriado)} noValidate>
              <Group align="flex-end" wrap="wrap" gap="md">
                <DateInput
                  label="Fecha"
                  placeholder="DD-MM-AAAA"
                  valueFormat="DD-MM-YYYY"
                  clearable
                  value={
                    formFeriado.values.fecha
                      ? new Date(`${formFeriado.values.fecha}T00:00:00`)
                      : null
                  }
                  onChange={(val) => formFeriado.setFieldValue('fecha', aFechaString(val))}
                  error={formFeriado.errors.fecha}
                  disabled={soloLectura}
                  style={{ minWidth: 180 }}
                />

                <TextInput
                  label="Descripción"
                  placeholder="Nombre o motivo del feriado"
                  {...formFeriado.getInputProps('descripcion')}
                  disabled={soloLectura}
                  style={{ flex: 1, minWidth: 240 }}
                />

                <BotonProtegido
                  type="submit"
                  permiso="editarPlanificacion"
                  estadoProyecto={proyecto.estado}
                  leftSection={<IconPlus size={16} />}
                  loading={crearFeriadoMutacion.isPending}
                >
                  Agregar feriado
                </BotonProtegido>
              </Group>
            </form>

            <Divider my="sm" />

            {feriados.length === 0 ? (
              <Center py="lg">
                <Text c="dimmed">Sin feriados registrados</Text>
              </Center>
            ) : (
              <Table.ScrollContainer minWidth={600}>
                <Table verticalSpacing="xs" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 140 }}>Fecha</Table.Th>
                      <Table.Th>Descripción</Table.Th>
                      <Table.Th style={{ width: 90 }}>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {feriados.map((f) => (
                      <Table.Tr key={f.id}>
                        <Table.Td style={{ whiteSpace: 'nowrap' }}>
                          {formatearFecha(f.fecha)}
                        </Table.Td>
                        <Table.Td>{f.descripcion}</Table.Td>
                        <Table.Td>
                          <AccionProtegida
                            permiso="editarPlanificacion"
                            estadoProyecto={proyecto.estado}
                            tooltip={`Eliminar feriado del ${formatearFecha(f.fecha)}`}
                            aria-label={`Eliminar feriado del ${formatearFecha(f.fecha)}`}
                            color="red"
                            variant="subtle"
                            loading={
                              eliminarFeriadoMutacion.isPending &&
                              eliminarFeriadoMutacion.variables === f.id
                            }
                            onClick={() => onEliminarFeriado(f)}
                          >
                            <IconTrash size={16} />
                          </AccionProtegida>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
