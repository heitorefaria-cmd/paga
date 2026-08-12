import React, { useState, useEffect } from 'react';
import { Shield, Users, Heart, MessageCircle, AlertTriangle, Search, Ban, CheckCircle, FileText, Activity, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminStats, User as UserType, Report, AdminLog } from '../types';

export const AdminPage: React.FC = () => {
  const { token, user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'reports' | 'logs' | 'chats'>('dashboard');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [conversationsList, setConversationsList] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Admin Gate Form State
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginLoading(true);
    setAdminLoginError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.user.role === 'admin') {
          login(data.token, data.user);
        } else {
          setAdminLoginError('Esta conta não tem privilégios de administrador.');
        }
      } else {
        setAdminLoginError(data.error || 'Credenciais administrativas incorretas.');
      }
    } catch (err) {
      setAdminLoginError('Erro de conexão ao autenticar administrador.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch admin stats error:', err);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/admin/users${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Fetch admin users error:', err);
    }
  };

  const fetchReports = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReportsList(data.reports || []);
      }
    } catch (err) {
      console.error('Fetch admin reports error:', err);
    }
  };

  const fetchLogs = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Fetch admin logs error:', err);
    }
  };

  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversationsList(data.conversations || []);
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchUsers(), fetchReports(), fetchLogs(), fetchConversations()]).finally(() =>
      setLoading(false)
    );
  }, [token]);

  useEffect(() => {
    if (activeTab === 'chats') {
      fetchConversations();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [search]);

  const handleUpdateUserStatus = async (userId: string, newStatus: 'online' | 'offline' | 'suspended') => {
    if (!token) return;
    try {
      setMessage(null);
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
        fetchUsers();
        fetchStats();
        fetchLogs();
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleResolveReport = async (reportId: string, status: 'reviewed' | 'actioned' | 'dismissed', actionTarget?: string) => {
    if (!token) return;
    try {
      setMessage(null);
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, actionTarget }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
        fetchReports();
        fetchUsers();
        fetchStats();
        fetchLogs();
      }
    } catch (err) {
      console.error('Resolve report error:', err);
    }
  };

  const handleResetDatabase = async () => {
    if (!token) return;
    if (!window.confirm('TEM CERTEZA ABSOLUTA? Esta ação irá excluir permanentemente todas as contas de usuários criadas, suspensões, conversas, denúncias e logs, mantendo apenas a conta de Administrador zerada.')) {
      return;
    }

    try {
      setMessage(null);
      const res = await fetch('/api/admin/reset-db', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
        fetchStats();
        fetchUsers();
        fetchReports();
        fetchLogs();
        fetchConversations();
      } else {
        const errData = await res.json();
        setMessage(`Erro: ${errData.error || 'Falha ao redefinir banco de dados.'}`);
      }
    } catch (err) {
      console.error('Reset DB error:', err);
      setMessage('Erro ao conectar para redefinir o banco de dados.');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-[2rem] bg-[#0A0A0A] border border-white/10 shadow-2xl text-white space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Shield className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">Painel Administrativo</h2>
            <p className="text-xs text-gray-400">
              Acesso restrito via <code className="text-red-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">/admin</code> ou <code className="text-red-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">/painel-admin</code>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-300 font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0" />
            <span>Sessão encriptada e monitorada com proteção anti-bot ativa.</span>
          </div>

          {adminLoginError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-bold">
              {adminLoginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Usuário Admin
              </label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Ex: segredo"
                required
                className="w-full bg-[#111] border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Senha Admin
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#111] border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={adminLoginLoading}
              id="btn-admin-login-submit"
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all cursor-pointer mt-2"
            >
              {adminLoginLoading ? 'Autenticando...' : 'Acessar Painel Admin'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-amber-400" />
            <span>Painel Administrativo — Ignite</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Gestão do sistema, moderação de usuários, denúncias e logs de auditoria.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#111] p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-gray-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-gray-400 hover:text-white'
            }`}
          >
            Usuários
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'reports' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-gray-400 hover:text-white'
            }`}
          >
            Denúncias
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'chats' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-gray-400 hover:text-white'
            }`}
          >
            Conversas ({conversationsList.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'logs' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-gray-400 hover:text-white'
            }`}
          >
            Logs
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold">
          {message}
        </div>
      )}

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Usuários Totais</span>
                <Users className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-3xl font-black text-white">{stats.totalUsers}</div>
              <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">🟢 {stats.onlineUsers} online agora</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Matches Criados</span>
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-3xl font-black text-white">{stats.totalMatches}</div>
              <span className="text-[11px] text-gray-500">Interações mútuas</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Mensagens Trocadas</span>
                <MessageCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-white">{stats.totalMessages}</div>
              <span className="text-[11px] text-gray-500">Persistidas no banco</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Denúncias Pendentes</span>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-3xl font-black text-white">{stats.pendingReports}</div>
              <span className="text-[11px] text-red-400 font-bold uppercase tracking-wider">{stats.totalReports} total registradas</span>
            </div>
          </div>

          {/* Database Reset Action Panel */}
          <div className="p-6 rounded-3xl bg-red-950/30 border border-red-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                <span>Limpar e Redefinir Banco de Dados</span>
              </h3>
              <p className="text-xs text-gray-300 max-w-xl">
                Exclua permanentemente todas as contas de usuários criadas, suspensões, matches, mensagens e denúncias. Mantém apenas a conta de Administrador limpa e ativa.
              </p>
            </div>

            <button
              onClick={handleResetDatabase}
              className="py-2.5 px-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer shrink-0 hover:scale-105"
            >
              <Trash2 className="w-4 h-4" />
              <span>Redefinir Tudo Agora</span>
            </button>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou @username..."
              className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#111] text-gray-400 font-bold text-[10px] uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">Usuário</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Gênero / Idade</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Ações Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-lg object-cover ring-2 ring-red-600/40" />
                      <span className="font-bold text-white">{u.name}</span>
                    </td>
                    <td className="p-4 text-gray-400">@{u.username}</td>
                    <td className="p-4 capitalize">{u.gender} ({u.age} anos)</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.status === 'online'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : u.status === 'suspended'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-[#111] text-gray-400 border border-white/10'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.status === 'suspended' ? (
                        <button
                          onClick={() => handleUpdateUserStatus(u.id, 'offline')}
                          className="px-3 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                        >
                          Reativar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateUserStatus(u.id, 'suspended')}
                          className="px-3 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 font-bold text-[10px] uppercase tracking-wider cursor-pointer border border-red-800"
                        >
                          Suspender
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {reportsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 bg-[#0A0A0A] rounded-2xl border border-white/10">
                Nenhuma denúncia registrada no sistema.
              </div>
            ) : (
              reportsList.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-500">Motivo: {r.reason}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        r.status === 'pending'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-gray-300">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Denunciante:</span>
                      <strong className="text-white">{r.reporterName}</strong>
                    </div>

                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Denunciado:</span>
                      <strong className="text-white">{r.reportedName}</strong>
                    </div>
                  </div>

                  {r.details && <p className="p-2.5 rounded-xl bg-[#111] border border-white/5 text-gray-300">{r.details}</p>}

                  {r.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleResolveReport(r.id, 'actioned', 'suspend_user')}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-wider shadow-[0_0_15px_rgba(220,38,38,0.3)] cursor-pointer"
                      >
                        Suspender Usuário Denunciado
                      </button>

                      <button
                        onClick={() => handleResolveReport(r.id, 'dismissed')}
                        className="px-3 py-1.5 rounded-xl bg-[#111] hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        Arquivar Denúncia
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CHATS TAB (ADMIN OVERWRITE INSPECTOR) */}
      {activeTab === 'chats' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-[#0A0A0A] border border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-red-500" />
                <span>Supervisão de Conversas do Sistema</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                O painel administrativo permite ler as mensagens e interações de todos os usuários cadastrados.
              </p>
            </div>
            <button
              onClick={fetchConversations}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 transition-all cursor-pointer self-start sm:self-auto"
            >
              🔄 Atualizar Conversas
            </button>
          </div>

          {conversationsList.length === 0 ? (
            <div className="p-12 text-center text-gray-500 bg-[#0A0A0A] rounded-2xl border border-white/10">
              Nenhuma conversa gravada no sistema até o momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Conversation List Sidebar */}
              <div className="md:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {conversationsList.map((conv) => {
                  const isSelected = selectedConversation?.id === conv.id;
                  const p1 = conv.participants[0];
                  const p2 = conv.participants[1];

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)]'
                          : 'bg-[#0A0A0A] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex -space-x-3">
                          <img
                            src={p1?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={p1?.name}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0A0A0A]"
                          />
                          <img
                            src={p2?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                            alt={p2?.name}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0A0A0A]"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-extrabold text-white truncate">
                            {p1?.name?.split(' ')[0]} & {p2?.name?.split(' ')[0]}
                          </h4>
                          <span className="text-[10px] text-gray-400 block truncate">
                            @{p1?.username} ↔ @{p2?.username}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-gray-300 line-clamp-1 bg-black/40 p-2 rounded-xl border border-white/5">
                        {conv.lastMessage ? (
                          <span>"{conv.lastMessage.content}"</span>
                        ) : (
                          <span className="text-gray-500 italic">Sem mensagens</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2">
                        <span>{conv.totalMessages} mensagens</span>
                        <span>
                          {conv.lastMessage
                            ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Message Viewer Detail Panel */}
              <div className="md:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 flex flex-col min-h-[450px]">
                {selectedConversation ? (
                  <div className="flex flex-col h-full space-y-4">
                    {/* Header */}
                    <div className="pb-3 border-b border-white/10 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>
                            Chat entre{' '}
                            <span className="text-red-400">{selectedConversation.participants[0]?.name}</span> e{' '}
                            <span className="text-red-400">{selectedConversation.participants[1]?.name}</span>
                          </span>
                        </h3>
                        <p className="text-[11px] text-gray-400">
                          ID Conversa: <code className="font-mono text-gray-500">{selectedConversation.id}</code>
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-red-950/60 text-red-400 border border-red-800">
                        {selectedConversation.messages.length} mensagens
                      </span>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto space-y-3 p-2 max-h-[480px]">
                      {selectedConversation.messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-12 text-xs">
                          Nenhuma mensagem trocada nesta conversa.
                        </div>
                      ) : (
                        selectedConversation.messages.map((msg: any) => {
                          const sender = selectedConversation.participants.find((p: any) => p.id === msg.senderId);
                          const isFirstUser = msg.senderId === selectedConversation.participants[0]?.id;

                          return (
                            <div
                              key={msg.id}
                              className={`flex items-start gap-2.5 ${isFirstUser ? 'flex-row' : 'flex-row-reverse'}`}
                            >
                              <img
                                src={sender?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                                alt={sender?.name}
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20 shrink-0"
                              />

                              <div
                                className={`max-w-[75%] p-3 rounded-2xl text-xs space-y-1 ${
                                  isFirstUser
                                    ? 'bg-red-950/60 border border-red-800/80 text-red-100 rounded-tl-none'
                                    : 'bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-tr-none'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3 text-[10px] font-bold opacity-75">
                                  <span>{sender?.name || 'Usuário'}</span>
                                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-xs space-y-2 py-12">
                    <MessageCircle className="w-10 h-10 text-gray-600" />
                    <p>Selecione uma conversa da lista à esquerda para ler todas as mensagens transmitidas.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          {adminLogs.map((log) => (
            <div key={log.id} className="p-3.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-xs font-mono flex items-center justify-between">
              <div>
                <span className="text-red-500 font-bold">[{log.action}]</span>{' '}
                <span className="text-gray-400">por @{log.adminUsername}: </span>
                <span className="text-white">{log.target}</span>
                {log.details && <span className="text-gray-500 block text-[10px] mt-0.5">{log.details}</span>}
              </div>
              <span className="text-[10px] text-gray-500">
                {new Date(log.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
