import { useEffect, useRef, useState, useCallback } from 'react';

export default function useWebSocket(token) {
  const wsRef = useRef(null);
  const [messages, setMessages] = useState([]); // входящие события

  useEffect(() => {
    const API = process.env.REACT_APP_API_URL;
    const wsProtocol = API.startsWith('https') ? 'wss' : 'ws';
    const wsHost = API.replace(/^https?:/, '');
    const ws = new WebSocket(`${wsProtocol}:${wsHost}?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data);
      setMessages(prev => [...prev, msg]);
    };
    ws.onclose = () => console.log('WS closed');
    ws.onerror = e => console.error('WS error', e);

    return () => ws.close();
  }, [token]);

  const send = useCallback(msg => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { messages, send };
}