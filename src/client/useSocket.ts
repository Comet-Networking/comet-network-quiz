import { useCallback, useEffect, useRef, useState } from 'react';

export interface Said {
  type: 'said';
  text: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isServerMessage(value: unknown): value is Said {
  return (
    isRecord(value) &&
    value['type'] === 'said' &&
    typeof value['text'] === 'string'
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
        if (!stopped) setConnected(true);
      };
      ws.onclose = () => {
        if (stopped) return;
        setConnected(false);
        retry = setTimeout(connect, 1000); // auto-reconnect
      };
      ws.onmessage = (e) => {
        if (typeof e.data !== 'string') return;
        handler.current(JSON.parse(e.data) as unknown);
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
