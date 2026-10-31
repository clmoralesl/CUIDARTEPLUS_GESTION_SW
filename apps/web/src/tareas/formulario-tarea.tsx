import { useMemo } from 'react';
import { Alert, Button, Group, NumberInput, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
  calendarioLaboralDe,
  esHabil,
  esquemaActualizarTarea,
  esquemaCrearTarea,
  formatearFecha,
  siguienteHabil,
  validar,
  type ActualizarTarea,
  type CrearTarea,
  type NivelTarea,
  type TareaArbol,
} from '@autofix/core';
import { useCalendario } from '../api/calendario';
import { useActualizarTarea, useCrearTarea } from '../api/tareas';
import { cargarErroresServidor } from '../componentes/formularios/validador-formulario';

interface FormularioTareaProps {
  modo: 'crear' | 'editar';
  proyectoId: number;
  tarea?: TareaArbol;
  nivel?: NivelTarea;
  padreId?: number | null;
  padreEsHoja?: boolean;
  alCerrar: () => void;
}

interface ValoresFormulario {
  nombre: string;
  descripcion: string;
  responsable: string;
  duracionDias: number;
  fechaFija: string | null;
  inicioReal: string | null;
  finReal: string | null;
  porcentajeAvance: number;
}

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

export function FormularioTarea({
  modo,
  proyectoId,
  tarea,
  nivel = 'ETAPA',
  padreId = null,
  padreEsHoja = false,
  alCerrar,
}: FormularioTareaProps) {
  const crearMutacion = useCrearTarea(proyectoId);
  const actualizarMutacion = useActualizarTarea(proyectoId);

  const tieneHijas = modo === 'editar' && Boolean(tarea?.tieneHijas);

  const form = useForm<ValoresFormulario>({
    initialValues: {
      nombre: tarea?.nombre ?? '',
      descripcion: tarea?.descripcion ?? '',
      responsable: tarea?.responsable ?? '',
      duracionDias: tarea?.duracionDias ?? 1,
      fechaFija: tarea?.fechaFija ?? null,
      inicioReal: tarea?.inicioReal ?? null,
      finReal: tarea?.finReal ?? null,
      porcentajeAvance: tarea?.porcentajeAvance ?? 0,
    },
    validate: (valores) => {
      if (modo === 'crear') {
        const resultado = validar(esquemaCrearTarea, {
          nombre: valores.nombre,
          descripcion: valores.descripcion,
          responsable: valores.responsable,
          duracionDias: valores.duracionDias,
          fechaFija: valores.fechaFija,
          nivel,
          padreId,
        });
        if (resultado.ok) return {};
        const errores: Record<string, string> = {};
        for (const { campo, mensaje } of resultado.detalles) {
          errores[campo] ??= mensaje;
        }
        return errores;
      }
      const resultado = validar(esquemaActualizarTarea, valores);
      if (resultado.ok) return {};
      const errores: Record<string, string> = {};
      for (const { campo, mensaje } of resultado.detalles) {
        errores[campo] ??= mensaje;
      }
      return errores;
    },
  });

  const { data: calendarioData } = useCalendario(proyectoId);
  const calendario = useMemo(
    () => (calendarioData ? calendarioLaboralDe(calendarioData) : null),
    [calendarioData],
  );

  const estaCargando = crearMutacion.isPending || actualizarMutacion.isPending;

  const avisoNoHabil =
    form.values.fechaFija && calendario && !esHabil(form.values.fechaFija, calendario)
      ? `La tarea no comenzará antes del ${formatearFecha(
          siguienteHabil(form.values.fechaFija, calendario),
        )}, primer día hábil.`
      : null;

  const alEnviar = (valores: ValoresFormulario) => {
    if (modo === 'crear') {
      const cuerpo: CrearTarea = {
        nivel,
        padreId,
        nombre: valores.nombre,
        descripcion: valores.descripcion.trim() === '' ? null : valores.descripcion,
        responsable: valores.responsable.trim() === '' ? null : valores.responsable,
        duracionDias: valores.duracionDias,
        fechaFija: valores.fechaFija,
      };

      crearMutacion.mutate(cuerpo, {
        onSuccess: () => alCerrar(),
        onError: (error) => cargarErroresServidor(form, error),
      });
    } else {
      if (!tarea) return;

      const cambios: Record<string, unknown> = {};
      if (form.isDirty('nombre')) cambios.nombre = valores.nombre;
      if (form.isDirty('descripcion')) {
        cambios.descripcion = valores.descripcion.trim() === '' ? null : valores.descripcion;
      }
      if (form.isDirty('responsable')) {
        cambios.responsable = valores.responsable.trim() === '' ? null : valores.responsable;
      }

      if (!tieneHijas) {
        if (form.isDirty('duracionDias')) {
          cambios.duracionDias = valores.duracionDias;
        }
        if (form.isDirty('fechaFija')) {
          cambios.fechaFija = valores.fechaFija;
        }
        if (form.isDirty('inicioReal')) {
          cambios.inicioReal = valores.inicioReal;
        }
        if (form.isDirty('finReal')) {
          cambios.finReal = valores.finReal;
        }
        if (form.isDirty('porcentajeAvance')) {
          cambios.porcentajeAvance = valores.porcentajeAvance;
        }
      }

      if (Object.keys(cambios).length === 0) {
        alCerrar();
        return;
      }

      actualizarMutacion.mutate(
        { tareaId: tarea.id, datos: cambios as ActualizarTarea },
        {
          onSuccess: () => alCerrar(),
          onError: (error) => cargarErroresServidor(form, error),
        },
      );
    }
  };

  return (
    <form onSubmit={form.onSubmit(alEnviar)} noValidate>
      <Stack gap="md">
        {modo === 'crear' && padreEsHoja && (
          <Alert color="yellow" title="Atención">
            Esta tarea pasará a calcularse a partir de sus subtareas; su avance y sus fechas
            actuales se reemplazarán.
          </Alert>
        )}

        {tieneHijas && (
          <Alert color="blue" title="Tarea con subtareas">
            Esta tarea se calcula a partir de sus subtareas; sus fechas, duración y avance se
            calculan automáticamente.
          </Alert>
        )}

        <TextInput
          label="Nombre"
          placeholder="Nombre descriptivo de la tarea"
          withAsterisk
          {...form.getInputProps('nombre')}
        />

        <TextInput
          label="Responsable"
          placeholder="Responsable o rol asignado"
          {...form.getInputProps('responsable')}
        />

        <Textarea
          label="Descripción"
          placeholder="Detalles adicionales opcionales"
          autosize
          minRows={2}
          maxRows={6}
          {...form.getInputProps('descripcion')}
        />

        {!tieneHijas && (
          <>
            <Group grow align="flex-start">
              <NumberInput
                label="Duración (días hábiles)"
                min={0}
                max={3650}
                allowDecimal={false}
                withAsterisk
                {...form.getInputProps('duracionDias')}
              />

              <div>
                <DateInput
                  label="Fecha fija (no comenzar antes de)"
                  placeholder="DD-MM-AAAA"
                  valueFormat="DD-MM-YYYY"
                  clearable
                  value={
                    form.values.fechaFija ? new Date(`${form.values.fechaFija}T00:00:00`) : null
                  }
                  onChange={(val) => form.setFieldValue('fechaFija', aFechaString(val))}
                  error={form.errors.fechaFija}
                />
                {avisoNoHabil && (
                  <Text size="xs" c="orange.8" mt={4}>
                    {avisoNoHabil}
                  </Text>
                )}
              </div>
            </Group>

            {modo === 'editar' && (
              <Group grow align="flex-start">
                <TextInput
                  label="Inicio calculado"
                  value={tarea?.inicioPlan ? formatearFecha(tarea.inicioPlan) : '—'}
                  readOnly
                  disabled
                />
                <TextInput
                  label="Fin calculado"
                  value={tarea?.finPlan ? formatearFecha(tarea.finPlan) : '—'}
                  readOnly
                  disabled
                />
              </Group>
            )}

            <Group grow align="flex-start">
              <DateInput
                label="Inicio real"
                placeholder="DD-MM-AAAA"
                valueFormat="DD-MM-YYYY"
                clearable
                value={
                  form.values.inicioReal ? new Date(`${form.values.inicioReal}T00:00:00`) : null
                }
                onChange={(val) => form.setFieldValue('inicioReal', aFechaString(val))}
                error={form.errors.inicioReal}
              />

              <DateInput
                label="Fin real"
                placeholder="DD-MM-AAAA"
                valueFormat="DD-MM-YYYY"
                clearable
                value={form.values.finReal ? new Date(`${form.values.finReal}T00:00:00`) : null}
                onChange={(val) => form.setFieldValue('finReal', aFechaString(val))}
                error={form.errors.finReal}
              />

              <NumberInput
                label="Porcentaje de avance"
                min={0}
                max={100}
                decimalScale={2}
                suffix=" %"
                {...form.getInputProps('porcentajeAvance')}
              />
            </Group>
          </>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={alCerrar} disabled={estaCargando}>
            Cancelar
          </Button>
          <Button type="submit" loading={estaCargando}>
            {modo === 'crear' ? 'Crear tarea' : 'Guardar cambios'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
