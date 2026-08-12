import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, Ban } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';

interface ReportModalProps {
  targetUser: User;
  onClose: () => void;
  onActionComplete?: () => void;
}

const REPORT_REASONS = [
  'Comportamento inadequado ou ofensivo',
  'Perfil falso ou fotos de terceiros',
  'Spam, automação ou bot',
  'Assédio ou linguagem de ódio',
  'Tentativa de golpe ou vendas não autorizadas',
  'Outro motivo grave'
];

export const ReportModal: React.FC<{
  targetUser: User;
  onClose: () => void;
  onActionComplete?: () => void;
}> = ({ targetUser, onClose, onActionComplete }) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'report' | 'block'>('report');
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportedUserId: targetUser.id,
          reason,
          details,
        }),
      });

      if (res.ok) {
        setSuccess('Denúncia enviada à equipe de moderação.');
        setTimeout(() => {
          onClose();
          if (onActionComplete) onActionComplete();
        }, 1200);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao enviar denúncia.');
      }
    } catch (err) {
      setError('Erro de conexão ao enviar denúncia.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlock = async () => {
    if (!token) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          blockedUserId: targetUser.id,
        }),
      });

      if (res.ok) {
        setSuccess(`Você bloqueou ${targetUser.name}.`);
        setTimeout(() => {
          onClose();
          if (onActionComplete) onActionComplete();
        }, 1200);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao bloquear usuário.');
      }
    } catch (err) {
      setError('Erro de conexão ao bloquear usuário.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-red-500 font-bold text-lg">
            <ShieldAlert className="w-5 h-5" />
            <span>Segurança & Moderação</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Profile Snippet */}
        <div className="flex items-center gap-3 p-3 mb-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <img src={targetUser.avatar} alt={targetUser.name} className="w-12 h-12 rounded-xl object-cover" />
          <div>
            <h4 className="font-bold text-white text-sm">{targetUser.name}</h4>
            <p className="text-xs text-zinc-400">@{targetUser.username}</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-zinc-900 p-1 rounded-xl mb-4 border border-zinc-800">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'report' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Denunciar Perfil
          </button>
          <button
            onClick={() => setActiveTab('block')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'block' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Bloquear Usuário
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
            {success}
          </div>
        )}

        {activeTab === 'report' ? (
          <form onSubmit={handleReport} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Motivo da Denúncia</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                {REPORT_REASONS.map((r, i) => (
                  <option key={i} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Detalhes Adicionais (opcional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Descreva o ocorrido de forma detalhada..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{submitting ? 'Enviando...' : 'Enviar Denúncia'}</span>
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Ao bloquear <strong className="text-white">{targetUser.name}</strong>, este perfil deixará de aparecer para você na descoberta e vocês não poderão mais trocar mensagens nem ver o perfil um do outro.
            </p>

            <button
              onClick={handleBlock}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-red-950/80 border border-red-800/80 text-red-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Ban className="w-4 h-4" />
              <span>{submitting ? 'Bloqueando...' : `Confirmar Bloqueio de ${targetUser.name.split(' ')[0]}`}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
