import { AppShell, Burger, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router';
import { APP_NOMBRE } from '@autofix/core';
import { IndicadorEstado } from './indicador-estado';
import { InterruptorTema } from './interruptor-tema';
import { MenuLateral } from './menu-lateral';
import { SelectorProyecto } from './selector-proyecto';
import { SelectorRol } from './selector-rol';

export function EstructuraApp() {
  const [abierto, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !abierto },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={abierto} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg">
              {APP_NOMBRE}
            </Text>
          </Group>

          <Group gap="md">
            <SelectorProyecto />
            <SelectorRol />
            <IndicadorEstado />
            <InterruptorTema />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <MenuLateral alNavegar={close} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
