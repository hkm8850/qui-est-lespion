import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws-chat';

let stompClient = null;

export function connectWebSocket(gameCode, { onGameState, onChatMessage }) {
  if (stompClient?.active) {
    stompClient.deactivate();
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_BASE),
    reconnectDelay: 4000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      stompClient.subscribe(`/topic/game/${gameCode}/state`, (message) => {
        const data = JSON.parse(message.body);
        onGameState?.(data);
      });

      stompClient.subscribe(`/topic/game/${gameCode}`, (message) => {
        const data = JSON.parse(message.body);
        onChatMessage?.(data);
      });
    },
    onStompError: (frame) => {
      console.error('STOMP error:', frame.headers.message);
    },
  });

  stompClient.activate();
  return stompClient;
}

export function sendChatMessage(gameCode, sender, content) {
  if (!stompClient?.connected) {
    throw new Error('Le chat n est pas encore connecte.');
  }

  stompClient.publish({
    destination: '/app/chat.sendMessage',
    body: JSON.stringify({ gameCode, sender, content }),
  });
}

export function disconnectWebSocket() {
  if (!stompClient) return;
  stompClient.deactivate();
  stompClient = null;
}
