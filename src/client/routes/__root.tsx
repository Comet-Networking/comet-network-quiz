import {
  AppShell,
  Container,
  Group,
  Stack,
  Text,
  Image,
  Burger,
} from '@mantine/core';
import { createRootRoute, Outlet } from '@tanstack/react-router';

import { Link } from '../components/Link';
import classes from '../css/Link.module.css';
import cometsLogo from '../assets/comets-logo.svg';
import { useDisclosure } from '@mantine/hooks';

export const Route = createRootRoute({
  component: Layout,
  notFoundComponent: () => <Text>Page not found.</Text>,
});

export function Layout() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <AppShell
          header={{ height: 60 }}
          navbar={{
            width: 250,
            breakpoint: 'sm',
            collapsed: { desktop: true, mobile: !opened },
          }}
          padding="md"
        >
          <AppShell.Header>
            <Group h="100%" px="md" gap={10}>
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />
              <Image src={cometsLogo} alt="MyApp logo" h={40} w="auto" />
              <Link
                fw={700}
                size="lg"
                pr={10}
                underline="never"
                to="/"
                c="black"
              >
                Comet Quiz
              </Link>

              <Group
                component="nav"
                aria-label="Main navigation"
                gap={0}
                h="100%"
                align="stretch"
                visibleFrom="sm"
              >
                <Link to="/host" className={classes['link']} underline="never">
                  Host
                </Link>
                <Link to="/play" className={classes['link']} underline="never">
                  Play
                </Link>
                <Link
                  to="/quizzes"
                  className={classes['link']}
                  underline="never"
                >
                  Quizzes
                </Link>
              </Group>
            </Group>
          </AppShell.Header>
          <AppShell.Navbar p="md">
            <Stack>
              <Link to="/host" c="var(--mantine-color-dimmed)">
                Host
              </Link>
              <Link to="/play" c="var(--mantine-color-dimmed)">
                Play
              </Link>
              <Link to="/quizzes" c="var(--mantine-color-dimmed)">
                Quizzes
              </Link>
            </Stack>
          </AppShell.Navbar>
        </AppShell>
        <main>
          <Outlet />
        </main>
      </Stack>
    </Container>
  );
}
