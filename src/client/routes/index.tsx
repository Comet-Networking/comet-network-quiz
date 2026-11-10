import { Stack, Text } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

import { NetworkExamples } from '../components/NetworkExamples';

export const Route = createFileRoute('/')({ component: HomePage });

export function HomePage() {
  return (
    <Stack gap="xl">
      <Text>A multiplayer quiz where speed and accuracy count.</Text>
      <NetworkExamples />
    </Stack>
  );
}
