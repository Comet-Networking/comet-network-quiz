import { Stack, Text, Title } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/play')({ component: PlayPage });

export function PlayPage() {
  return (
    <Stack>
      <Title order={2}>Join a quiz</Title>
      <Text>Joining is not available yet.</Text>
    </Stack>
  );
}
