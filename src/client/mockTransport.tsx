import type { PlayerQuestion } from './routes/play';
import type { Transport } from './routes/play';
import type { ServerMessage } from './routes/play';

// Replace with a WebSocket / socket.io implementation of `Transport`.
export function createMockTransport(): Transport {
  const quiz: (PlayerQuestion & { correctChoice: number })[] = [
    {
      id: 'q1',
      prompt: 'Which data structure uses FIFO ordering?',
      choices: ['Stack', 'Queue', 'Heap', 'Tree'],
      correctChoice: 1,
    },
    {
      id: 'q2',
      prompt: 'What does a page table map?',
      choices: [
        'Files to inodes',
        'Virtual to physical addresses',
        'Threads to cores',
        'Sockets to ports',
      ],
      correctChoice: 1,
    },
    {
      id: 'q3',
      prompt: 'Which scheduling policy can starve long jobs?',
      choices: ['Round robin', 'FCFS', 'Shortest job first', 'Lottery'],
      correctChoice: 2,
    },
  ];
  const DURATION = 10_000;
  const listeners = new Set<(m: ServerMessage) => void>();
  const emit = (m: ServerMessage) => {
    {
      listeners.forEach((l) => {
        l(m);
      });
    }
  };

  let score = 0;
  let current = -1;
  let answer: { choice: number; at: number } | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  //function that reveals the correct answer
  const reveal = () => {
    const q = quiz[current];
    if (!q) return;
    //caclulate the player's score based on how fast they answered
    const correct = answer?.choice === q.correctChoice;
    const earned =
      correct && answer
        ? Math.round(1000 * (1 - (answer.at / DURATION) * 0.5))
        : 0;
    score += earned;
    //send the reveal message to every listener
    emit({
      type: 'reveal',
      correctChoice: q.correctChoice,
      yourChoice: answer?.choice ?? null,
      correct,
      pointsEarned: earned,
      score,
    });
    //move to the next question
    timer = setTimeout(next, 3000);
  };

  //funciton gets the next question
  const next = () => {
    current += 1;
    answer = null;
    const q = quiz[current];
    //if there are no more questions, send the finished message to every listener
    if (!q) {
      emit({ type: 'finished', score, rank: 1, players: 1 });
      return;
    }

    const { id, prompt, choices } = q;
    //send a message containing the question information and duration
    emit({
      type: 'question',
      index: current,
      total: quiz.length,
      question: { id, prompt, choices },
      endsAt: Date.now() + DURATION,
      durationMs: DURATION,
    });

    //call the reveal function when the time ends
    timer = setTimeout(reveal, DURATION);
  };

  return {
    subscribe(l) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
        clearTimeout(timer);
      };
    },
    //processing the received messages
    send(msg) {
      if (msg.type === 'join') {
        setTimeout(() => {
          emit({ type: 'lobby' });
        }, 300);
        setTimeout(next, 2500);
      } else if (!answer) {
        answer = { choice: msg.choice, at: 0 };
        clearTimeout(timer);
        timer = setTimeout(reveal, 1500);
      }
    },
  };
}
