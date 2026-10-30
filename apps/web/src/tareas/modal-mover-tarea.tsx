import { useState } from 'react';
import { Button, Group, NumberInput, Select, Stack, Text } from '@mantine/core';
import type { TareaArbol } from '@autofix/core';
import { useMoverTarea } from '../api/tareas';

interface ModalMoverTareaProps {
  tarea: TareaArbol;
  tareas: readonly TareaArbol[];
  proyectoId: number;
  alCerrar: () => void;
}

export function ModalMoverTarea({ tarea, tareas, proyectoId, alCerrar }: ModalMoverTareaProps) {
  const moverMutacion = useMoverTarea(proyectoId);

  const nivelPadreEsperado =
    tarea.nivel === 'ACTIVIDAD' ? 'ETAPA' : tarea.nivel === 'SUBACTIVIDAD' ? 'ACTIVIDAD' : null;

  const padresValidos = tareas.filter((t) => t.nivel === nivelPadreEsperado);

  const opcionesPadres = padresValidos.map((p) => ({
    value: String(p.id),
    label: `${p.codigo} · ${p.nombre}`,
  }));

  const [padreIdSeleccionado, setPadreIdSeleccionado] = useState<string | null>(
    tarea.padreId !== null ? String(tarea.padreId) : null,
  );
  const [posicion, setPosicion] = useState<number | ''>(tarea.orden);

  const alConfirmar = () => {
    if (nivelPadreEsperado !== null && !padreIdSeleccionado) return;

    moverMutacion.mutate(
      {
        tareaId: tarea.id,
        datos: {
          padreId: padreIdSeleccionado ? Number(padreIdSeleccionado) : null,
          posicion: typeof posicion === 'number' && posicion > 0 ? posicion : undefined,
        },
      },
      {
        onSuccess: () => alCerrar(),
      },
    );
  };

  return (
    <Stack gap="md">
      <Text size="sm">
        Mover la tarea «{tarea.nombre}» a otro contenedor o cambiar su posición entre hermanas:
      </Text>

      {nivelPadreEsperado !== null && (
        <Select
          label="Nuevo contenedor padre"
          placeholder="Seleccione el nuevo padre"
          data={opcionesPadres}
          value={padreIdSeleccionado}
          onChange={setPadreIdSeleccionado}
          withAsterisk
        />
      )}

      <NumberInput
        label="Posición entre hermanas"
        placeholder="Ej: 1 (primera)"
        min={1}
        allowDecimal={false}
        value={posicion}
        onChange={(val) => setPosicion(typeof val === 'number' ? val : '')}
      />

      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={alCerrar} disabled={moverMutacion.isPending}>
          Cancelar
        </Button>
        <Button
          onClick={alConfirmar}
          loading={moverMutacion.isPending}
          disabled={nivelPadreEsperado !== null && !padreIdSeleccionado}
        >
          Mover tarea
        </Button>
      </Group>
    </Stack>
  );
}
