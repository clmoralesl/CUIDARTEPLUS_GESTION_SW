import { ActionIcon, Tooltip, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';

export function InterruptorTema() {
  const { setColorScheme } = useMantineColorScheme();
  const esquemaActual = useComputedColorScheme('light', { getInitialValueInEffect: true });

  const alternar = () => {
    setColorScheme(esquemaActual === 'dark' ? 'light' : 'dark');
  };

  return (
    <Tooltip label={esquemaActual === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
      <ActionIcon
        onClick={alternar}
        variant="default"
        size="lg"
        aria-label="Alternar esquema de color"
      >
        {esquemaActual === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}
