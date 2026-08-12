import React, { useState, useEffect, useRef } from 'react';
import { Send, ShieldAlert, Check, CheckCheck, User as UserIcon, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Message, User } from '../types';

interface ChatWindowProps {
  conversationId: string;
  otherUser: User;
  onBackMobile?: () => void;
  onReportClick: (user: User) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  otherUser,
  onBackMobile,
  onReportClick,
}) => {
  const { user, token } = useAuth();
  const { sendTyping, typingUsers, lastMessageEvent } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOtherUserTyping = typingUsers[otherUser.id] || false;

  const fetchMessages = async () => {
    if (!token || !conversationId) return;
    try {
      setError(null);
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao carregar mensagens.');
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
      setError('Falha de conexão ao carregar conversa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId, token]);

  // Handle incoming real-time messages via WebSocket
  useEffect(() => {
    if (lastMessageEvent && lastMessageEvent.conversationId === conversationId) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === lastMessageEvent.id)) return prev;
        return [...prev, lastMessageEvent];
      });
    }
  }, [lastMessageEvent, conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherUserTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Trigger typing indicator
    sendTyping(otherUser.id, true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(otherUser.id, false);
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending || !token) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      sendTyping(otherUser.id, false);

      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          recipientId: otherUser.id,
          content,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Falha ao enviar mensagem.');
      }
    } catch (err) {
      console.error('Send message error:', err);
      setError('Erro de rede ao enviar mensagem.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#111] border-b border-white/10">
        <div className="flex items-center gap-3">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="md:hidden p-2 rounded-xl bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="relative">
            <img
              src={otherUser.avatar}
              alt={otherUser.name}
              className="w-11 h-11 rounded-xl object-cover ring-2 ring-red-600/60"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#050505] ${
                otherUser.status === 'online' ? 'bg-emerald-500' : 'bg-gray-600'
              }`}
            />
          </div>

          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              {otherUser.name}
            </h3>
            <span className="text-xs text-gray-400">
              {isOtherUserTyping ? (
                <span className="text-red-400 font-bold uppercase tracking-wider text-[10px] animate-pulse">Digitando...</span>
              ) : otherUser.status === 'online' ? (
                <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Online agora</span>
              ) : (
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Offline</span>
              )}
            </span>
          </div>
        </div>

        {/* Security & Report Options */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <Lock className="w-3 h-3 text-red-500" />
            <span>Criptografado</span>
          </div>

          <button
            onClick={() => onReportClick(otherUser)}
            title="Denunciar ou Bloquear"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-red-950/60 text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-600/60 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#050505]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-xs font-bold uppercase tracking-widest">
            Carregando mensagens...
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs text-center">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-500">
              <UserIcon className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-white text-lg">Inicie o papo com {otherUser.name}!</h4>
            <p className="text-xs text-gray-400 max-w-xs">
              Vocês deram match! Mande um "Oi!" amigável e quebre o gelo.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            const msgTime = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                    isMe
                      ? 'bg-red-600 text-white rounded-br-none shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                      : 'bg-[#1a1a1a] text-gray-100 rounded-bl-none border border-white/10'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                  <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-red-200' : 'text-gray-400'}`}>
                    <span>{msgTime}</span>
                    {isMe && (
                      <span>
                        {msg.readAt ? (
                          <CheckCheck className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-red-200" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isOtherUserTyping && (
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#111] p-2.5 rounded-xl w-max border border-white/10">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>{otherUser.name.split(' ')[0]} está digitando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 bg-[#111] border-t border-white/10 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder={`Enviar mensagem para ${otherUser.name.split(' ')[0]}...`}
          className="flex-1 bg-[#050505] border border-white/10 focus:border-red-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          id="btn-send-chat-msg"
          className="p-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
