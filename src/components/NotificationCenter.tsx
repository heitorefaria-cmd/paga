import React from 'react';
import { Bell, Heart, MessageCircle, Sparkles, CheckCheck, X, ShieldAlert } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

interface NotificationCenterProps {
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    markAllRead,
    requestBrowserPermission,
    browserPermission,
  } = useNotifications();

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-4 z-50 text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 font-bold text-sm">
          <Bell className="w-4 h-4 text-red-500" />
          <span>Notificações ({unreadCount})</span>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Marcar lidas</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Push Permission Prompt Banner */}
      {browserPermission === 'default' && (
        <div className="mb-3 p-3 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-zinc-200 flex flex-col gap-2">
          <p className="leading-snug">
            Deseja receber notificações do navegador quando der Match ou receber novas mensagens?
          </p>
          <button
            onClick={requestBrowserPermission}
            className="py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 font-semibold text-white text-[11px] self-end cursor-pointer"
          >
            Ativar Notificações
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            Nenhuma notificação por enquanto.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-xl border text-xs transition-all ${
                n.read
                  ? 'bg-zinc-900/60 border-zinc-800/60 text-zinc-400'
                  : 'bg-zinc-900 border-red-900/50 text-zinc-100 ring-1 ring-red-600/30'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">
                  {n.type === 'match' ? (
                    <Heart className="w-4 h-4 text-red-500 fill-red-500/20" />
                  ) : n.type === 'message' ? (
                    <MessageCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  )}
                </div>

                <div className="flex-1">
                  <h5 className="font-bold text-white mb-0.5">{n.title}</h5>
                  <p className="leading-relaxed">{n.content}</p>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
