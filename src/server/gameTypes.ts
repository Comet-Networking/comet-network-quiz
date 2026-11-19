export interface HostedQuestion {
  id: string;
  prompt: string;
  choices: [string, string, string, string];
  correctChoice: number;
}

export interface HostedQuiz {
  id: string;
  title: string;
  questions: HostedQuestion[];
}

export type GameEvent =
  | { type: 'lobby-created'; code: string; quizId?: string; quizTitle?: string }
  | { type: 'lobby-update'; players: string[] }
  | { type: 'game-started' }
  | { type: 'lobby' }
  | { type: 'error'; message: string }
  | {
      type: 'question';
      index: number;
      total: number;
      question: {
        id: string;
        prompt: string;
        choices: [string, string, string, string];
      };
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
  | { type: 'finished'; score: number; rank: number; players: number }
  | { type: 'said'; text: string }
  | { type: 'pong'; requestId: string };
