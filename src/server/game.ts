import type { GameEvent, HostedQuiz } from './gameTypes';
import {
  addPlayer,
  createLobby,
  deleteLobby,
  getLobby,
  removePlayer,
  type Lobby,
} from './lobbies';

type Send = (message: GameEvent) => void;

interface Connection {
  send: Send;
  code?: string;
  role?: 'host' | 'player';
}

interface Player {
  id: string;
  name: string;
  send: Send;
  score: number;
  answer: number | null;
  answeredAt: number;
}

type Phase = 'lobby' | 'question' | 'reveal' | 'finished';

interface Session {
  code: string;
  hostId: string;
  quiz?: HostedQuiz;
  phase: Phase;
  questionIndex: number;
  questionStartedAt: number;
  revealScheduled: boolean;
  timer?: ReturnType<typeof setTimeout>;
  players: Map<string, Player>;
}

export interface GameTimings {
  questionMs: number;
  revealDelayMs: number;
  nextQuestionDelayMs: number;
}

const DEFAULT_TIMINGS: GameTimings = {
  questionMs: 15_000,
  revealDelayMs: 1_000,
  nextQuestionDelayMs: 2_500,
};

function sanitizeQuiz(quiz: HostedQuiz): HostedQuiz | null {
  const id = quiz.id.trim();
  const title = quiz.title.trim();
  if (!id || !title || quiz.questions.length === 0) return null;

  const seenIds = new Set<string>();
  const questions: HostedQuiz['questions'] = [];
  for (const question of quiz.questions) {
    const qId = question.id.trim();
    const prompt = question.prompt.trim();
    const choices = question.choices.map((c) => c.trim());
    if (
      !qId ||
      seenIds.has(qId) ||
      !prompt ||
      choices.some((c) => c.length === 0)
    ) {
      return null;
    }
    seenIds.add(qId);
    const [c0, c1, c2, c3] = choices as [string, string, string, string];
    questions.push({
      id: qId,
      prompt,
      choices: [c0, c1, c2, c3],
      correctChoice: question.correctChoice,
    });
  }
  return { id, title, questions };
}

export class GameManager {
  private connections = new Map<string, Connection>();
  private sessions = new Map<string, Session>();
  private timings: GameTimings;

  constructor(timings: Partial<GameTimings> = {}) {
    this.timings = { ...DEFAULT_TIMINGS, ...timings };
  }

  connect(id: string, send: Send) {
    this.connections.set(id, { send });
  }

  isConnected(id: string): boolean {
    return this.connections.has(id);
  }

  create(id: string, quiz?: HostedQuiz): Lobby | null {
    const connection = this.connections.get(id);
    const sanitized = quiz ? sanitizeQuiz(quiz) : undefined;
    if (quiz && !sanitized) {
      connection?.send({ type: 'error', message: 'Invalid quiz data.' });
      return null;
    }

    if (connection?.role === 'host' && connection.code) {
      this.teardownSession(connection.code, 'The host started a new lobby.');
    } else if (connection?.role === 'player' && connection.code) {
      this.leavePlayer(id, connection);
    }

    const lobby = createLobby(
      sanitized ? { id: sanitized.id, title: sanitized.title } : undefined,
    );
    if (connection) {
      connection.code = lobby.code;
      connection.role = 'host';
    }
    this.sessions.set(lobby.code, {
      code: lobby.code,
      hostId: id,
      ...(sanitized ? { quiz: sanitized } : {}),
      phase: 'lobby',
      questionIndex: 0,
      questionStartedAt: 0,
      revealScheduled: false,
      players: new Map(),
    });
    return lobby;
  }

  join(id: string, pin: string, name: string) {
    const connection = this.connections.get(id);
    if (!connection) return;

    if (connection.role === 'host' && connection.code) {
      connection.send({
        type: 'error',
        message: 'Hosts cannot join a game as a player.',
      });
      return;
    }

    if (connection.role === 'player' && connection.code) {
      const current = this.sessions.get(connection.code);
      if (current && current.phase !== 'finished') {
        connection.send({
          type: 'error',
          message: 'You have already joined a game.',
        });
        return;
      }
      this.leavePlayer(id, connection);
    }

    const session = this.sessions.get(pin);
    if (!session || !getLobby(pin)) {
      connection.send({ type: 'error', message: 'Game PIN not found.' });
      return;
    }
    if (session.phase !== 'lobby') {
      connection.send({
        type: 'error',
        message: 'This game has already started.',
      });
      return;
    }

    const result = addPlayer(pin, name);
    if (!result.ok) {
      connection.send({ type: 'error', message: result.reason });
      return;
    }

    const trimmedName = name.trim();
    connection.code = pin;
    connection.role = 'player';
    const player: Player = {
      id,
      name: trimmedName,
      send: connection.send,
      score: 0,
      answer: null,
      answeredAt: 0,
    };
    session.players.set(id, player);
    connection.send({ type: 'lobby' });
    this.notifyLobbyUpdate(session, result.lobby);
  }

  start(id: string) {
    const connection = this.connections.get(id);
    const session = connection?.code
      ? this.sessions.get(connection.code)
      : undefined;
    if (connection?.role !== 'host' || !session) {
      connection?.send({ type: 'error', message: 'No hosted lobby is ready.' });
      return;
    }
    if (!session.quiz) {
      connection.send({
        type: 'error',
        message: 'Select a quiz before starting.',
      });
      return;
    }
    if (session.phase !== 'lobby') return;
    if (session.players.size === 0) {
      connection.send({
        type: 'error',
        message: 'Wait for a player to join first.',
      });
      return;
    }

    connection.send({ type: 'game-started' });
    this.sendQuestion(session);
  }

  answer(id: string, questionId: string, choice: number) {
    const connection = this.connections.get(id);
    const session = connection?.code
      ? this.sessions.get(connection.code)
      : undefined;
    const player = session?.players.get(id);
    const question = session?.quiz?.questions[session.questionIndex];
    if (
      session?.phase !== 'question' ||
      !player ||
      !question ||
      player.answer !== null ||
      question.id !== questionId ||
      Date.now() >= session.questionStartedAt + this.timings.questionMs ||
      choice < 0 ||
      choice > 3
    ) {
      return;
    }

    player.answer = choice;
    player.answeredAt = Date.now() - session.questionStartedAt;
    this.maybeScheduleEarlyReveal(session);
  }

  disconnect(id: string) {
    const connection = this.connections.get(id);
    if (connection?.code) {
      if (connection.role === 'host') {
        this.teardownSession(connection.code, 'The host disconnected.');
      } else if (connection.role === 'player') {
        this.leavePlayer(id, connection);
      }
    }
    this.connections.delete(id);
  }

  private leavePlayer(id: string, connection: Connection) {
    const code = connection.code;
    delete connection.code;
    delete connection.role;
    if (!code) return;

    const session = this.sessions.get(code);
    const player = session?.players.get(id);
    if (!session || !player) return;

    session.players.delete(id);
    const lobby = removePlayer(code, player.name);
    if (lobby) {
      this.notifyLobbyUpdate(session, lobby);
    }

    if (session.phase === 'question') {
      if (session.players.size === 0) {
        if (session.timer) clearTimeout(session.timer);
        delete session.timer;
        session.phase = 'finished';
      } else {
        this.maybeScheduleEarlyReveal(session);
      }
    }
  }

  private teardownSession(code: string, reason: string) {
    const session = this.sessions.get(code);
    if (session) {
      if (session.timer) clearTimeout(session.timer);
      for (const player of session.players.values()) {
        const playerConnection = this.connections.get(player.id);
        if (playerConnection) {
          delete playerConnection.code;
          delete playerConnection.role;
        }
        if (session.phase !== 'finished') {
          player.send({ type: 'error', message: reason });
        }
      }
      this.sessions.delete(code);
    }
    deleteLobby(code);
  }

  private notifyLobbyUpdate(session: Session, lobby: Lobby) {
    this.connections.get(session.hostId)?.send({
      type: 'lobby-update',
      players: [...lobby.players],
    });
  }

  private maybeScheduleEarlyReveal(session: Session) {
    if (session.phase !== 'question' || session.revealScheduled) return;
    const allAnswered = [...session.players.values()].every(
      (p) => p.answer !== null,
    );
    if (!allAnswered) return;
    session.revealScheduled = true;
    if (session.timer) clearTimeout(session.timer);
    session.timer = setTimeout(() => {
      this.reveal(session);
    }, this.timings.revealDelayMs);
  }

  private sendQuestion(session: Session) {
    if (!session.quiz) return;
    const question = session.quiz.questions[session.questionIndex];
    if (!question) {
      session.phase = 'finished';
      const allPlayers = [...session.players.values()];
      for (const player of allPlayers) {
        const rank =
          1 + allPlayers.filter((other) => other.score > player.score).length;
        player.send({
          type: 'finished',
          score: player.score,
          rank,
          players: allPlayers.length,
        });
      }
      return;
    }

    session.phase = 'question';
    session.revealScheduled = false;
    session.questionStartedAt = Date.now();
    const endsAt = session.questionStartedAt + this.timings.questionMs;
    for (const player of session.players.values()) {
      player.answer = null;
      player.answeredAt = 0;
      player.send({
        type: 'question',
        index: session.questionIndex,
        total: session.quiz.questions.length,
        question: {
          id: question.id,
          prompt: question.prompt,
          choices: question.choices,
        },
        endsAt,
        durationMs: this.timings.questionMs,
      });
    }
    session.timer = setTimeout(() => {
      this.reveal(session);
    }, this.timings.questionMs);
  }

  private reveal(session: Session) {
    if (session.phase !== 'question' || !session.quiz) return;
    const question = session.quiz.questions[session.questionIndex];
    if (!question) return;
    if (session.timer) clearTimeout(session.timer);
    session.phase = 'reveal';

    for (const player of session.players.values()) {
      const correct = player.answer === question.correctChoice;
      const elapsed = Math.min(
        this.timings.questionMs,
        Math.max(0, player.answeredAt),
      );
      const pointsEarned = correct
        ? Math.round(1000 * (1 - (elapsed / this.timings.questionMs) * 0.5))
        : 0;
      player.score += pointsEarned;
      player.send({
        type: 'reveal',
        correctChoice: question.correctChoice,
        yourChoice: player.answer,
        correct,
        pointsEarned,
        score: player.score,
      });
    }

    session.questionIndex += 1;
    session.timer = setTimeout(() => {
      this.sendQuestion(session);
    }, this.timings.nextQuestionDelayMs);
  }
}
