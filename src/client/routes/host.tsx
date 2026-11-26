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
import { useEffect, useRef, useState } from 'react';

import { Link } from '../components/Link';
import {
  readSavedQuizzes,
  type Quiz,
  type ServerQuizSummary,
} from '../quizStorage';
import { isServerMessage, useSocket, type Said } from '../useSocket';

export const Route = createFileRoute('/host')({ component: HostPage });

const SERVER_PREFIX = 'server:';
const LOCAL_PREFIX = 'local:';

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

function isLobbyUpdate(
  value: unknown,
): value is { type: 'lobby-update'; players: string[] } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'lobby-update' &&
    'players' in value &&
    Array.isArray(value.players) &&
    value.players.every((p: unknown) => typeof p === 'string')
  );
}

export function HostPage() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [log, setLog] = useState<Said[]>([]);
  const [localQuizzes] = useState<Quiz[]>(readSavedQuizzes);
  const [serverQuizzes, setServerQuizzes] = useState<ServerQuizSummary[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(
    localQuizzes[0] ? `${LOCAL_PREFIX}${localQuizzes[0].id}` : null,
  );

  // The join code from the server. null = no lobby created yet.
  const [code, setCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [lobbyQuizTitle, setLobbyQuizTitle] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [hostError, setHostError] = useState('');

  const { connected, send } = useSocket((msg) => {
    if (isLobbyUpdate(msg)) {
      setPlayers(msg.players);
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
      setPlayers([]);
      setGameStarted(false);
      setHostError('');
      setLobbyQuizTitle(
        'quizTitle' in msg && typeof msg.quizTitle === 'string'
          ? msg.quizTitle
          : null,
      );
      return;
    }
    if (!isServerMessage(msg)) return;
    setLog((l) => [...l, msg]);
  });

  const wasConnected = useRef(false);
  useEffect(() => {
    if (wasConnected.current && !connected && code !== null) {
      setCode(null);
      setPlayers([]);
      setLobbyQuizTitle(null);
      setGameStarted(false);
      setHostError('Connection lost. Create a new lobby after reconnecting.');
    }
    wasConnected.current = connected;
  }, [connected, code]);

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

  useEffect(() => {
    fetch('/api/quizzes')
      .then((r) => r.json())
      .then((d: { quizzes?: ServerQuizSummary[] }) => {
        const list = Array.isArray(d.quizzes) ? d.quizzes : [];
        setServerQuizzes(list);
        if (list[0]) {
          const firstServer = `${SERVER_PREFIX}${list[0].id}`;
          setSelectedQuiz((current) => current ?? firstServer);
        }
      })
      .catch(() => {
        setServerQuizzes([]);
      })
      .finally(() => {
        setLoadingQuizzes(false);
      });
  }, []);

  const quizGroups = [
    ...(serverQuizzes.length > 0
      ? [
          {
            group: 'Server quizzes',
            items: serverQuizzes.map((quiz) => ({
              value: `${SERVER_PREFIX}${quiz.id}`,
              label: `${quiz.title} (${String(quiz.questionCount)} question${quiz.questionCount === 1 ? '' : 's'})`,
            })),
          },
        ]
      : []),
    ...(localQuizzes.length > 0
      ? [
          {
            group: 'Saved on this device',
            items: localQuizzes.map((quiz) => ({
              value: `${LOCAL_PREFIX}${quiz.id}`,
              label: `${quiz.title} (${String(quiz.questions.length)} question${quiz.questions.length === 1 ? '' : 's'})`,
            })),
          },
        ]
      : []),
  ];

  const hasQuizzes = serverQuizzes.length > 0 || localQuizzes.length > 0;
  const port = location.port ? `:${location.port}` : '';

  return (
    <Stack mt="lg">
      <Group justify="space-between">
        <Title order={2}>Host a quiz</Title>
        <Badge color={connected ? 'green' : 'red'}>
          {connected ? 'Connected' : 'Disconnected'}
        </Badge>
      </Group>

      <Paper withBorder p="md">
        <Stack gap="sm">
          <Select
            label="Quiz to host"
            placeholder={loadingQuizzes ? 'Loading quizzes…' : 'Select a quiz'}
            data={quizGroups}
            value={selectedQuiz}
            onChange={setSelectedQuiz}
            disabled={!hasQuizzes || code !== null}
          />
          {!loadingQuizzes && !hasQuizzes && (
            <Text c="dimmed">
              No quizzes found. <Link to="/quizzes">Create one</Link> first.
            </Text>
          )}
          <Button
            disabled={!connected || !selectedQuiz || code !== null}
            onClick={() => {
              if (!selectedQuiz) return;
              if (selectedQuiz.startsWith(SERVER_PREFIX)) {
                const quizId = selectedQuiz.slice(SERVER_PREFIX.length);
                setHostError('');
                send({ type: 'create-lobby', quizId });
                return;
              }
              const localId = selectedQuiz.slice(LOCAL_PREFIX.length);
              const quiz = localQuizzes.find((item) => item.id === localId);
              if (!quiz) return;
              if (
                quiz.id.length > 64 ||
                quiz.title.length > 100 ||
                quiz.questions.some((question) => question.id.length > 64)
              ) {
                setHostError(
                  'This quiz exceeds the maximum ID or title length and cannot be hosted.',
                );
                return;
              }
              const payload = { type: 'create-lobby', quiz };
              if (new Blob([JSON.stringify(payload)]).size > 1_048_576) {
                setHostError(
                  'This quiz is too large to host (over 1 MB). Remove some questions and try again.',
                );
                return;
              }
              setHostError('');
              send(payload);
            }}
          >
            Create lobby
          </Button>
        </Stack>
        {code !== null && (
          <Stack gap={0} mt="md">
            {lobbyQuizTitle && <Text c="dimmed">Quiz: {lobbyQuizTitle}</Text>}
            <Text c="dimmed">Join code</Text>
            <Title order={1}>{code}</Title>
            <Text fw={500} mt="md">
              Players ({players.length})
            </Text>
            {players.length === 0 ? (
              <Text c="dimmed">Waiting for players…</Text>
            ) : (
              <List>
                {players.map((p) => (
                  <List.Item key={p}>{p}</List.Item>
                ))}
              </List>
            )}
            {gameStarted ? (
              <Text c="green" mt="md">
                Quiz started. Players can now play.
              </Text>
            ) : (
              <Button
                mt="md"
                disabled={!connected || players.length === 0}
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
          <Text c="red" role="alert" mt="sm">
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
              <Code key={ip}>{`${location.protocol}//${ip}${port}/play`}</Code>
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
