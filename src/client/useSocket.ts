import { useCallback, useEffect, useRef, useState } from 'react';

const MESSAGE_TYPES = ['said', 'pong'] as const;
export interface messageTypes {
  type: 'said';
  name: string;
  text: string;
  at: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isServerMessage(value: unknown): value is messageTypes {
  return (
    isRecord(value) &&
    typeof value['type'] === 'string' &&
    (MESSAGE_TYPES as readonly string[]).includes(value['type'])
  );
}

export function useSocket(onMessage: (msg: unknown) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  const handler = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    handler.current = onMessage; // always call the latest callback
  }, [onMessage]);

  useEffect(() => {
    let stopped = false;
    let retry: ReturnType<typeof setTimeout>;

    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      // location.host = whatever address this page was loaded from,
      // so it works from a phone with no hardcoded IP.
      const ws = new WebSocket(`${proto}://${location.host}/api/ws`);
      wsRef.current = ws;
      ws.onopen = () => {
        setConnected(true);
      };
      ws.onclose = () => {
        setConnected(false);
        if (!stopped) retry = setTimeout(connect, 1000); // auto-reconnect
      };
      ws.onmessage = (e) => {
        handler.current(JSON.parse(e.data));
      };
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(retry);
      wsRef.current?.close();
    };
  }, []);

  const send = useCallback((msg: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { connected, send };
}
