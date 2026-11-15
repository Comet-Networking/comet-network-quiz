# Comet Network Quiz

A multiplayer quiz project built with React, Mantine, and Bun/Elysia.

## Run locally

Install [Bun](https://bun.com/docs/installation) **1.4.4 or later**, then run:

```sh
bun install
bun run dev
```

Open <http://localhost:5173>. The dev command starts Vite and the API server;
Vite proxies `/api` HTTP and WebSocket traffic to port 3000.

## Quiz authoring

`/quizzes` saves custom quizzes in the current browser and imports quiz JSON
files. `/create-quiz` saves quizzes as server-side YAML files in `quizzes/`.

Set `QUIZ_ADMIN_KEY` on the server and enter that key in the hosted quiz form.
Quiz creation and update requests are denied until a key is configured. Never
put the key in client code or commit it to the repository.

The quiz API provides `POST /api/quizzes`, `PUT /api/quizzes/:id`, and public
`GET /api/quizzes/:id/info`. Writes require the `x-quiz-admin-key` header;
public metadata includes only the title, ID, and question count. Quiz files
need persistent storage if they must survive a deployment or server restart on
an ephemeral host.
