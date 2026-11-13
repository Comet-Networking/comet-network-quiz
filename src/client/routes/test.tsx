import { Badge, Button, Center, Group, List, Paper, Stack, TextInput, Title } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { useSocket } from '../useSocket'; // adjust to wherever you put the hook

export const Route = createFileRoute('/test')({ component: TestPage });

type Said = { type: 'said'; text: string };

export function TestPage() {
  const [text, setText] = useState('');
  const [log, setLog] = useState<Said[]>([]);

  const { connected, send } = useSocket((msg) => {
    if (msg.type === 'said') setLog((l) => [...l, msg]);
  });

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Test</Title>
        <Badge color={connected ? 'green' : 'red'} w="fit-content">
          {connected ? 'Connected' : 'Disconnected'}
        </Badge>
      </Group>
      <Paper withBorder p="md">
        <Center w="100%">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send({ type: 'say', text: text.trim() });
              setText('');
            }}
          >
            <Stack maw={320}>
              <TextInput
                placeholder="Message"
                value={text}
                maxLength={200}
                onChange={(e) => setText(e.currentTarget.value)}
              />
              <Button type="submit" disabled={!connected}>
                Send
              </Button>
            </Stack>
          </form>
        </Center>
      </Paper>

      <Title order={4}>Everything said</Title>
      {log.length === 0 ? (
        <List>
          <List.Item>Nothing yet.</List.Item>
        </List>
      ) : (
        <List>
          {log.map((m, i) => (
            <List.Item key={i}>
              {m.text}
            </List.Item>
          ))}
        </List>
      )}
    </Stack>
  );
}
