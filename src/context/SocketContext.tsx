import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Message, User } from '../types';

interface MatchEventData {
  matchId: string;
  conversationId: string;
  matchedUser: User;
}

interface SocketContextType {
  isConnected: boolean;
  activeMatchEvent: MatchEventData | null;
  clearMatchEvent: () => void;
  sendTyping: (recipientId: string, isTyping: boolean) => void;
  typingUsers: Record<string, boolean>;
  lastMessageEvent: Message | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeMatchEvent, setActiveMatchEvent] = useState<MatchEventData | null>(null);
  const [lastMessageEvent, setLastMessageEvent] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user || !token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'match') {
          setActiveMatchEvent({
            matchId: data.matchId,
            conversationId: data.conversationId,
            matchedUser: data.matchedUser,
          });
        }

        if (data.type === 'new_message') {
          setLastMessageEvent(data.message);
        }

        if (data.type === 'typing') {
          setTypingUsers((prev) => ({
            ...prev,
            [data.senderId]: data.isTyping,
          }));
        }
      } catch (err) {
        console.error('Socket parse error:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setIsConnected(false);
    };

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [user, token]);

  const sendTyping = (recipientId: string, isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing',
          recipientId,
          isTyping,
        })
      );
    }
  };

  const clearMatchEvent = () => setActiveMatchEvent(null);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        activeMatchEvent,
        clearMatchEvent,
        sendTyping,
        typingUsers,
        lastMessageEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
