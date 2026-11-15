import { Elysia, t } from 'elysia';
import { loadQuiz, saveQuiz, updateQuiz } from './quizzes';

function canEditQuiz(request: Request): boolean {
  return request.headers.get('x-quiz-admin-key') === 'comet-quiz-admin';
}

import { createLobby } from './lobbies';
import { lanAddresses } from './network';

const strict = { additionalProperties: false } as const;
const Id = t.String({ minLength: 1, maxLength: 64 });

const Pong = t.Object({ type: t.Literal('pong'), requestId: Id }, strict);
const Said = t.Object({ type: t.Literal('said'), text: t.String() }, strict);

function createApi() {
  return new Elysia()
    .get('/health', () => ({ status: 'ok' as const }))
    .get('/info', () => ({ addresses: lanAddresses() }))
    .get('/quizzes/:id/info', async ({ params }) => {
      const quiz = (await loadQuiz(params.id)) as {
        id: string;
        title: string;
        questions: unknown[];
      };

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
        t.Object({ type: t.Literal('create-lobby') }, strict),
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
          { type: t.Literal('lobby-created'), code: t.String() },
          strict,
        ),
      ]),
      open(socket) {
        socket.subscribe('lobby');
      },
      message(socket, message) {
        if (message.type === 'ping') {
          socket.send({ type: 'pong', requestId: message.requestId });
          return;
        }
        if (message.type === 'create-lobby') {
          const lobby = createLobby();
          socket.send({ type: 'lobby-created', code: lobby.code });
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
  const app = new Elysia({ websocket: { maxPayloadLength: 1024 } });
  return app.group('/api', (api) => api.use(createApi()));
}

export type App = ReturnType<typeof createApp>;
