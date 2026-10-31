import { useMemo } from 'react';
import { Button, Group, Select, Stack, TextInput, Textarea } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
  esquemaActualizarHito,
  esquemaCrearHito,
  validar,
  type ActualizarHito,
  type CrearHito,
  type HitoConEstado,
} from '@autofix/core';
import { useActualizarHito, useCrearHito } from '../api/hitos';
import { useProyecto } from '../api/proyectos';
import { useArbolTareas } from '../api/tareas';
import { cargarErroresServidor } from '../componentes/formularios/validador-formulario';
import { usePermisos } from '../sesion/use-permisos';

interface FormularioHitoProps {
  modo: 'crear' | 'editar';
  proyectoId: number;
  hito?: HitoConEstado;
  alCerrar: () => void;
}

interface ValoresFormulario {
  nombre: string;
  fechaObjetivo: string;
  tareaId: string | null;
  criterio: string;
  responsable: string;
  fechaCumplimiento: string | null;
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

export function FormularioHito({ modo, proyectoId, hito, alCerrar }: FormularioHitoProps) {
  const { puede } = usePermisos();
  const { data: proyecto } = useProyecto(proyectoId);
  const editable = puede('editarPlanificacion', proyecto?.estado);

  const crearMutacion = useCrearHito(proyectoId);
  const actualizarMutacion = useActualizarHito(proyectoId);

  const { data: arbol } = useArbolTareas(proyectoId);

  const opcionesTareas = useMemo(() => {
    if (!arbol?.tareas) return [];
    return arbol.tareas.map((t) => ({
      value: String(t.id),
      label: `${t.codigo} · ${t.nombre}`,
    }));
  }, [arbol]);

  const form = useForm<ValoresFormulario>({
    initialValues: {
      nombre: hito?.nombre ?? '',
      fechaObjetivo: hito?.fechaObjetivo ?? '',
      tareaId: hito?.tarea ? String(hito.tarea.id) : null,
      criterio: hito?.criterio ?? '',
      responsable: hito?.responsable ?? '',
      fechaCumplimiento: hito?.fechaCumplimiento ?? null,
    },
    validate: (valores) => {
      const tareaIdNum = valores.tareaId ? Number(valores.tareaId) : null;
      if (modo === 'crear') {
        const payload: CrearHito = {
          nombre: valores.nombre,
          fechaObjetivo: valores.fechaObjetivo,
          tareaId: tareaIdNum,
          criterio: valores.criterio.trim() === '' ? null : valores.criterio,
          responsable: valores.responsable.trim() === '' ? null : valores.responsable,
          fechaCumplimiento: valores.fechaCumplimiento,
        };
        const resultado = validar(esquemaCrearHito, payload);
        if (resultado.ok) return {};
        const errores: Record<string, string> = {};
        for (const { campo, mensaje } of resultado.detalles) {
          errores[campo] ??= mensaje;
        }
        return errores;
      }

      const payload: ActualizarHito = {
        nombre: valores.nombre,
        fechaObjetivo: valores.fechaObjetivo,
        tareaId: tareaIdNum,
        criterio: valores.criterio.trim() === '' ? null : valores.criterio,
        responsable: valores.responsable.trim() === '' ? null : valores.responsable,
        fechaCumplimiento: valores.fechaCumplimiento,
      };
      const resultado = validar(esquemaActualizarHito, payload);
      if (resultado.ok) return {};
      const errores: Record<string, string> = {};
      for (const { campo, mensaje } of resultado.detalles) {
        errores[campo] ??= mensaje;
      }
      return errores;
    },
  });

  const estaCargando = crearMutacion.isPending || actualizarMutacion.isPending;

  const alEnviar = (valores: ValoresFormulario) => {
    const tareaIdNum = valores.tareaId ? Number(valores.tareaId) : null;
    if (modo === 'crear') {
      const cuerpo: CrearHito = {
        nombre: valores.nombre,
        fechaObjetivo: valores.fechaObjetivo,
        tareaId: tareaIdNum,
        criterio: valores.criterio.trim() === '' ? null : valores.criterio,
        responsable: valores.responsable.trim() === '' ? null : valores.responsable,
        fechaCumplimiento: valores.fechaCumplimiento,
      };
      crearMutacion.mutate(cuerpo, {
        onSuccess: () => alCerrar(),
        onError: (error) => cargarErroresServidor(form, error),
      });
    } else {
      if (!hito) return;
      const cuerpo: ActualizarHito = {
        nombre: valores.nombre,
        fechaObjetivo: valores.fechaObjetivo,
        tareaId: tareaIdNum,
        criterio: valores.criterio.trim() === '' ? null : valores.criterio,
        responsable: valores.responsable.trim() === '' ? null : valores.responsable,
        fechaCumplimiento: valores.fechaCumplimiento,
      };
      actualizarMutacion.mutate(
        { hitoId: hito.id, datos: cuerpo },
        {
          onSuccess: () => alCerrar(),
          onError: (error) => cargarErroresServidor(form, error),
        },
      );
    }
  };

  return (
    <form onSubmit={form.onSubmit(alEnviar)}>
      <Stack gap="md">
        <TextInput
          label="Nombre del hito"
          placeholder="Ej. Diseño de la solución aprobado"
          withAsterisk
          disabled={!editable || estaCargando}
          {...form.getInputProps('nombre')}
        />

        <Group grow align="flex-start">
          <DateInput
            label="Fecha objetivo"
            placeholder="DD-MM-AAAA"
            valueFormat="DD-MM-YYYY"
            withAsterisk
            disabled={!editable || estaCargando}
            value={
              form.values.fechaObjetivo ? new Date(`${form.values.fechaObjetivo}T00:00:00`) : null
            }
            onChange={(val) => form.setFieldValue('fechaObjetivo', aFechaString(val) ?? '')}
            error={form.errors.fechaObjetivo}
          />

          <DateInput
            label="Fecha de cumplimiento"
            placeholder="DD-MM-AAAA"
            valueFormat="DD-MM-YYYY"
            clearable
            disabled={!editable || estaCargando}
            value={
              form.values.fechaCumplimiento
                ? new Date(`${form.values.fechaCumplimiento}T00:00:00`)
                : null
            }
            onChange={(val) => form.setFieldValue('fechaCumplimiento', aFechaString(val))}
            error={form.errors.fechaCumplimiento}
          />
        </Group>

        <Select
          label="Tarea vinculada"
          placeholder="Seleccionar tarea (opcional)"
          data={opcionesTareas}
          searchable
          clearable
          disabled={!editable || estaCargando}
          {...form.getInputProps('tareaId')}
        />

        <TextInput
          label="Responsable"
          placeholder="Ej. Jefe de Proyecto"
          disabled={!editable || estaCargando}
          {...form.getInputProps('responsable')}
        />

        <Textarea
          label="Criterio de cumplimiento"
          placeholder="Ej. Acta formal firmada por el cliente"
          rows={3}
          disabled={!editable || estaCargando}
          {...form.getInputProps('criterio')}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={alCerrar} disabled={estaCargando}>
            {editable ? 'Cancelar' : 'Cerrar'}
          </Button>
          {editable && (
            <Button type="submit" loading={estaCargando}>
              {modo === 'crear' ? 'Crear hito' : 'Guardar cambios'}
            </Button>
          )}
        </Group>
      </Stack>
    </form>
  );
}
