import { Text } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({ component: HomePage });

export function HomePage() {
  return <Text>A multiplayer quiz where speed and accuracy count.</Text>;
}
