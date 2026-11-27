import { readdir, unlink, writeFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';

export interface Quiz {
  id: string;
  title: string;
  questions: {
    id: string;
    prompt: string;
    choices: [string, string, string, string];
    correctChoice: number;
  }[];
}

export interface QuizSummary {
  id: string;
  title: string;
  questionCount: number;
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
const quizzesDir = new URL('../../quizzes/', import.meta.url);
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

export async function listQuizzes(): Promise<QuizSummary[]> {
  let entries: string[];
  try {
    entries = await readdir(quizzesDir);
  } catch {
    return [];
  }

  const summaries: QuizSummary[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.yaml') || entry === 'quiz.schema.yaml') continue;
    const id = entry.slice(0, -'.yaml'.length);
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) continue;
    try {
      const quiz = await loadQuiz(id);
      summaries.push({
        id,
        title: quiz.title,
        questionCount: quiz.questions.length,
      });
    } catch {
      // Skip unreadable or invalid quiz files.
    }
  }
  summaries.sort((a, b) => a.title.localeCompare(b.title));
  return summaries;
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

export async function deleteQuiz(id: string): Promise<void> {
  const path = quizPath(id);

  try {
    await unlink(path);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new QuizError(404, 'Quiz not found');
    }
    throw error;
  }
}
