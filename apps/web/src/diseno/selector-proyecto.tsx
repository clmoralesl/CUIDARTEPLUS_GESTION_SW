import { useEffect } from 'react';
import { useMatch, useNavigate } from 'react-router';
import { Select } from '@mantine/core';
import { useProyectos } from '../api/proyectos';
import { useSesion } from '../sesion/proveedor-sesion';

export function SelectorProyecto() {
  const { data: proyectos, isLoading } = useProyectos();
  const { proyectoActivoId, cambiarProyecto } = useSesion();
  const navegar = useNavigate();
  const enDetalle = useMatch('/proyectos/:proyectoId');

  useEffect(() => {
    if (!proyectos) return;

    if (proyectos.length === 0) {
      if (proyectoActivoId !== null) {
        cambiarProyecto(null);
      }
      return;
    }

    const existe = proyectos.some((p) => p.id === proyectoActivoId);
    const primerProyecto = proyectos[0];
    if (!existe && primerProyecto) {
      cambiarProyecto(primerProyecto.id);
    }
  }, [proyectos, proyectoActivoId, cambiarProyecto]);

  if (isLoading) {
    return <Select placeholder="Cargando proyectos..." disabled size="xs" w={220} />;
  }

  if (!proyectos || proyectos.length === 0) {
    return <Select placeholder="Sin proyectos" disabled size="xs" w={220} data={[]} />;
  }

  const opciones = proyectos.map((p) => ({
    value: String(p.id),
    label: p.estado === 'CERRADO' ? `${p.nombre} (Cerrado)` : p.nombre,
  }));

  const alCambiar = (valor: string | null) => {
    const id = valor ? Number(valor) : null;
    cambiarProyecto(id);
    if (enDetalle && id !== null) {
      navegar(`/proyectos/${id}`);
    }
  };

  return (
    <Select
      placeholder="Seleccionar proyecto"
      size="xs"
      w={240}
      data={opciones}
      value={proyectoActivoId !== null ? String(proyectoActivoId) : null}
      onChange={alCambiar}
      allowDeselect={false}
    />
  );
}
