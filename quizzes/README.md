# Hand-authored quizzes (server only)

Future quizzes will be JSON files in this folder. `example.json` illustrates the
format in `quiz.schema.json`: a nonempty question list, exactly four choices per
question, and one zero-based `correctChoice` index (0–3).

The example is a format fixture, not a playable quiz. Nothing loads these files
yet. Add a server-side loader and runtime validation before using them. Do not
put this directory under Vite's `public` directory or import it into client code.
Only send the public question/choices during a question; keep the answer key on
the server until the protocol explicitly permits revealing it.
