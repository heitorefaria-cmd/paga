import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/ChatWindow';
import ReportModal from '../components/ReportModal';
import { User } from '../types';

interface ChatPageProps {
  initialConversationId?: string;
}

interface ConversationItem {
  id: string;
  createdAt: string;
  otherUser: User | null;
  lastMessage: any;
  unreadCount: number;
}

export const ChatPage: React.FC<ChatPageProps> = ({ initialConversationId }) => {
  const { token } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConversationId || null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reportUser, setReportUser] = useState<User | null>(null);

  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const convList: ConversationItem[] = data.conversations || [];
        setConversations(convList);

        if (!selectedConvId && convList.length > 0) {
          setSelectedConvId(convList[0].id);
        }
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [token]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  const filtered = conversations.filter((c) =>
    c.otherUser?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-100px)]">
      {/* Report Modal */}
      {reportUser && (
        <ReportModal
          targetUser={reportUser}
          onClose={() => setReportUser(null)}
          onActionComplete={() => {
            setConversations((prev) => prev.filter((c) => c.otherUser?.id !== reportUser.id));
            setSelectedConvId(null);
            setReportUser(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
        {/* Left Column: Conversations List */}
        <div
          className={`md:col-span-4 lg:col-span-4 flex flex-col bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 h-full ${
            selectedConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="pb-4 mb-4 border-b border-white/10">
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-red-500" />
              <span>Mensagens</span>
            </h2>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conversa..."
                className="w-full bg-[#111] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Conversations Items List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="p-8 text-center text-xs font-bold uppercase tracking-widest text-gray-500">Carregando conversas...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">Nenhuma conversa encontrada.</div>
            ) : (
              filtered.map((conv) => {
                const other = conv.otherUser;
                if (!other) return null;
                const isSelected = conv.id === selectedConvId;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-red-600/10 border-l-4 border-red-600 text-white'
                        : 'bg-[#111] hover:bg-white/5 border border-white/5 text-gray-300'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={other.avatar}
                        alt={other.name}
                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-red-600/40"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#050505] ${
                          other.status === 'online' ? 'bg-emerald-500' : 'bg-gray-600'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-sm truncate">{other.name}</h4>
                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {conv.lastMessage ? conv.lastMessage.content : 'Iniciar conversa...'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Chat Window */}
        <div
          className={`md:col-span-8 lg:col-span-8 h-full ${
            selectedConvId ? 'flex' : 'hidden md:flex'
          } flex-col`}
        >
          {selectedConv && selectedConv.otherUser ? (
            <ChatWindow
              conversationId={selectedConv.id}
              otherUser={selectedConv.otherUser}
              onBackMobile={() => setSelectedConvId(null)}
              onReportClick={(u) => setReportUser(u)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-500 mb-3">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-white text-lg">Selecione uma Conversa</h3>
              <p className="text-xs text-gray-400 max-w-xs mt-1">
                Escolha um de seus matches no menu à esquerda para trocar mensagens em tempo real.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
