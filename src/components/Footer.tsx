import React from 'react';
import { Flame, Heart, MessageCircle, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FooterProps {
  activeTab: 'discovery' | 'matches' | 'chat' | 'profile' | 'admin';
  setActiveTab: (tab: 'discovery' | 'matches' | 'chat' | 'profile' | 'admin') => void;
}

export const Footer: React.FC<FooterProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-lg border-t border-white/10 px-2 py-2">
      <nav className="flex items-center justify-around">
        <button
          onClick={() => setActiveTab('discovery')}
          id="mobile-nav-discovery"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'discovery' ? 'text-red-500 font-bold scale-105' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Descobrir</span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          id="mobile-nav-matches"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'matches' ? 'text-red-500 font-bold scale-105' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Matches</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          id="mobile-nav-chat"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'chat' ? 'text-red-500 font-bold scale-105' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          id="mobile-nav-profile"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-red-500 font-bold scale-105' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Perfil</span>
        </button>

        {user.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            id="mobile-nav-admin"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'admin' ? 'text-amber-400 font-bold scale-105' : 'text-gray-500 hover:text-amber-400/80'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Admin</span>
          </button>
        )}
      </nav>
    </footer>
  );
};

export default Footer;
