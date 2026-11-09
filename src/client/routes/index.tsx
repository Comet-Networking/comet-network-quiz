import { Stack, Text, Title } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({ component: OverviewPage });

export function OverviewPage() {
  return (
    <Stack>
      <Title order={2}>Project scaffold</Title>
      <Text>
        A future multiplayer quiz where quicker correct answers earn more
        points. The routes and transport are ready for implementation.
      </Text>
      <Text c="dimmed">
        Host and Play are placeholders. There are no rooms, players, questions,
        timers, or scores yet.
      </Text>
    </Stack>
  );
}
