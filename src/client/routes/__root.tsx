import { Container, Group, Stack, Text, Title } from '@mantine/core';
import { createRootRoute, Outlet } from '@tanstack/react-router';

import { Link } from '../components/Link';

export const Route = createRootRoute({
  component: Layout,
  notFoundComponent: () => <Text>Page not found.</Text>,
});

export function Layout() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <header>
          <Title order={1} size="h2" mb="md">
            Comet Network Quiz
          </Title>
          <Group component="nav" aria-label="Main navigation" gap="lg">
            <Link to="/">Home</Link>
            <Link to="/host">Host</Link>
            <Link to="/play">Play</Link>
            <Link to="/quizzes">Quizzes</Link>
          </Group>
        </header>
        <main>
          <Outlet />
        </main>
      </Stack>
    </Container>
  );
}
