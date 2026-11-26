import { Button, Stack, Text, Title, Group } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({ component: HomePage });

export function HomePage() {
  return (
    <Stack gap="xl" mt="lg">
      <Group gap={5}>
        <Title order={2}>What is Comet Quiz?</Title>
        <Text>
          Comet Quiz is a quiz app that allows you to host or play games on your
          local network. The host creates a game and shares a game code. Players
          join from their own device by entering the code and their name. Once
          the quiz starts, questions appear on every screen at the same time,
          and players answer in real time. Scores update after each question,
          and everyone sees the results together.
        </Text>
      </Group>
      <Stack gap="md">
        <Title order={2}>Ready to get started?</Title>

        <Button>Host a game</Button>
        <Button>Join a game</Button>
        <Button>Create a quiz</Button>
      </Stack>
    </Stack>
  );
}
