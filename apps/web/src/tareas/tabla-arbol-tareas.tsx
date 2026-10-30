import { Table } from '@mantine/core';
import type { EstadoProyecto, TareaArbol } from '@autofix/core';
import { FilaTarea } from './fila-tarea';
import { filasVisibles } from './filas-visibles';

interface TablaArbolTareasProps {
  tareas: readonly TareaArbol[];
  colapsadas: Set<number>;
  estadoProyecto?: EstadoProyecto;
  onToggleColapso: (id: number) => void;
  onAgregarHija: (tarea: TareaArbol) => void;
  onEditar: (tarea: TareaArbol) => void;
  onSubir: (tarea: TareaArbol) => void;
  onBajar: (tarea: TareaArbol) => void;
  onMover: (tarea: TareaArbol) => void;
  onEliminar: (tarea: TareaArbol) => void;
}

export function TablaArbolTareas({
  tareas,
  colapsadas,
  estadoProyecto,
  onToggleColapso,
  onAgregarHija,
  onEditar,
  onSubir,
  onBajar,
  onMover,
  onEliminar,
}: TablaArbolTareasProps) {
  const visibles = filasVisibles(tareas, colapsadas);

  const hermanasPorPadre = new Map<number | null, TareaArbol[]>();
  for (const t of tareas) {
    const lista = hermanasPorPadre.get(t.padreId) ?? [];
    lista.push(t);
    hermanasPorPadre.set(t.padreId, lista);
  }
  for (const lista of hermanasPorPadre.values()) {
    lista.sort((a, b) => a.orden - b.orden || a.id - b.id);
  }

  return (
    <Table.ScrollContainer minWidth={1150}>
      <Table verticalSpacing="xs" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 70 }}>Código</Table.Th>
            <Table.Th style={{ minWidth: 260 }}>Nombre</Table.Th>
            <Table.Th style={{ width: 110 }}>Nivel</Table.Th>
            <Table.Th style={{ width: 110 }}>Inicio plan</Table.Th>
            <Table.Th style={{ width: 110 }}>Fin plan</Table.Th>
            <Table.Th style={{ width: 130 }}>Duración (días hábiles)</Table.Th>
            <Table.Th style={{ width: 110 }}>Inicio real</Table.Th>
            <Table.Th style={{ width: 110 }}>Fin real</Table.Th>
            <Table.Th style={{ width: 150 }}>Avance</Table.Th>
            <Table.Th style={{ width: 160 }}>Responsable</Table.Th>
            <Table.Th style={{ width: 170 }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visibles.map((tarea) => {
            const hermanas = hermanasPorPadre.get(tarea.padreId) ?? [];
            const esPrimera = hermanas[0]?.id === tarea.id;
            const esUltima = hermanas[hermanas.length - 1]?.id === tarea.id;

            return (
              <FilaTarea
                key={tarea.id}
                tarea={tarea}
                colapsada={colapsadas.has(tarea.id)}
                estadoProyecto={estadoProyecto}
                esPrimera={esPrimera}
                esUltima={esUltima}
                onToggleColapso={onToggleColapso}
                onAgregarHija={onAgregarHija}
                onEditar={onEditar}
                onSubir={onSubir}
                onBajar={onBajar}
                onMover={onMover}
                onEliminar={onEliminar}
              />
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
