# Hand-authored quizzes (server only)

Future quizzes will be YAML files in this folder. `example.yaml` illustrates the
format in `quiz.schema.yaml`: a nonempty question list, exactly four choices per
question, and one zero-based `correctChoice` index (0–3).

The schema is standard JSON Schema draft 2020-12 represented as a YAML mapping.
A future server-side loader can parse both files with Bun 1.4.4's built-in
`Bun.YAML.parse`, then validate the quiz separately against the parsed schema.
The example's `$schema` metadata points to the schema; editor validation may require
a JSON-serialized copy of that schema, depending on the editor's support.

The example is a format fixture, not a playable quiz. Nothing loads these files
yet. Add a server-side loader and runtime validation before using them. Do not
put this directory under Vite's `public` directory or import it into client code.
Only send the public question/choices during a question; keep the answer key on
the server until the protocol explicitly permits revealing it.
