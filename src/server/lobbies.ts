


export type Lobby = {
  code: string;
  players: string[]; // player names
};

const lobbies = new Map<string, Lobby>();

//Generate codes for the lobby
export function generateCode(): string {
  
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let i = 0; i < 4; i++){
        const index = Math.floor(Math.random() * alphabet.length);
        code += alphabet[index];
    }
    return code;
}

//Create lobby codes
export function createLobby(): Lobby {
    let code = generateCode();
    while (lobbies.has(code)){
        code = generateCode();
    }

    const lobby: Lobby = {code, players: [] };
    lobbies.set(code, lobby);
    return lobby;

}

export function getLobby(code: string): Lobby | undefined {
    return lobbies.get(code);
}