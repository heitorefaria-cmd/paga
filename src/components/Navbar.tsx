import React, { useState } from 'react';
import { Flame, MessageCircle, Heart, User as UserIcon, Shield, Bell, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useSocket } from '../context/SocketContext';
import NotificationCenter from './NotificationCenter';

interface NavbarProps {
  activeTab: 'discovery' | 'matches' | 'chat' | 'profile' | 'admin';
  setActiveTab: (tab: 'discovery' | 'matches' | 'chat' | 'profile' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { isConnected } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => setActiveTab('discovery')}
            className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
            id="nav-logo-btn"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600 p-0.5 shadow-[0_0_20px_rgba(220,38,38,0.4)] group-hover:scale-105 transition-all duration-300">
              <div className="w-full h-full bg-[#050505] rounded-[10px] flex items-center justify-center">
                <Flame className="w-6 h-6 text-red-500 fill-red-500/20 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                IGNITE <span className="text-red-500 font-black">TEEN</span>
              </span>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-gray-500">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-emerald-500/50 shadow-sm animate-pulse' : 'bg-gray-600'}`} />
                <span>{isConnected ? 'Realtime On' : 'Conectando...'}</span>
              </div>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-[#111] p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('discovery')}
              id="nav-discovery-btn"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'discovery'
                  ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Descoberta</span>
            </button>

            <button
              onClick={() => setActiveTab('matches')}
              id="nav-matches-btn"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'matches'
                  ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Matches</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              id="nav-chat-btn"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              id="nav-profile-btn"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Perfil</span>
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                id="nav-admin-btn"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                id="nav-notif-bell-btn"
                className="p-2.5 rounded-xl bg-[#111] border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-all relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#050505] animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationCenter onClose={() => setShowNotifications(false)} />
              )}
            </div>

            {/* User Avatar Menu */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <button
                onClick={() => setActiveTab('profile')}
                id="nav-user-avatar-btn"
                className="flex items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-red-600/60 group-hover:ring-red-500 transition-all"
                />
                <span className="hidden lg:inline text-xs font-bold text-gray-200 group-hover:text-white transition-colors">
                  {user.name.split(' ')[0]}
                </span>
              </button>

              <button
                onClick={logout}
                id="nav-logout-btn"
                title="Sair da Conta"
                className="p-2.5 rounded-xl bg-[#111] hover:bg-red-950/40 border border-white/10 hover:border-red-600/60 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
