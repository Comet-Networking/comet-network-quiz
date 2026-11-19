export interface Lobby {
  code: string;
  players: string[];
  quizId?: string;
  quizTitle?: string;
}

const lobbies = new Map<string, Lobby>();

export function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    const index = Math.floor(Math.random() * alphabet.length);
    code += alphabet.charAt(index);
  }
  return code;
}

export function createLobby(quiz?: { id: string; title: string }): Lobby {
  let code = generateCode();
  while (lobbies.has(code)) {
    code = generateCode();
  }
  const lobby: Lobby = {
    code,
    players: [],
    ...(quiz ? { quizId: quiz.id, quizTitle: quiz.title } : {}),
  };
  lobbies.set(code, lobby);
  return lobby;
}

export function getLobby(code: string): Lobby | undefined {
  return lobbies.get(code);
}
