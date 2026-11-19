import { Elysia, t } from 'elysia';
import { GameManager } from './game';
import { lanAddresses } from './network';
import { loadQuiz, QuizError, saveQuiz, updateQuiz } from './quizzes';

function canEditQuiz(request: Request): boolean {
  const key = process.env['QUIZ_ADMIN_KEY'];
  return Boolean(key) && request.headers.get('x-quiz-admin-key') === key;
}

const strict = { additionalProperties: false } as const;
const Id = t.String({ minLength: 1, maxLength: 64 });

const Pong = t.Object({ type: t.Literal('pong'), requestId: Id }, strict);
const Said = t.Object({ type: t.Literal('said'), text: t.String() }, strict);
const Choice = t.String({ minLength: 1 });
const Question = t.Object(
  {
    id: Id,
    prompt: t.String({ minLength: 1 }),
    choices: t.Tuple([Choice, Choice, Choice, Choice]),
    correctChoice: t.Integer({ minimum: 0, maximum: 3 }),
  },
  strict,
);
const HostedQuiz = t.Object(
  {
    id: Id,
    title: t.String({ minLength: 1, maxLength: 100 }),
    questions: t.Array(Question, { minItems: 1 }),
  },
  strict,
);

function createApi() {
  const game = new GameManager();
  return new Elysia()
    .onError(({ error, set }) => {
      if (error instanceof QuizError) {
        set.status = error.status;
        return { error: error.message };
      }
      return undefined;
    })
    .get('/health', () => ({ status: 'ok' as const }))
    .get('/info', () => ({ addresses: lanAddresses() }))
    .get('/quizzes/:id/info', async ({ params }) => {
      const quiz = await loadQuiz(params.id);

      return {
        id: quiz.id,
        title: quiz.title,
        questionCount: quiz.questions.length,
      };
    })
    .post(
      '/quizzes',
      async ({ request, body, set }) => {
        if (!canEditQuiz(request)) {
          set.status = 403;
          return { error: 'Not authorized' };
        }

        await saveQuiz(body);
        return { success: true };
      },
      {
        body: t.Unknown(),
      },
    )
    .put(
      '/quizzes/:id',
      async ({ request, params, body, set }) => {
        if (!canEditQuiz(request)) {
          set.status = 403;
          return { error: 'Not authorized' };
        }

        await updateQuiz(params.id, body);
        return { success: true };
      },
      {
        body: t.Unknown(),
      },
    )
    .post('/echo', ({ body }) => ({ message: body.message }), {
      body: t.Object(
        { message: t.String({ minLength: 1, maxLength: 200 }) },
        { additionalProperties: false },
      ),
    })
    .ws('/ws', {
      body: t.Union([
        t.Object({ type: t.Literal('ping'), requestId: Id }, strict),
        t.Object(
          {
            type: t.Literal('create-lobby'),
            quiz: t.Optional(HostedQuiz),
          },
          strict,
        ),
        t.Object({ type: t.Literal('start-game') }, strict),
        t.Object(
          {
            type: t.Literal('join'),
            pin: t.String({ minLength: 1, maxLength: 16 }),
            name: t.String({ minLength: 1, maxLength: 20 }),
          },
          strict,
        ),
        t.Object(
          {
            type: t.Literal('answer'),
            questionId: Id,
            choice: t.Integer({ minimum: 0, maximum: 3 }),
          },
          strict,
        ),
        t.Object(
          {
            type: t.Literal('say'),
            text: t.String({ minLength: 1, maxLength: 200 }),
          },
          strict,
        ),
      ]),
      response: t.Union([
        Pong,
        Said,
        t.Object(
          {
            type: t.Literal('lobby-created'),
            code: t.String(),
            quizId: t.Optional(Id),
            quizTitle: t.Optional(t.String()),
          },
          strict,
        ),
        t.Object({ type: t.Literal('lobby') }, strict),
        t.Object({ type: t.Literal('error'), message: t.String() }, strict),
        t.Object(
          { type: t.Literal('player-joined'), players: t.Integer() },
          strict,
        ),
        t.Object({ type: t.Literal('game-started') }, strict),
        t.Object(
          {
            type: t.Literal('question'),
            index: t.Integer(),
            total: t.Integer(),
            question: t.Object(
              {
                id: Id,
                prompt: t.String(),
                choices: t.Tuple([Choice, Choice, Choice, Choice]),
              },
              strict,
            ),
            endsAt: t.Number(),
            durationMs: t.Number(),
          },
          strict,
        ),
        t.Object(
          {
            type: t.Literal('reveal'),
            correctChoice: t.Integer({ minimum: 0, maximum: 3 }),
            yourChoice: t.Union([
              t.Integer({ minimum: 0, maximum: 3 }),
              t.Null(),
            ]),
            correct: t.Boolean(),
            pointsEarned: t.Integer(),
            score: t.Integer(),
          },
          strict,
        ),
        t.Object(
          {
            type: t.Literal('finished'),
            score: t.Integer(),
            rank: t.Integer(),
            players: t.Integer(),
          },
          strict,
        ),
      ]),
      open(socket) {
        game.connect(socket.id, (message) => socket.send(message));
        socket.subscribe('lobby');
      },
      close(socket) {
        game.disconnect(socket.id);
      },
      message(socket, message) {
        if (message.type === 'ping') {
          socket.send({ type: 'pong', requestId: message.requestId });
          return;
        }
        if (message.type === 'create-lobby') {
          const lobby = game.create(socket.id, message.quiz);
          socket.send({
            type: 'lobby-created',
            code: lobby.code,
            ...(lobby.quizId && lobby.quizTitle
              ? { quizId: lobby.quizId, quizTitle: lobby.quizTitle }
              : {}),
          });
          return;
        }
        if (message.type === 'start-game') {
          game.start(socket.id);
          return;
        }
        if (message.type === 'join') {
          game.join(
            socket.id,
            message.pin.trim().toUpperCase(),
            message.name.trim(),
          );
          return;
        }
        if (message.type === 'answer') {
          game.answer(socket.id, message.questionId, message.choice);
          return;
        }
        const out = {
          type: 'said' as const,
          text: message.text,
        };
        socket.send(out);
        socket.publish('lobby', out);
      },
    });
}

// No listener or game state here: production composes this app and Eden derives its types.
export function createApp() {
  const app = new Elysia({ websocket: { maxPayloadLength: 1048576 } });
  return app.group('/api', (api) => api.use(createApi()));
}

export type App = ReturnType<typeof createApp>;
