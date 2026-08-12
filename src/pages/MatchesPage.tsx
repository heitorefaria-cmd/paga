import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Sparkles, ChevronRight, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Match } from '../types';

interface MatchesPageProps {
  onOpenChat: (conversationId?: string) => void;
}

export const MatchesPage: React.FC<MatchesPageProps> = ({ onOpenChat }) => {
  const { token } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    if (!token) return;
    try {
      setError(null);
      const res = await fetch('/api/matches', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao carregar matches.');
      }
    } catch (err) {
      console.error('Fetch matches error:', err);
      setError('Erro de conexão ao carregar matches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Heart className="w-7 h-7 text-red-500 fill-red-500/20" />
            <span>Seus Matches</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Pessoas que demonstraram interesse mútuo por você no Ignite Match.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">Carregando matches...</div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-950/40 border border-red-800 text-center text-xs text-red-300">
          {error}
        </div>
      ) : matches.length === 0 ? (
        <div className="p-12 text-center bg-[#0A0A0A] border border-white/10 rounded-3xl space-y-3">
          <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-500 mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-white text-lg">Nenhum Match Ainda</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Continue deslizando no menu Descoberta. Quando duas pessoas se curtirem, o match aparecerá aqui!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Horizontal Row of Matches Avatar Stories */}
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-500 mb-3">
              Novos Matches ({matches.length})
            </h2>

            <div className="flex items-center gap-4 overflow-x-auto pb-3 scrollbar-none">
              {matches.map((m) => {
                const other = m.otherUser;
                if (!other) return null;

                return (
                  <button
                    key={m.id}
                    onClick={() => onOpenChat(m.conversationId)}
                    className="flex flex-col items-center gap-2 group min-w-[80px] cursor-pointer"
                  >
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden p-0.5 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)] group-hover:scale-105 transition-transform">
                      <img
                        src={other.avatar}
                        alt={other.name}
                        className="w-full h-full object-cover rounded-[14px]"
                      />
                      <span
                        className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-[#050505] ${
                          other.status === 'online' ? 'bg-emerald-500' : 'bg-gray-600'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-200 group-hover:text-white truncate max-w-[80px]">
                      {other.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversations List */}
          <div className="space-y-3">
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-3">
              Conversas Recentes
            </h2>

            {matches.map((m) => {
              const other = m.otherUser;
              if (!other) return null;

              return (
                <div
                  key={m.id}
                  onClick={() => onOpenChat(m.conversationId)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#0A0A0A] hover:bg-[#111] border border-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={other.avatar}
                        alt={other.name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-red-600/60"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#050505] ${
                          other.status === 'online' ? 'bg-emerald-500' : 'bg-gray-600'
                        }`}
                      />
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        <span>{other.name}</span>
                        {m.unreadCount && m.unreadCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-extrabold text-white">
                            {m.unreadCount} nova
                          </span>
                        ) : null}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                        {m.lastMessage ? m.lastMessage.content : 'Toque para iniciar a conversa...'}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesPage;
