import { writeFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';

export interface Quiz {
  id: string;
  title: string;
  questions: {
    id: string;
    prompt: string;
    choices: string[];
    correctChoice: number;
  }[];
}

export class QuizError extends Error {
  constructor(
    public status: 400 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

const ajv = new Ajv2020();
const schemaPath = new URL('../../quizzes/quiz.schema.yaml', import.meta.url);
const schema = Bun.YAML.parse(await Bun.file(schemaPath).text()) as object;
const validate = ajv.compile<Quiz>(schema);

export function validateQuiz(quiz: unknown): asserts quiz is Quiz {
  if (!validate(quiz)) {
    throw new QuizError(
      400,
      `Invalid quiz: ${ajv.errorsText(validate.errors)}`,
    );
  }
}

function quizPath(id: string): URL {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new QuizError(400, 'Invalid quiz ID');
  }
  return new URL(`../../quizzes/${id}.yaml`, import.meta.url);
}

export async function loadQuiz(id: string): Promise<Quiz> {
  const file = Bun.file(quizPath(id));
  if (!(await file.exists())) {
    throw new QuizError(404, 'Quiz not found');
  }
  const quiz: unknown = Bun.YAML.parse(await file.text());
  validateQuiz(quiz);
  return quiz;
}

export async function saveQuiz(quiz: unknown): Promise<void> {
  validateQuiz(quiz);
  const path = quizPath(quiz.id);
  const yaml = Bun.YAML.stringify(quiz, null, 2);
  try {
    await writeFile(path, yaml, { flag: 'wx' });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      throw new QuizError(409, 'Quiz already exists');
    }
    throw error;
  }
}

export async function updateQuiz(id: string, quiz: unknown): Promise<void> {
  const path = quizPath(id);
  validateQuiz(quiz);
  if (quiz.id !== id) {
    throw new QuizError(400, 'Quiz ID cannot be changed');
  }
  if (!(await Bun.file(path).exists())) {
    throw new QuizError(404, 'Quiz not found');
  }
  await Bun.write(path, Bun.YAML.stringify(quiz, null, 2));
}
