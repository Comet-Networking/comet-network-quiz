import { Stack, Text, Title } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/host')({ component: HostPage });

export function HostPage() {
  return (
    <Stack>
      <Title order={2}>Host placeholder</Title>
      <Text>
        Add the host flow here after the game protocol and server rules are
        defined. Hosting a game is not available yet.
      </Text>
    </Stack>
  );
}
