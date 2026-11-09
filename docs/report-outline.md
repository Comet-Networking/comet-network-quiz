# Class report and evaluation outline

This is a planning template. The scaffold contains no completed gameplay evaluation
or fabricated results. The assignment allows high-level protocols and requires
annotated source, a report, run instructions, and a four-minute presentation.

## Report sections to write as implementation progresses

1. **Motivation and goals:** audience, quiz idea, intended MVP, and exclusions.
2. **Design:** component ownership, authoritative game state, deployment model,
   decisions, and alternatives considered.
3. **Protocol:** HTTP/WS roles, schemas, game state transitions, timing, trust,
   ordering, errors, duplicate messages, and disconnect/reconnect decisions.
4. **Evaluation:** method, environment, client count, measurements, observations,
   failures, and limitations. Distinguish automated tests from manual experiments.
5. **Run instructions:** Bun version, frozen install, local commands, production
   commands, deployment URL, and class warmup steps.
6. **References and contributions:** sources, library responsibilities, team roles,
   and annotations explaining non-obvious source decisions.

## Evaluation plan (not results)

| Boundary               | Proposed evidence                                                      |
| ---------------------- | ---------------------------------------------------------------------- |
| Current infrastructure | Health, protocol validation, typed client, SPA routes, WS upgrade      |
| Future room/game rules | Multiple clients; unauthorized actions; duplicate/late answers         |
| Future timing/scoring  | Controlled correct/incorrect answers and delays; server clock behavior |
| Future robustness      | Disconnects/reconnects, malformed input, message limits, restarts      |
| Render demo            | Health/WSS after cold start; note observed warmup and reset behavior   |

Record each experiment's date, commit, setup, expected behavior, actual behavior,
and measurements. Do not label health probes or ping/pong as successful gameplay.

## Four-minute presentation plan

- 0:00–0:40: motivation, intended goals, and implemented scope.
- 0:40–1:40: architecture and application protocol.
- 1:40–3:10: demo and real evaluation evidence.
- 3:10–4:00: limitations, lessons, and next steps.

Until gameplay exists, demo only the infrastructure and say so explicitly.
