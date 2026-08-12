import React, { useState, useEffect } from 'react';
import { Flame, RefreshCw, Sparkles, Filter, Heart, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import SwipeCard from '../components/SwipeCard';
import MatchModal from '../components/MatchModal';
import ReportModal from '../components/ReportModal';
import UserProfileModal from '../components/UserProfileModal';
import { User } from '../types';

interface DiscoveryPageProps {
  onOpenChat: (conversationId?: string) => void;
}

export const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ onOpenChat }) => {
  const { user, token } = useAuth();
  const { activeMatchEvent, clearMatchEvent } = useSocket();

  const [profiles, setProfiles] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active match modal state
  const [currentMatchData, setCurrentMatchData] = useState<{
    matchedUser: User;
    conversationId?: string;
  } | null>(null);

  // Active report user modal state
  const [reportTargetUser, setReportTargetUser] = useState<User | null>(null);
  const [viewProfileUser, setViewProfileUser] = useState<User | null>(null);

  const fetchDiscoveryStack = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/users/discovery', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles || []);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao carregar fila de descoberta.');
      }
    } catch (err) {
      console.error('Fetch discovery error:', err);
      setError('Erro de conexão ao carregar perfis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoveryStack();
  }, [token]);

  // Handle incoming real-time match events via socket
  useEffect(() => {
    if (activeMatchEvent) {
      setCurrentMatchData({
        matchedUser: activeMatchEvent.matchedUser,
        conversationId: activeMatchEvent.conversationId,
      });
      clearMatchEvent();
    }
  }, [activeMatchEvent, clearMatchEvent]);

  const handleSwipe = async (targetUser: User, action: 'left' | 'right' | 'superlike') => {
    if (!token) return;

    // Optimistically remove top card from queue
    setProfiles((prev) => prev.filter((p) => p.id !== targetUser.id));

    const apiAction = action === 'left' ? 'pass' : action === 'superlike' ? 'superlike' : 'like';

    try {
      const res = await fetch('/api/matches/swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: targetUser.id,
          action: apiAction,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isMatch && data.matchedUser) {
          setCurrentMatchData({
            matchedUser: data.matchedUser,
            conversationId: data.match ? `conv_${data.match.id}` : undefined,
          });
        }
      }
    } catch (err) {
      console.error('Swipe action error:', err);
    }
  };

  if (!user) return null;

  const currentProfile = profiles[0];

  return (
    <div className="max-w-xl mx-auto px-4 py-6 min-h-[calc(100vh-120px)] flex flex-col justify-center">
      {/* Active Match Overlay Popup */}
      {currentMatchData && (
        <MatchModal
          matchedUser={currentMatchData.matchedUser}
          currentUser={user}
          conversationId={currentMatchData.conversationId}
          onClose={() => setCurrentMatchData(null)}
          onOpenChat={onOpenChat}
        />
      )}

      {/* Report / Block Modal */}
      {reportTargetUser && (
        <ReportModal
          targetUser={reportTargetUser}
          onClose={() => setReportTargetUser(null)}
          onActionComplete={() => {
            setProfiles((prev) => prev.filter((p) => p.id !== reportTargetUser.id));
            setReportTargetUser(null);
          }}
        />
      )}

      {/* Profile Detail Modal */}
      {viewProfileUser && (
        <UserProfileModal
          user={viewProfileUser}
          onClose={() => setViewProfileUser(null)}
          onReportClick={(u) => {
            setViewProfileUser(null);
            setReportTargetUser(u);
          }}
        />
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 p-0.5 animate-bounce shadow-xl shadow-red-600/30">
            <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
              <Flame className="w-8 h-8 text-red-500 fill-red-500/20" />
            </div>
          </div>
          <p className="text-sm font-semibold text-zinc-400">Procurando pessoas interessantes próximas de você...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-red-950/40 border border-red-800 text-center space-y-3">
          <p className="text-xs text-red-300">{error}</p>
          <button
            onClick={fetchDiscoveryStack}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl space-y-4 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-red-500">
            <Sparkles className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">Fila de Descoberta Vazia</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1 leading-relaxed">
              Você já visualizou todos os perfis disponíveis no momento. Volte em breve ou atualize para ver novas opções!
            </p>
          </div>

          <button
            onClick={fetchDiscoveryStack}
            id="btn-refresh-discovery"
            className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar Fila</span>
          </button>
        </div>
      ) : (
        <div className="w-full flex justify-center">
          <SwipeCard
            key={currentProfile.id}
            user={currentProfile}
            onSwipe={(dir) => handleSwipe(currentProfile, dir)}
            onReportClick={(u) => setReportTargetUser(u)}
            onViewProfile={(u) => setViewProfileUser(u)}
          />
        </div>
      )}
    </div>
  );
};

export default DiscoveryPage;
