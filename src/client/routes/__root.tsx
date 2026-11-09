import { Badge, Container, Group, Stack, Text, Title } from '@mantine/core';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: Layout,
  notFoundComponent: () => <Text>Page not found.</Text>,
});

export function Layout() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <header>
          <Group justify="space-between" mb="md">
            <Title order={1} size="h2">
              Comet Network Quiz
            </Title>
            <Badge variant="light">Scaffold</Badge>
          </Group>
          <Group component="nav" aria-label="Main navigation" gap="lg">
            <Link to="/" activeProps={{ 'aria-current': 'page' }}>
              Overview
            </Link>
            <Link to="/host" activeProps={{ 'aria-current': 'page' }}>
              Host
            </Link>
            <Link to="/play" activeProps={{ 'aria-current': 'page' }}>
              Play
            </Link>
          </Group>
        </header>
        <main>
          <Outlet />
        </main>
        <Text component="footer" size="sm" c="dimmed">
          Infrastructure only. Multiplayer gameplay is not implemented.
        </Text>
      </Stack>
    </Container>
  );
}
