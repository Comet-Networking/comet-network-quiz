export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: [string, string, string, string];
  correctChoice: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface ServerQuizSummary {
  id: string;
  title: string;
  questionCount: number;
}

export const STORAGE_KEY = 'comet-network-quiz:custom-quizzes';

export function createId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function isQuiz(value: unknown): value is Quiz {
  if (!value || typeof value !== 'object') return false;
  const quiz = value as Record<string, unknown>;
  if (
    typeof quiz['id'] !== 'string' ||
    quiz['id'].trim().length === 0 ||
    typeof quiz['title'] !== 'string' ||
    quiz['title'].trim().length === 0 ||
    !Array.isArray(quiz['questions']) ||
    quiz['questions'].length === 0
  ) {
    return false;
  }

  const seenIds = new Set<string>();
  return quiz['questions'].every((item: unknown) => {
    if (!item || typeof item !== 'object') return false;
    const question = item as Record<string, unknown>;
    if (
      typeof question['id'] !== 'string' ||
      question['id'].trim().length === 0 ||
      seenIds.has(question['id'].trim())
    ) {
      return false;
    }
    seenIds.add(question['id'].trim());
    return (
      typeof question['prompt'] === 'string' &&
      question['prompt'].trim().length > 0 &&
      Array.isArray(question['choices']) &&
      question['choices'].length === 4 &&
      question['choices'].every(
        (choice: unknown) =>
          typeof choice === 'string' && choice.trim().length > 0,
      ) &&
      typeof question['correctChoice'] === 'number' &&
      Number.isInteger(question['correctChoice']) &&
      question['correctChoice'] >= 0 &&
      question['correctChoice'] <= 3
    );
  });
}

export function readSavedQuizzes(): Quiz[] {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]',
    );
    return Array.isArray(saved) ? saved.filter(isQuiz) : [];
  } catch {
    return [];
  }
}

export function writeSavedQuizzes(quizzes: Quiz[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
    return true;
  } catch {
    return false;
  }
}
