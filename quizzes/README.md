# Quiz formats

The **Quizzes** page (`/quizzes`) is the unified quiz editor. You can save a
quiz either:

- **On this device (browser)**: stored in `localStorage`, or imported from a
  quiz JSON file.
- **On the server (YAML)**: stored as `quizzes/<id>.yaml` via `POST /api/quizzes`
  (requires `QUIZ_ADMIN_KEY`).

Both formats follow the same schema in `quiz.schema.yaml`, including a
zero-based `correctChoice` from `0` to `3`, and both server quizzes and
browser-saved quizzes can be selected and hosted on `/host`.
