import {
  Button,
  Card,
  Code,
  FileInput,
  Group,
  PasswordInput,
  Radio,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import {
  createId,
  isQuiz,
  readSavedQuizzes,
  writeSavedQuizzes,
  type Quiz,
  type QuizQuestion,
  type ServerQuizSummary,
} from '../quizStorage';

export const Route = createFileRoute('/quizzes')({ component: QuizzesPage });

type SaveTarget = 'browser' | 'server';

async function fetchServerQuizzes(): Promise<ServerQuizSummary[] | null> {
  try {
    const response = await fetch('/api/quizzes');
    if (!response.ok) return null;
    const data = (await response.json()) as { quizzes?: ServerQuizSummary[] };
    return Array.isArray(data.quizzes) ? data.quizzes : null;
  } catch {
    return null;
  }
}

function blankQuestion(): QuizQuestion {
  return {
    id: createId(),
    prompt: '',
    choices: ['', '', '', ''],
    correctChoice: 0,
  };
}

export function QuizzesPage() {
  const [saveTarget, setSaveTarget] = useState<SaveTarget>('browser');
  const [quizId, setQuizId] = useState('');
  const [title, setTitle] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([blankQuestion()]);
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>(readSavedQuizzes);
  const savedQuizzesRef = useRef(savedQuizzes);
  const [serverQuizzes, setServerQuizzes] = useState<ServerQuizSummary[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchServerQuizzes()
      .then((list) => {
        if (!cancelled && list) setServerQuizzes(list);
      })
      .catch(() => {
        // Keep existing server quiz list if the server is temporarily unreachable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function saveBrowserQuizzes(update: (current: Quiz[]) => Quiz[]): boolean {
    const nextQuizzes = update(savedQuizzesRef.current);
    if (!writeSavedQuizzes(nextQuizzes)) {
      setMessage(
        'Could not save quizzes on this device. Your changes were kept.',
      );
      return false;
    }
    savedQuizzesRef.current = nextQuizzes;
    setSavedQuizzes(nextQuizzes);
    return true;
  }

  function updateQuestion(index: number, update: Partial<QuizQuestion>) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...update } : question,
      ),
    );
  }

  function updateChoice(
    questionIndex: number,
    choiceIndex: number,
    value: string,
  ) {
    const question = questions[questionIndex];
    if (!question) return;
    const choices: [string, string, string, string] = [...question.choices];
    choices[choiceIndex] = value;
    updateQuestion(questionIndex, { choices });
  }

  async function saveQuiz() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setMessage('Give your quiz a title.');
      return;
    }
    if (
      questions.some(
        (question) =>
          !question.prompt.trim() ||
          question.choices.some((choice) => !choice.trim()),
      )
    ) {
      setMessage(
        'Add a question and fill in all four answer choices for each one.',
      );
      return;
    }

    const cleanedQuestions: QuizQuestion[] = questions.map(
      (question, index) => {
        const [c0, c1, c2, c3] = question.choices.map((choice) =>
          choice.trim(),
        ) as [string, string, string, string];
        return {
          id: saveTarget === 'server' ? `q${String(index + 1)}` : question.id,
          prompt: question.prompt.trim(),
          choices: [c0, c1, c2, c3],
          correctChoice: question.correctChoice,
        };
      },
    );

    if (saveTarget === 'browser') {
      const quiz: Quiz = {
        id: createId(),
        title: trimmedTitle,
        questions: cleanedQuestions,
      };
      if (!saveBrowserQuizzes((current) => [quiz, ...current])) return;
      setTitle('');
      setQuestions([blankQuestion()]);
      setMessage('Quiz saved on this device.');
      return;
    }

    const trimmedId = quizId.trim();
    if (!trimmedId || !adminKey.trim()) {
      setMessage(
        'Enter a quiz ID and administrator key to save to the server.',
      );
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedId)) {
      setMessage(
        'Use letters, numbers, hyphens, or underscores for the quiz ID.',
      );
      return;
    }
    if (saving) return;

    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-quiz-admin-key': adminKey,
        },
        body: JSON.stringify({
          id: trimmedId,
          title: trimmedTitle,
          questions: cleanedQuestions,
        }),
      });

      if (response.ok) {
        setQuizId('');
        setTitle('');
        setQuestions([blankQuestion()]);
        setMessage('Quiz saved to the server.');
        const list = await fetchServerQuizzes();
        if (list) setServerQuizzes(list);
      } else {
        const result = (await response.json()) as { error?: string };
        setMessage(
          result.error ?? `Failed to save quiz (${String(response.status)}).`,
        );
      }
    } catch {
      setMessage('Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  }

  async function importQuiz(file: File | null) {
    if (!file) return;
    try {
      const imported: unknown = JSON.parse(await file.text());
      if (!isQuiz(imported)) {
        setMessage('That file does not match the quiz format.');
        return;
      }
      const saved = saveBrowserQuizzes((current) => [
        imported,
        ...current.filter((quiz) => quiz.id !== imported.id),
      ]);
      if (saved) setMessage(`Imported “${imported.title}”.`);
    } catch {
      setMessage('Could not read that file. Choose a valid quiz JSON file.');
    }
  }

  return (
    <Stack maw={680}>
      <Title order={2}>Create a quiz</Title>
      <Text>
        Write questions, enter four choices, and select the correct answer. Save
        locally in this browser or store a YAML quiz on the server.
      </Text>

      <Stack gap={4}>
        <Text size="sm" fw={500}>
          Save destination
        </Text>
        <SegmentedControl
          value={saveTarget}
          onChange={(value) => {
            setSaveTarget(value === 'server' ? 'server' : 'browser');
            setMessage('');
          }}
          data={[
            { label: 'This device (browser)', value: 'browser' },
            { label: 'Server (YAML)', value: 'server' },
          ]}
        />
      </Stack>

      {saveTarget === 'server' && (
        <>
          <TextInput
            label="Quiz ID"
            placeholder="network-basics"
            description="Use letters, numbers, hyphens, or underscores."
            value={quizId}
            maxLength={64}
            onChange={(event) => {
              setQuizId(event.currentTarget.value);
            }}
          />
          <PasswordInput
            label="Administrator key"
            placeholder="Enter your administrator key"
            description="Required to save quizzes to the server."
            value={adminKey}
            onChange={(event) => {
              setAdminKey(event.currentTarget.value);
            }}
          />
        </>
      )}

      <TextInput
        label="Quiz title"
        placeholder="For example, Network Basics"
        value={title}
        maxLength={100}
        onChange={(event) => {
          setTitle(event.currentTarget.value);
        }}
      />

      {questions.map((question, questionIndex) => (
        <Card key={question.id} withBorder>
          <Stack>
            <Title order={3}>Question {questionIndex + 1}</Title>
            <TextInput
              label="Question"
              value={question.prompt}
              onChange={(event) => {
                updateQuestion(questionIndex, {
                  prompt: event.currentTarget.value,
                });
              }}
            />
            <Radio.Group
              label="Answer choices — select the correct answer"
              value={String(question.correctChoice)}
              onChange={(value) => {
                updateQuestion(questionIndex, { correctChoice: Number(value) });
              }}
            >
              <Stack gap="xs" mt="xs">
                {question.choices.map((choice, choiceIndex) => (
                  <Group key={choiceIndex} wrap="nowrap" align="end">
                    <Radio
                      value={String(choiceIndex)}
                      aria-label={`Mark choice ${String(choiceIndex + 1)} as correct`}
                    />
                    <TextInput
                      style={{ flex: 1 }}
                      label={`Choice ${String.fromCharCode(65 + choiceIndex)}`}
                      value={choice}
                      onChange={(event) => {
                        updateChoice(
                          questionIndex,
                          choiceIndex,
                          event.currentTarget.value,
                        );
                      }}
                    />
                  </Group>
                ))}
              </Stack>
            </Radio.Group>
            {questions.length > 1 && (
              <Button
                variant="subtle"
                color="red"
                onClick={() => {
                  setQuestions((current) =>
                    current.filter((_, index) => index !== questionIndex),
                  );
                }}
              >
                Remove question
              </Button>
            )}
          </Stack>
        </Card>
      ))}

      <Group>
        <Button
          variant="default"
          onClick={() => {
            setQuestions([...questions, blankQuestion()]);
          }}
        >
          Add question
        </Button>
        <Button
          loading={saving}
          onClick={() => {
            void saveQuiz().catch(() => {
              setMessage('Could not save quiz.');
            });
          }}
        >
          {saveTarget === 'server' ? 'Save to server' : 'Save on this device'}
        </Button>
      </Group>

      <FileInput
        label="Import a quiz JSON file"
        description="Adds a quiz JSON file to this browser."
        accept=".json,application/json"
        onChange={(file) => {
          void importQuiz(file).catch(() => {
            setMessage(
              'Could not read that file. Choose a valid quiz JSON file.',
            );
          });
        }}
        clearable
      />
      {message && <Text role="status">{message}</Text>}

      <Title order={3}>Server quizzes</Title>
      {serverQuizzes.length === 0 ? (
        <Text c="dimmed">No server quizzes found.</Text>
      ) : (
        serverQuizzes.map((quiz) => (
          <Card key={quiz.id} withBorder>
            <Stack gap={2}>
              <Text fw={600}>{quiz.title}</Text>
              <Text size="sm" c="dimmed">
                {quiz.questionCount} question
                {quiz.questionCount === 1 ? '' : 's'} · ID:{' '}
                <Code>{quiz.id}</Code>
              </Text>
            </Stack>
          </Card>
        ))
      )}

      <Title order={3}>Saved on this device</Title>
      {savedQuizzes.length === 0 ? (
        <Text c="dimmed">No custom quizzes saved in this browser yet.</Text>
      ) : (
        savedQuizzes.map((quiz) => (
          <Card key={quiz.id} withBorder>
            <Group justify="space-between">
              <Stack gap={2}>
                <Text fw={600}>{quiz.title}</Text>
                <Text size="sm" c="dimmed">
                  {quiz.questions.length} question
                  {quiz.questions.length === 1 ? '' : 's'}
                </Text>
              </Stack>
              <Button
                variant="subtle"
                color="red"
                onClick={() => {
                  saveBrowserQuizzes((current) =>
                    current.filter((saved) => saved.id !== quiz.id),
                  );
                }}
              >
                Delete
              </Button>
            </Group>
          </Card>
        ))
      )}

      <Text size="sm" c="dimmed">
        Both server YAML quizzes and browser-saved quizzes share the same schema
        (using zero-based <Code>correctChoice</Code>) and can be hosted from the
        Host page.
      </Text>
    </Stack>
  );
}
