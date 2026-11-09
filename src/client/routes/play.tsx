import { Stack, Text, Title } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/play')({ component: PlayPage });

export function PlayPage() {
  return (
    <Stack>
      <Title order={2}>Player placeholder</Title>
      <Text>
        Add the player flow here after the game protocol and server rules are
        defined. Joining and answering are not available yet.
      </Text>
    </Stack>
  );
}
