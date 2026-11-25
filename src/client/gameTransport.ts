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
  let closing = false;
  let finished = false;

  const emit = (message: ServerMessage) => {
    listeners.forEach((listener) => {
      listener(message);
    });
  };

  const connect = () => {
    closing = false;
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${location.host}/api/ws`);
    socket = ws;
    ws.onopen = () => {
      if (socket !== ws) return;
      while (pending.length > 0 && ws.readyState === WebSocket.OPEN) {
        const message = pending.shift();
        if (message) ws.send(JSON.stringify(message));
      }
    };
    ws.onmessage = (event) => {
      if (socket !== ws) return;
      if (typeof event.data !== 'string') return;
      try {
        const message: unknown = JSON.parse(event.data);
        if (isServerMessage(message)) {
          if (message.type === 'finished') finished = true;
          if (message.type === 'lobby') finished = false;
          emit(message);
        }
      } catch {
        // Ignore malformed server messages.
      }
    };
    ws.onerror = () => {
      if (socket !== ws) return;
      pending.length = 0;
      if (!closing && !finished) {
        emit({ type: 'error', message: 'Could not connect to the game.' });
      }
    };
    ws.onclose = () => {
      if (socket !== ws) return;
      socket = null;
      pending.length = 0;
      if (!closing && !finished && listeners.size > 0) {
        emit({ type: 'error', message: 'Connection lost. Please rejoin.' });
      }
    };
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      if (
        !socket ||
        socket.readyState === WebSocket.CLOSED ||
        socket.readyState === WebSocket.CLOSING
      ) {
        connect();
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          closing = true;
          pending.length = 0;
          socket?.close();
          socket = null;
        }
      };
    },
    send(message) {
      if (message.type === 'join') finished = false;
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
        return;
      }
      pending.push(message);
      if (
        !socket ||
        socket.readyState === WebSocket.CLOSED ||
        socket.readyState === WebSocket.CLOSING
      ) {
        connect();
      }
    },
  };
}
