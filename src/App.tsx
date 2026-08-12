import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DiscoveryPage from './pages/DiscoveryPage';
import MatchesPage from './pages/MatchesPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

type AppTab = 'landing' | 'auth' | 'discovery' | 'matches' | 'chat' | 'profile' | 'admin';

const isAdminPath = () => {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/admin' ||
    path === '/painel-admin' ||
    path.startsWith('/admin/') ||
    path.startsWith('/painel-admin/') ||
    hash === '#admin' ||
    hash === '#painel-admin'
  );
};

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTabState] = useState<AppTab>(() => (isAdminPath() ? 'admin' : 'discovery'));
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [chatConvId, setChatConvId] = useState<string | undefined>(undefined);

  const handleTabChange = (tab: AppTab) => {
    setChatConvId(undefined);
    setActiveTabState(tab);
    if (tab === 'admin') {
      if (window.location.pathname !== '/admin' && window.location.pathname !== '/painel-admin') {
        window.history.pushState({}, '', '/admin');
      }
    } else if (isAdminPath()) {
      window.history.pushState({}, '', '/');
    }
  };

  useEffect(() => {
    const handleLocationCheck = () => {
      if (isAdminPath()) {
        setActiveTabState('admin');
      }
    };

    window.addEventListener('popstate', handleLocationCheck);
    handleLocationCheck();
    return () => window.removeEventListener('popstate', handleLocationCheck);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Iniciando o Ignite Match...</p>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!isAuthenticated || !user) {
    if (activeTab === 'admin' || isAdminPath()) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col">
          <header className="bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex justify-between items-center max-w-7xl mx-auto w-full">
            <span className="text-xl font-black tracking-tight">IGNITE <span className="text-red-500">MATCH</span></span>
            <button
              onClick={() => handleTabChange('landing')}
              className="text-xs text-gray-400 hover:text-white font-bold uppercase tracking-wider cursor-pointer"
            >
              Voltar ao Início
            </button>
          </header>
          <main className="flex-1 flex items-center justify-center">
            <AdminPage />
          </main>
        </div>
      );
    }

    if (activeTab === 'auth') {
      return (
        <AuthPage
          initialMode={authMode}
          onBackToLanding={() => handleTabChange('landing')}
        />
      );
    }
    return (
      <LandingPage
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          handleTabChange('auth');
        }}
      />
    );
  }

  // Authenticated Main App Flow
  const handleOpenChat = (conversationId?: string) => {
    setChatConvId(conversationId);
    handleTabChange('chat');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-red-600 selection:text-white">
      {/* Top Header Navigation */}
      <Navbar
        activeTab={activeTab as any}
        setActiveTab={handleTabChange}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16 md:pb-6">
        {activeTab === 'discovery' && <DiscoveryPage onOpenChat={handleOpenChat} />}
        {activeTab === 'matches' && <MatchesPage onOpenChat={handleOpenChat} />}
        {activeTab === 'chat' && <ChatPage initialConversationId={chatConvId} />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'admin' && <AdminPage />}
      </main>

      {/* Mobile Navigation Bar */}
      <Footer
        activeTab={activeTab as any}
        setActiveTab={handleTabChange}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
