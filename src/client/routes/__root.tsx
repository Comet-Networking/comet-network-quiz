import { Anchor, Container, Group, Stack, Text, Title } from '@mantine/core';
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
          <Title order={1} size="h2" mb="md">
            Comet Network Quiz
          </Title>
          <Group component="nav" aria-label="Main navigation" gap="lg">
            <Anchor
              renderRoot={(props) => (
                <Link
                  {...props}
                  to="/"
                  activeProps={{ 'aria-current': 'page' }}
                />
              )}
            >
              Home
            </Anchor>
            <Anchor
              renderRoot={(props) => (
                <Link
                  {...props}
                  to="/host"
                  activeProps={{ 'aria-current': 'page' }}
                />
              )}
            >
              Host
            </Anchor>
            <Anchor
              renderRoot={(props) => (
                <Link
                  {...props}
                  to="/play"
                  activeProps={{ 'aria-current': 'page' }}
                />
              )}
            >
              Play
            </Anchor>
          </Group>
        </header>
        <main>
          <Outlet />
        </main>
      </Stack>
    </Container>
  );
}
