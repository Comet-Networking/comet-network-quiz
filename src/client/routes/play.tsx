import { useEffect, useState } from 'react';
import {
  Button,
  Center,
  Container,
  Loader,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { createGameTransport } from '../gameTransport';

export interface PlayerQuestion {
  id: string;
  prompt: string;
  choices: [string, string, string, string];
}

//structure for host to client messages
export type ServerMessage =
  | { type: 'lobby' }
  | { type: 'error'; message: string }
  | {
      type: 'question';
      index: number;
      total: number;
      question: PlayerQuestion;
      endsAt: number;
      durationMs: number;
    }
  | {
      type: 'reveal';
      correctChoice: number;
      yourChoice: number | null;
      correct: boolean;
      pointsEarned: number;
      score: number;
    }
  | { type: 'finished'; score: number; rank: number; players: number };

//structure for client to host message
export type ClientMessage =
  | { type: 'join'; pin: string; name: string }
  | { type: 'answer'; questionId: string; choice: number };

export interface Transport {
  send(msg: ClientMessage): void;
  subscribe(listener: (msg: ServerMessage) => void): () => void;
}

//structure for different message types (same as server messages, but remove the type field)
type QuestionMsg = Extract<ServerMessage, { type: 'question' }>;
type RevealMsg = Extract<ServerMessage, { type: 'reveal' }>;
type FinishedMsg = Extract<ServerMessage, { type: 'finished' }>;

//strucutre for data used (different for each screen)
type View =
  | { name: 'join'; error?: string | undefined }
  | { name: 'lobby'; playerName: string }
  | ({ name: 'question'; answer: number | null } & Omit<QuestionMsg, 'type'>)
  | ({ name: 'reveal'; question: PlayerQuestion } & Omit<RevealMsg, 'type'>)
  | ({ name: 'finished' } & Omit<FinishedMsg, 'type'>);

//variables for the choice buttons
const COLORS = ['red', 'blue', 'yellow', 'green'] as const;
const SHAPES = ['▲', '◆', '●', '■'] as const;

export const Route = createFileRoute('/play')({ component: PlayRoute });

function PlayRoute() {
  // useState keeps one transport for the lifetime of the page.
  // Creating it inline would make a new one on every render.
  const [transport] = useState(createGameTransport);

  return <PlayerView transport={transport} />;
}

//controller function (manages which screen is displayed)
export function PlayerView({ transport }: { transport: Transport }) {
  //stores the data being used for a given screen
  const [view, setView] = useState<View>({ name: 'join' });

  //register listeners to change the screen based on the server messages
  useEffect(
    () =>
      transport.subscribe((msg) => {
        setView((prev) => {
          switch (msg.type) {
            case 'lobby':
              return prev.name === 'lobby'
                ? prev
                : { name: 'lobby', playerName: '' };
            case 'error':
              return { name: 'join', error: msg.message };
            case 'question': {
              const { index, total, question, endsAt, durationMs } = msg;
              return {
                name: 'question',
                answer: null,
                index,
                total,
                question,
                endsAt,
                durationMs,
              };
            }
            case 'reveal': {
              if (prev.name !== 'question') return prev;
              const {
                correctChoice,
                yourChoice,
                correct,
                pointsEarned,
                score,
              } = msg;
              return {
                name: 'reveal',
                question: prev.question,
                correctChoice,
                yourChoice,
                correct,
                pointsEarned,
                score,
              };
            }
            case 'finished': {
              const { score, rank, players } = msg;
              return { name: 'finished', score, rank, players };
            }
          }
        });
      }),
    [transport],
  );

  //function that runs when the user join a lobby
  const join = (pin: string, name: string) => {
    //send a msg to the server and change the screen
    transport.send({ type: 'join', pin, name });
    setView({ name: 'lobby', playerName: name });
  };

  //function that runs after the user answers a question (before the timer runs out)
  const answer = (choice: number) => {
    //exit early if the player is not on the question screen or if they already answered
    if (
      view.name !== 'question' ||
      view.answer !== null ||
      Date.now() >= view.endsAt
    )
      return;
    //send a msg to the server and change the screen
    transport.send({ type: 'answer', questionId: view.question.id, choice });
    setView({ ...view, answer: choice });
  };

  //change the screen based on the view useState
  switch (view.name) {
    case 'join':
      return <JoinScreen error={view.error} onJoin={join} />;
    case 'lobby':
      return <LobbyScreen playerName={view.playerName} />;
    case 'question':
      return <QuestionScreen view={view} onAnswer={answer} />;
    case 'reveal':
      return <RevealScreen view={view} />;
    case 'finished':
      return <FinishedScreen view={view} />;
  }
}

function JoinScreen({
  error,
  onJoin,
}: {
  error?: string | undefined;
  onJoin: (pin: string, name: string) => void;
}) {
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const ready = pin.trim().length > 0 && name.trim().length > 0;

  return (
    <Center h="100%" p="md">
      <Container size="xs" w="100%">
        <Stack gap="md">
          <Title order={2} ta="center">
            Join a quiz
          </Title>
          <TextInput
            label="Game PIN"
            inputMode="numeric"
            size="md"
            value={pin}
            onChange={(e) => {
              setPin(e.currentTarget.value);
            }}
            error={error}
          />
          <TextInput
            label="Your name"
            size="md"
            maxLength={20}
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && ready) {
                onJoin(pin.trim(), name.trim());
              }
            }}
          />
          <Button
            size="lg"
            disabled={!ready}
            onClick={() => {
              onJoin(pin.trim(), name.trim());
            }}
          >
            Join game
          </Button>
        </Stack>
      </Container>
    </Center>
  );
}

function LobbyScreen({ playerName }: { playerName: string }) {
  return (
    <Center h="100%" p="md">
      <Stack align="center" gap="sm">
        <Loader />
        <Title order={2}>
          {playerName ? `You're in, ${playerName}` : "You're in"}
        </Title>
        <Text c="dimmed">Waiting for the host to start the game.</Text>
      </Stack>
    </Center>
  );
}

//keep track of the time remaining per question
function useRemaining(endsAt: number, durationMs: number) {
  const [pct, setPct] = useState(100);
  useEffect(() => {
    const tick = () => {
      setPct(Math.max(0, ((endsAt - Date.now()) / durationMs) * 100));
    };
    tick();
    const id = setInterval(tick, 100);
    return () => {
      clearInterval(id);
    };
  }, [endsAt, durationMs]);
  return pct;
}

function QuestionScreen({
  view,
  onAnswer,
}: {
  view: Extract<View, { name: 'question' }>;
  onAnswer: (choice: number) => void;
}) {
  //keep track of time remaining
  const pct = useRemaining(view.endsAt, view.durationMs);
  //variable to stop the player from answering if they already answered or the time is up
  const locked = view.answer !== null || pct <= 0;

  return (
    <Stack h="100%" gap={0}>
      <Progress
        value={pct}
        size="md"
        radius={0}
        color={pct > 25 ? 'blue' : 'red'}
      />

      <Stack flex={1} justify="center" p="md" gap="xs">
        <Text c="dimmed" ta="center" size="sm">
          Question {view.index + 1} of {view.total}
        </Text>
        <Title order={2} ta="center" maw={640} mx="auto">
          {view.question.prompt}
        </Title>
        {view.answer !== null && (
          <Text ta="center" c="dimmed">
            Answer locked in. Waiting for everyone else.
          </Text>
        )}
      </Stack>

      <SimpleGrid cols={2} spacing="xs" p="xs">
        {view.question.choices.map((choice, i) => {
          const picked = view.answer === i;
          return (
            <Button
              key={i}
              color={COLORS[i] ?? 'gray'}
              autoContrast
              h={120}
              radius="md"
              disabled={locked && !picked}
              variant={picked || !locked ? 'filled' : 'light'}
              onClick={() => {
                onAnswer(i);
              }}
              leftSection={<span aria-hidden>{SHAPES[i]}</span>}
              styles={{
                label: {
                  whiteSpace: 'normal',
                  textAlign: 'left',
                  fontSize: 'var(--mantine-font-size-lg)',
                },
              }}
            >
              {choice}
            </Button>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}

function RevealScreen({ view }: { view: Extract<View, { name: 'reveal' }> }) {
  const timedOut = view.yourChoice === null;
  const headline = view.correct
    ? 'Correct'
    : timedOut
      ? "Time's up"
      : 'Incorrect';

  return (
    <Center h="100%" p="md" bg={view.correct ? 'green.7' : 'red.7'} c="white">
      <Stack align="center" gap="md" maw={480}>
        <Title order={1}>{headline}</Title>
        {view.correct ? (
          <Text size="xl">+{view.pointsEarned} points</Text>
        ) : (
          <Paper p="md" radius="md" w="100%" c="dark">
            <Text size="sm" c="dimmed">
              Correct answer
            </Text>
            <Text size="lg" fw={600}>
              {SHAPES[view.correctChoice]}{' '}
              {view.question.choices[view.correctChoice]}
            </Text>
          </Paper>
        )}
        <Text>Total score: {view.score}</Text>
      </Stack>
    </Center>
  );
}

function FinishedScreen({
  view,
}: {
  view: Extract<View, { name: 'finished' }>;
}) {
  return (
    <Center h="100%" p="md">
      <Stack align="center" gap="xs">
        <Title order={1}>Game over</Title>
        <Text size="xl">
          You finished {ordinal(view.rank)} of {view.players}
        </Text>
        <Text c="dimmed">Final score: {view.score}</Text>
      </Stack>
    </Center>
  );
}

//used for the position of the player in the results screen
function ordinal(n: number) {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${String(n)}th`;
  switch (n % 10) {
    case 1:
      return `${String(n)}st`;
    case 2:
      return `${String(n)}nd`;
    case 3:
      return `${String(n)}rd`;
    default:
      return `${String(n)}th`;
  }
}
