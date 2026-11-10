import { Button, Code, Stack, TextInput, Title } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

import { client } from '../client';

export function NetworkExamples() {
  const [getResult, setGetResult] = useState('');
  const [postResult, setPostResult] = useState('');
  const [message, setMessage] = useState('Hello, Comet!');
  const [wsResult, setWsResult] = useState('Connecting…');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<ReturnType<typeof client.ws.subscribe> | null>(null);

  function runGet() {
    client.health
      .get()
      .then(({ data, error }) => {
        setGetResult(JSON.stringify(error ?? data, null, 2));
      })
      .catch(() => {
        setGetResult('GET failed.');
      });
  }

  function runPost() {
    client.echo
      .post({ message })
      .then(({ data, error }) => {
        setPostResult(JSON.stringify(error ?? data, null, 2));
      })
      .catch(() => {
        setPostResult('POST failed.');
      });
  }

  function sendPing() {
    socketRef.current?.send({ type: 'ping', requestId: 'example' });
  }

  // Connect and display replies. Close when leaving the page.
  useEffect(() => {
    let active = true;
    const socket = client.ws.subscribe();
    socketRef.current = socket;
    socket.on('open', () => {
      if (!active) return;
      setConnected(true);
      setWsResult('Connected. Send a ping.');
    });
    socket.subscribe(({ data }) => {
      if (active) setWsResult(JSON.stringify(data, null, 2));
    });
    socket.on('error', () => {
      if (active) setWsResult('WebSocket failed.');
    });
    socket.on('close', () => {
      if (!active) return;
      setConnected(false);
      setWsResult('WebSocket disconnected. Reload to reconnect.');
    });
    return () => {
      active = false;
      socketRef.current = null;
      socket.close();
    };
  }, []);

  return (
    <Stack>
      <Title order={2}>Network examples</Title>
      <Title order={3}>GET /api/health</Title>
      <Button onClick={runGet}>Run GET</Button>
      <Code block role="status">
        {getResult}
      </Code>

      <Title order={3}>POST /api/echo</Title>
      <TextInput
        label="Message"
        value={message}
        maxLength={200}
        onChange={(event) => {
          setMessage(event.currentTarget.value);
        }}
      />
      <Button onClick={runPost} disabled={!message.trim()}>
        Send message
      </Button>
      <Code block role="status">
        {postResult}
      </Code>

      <Title order={3}>WebSocket /api/ws</Title>
      <Button onClick={sendPing} disabled={!connected}>
        Send ping
      </Button>
      <Code block role="status">
        {wsResult}
      </Code>
    </Stack>
  );
}
