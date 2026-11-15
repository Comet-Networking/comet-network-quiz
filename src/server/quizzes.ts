import Ajv2020 from 'ajv/dist/2020.js';
const ajv = new Ajv2020();

export async function validateQuiz(quiz: unknown): Promise<void> {
  const schemaPath = new URL('../../quizzes/quiz.schema.yaml', import.meta.url);
  const schemaText = await Bun.file(schemaPath).text();
  const schema = Bun.YAML.parse(schemaText) as object;
  const validate = ajv.compile(schema);

  if (!validate(quiz)) {
    throw new Error(`Invalid quiz: ${ajv.errorsText(validate.errors)}`);
  }
}

export async function loadQuiz(filename: string): Promise<unknown> {
  if (!/^[a-zA-Z0-9_-]+$/.test(filename)) {
    throw new Error('Invalid quiz filename');
  }

  const path = new URL(`../../quizzes/${filename}.yaml`, import.meta.url);
  const file = Bun.file(path);

  if (!(await file.exists())) {
    throw new Error('Quiz not found');
  }

  const text = await file.text();
  const quiz = Bun.YAML.parse(text);

  await validateQuiz(quiz);
  return quiz;
}

export async function saveQuiz(quiz: unknown): Promise<void> {
  await validateQuiz(quiz);

  const quizData = quiz as { id: string };

  if (!/^[a-zA-Z0-9_-]+$/.test(quizData.id)) {
    throw new Error('Invalid quiz ID');
  }

  const path = new URL(`../../quizzes/${quizData.id}.yaml`, import.meta.url);
  const file = Bun.file(path);

  if (await file.exists()) {
    throw new Error('Quiz already exists');
  }

  const yaml = Bun.YAML.stringify(quizData, null, 2);
  await Bun.write(file, yaml);
}

export async function updateQuiz(
  filename: string,
  quiz: unknown,
): Promise<void> {
  if (!/^[a-zA-Z0-9_-]+$/.test(filename)) {
    throw new Error('Invalid quiz filename');
  }

  await validateQuiz(quiz);

  const quizData = quiz as { id: string };

  if (quizData.id !== filename) {
    throw new Error('Quiz ID cannot be changed');
  }

  const path = new URL(`../../quizzes/${filename}.yaml`, import.meta.url);
  const file = Bun.file(path);

  if (!(await file.exists())) {
    throw new Error('Quiz not found');
  }

  const yaml = Bun.YAML.stringify(quizData, null, 2);
  await Bun.write(file, yaml);
}
