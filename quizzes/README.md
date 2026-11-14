# Quiz formats

The **Quizzes** page lets you create a custom quiz, choose the correct answer
for each question, and save it in this browser. You can export a quiz as JSON
or import a JSON file exported from the page. The JSON fields follow the same
shape as the schema below, including `correctChoice` (zero-based, from 0 to 3).

These browser-saved quizzes are an authoring feature; the game server does not
load them yet. The YAML example is a server-side format example, and
`quiz.schema.yaml` describes that format.
