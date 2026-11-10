import { Stack, Text, Title } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/host')({ component: HostPage });

export function HostPage() {
  return (
    <Stack>
      <Title order={2}>Host a quiz</Title>
      <Text>Hosting is not available yet.</Text>
    </Stack>
  );
}
