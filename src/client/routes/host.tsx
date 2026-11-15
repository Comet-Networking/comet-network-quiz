import {
  Badge,
  Code,
  Group,
  List,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { isServerMessage, useSocket, type Said } from '../useSocket';

export const Route = createFileRoute('/host')({ component: HostPage });

export function HostPage() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [log, setLog] = useState<Said[]>([]);

  const { connected } = useSocket((msg) => {
    if (!isServerMessage(msg)) return;
    setLog((l) => [...l, msg]);
  });

  useEffect(() => {
    fetch('/api/info')
      .then((r) => r.json())
      .then((d: { addresses: string[] }) => {
        setAddresses(d.addresses);
      })
      .catch(() => {
        setAddresses([]);
      });
  }, []);

  const port = location.port ? `:${location.port}` : '';

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Host a quiz</Title>
        <Badge color={connected ? 'green' : 'red'}>
          {connected ? 'Connected' : 'Disconnected'}
        </Badge>
      </Group>

      <Paper withBorder p="md">
        <Text fw={500} mb="xs">
          Have other devices open one of these:
        </Text>
        {addresses.length === 0 ? (
          <Text c="dimmed">No LAN address found.</Text>
        ) : (
          <Stack gap={4}>
            {addresses.map((ip) => (
              <Code key={ip}>{`${location.protocol}//${ip}${port}/test`}</Code>
            ))}
          </Stack>
        )}
      </Paper>

      <Paper withBorder p="md">
        <Text fw={500} mb="xs">
          Incoming messages
        </Text>
        {log.length === 0 ? (
          <Text c="dimmed">Nothing yet.</Text>
        ) : (
          <List spacing="xs">
            {log.map((m, i) => (
              <List.Item key={i}>{m.text}</List.Item>
            ))}
          </List>
        )}
      </Paper>
    </Stack>
  );
}
