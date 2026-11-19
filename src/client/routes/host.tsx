import {
  Badge,
  Button,
  Code,
  Group,
  List,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Link } from '../components/Link';
import { isServerMessage, useSocket, type Said } from '../useSocket';

export const Route = createFileRoute('/host')({ component: HostPage });

interface SavedQuiz {
  id: string;
  title: string;
  questions: {
    id: string;
    prompt: string;
    choices: [string, string, string, string];
    correctChoice: number;
  }[];
}

function isSavedQuiz(value: unknown): value is SavedQuiz {
  if (typeof value !== 'object' || value === null) return false;
  if (
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !('title' in value) ||
    typeof value.title !== 'string' ||
    !('questions' in value) ||
    !Array.isArray(value.questions) ||
    value.questions.length === 0
  ) {
    return false;
  }
  return value.questions.every((question: unknown) => {
    if (typeof question !== 'object' || question === null) return false;
    return (
      'id' in question &&
      typeof question.id === 'string' &&
      'prompt' in question &&
      typeof question.prompt === 'string' &&
      'choices' in question &&
      Array.isArray(question.choices) &&
      question.choices.length === 4 &&
      question.choices.every((choice) => typeof choice === 'string') &&
      'correctChoice' in question &&
      typeof question.correctChoice === 'number' &&
      Number.isInteger(question.correctChoice) &&
      question.correctChoice >= 0 &&
      question.correctChoice < 4
    );
  });
}

function readSavedQuizzes(): SavedQuiz[] {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem('comet-network-quiz:custom-quizzes') ?? '[]',
    );
    return Array.isArray(saved) ? saved.filter(isSavedQuiz) : [];
  } catch {
    return [];
  }
}

function isLobbyCreated(
  value: unknown,
): value is { type: 'lobby-created'; code: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'lobby-created' &&
    'code' in value &&
    typeof value.code === 'string'
  );
}

export function HostPage() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [log, setLog] = useState<Said[]>([]);
  const [quizzes] = useState(readSavedQuizzes);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(
    quizzes[0]?.id ?? null,
  );

  // The join code from the server. null = no lobby created yet.
  const [code, setCode] = useState<string | null>(null);
  const [lobbyQuizTitle, setLobbyQuizTitle] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [hostError, setHostError] = useState('');

  const { connected, send } = useSocket((msg) => {
    if (
      typeof msg === 'object' &&
      msg !== null &&
      'type' in msg &&
      msg.type === 'player-joined' &&
      'players' in msg &&
      typeof msg.players === 'number'
    ) {
      setPlayerCount(msg.players);
      return;
    }
    if (
      typeof msg === 'object' &&
      msg !== null &&
      'type' in msg &&
      msg.type === 'game-started'
    ) {
      setGameStarted(true);
      return;
    }
    if (
      typeof msg === 'object' &&
      msg !== null &&
      'type' in msg &&
      msg.type === 'error' &&
      'message' in msg &&
      typeof msg.message === 'string'
    ) {
      setHostError(msg.message);
      return;
    }
    if (isLobbyCreated(msg)) {
      setCode(msg.code);
      setHostError('');
      if ('quizTitle' in msg && typeof msg.quizTitle === 'string') {
        setLobbyQuizTitle(msg.quizTitle);
      }
      return;
    }
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
        <Button
          disabled={!connected || !selectedQuizId || code !== null}
          onClick={() => {
            const quiz = quizzes.find((item) => item.id === selectedQuizId);
            if (!quiz) return;
            setHostError('');
            send({
              type: 'create-lobby',
              quiz,
            });
          }}
        >
          Create lobby
        </Button>
        <Select
          label="Quiz to host"
          placeholder="Select a quiz"
          data={quizzes.map((quiz) => ({
            value: quiz.id,
            label: `${quiz.title} (${String(quiz.questions.length)} questions)`,
          }))}
          value={selectedQuizId}
          onChange={setSelectedQuizId}
          disabled={quizzes.length === 0 || code !== null}
        />
        {quizzes.length === 0 && (
          <Text c="dimmed">
            No saved quizzes found. <Link to="/quizzes">Create one</Link> first.
          </Text>
        )}
        {code !== null && (
          <Stack gap={0} mt="md">
            {lobbyQuizTitle && <Text c="dimmed">Quiz: {lobbyQuizTitle}</Text>}
            <Text c="dimmed">Join code</Text>
            <Title order={1}>{code}</Title>
            <Text c="dimmed">Players joined: {String(playerCount)}</Text>
            {gameStarted ? (
              <Text c="green">Quiz started. Players can now play.</Text>
            ) : (
              <Button
                mt="md"
                disabled={!connected || playerCount === 0}
                onClick={() => {
                  setHostError('');
                  send({ type: 'start-game' });
                }}
              >
                Start quiz
              </Button>
            )}
          </Stack>
        )}
        {hostError && (
          <Text c="red" role="alert">
            {hostError}
          </Text>
        )}
      </Paper>

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
