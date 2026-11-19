import type { ClientMessage, ServerMessage, Transport } from './routes/play';

function isServerMessage(value: unknown): value is ServerMessage {
  if (typeof value !== 'object' || value === null || !('type' in value)) {
    return false;
  }
  return ['lobby', 'error', 'question', 'reveal', 'finished'].includes(
    String(value.type),
  );
}

export function createGameTransport(): Transport {
  const listeners = new Set<(message: ServerMessage) => void>();
  const pending: ClientMessage[] = [];
  let socket: WebSocket | null = null;

  const connect = () => {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    socket = new WebSocket(`${protocol}://${location.host}/api/ws`);
    socket.onopen = () => {
      while (pending.length > 0) {
        const message = pending.shift();
        if (message) socket?.send(JSON.stringify(message));
      }
    };
    socket.onmessage = (event) => {
      if (typeof event.data !== 'string') return;
      try {
        const message: unknown = JSON.parse(event.data);
        if (isServerMessage(message)) {
          listeners.forEach((listener) => {
            listener(message);
          });
        }
      } catch {
        // Ignore malformed server messages.
      }
    };
    socket.onerror = () => {
      listeners.forEach((listener) => {
        listener({ type: 'error', message: 'Could not connect to the game.' });
      });
    };
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      if (!socket || socket.readyState === WebSocket.CLOSED) connect();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          socket?.close();
          socket = null;
        }
      };
    },
    send(message) {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        pending.push(message);
      }
    },
  };
}
