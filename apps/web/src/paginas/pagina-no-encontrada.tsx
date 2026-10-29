import { Button, Card, Center, Stack, Text, Title } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useNavigate } from 'react-router';

export function PaginaNoEncontrada() {
  const navegar = useNavigate();

  return (
    <Center h={360}>
      <Card withBorder radius="md" p="xl" ta="center" maw={450}>
        <Stack align="center" gap="sm">
          <IconAlertTriangle size={48} stroke={1.5} color="orange" />
          <Title order={3}>Página no encontrada</Title>
          <Text c="dimmed" size="sm">
            La ruta solicitada no existe o fue movida.
          </Text>
          <Button variant="light" onClick={() => navegar('/proyectos')}>
            Ir a Proyectos
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}
