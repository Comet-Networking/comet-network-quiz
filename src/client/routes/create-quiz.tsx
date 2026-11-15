import { useState } from 'react';
import { Button, PasswordInput, Radio, Stack, Text, TextInput, Title } from '@mantine/core';
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
      current.map((question, i) => (i === index ? updated : question))
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
          question.choices.some((choice) => !choice.trim())
      )
    ) {
      alert('Please complete all fields before saving.');
      return;
    }

    try {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-quiz-admin-key': adminKey,
        },
        body: JSON.stringify({
          id: quizId,
          title,
          questions,
        }),
      });

      if (response.ok) {
        alert('Quiz saved successfully!');
      } else {
        alert(`Failed to save quiz. Server returned ${String(response.status)}.`);
      }
    } catch {
      alert('Could not connect to the server.');
    }
  }

  return (
    <Stack gap="md">
      <Title order={2}>Create Quiz</Title>
      <Text>Create a new quiz by adding questions and answers.</Text>

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
                  }))
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
        onClick={() => {
          saveQuiz().catch(() => {
            alert('Could not save quiz.');
          });
        }}
      >
        Save Quiz
      </Button>
    </Stack>
  );
}