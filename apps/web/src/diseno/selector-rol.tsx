import { Group, SegmentedControl, Text, Tooltip } from '@mantine/core';
import { NOMBRES_ROL, Rol, ROLES } from '@cuidarte/core';
import { useSesion } from '../sesion/proveedor-sesion';

export function SelectorRol() {
  const { rol, cambiarRol } = useSesion();

  return (
    <Group gap="xs">
      <Text size="sm" fw={500}>
        Rol:
      </Text>
      <SegmentedControl
        value={rol}
        onChange={(valor) => cambiarRol(valor as Rol)}
        data={ROLES.map((r) => ({
          value: r,
          label: (
            <Tooltip key={r} label={NOMBRES_ROL[r]}>
              <span>{r}</span>
            </Tooltip>
          ),
        }))}
      />
    </Group>
  );
}
