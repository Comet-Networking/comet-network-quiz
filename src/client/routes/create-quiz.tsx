import { useState } from 'react';
import {
  Button,
  PasswordInput,
  Radio,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/create-quiz')({
  component: CreateQuizPage,
});

interface Question {
  id: string;
  prompt: string;
  choices: string[];
  correctChoice: number;
}

export function CreateQuizPage() {
  const [quizId, setQuizId] = useState('');
  const [title, setTitle] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q1',
      prompt: '',
      choices: ['', '', '', ''],
      correctChoice: 0,
    },
  ]);

  function updateQuestion(index: number, updated: Question) {
    setQuestions((current) =>
      current.map((question, i) => (i === index ? updated : question)),
    );
  }

  async function saveQuiz() {
    if (
      !quizId.trim() ||
      !title.trim() ||
      !adminKey.trim() ||
      questions.some(
        (question) =>
          !question.prompt.trim() ||
          question.choices.some((choice) => !choice.trim()),
      )
    ) {
      setMessage('Please complete all fields before saving.');
      return;
    }

    if (saving) return;
    if (!/^[a-zA-Z0-9_-]+$/.test(quizId.trim())) {
      setMessage(
        'Use letters, numbers, hyphens, or underscores for the quiz ID.',
      );
      return;
    }
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
          id: quizId.trim(),
          title: title.trim(),
          questions: questions.map((question) => ({
            ...question,
            prompt: question.prompt.trim(),
            choices: question.choices.map((choice) => choice.trim()),
          })),
        }),
      });

      if (response.ok) {
        setMessage('Quiz saved successfully!');
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

  return (
    <Stack gap="md">
      <Title order={2}>Create Quiz</Title>
      <Text>Create a quiz on the server by adding questions and answers.</Text>

      <TextInput
        label="Quiz ID"
        placeholder="network-basics"
        description="Use letters, numbers, hyphens, or underscores."
        value={quizId}
        onChange={(event) => {
          setQuizId(event.currentTarget.value);
        }}
      />

      <TextInput
        label="Quiz Title"
        placeholder="Network Basics"
        value={title}
        onChange={(event) => {
          setTitle(event.currentTarget.value);
        }}
      />

      <PasswordInput
        label="Administrator Key"
        placeholder="Enter your administrator key"
        description="Required to save quizzes."
        value={adminKey}
        onChange={(event) => {
          setAdminKey(event.currentTarget.value);
        }}
      />

      {questions.map((question, index) => (
        <Stack key={question.id} gap="sm">
          <Title order={4}>Question {index + 1}</Title>

          <TextInput
            label="Question"
            placeholder="Enter your question"
            value={question.prompt}
            onChange={(event) => {
              updateQuestion(index, {
                ...question,
                prompt: event.currentTarget.value,
              });
            }}
          />

          {question.choices.map((choice, choiceIndex) => (
            <TextInput
              key={choiceIndex}
              label={`Choice ${String(choiceIndex + 1)}`}
              placeholder={`Answer ${String(choiceIndex + 1)}`}
              value={choice}
              onChange={(event) => {
                const choices = [...question.choices];
                choices[choiceIndex] = event.currentTarget.value;
                updateQuestion(index, { ...question, choices });
              }}
            />
          ))}

          <Radio.Group
            label="Correct Answer"
            value={String(question.correctChoice)}
            onChange={(value) => {
              updateQuestion(index, {
                ...question,
                correctChoice: Number(value),
              });
            }}
          >
            <Stack gap="xs" mt="xs">
              {[0, 1, 2, 3].map((choiceIndex) => (
                <Radio
                  key={choiceIndex}
                  value={String(choiceIndex)}
                  label={`Choice ${String(choiceIndex + 1)}`}
                />
              ))}
            </Stack>
          </Radio.Group>

          <Button
            color="red"
            variant="outline"
            disabled={questions.length === 1}
            onClick={() => {
              setQuestions((current) =>
                current
                  .filter((_, i) => i !== index)
                  .map((item, i) => ({
                    ...item,
                    id: `q${String(i + 1)}`,
                  })),
              );
            }}
          >
            Remove Question
          </Button>
        </Stack>
      ))}

      <Button
        onClick={() => {
          setQuestions((current) => [
            ...current,
            {
              id: `q${String(current.length + 1)}`,
              prompt: '',
              choices: ['', '', '', ''],
              correctChoice: 0,
            },
          ]);
        }}
      >
        Add Question
      </Button>

      <Button
        color="green"
        loading={saving}
        onClick={() => {
          saveQuiz().catch(() => {
            setMessage('Could not save quiz.');
          });
        }}
      >
        Save Quiz
      </Button>
      {message && <Text role="status">{message}</Text>}
    </Stack>
  );
}
