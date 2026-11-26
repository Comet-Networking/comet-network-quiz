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

## Quiz authoring and hosting

`/quizzes` lets you create quizzes and choose whether to save them locally in
the browser (or import a quiz JSON file) or save them as server-side YAML files
in `quizzes/`. `/host` can host both server-side quizzes and browser-saved
quizzes, and `/play` connects players over WebSockets.

Set `QUIZ_ADMIN_KEY` on the server and enter that key when saving a quiz to the
server. Server quiz creation and update requests are denied until a key is
configured. Never put the key in client code or commit it to the repository.

The quiz API provides public `GET /api/quizzes` and `GET /api/quizzes/:id/info`
(metadata only: ID, title, and question count) as well as authenticated
`POST /api/quizzes` and `PUT /api/quizzes/:id` (requiring the
`x-quiz-admin-key` header). Quiz files need persistent storage if they must
survive a deployment or server restart on an ephemeral host.
