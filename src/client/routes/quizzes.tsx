import {
  Button,
  Card,
  Code,
  FileInput,
  Group,
  Radio,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/quizzes')({ component: QuizzesPage });

type QuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  correctChoice: number;
};

type Quiz = {
  id: string;
  title: string;
  questions: QuizQuestion[];
};

const STORAGE_KEY = 'comet-network-quiz:custom-quizzes';

function blankQuestion(): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    prompt: '',
    choices: ['', '', '', ''],
    correctChoice: 0,
  };
}

function readSavedQuizzes(): Quiz[] {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]',
    );
    return Array.isArray(saved) ? saved.filter(isQuiz) : [];
  } catch {
    return [];
  }
}

function isQuiz(value: unknown): value is Quiz {
  if (!value || typeof value !== 'object') return false;
  const quiz = value as Partial<Quiz>;
  return (
    typeof quiz.id === 'string' &&
    typeof quiz.title === 'string' &&
    Array.isArray(quiz.questions) &&
    quiz.questions.length > 0 &&
    quiz.questions.every(
      (question) =>
        typeof question.id === 'string' &&
        typeof question.prompt === 'string' &&
        Array.isArray(question.choices) &&
        question.choices.length === 4 &&
        question.choices.every((choice) => typeof choice === 'string') &&
        Number.isInteger(question.correctChoice) &&
        question.correctChoice >= 0 &&
        question.correctChoice <= 3,
    )
  );
}

function downloadQuiz(quiz: Quiz) {
  const file = new Blob([JSON.stringify(quiz, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${quiz.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function QuizzesPage() {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([blankQuestion()]);
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>(readSavedQuizzes);
  const [message, setMessage] = useState('');

  function saveQuizzes(nextQuizzes: Quiz[]) {
    setSavedQuizzes(nextQuizzes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextQuizzes));
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
    const choices = [...question.choices];
    choices[choiceIndex] = value;
    updateQuestion(questionIndex, { choices });
  }

  function saveQuiz() {
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

    const quiz: Quiz = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      questions: questions.map((question) => ({
        ...question,
        prompt: question.prompt.trim(),
        choices: question.choices.map((choice) => choice.trim()),
      })),
    };
    saveQuizzes([quiz, ...savedQuizzes]);
    setTitle('');
    setQuestions([blankQuestion()]);
    setMessage('Quiz saved on this device. Export it to share the file.');
  }

  async function importQuiz(file: File | null) {
    if (!file) return;
    try {
      const imported: unknown = JSON.parse(await file.text());
      if (!isQuiz(imported)) {
        setMessage('That file does not match the quiz format.');
        return;
      }
      const nextQuizzes = [
        imported,
        ...savedQuizzes.filter((quiz) => quiz.id !== imported.id),
      ];
      saveQuizzes(nextQuizzes);
      setMessage(`Imported “${imported.title}”.`);
    } catch {
      setMessage('Could not read that file. Choose a valid quiz JSON file.');
    }
  }

  return (
    <Stack maw={680}>
      <Title order={2}>Create a quiz</Title>
      <Text>
        Write questions, enter four choices, and select the correct answer for
        each question.
      </Text>
      <TextInput
        label="Quiz title"
        placeholder="For example, Network Basics"
        value={title}
        maxLength={100}
        onChange={(event) => setTitle(event.currentTarget.value)}
      />
      {questions.map((question, questionIndex) => (
        <Card key={question.id} withBorder>
          <Stack>
            <Title order={3}>Question {questionIndex + 1}</Title>
            <TextInput
              label="Question"
              value={question.prompt}
              onChange={(event) =>
                updateQuestion(questionIndex, {
                  prompt: event.currentTarget.value,
                })
              }
            />
            <Radio.Group
              label="Answer choices — select the correct answer"
              value={String(question.correctChoice)}
              onChange={(value) =>
                updateQuestion(questionIndex, { correctChoice: Number(value) })
              }
            >
              <Stack gap="xs" mt="xs">
                {question.choices.map((choice, choiceIndex) => (
                  <Group key={choiceIndex} wrap="nowrap" align="end">
                    <Radio
                      value={String(choiceIndex)}
                      aria-label={`Mark choice ${choiceIndex + 1} as correct`}
                    />
                    <TextInput
                      style={{ flex: 1 }}
                      label={`Choice ${String.fromCharCode(65 + choiceIndex)}`}
                      value={choice}
                      onChange={(event) =>
                        updateChoice(
                          questionIndex,
                          choiceIndex,
                          event.currentTarget.value,
                        )
                      }
                    />
                  </Group>
                ))}
              </Stack>
            </Radio.Group>
            {questions.length > 1 && (
              <Button
                variant="subtle"
                color="red"
                onClick={() =>
                  setQuestions((current) =>
                    current.filter((_, index) => index !== questionIndex),
                  )
                }
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
          onClick={() => setQuestions([...questions, blankQuestion()])}
        >
          Add question
        </Button>
        <Button onClick={saveQuiz}>Save quiz</Button>
      </Group>
      <FileInput
        label="Upload a quiz file"
        description="Import a quiz JSON file exported from this page."
        accept=".json,application/json"
        onChange={importQuiz}
        clearable
      />
      {message && <Text role="status">{message}</Text>}

      <Title order={3}>Saved on this device</Title>
      {savedQuizzes.length === 0 ? (
        <Text c="dimmed">No custom quizzes saved yet.</Text>
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
              <Group>
                <Button variant="default" onClick={() => downloadQuiz(quiz)}>
                  Export JSON
                </Button>
                <Button
                  variant="subtle"
                  color="red"
                  onClick={() =>
                    saveQuizzes(
                      savedQuizzes.filter((saved) => saved.id !== quiz.id),
                    )
                  }
                >
                  Delete
                </Button>
              </Group>
            </Group>
          </Card>
        ))
      )}
      <Text size="sm" c="dimmed">
        Each question stores the correct choice as <Code>correctChoice</Code>,
        matching the project quiz schema. Quizzes are saved in this browser and
        can be shared as JSON files.
      </Text>
    </Stack>
  );
}
