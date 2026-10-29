import { Button, Group, NumberInput, Stack, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
  esquemaActualizarProyecto,
  esquemaCrearProyecto,
  fechaLocalIso,
  PRESUPUESTO_MAXIMO,
  type ActualizarProyecto,
  type ProyectoDetalle,
} from '@autofix/core';
import { useActualizarProyecto, useCrearProyecto } from '../api/proyectos';
import {
  cargarErroresServidor,
  validadorFormulario,
} from '../componentes/formularios/validador-formulario';

interface FormularioProyectoProps {
  modo: 'crear' | 'editar';
  proyecto?: ProyectoDetalle;
  alCerrar: () => void;
}

interface ValoresFormulario {
  nombre: string;
  descripcion: string;
  responsable: string;
  presupuesto: number | '';
  fechaInicio: string;
  fechaFin: string | null;
}

export function FormularioProyecto({ modo, proyecto, alCerrar }: FormularioProyectoProps) {
  const crearMutacion = useCrearProyecto();
  const actualizarMutacion = useActualizarProyecto(proyecto?.id ?? 0);

  const form = useForm<ValoresFormulario>({
    initialValues: {
      nombre: proyecto?.nombre ?? '',
      descripcion: proyecto?.descripcion ?? '',
      responsable: proyecto?.responsable ?? '',
      presupuesto: proyecto?.presupuesto ?? '',
      fechaInicio: proyecto?.fechaInicio ?? fechaLocalIso(),
      fechaFin: proyecto?.fechaFin ?? null,
    },
    validate: validadorFormulario(
      modo === 'crear' ? esquemaCrearProyecto : esquemaActualizarProyecto,
    ),
  });

  const estaCargando = crearMutacion.isPending || actualizarMutacion.isPending;

  const alEnviar = (valores: ValoresFormulario) => {
    if (modo === 'crear') {
      crearMutacion.mutate(
        {
          nombre: valores.nombre,
          descripcion: valores.descripcion.trim() === '' ? null : valores.descripcion,
          responsable: valores.responsable,
          presupuesto: Number(valores.presupuesto),
          fechaInicio: valores.fechaInicio,
          fechaFin: valores.fechaFin || null,
        },
        {
          onSuccess: () => alCerrar(),
          onError: (error) => cargarErroresServidor(form, error),
        },
      );
    } else {
      const cambios: Record<string, unknown> = {};
      if (form.isDirty('nombre')) cambios.nombre = valores.nombre;
      if (form.isDirty('descripcion')) {
        cambios.descripcion = valores.descripcion.trim() === '' ? null : valores.descripcion;
      }
      if (form.isDirty('responsable')) cambios.responsable = valores.responsable;
      if (form.isDirty('presupuesto')) cambios.presupuesto = Number(valores.presupuesto);
      if (form.isDirty('fechaInicio')) cambios.fechaInicio = valores.fechaInicio;
      if (form.isDirty('fechaFin')) cambios.fechaFin = valores.fechaFin || null;

      if (Object.keys(cambios).length === 0) {
        alCerrar();
        return;
      }

      actualizarMutacion.mutate(cambios as ActualizarProyecto, {
        onSuccess: () => alCerrar(),
        onError: (error) => cargarErroresServidor(form, error),
      });
    }
  };

  return (
    <form onSubmit={form.onSubmit(alEnviar)}>
      <Stack gap="md">
        <TextInput
          label="Nombre del proyecto"
          placeholder="Ej: AutoFix · Implementación"
          withAsterisk
          {...form.getInputProps('nombre')}
        />

        <TextInput
          label="Responsable"
          placeholder="Ej: Jefe de Proyecto"
          withAsterisk
          {...form.getInputProps('responsable')}
        />

        <Textarea
          label="Descripción"
          placeholder="Descripción opcional del proyecto"
          autosize
          minRows={2}
          maxRows={6}
          {...form.getInputProps('descripcion')}
        />

        <NumberInput
          label="Presupuesto"
          placeholder="0"
          withAsterisk
          thousandSeparator="."
          decimalSeparator=","
          decimalScale={2}
          allowNegative={false}
          max={PRESUPUESTO_MAXIMO}
          prefix="$ "
          {...form.getInputProps('presupuesto')}
        />

        <Group grow align="flex-start">
          <DateInput
            label="Fecha de inicio"
            placeholder="DD-MM-AAAA"
            valueFormat="DD-MM-YYYY"
            withAsterisk
            {...form.getInputProps('fechaInicio')}
          />

          <DateInput
            label="Fecha de término (opcional)"
            placeholder="DD-MM-AAAA"
            valueFormat="DD-MM-YYYY"
            clearable
            {...form.getInputProps('fechaFin')}
          />
        </Group>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={alCerrar} disabled={estaCargando}>
            Cancelar
          </Button>
          <Button type="submit" loading={estaCargando}>
            {modo === 'crear' ? 'Crear proyecto' : 'Guardar cambios'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
