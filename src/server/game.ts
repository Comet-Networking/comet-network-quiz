import type { GameEvent, HostedQuiz } from './gameTypes';
import { createLobby, getLobby, type Lobby } from './lobbies';

type Send = (message: GameEvent) => void;

interface Connection {
  send: Send;
  code?: string;
  role?: 'host' | 'player';
}

interface Player {
  name: string;
  send: Send;
  index: number;
  score: number;
  answer: number | null;
  answeredAt: number;
  questionStartedAt: number;
  timer?: ReturnType<typeof setTimeout>;
}

interface Session {
  hostId: string;
  quiz: HostedQuiz;
  started: boolean;
  players: Map<string, Player>;
}

const QUESTION_DURATION = 15_000;

export class GameManager {
  private connections = new Map<string, Connection>();
  private sessions = new Map<string, Session>();

  connect(id: string, send: Send) {
    this.connections.set(id, { send });
  }

  create(id: string, quiz?: HostedQuiz): Lobby {
    const lobby = createLobby(
      quiz ? { id: quiz.id, title: quiz.title } : undefined,
    );
    const connection = this.connections.get(id);
    if (connection) {
      connection.code = lobby.code;
      connection.role = 'host';
    }
    if (quiz) {
      this.sessions.set(lobby.code, {
        hostId: id,
        quiz,
        started: false,
        players: new Map(),
      });
    }
    return lobby;
  }

  join(id: string, pin: string, name: string) {
    const session = this.sessions.get(pin);
    const lobby = getLobby(pin);
    const connection = this.connections.get(id);
    if (!session || !lobby || !connection) {
      connection?.send({ type: 'error', message: 'Game PIN not found.' });
      return;
    }
    if (session.started) {
      connection.send({
        type: 'error',
        message: 'This game has already started.',
      });
      return;
    }

    connection.code = pin;
    connection.role = 'player';
    const player: Player = {
      name,
      send: connection.send,
      index: 0,
      score: 0,
      answer: null,
      answeredAt: 0,
      questionStartedAt: 0,
    };
    session.players.set(id, player);
    lobby.players.push(name);
    connection.send({ type: 'lobby' });
    this.connections.get(session.hostId)?.send({
      type: 'lobby-update',
      players: [...lobby.players],
    });
  }

  start(id: string) {
    const connection = this.connections.get(id);
    const session = connection?.code
      ? this.sessions.get(connection.code)
      : undefined;
    if (connection?.role !== 'host' || !session) {
      connection?.send({ type: 'error', message: 'No hosted quiz is ready.' });
      return;
    }
    if (session.started) return;
    if (session.players.size === 0) {
      connection.send({
        type: 'error',
        message: 'Wait for a player to join first.',
      });
      return;
    }

    session.started = true;
    connection.send({ type: 'game-started' });
    for (const player of session.players.values()) {
      this.sendQuestion(session, player);
    }
  }

  answer(id: string, questionId: string, choice: number) {
    const connection = this.connections.get(id);
    const session = connection?.code
      ? this.sessions.get(connection.code)
      : undefined;
    const player = session?.players.get(id);
    const question = session?.quiz.questions[player?.index ?? -1];
    if (
      !session?.started ||
      !player ||
      !question ||
      player.answer !== null ||
      question.id !== questionId ||
      Date.now() >= player.questionStartedAt + QUESTION_DURATION ||
      choice < 0 ||
      choice > 3
    ) {
      return;
    }

    player.answer = choice;
    player.answeredAt = Date.now() - player.questionStartedAt;
    if (player.timer) clearTimeout(player.timer);
    player.timer = setTimeout(() => {
      this.reveal(session, player);
    }, 1000);
  }

  disconnect(id: string) {
    const connection = this.connections.get(id);
    if (connection?.code && connection.role === 'player') {
      const session = this.sessions.get(connection.code);
      const player = session?.players.get(id);
      if (player?.timer) clearTimeout(player.timer);
      session?.players.delete(id);
      const lobby = getLobby(connection.code);
      if (lobby && player) {
        const index = lobby.players.indexOf(player.name);
        if (index >= 0) lobby.players.splice(index, 1);
      }
      if (session && lobby) {
        this.connections.get(session.hostId)?.send({
          type: 'lobby-update',
          players: [...lobby.players],
        });
      }
    }
    this.connections.delete(id);
  }

  private sendQuestion(session: Session, player: Player) {
    const question = session.quiz.questions[player.index];
    if (!question) {
      const rank =
        1 +
        [...session.players.values()].filter(
          (other) => other.score > player.score,
        ).length;
      player.send({
        type: 'finished',
        score: player.score,
        rank,
        players: session.players.size,
      });
      return;
    }

    player.answer = null;
    player.questionStartedAt = Date.now();
    player.send({
      type: 'question',
      index: player.index,
      total: session.quiz.questions.length,
      question: {
        id: question.id,
        prompt: question.prompt,
        choices: question.choices,
      },
      endsAt: player.questionStartedAt + QUESTION_DURATION,
      durationMs: QUESTION_DURATION,
    });
    player.timer = setTimeout(() => {
      this.reveal(session, player);
    }, QUESTION_DURATION);
  }

  private reveal(session: Session, player: Player) {
    const question = session.quiz.questions[player.index];
    if (!question) return;
    if (player.timer) clearTimeout(player.timer);
    const correct = player.answer === question.correctChoice;
    const pointsEarned = correct
      ? Math.round(1000 * (1 - (player.answeredAt / QUESTION_DURATION) * 0.5))
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
    player.index += 1;
    player.timer = setTimeout(() => {
      this.sendQuestion(session, player);
    }, 2500);
  }
}
