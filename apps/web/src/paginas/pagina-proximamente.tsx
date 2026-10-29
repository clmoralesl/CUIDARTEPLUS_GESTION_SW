import { Badge, Card, Center, Stack, Text, Title } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';

interface PaginaProximamenteProps {
  titulo: string;
}

export function PaginaProximamente({ titulo }: PaginaProximamenteProps) {
  return (
    <Center h={360}>
      <Card withBorder radius="md" p="xl" ta="center" maw={450}>
        <Stack align="center" gap="sm">
          <IconClock size={48} stroke={1.5} color="gray" />
          <Title order={3}>{titulo}</Title>
          <Badge color="gray" variant="light" size="lg">
            Próximamente
          </Badge>
          <Text c="dimmed" size="sm">
            Este módulo estará disponible en un próximo issue según la planificación del proyecto.
          </Text>
        </Stack>
      </Card>
    </Center>
  );
}
