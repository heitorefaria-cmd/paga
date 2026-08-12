import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { Heart, MessageCircle, Flame, X } from 'lucide-react';
import { User } from '../types';

interface MatchModalProps {
  matchedUser: User;
  currentUser: User;
  conversationId?: string;
  onClose: () => void;
  onOpenChat: (conversationId?: string) => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  matchedUser,
  currentUser,
  conversationId,
  onClose,
  onOpenChat,
}) => {
  useEffect(() => {
    // Fire festive celebration confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ef4444', '#dc2626', '#f87171', '#ffffff', '#fbbf24'],
    });

    const timeout = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ef4444', '#ffffff'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ef4444', '#ffffff'],
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative w-full max-w-md p-8 rounded-3xl bg-zinc-950 border-2 border-red-600/80 shadow-2xl shadow-red-600/40 text-center flex flex-col items-center overflow-hidden"
      >
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-2 text-red-500 font-black text-3xl tracking-widest uppercase">
          <Flame className="w-8 h-8 fill-red-500 animate-bounce" />
          <span>DEU MATCH!</span>
        </div>

        <p className="text-zinc-300 text-sm mb-8 font-medium">
          Você e <span className="text-white font-bold">{matchedUser.name}</span> demonstraram interesse mútuo! 🔥
        </p>

        {/* Overlapping Profile Pictures */}
        <div className="flex items-center justify-center -space-x-6 mb-8 relative">
          <motion.div
            initial={{ x: -40, rotate: -12 }}
            animate={{ x: 0, rotate: -6 }}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-red-500 shadow-xl bg-zinc-900"
          >
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
          </motion.div>

          <div className="z-10 p-3 rounded-full bg-red-600 text-white shadow-lg shadow-red-600/50 animate-pulse">
            <Heart className="w-8 h-8 fill-white" />
          </div>

          <motion.div
            initial={{ x: 40, rotate: 12 }}
            animate={{ x: 0, rotate: 6 }}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-red-500 shadow-xl bg-zinc-900"
          >
            <img src={matchedUser.avatar} alt={matchedUser.name} className="w-full h-full object-cover" />
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => {
              onClose();
              onOpenChat(conversationId);
            }}
            id="btn-match-chat-now"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-base shadow-xl shadow-red-600/40 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Enviar Mensagem Agora</span>
          </button>

          <button
            onClick={onClose}
            id="btn-match-keep-swiping"
            className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm border border-zinc-800 transition-colors cursor-pointer"
          >
            Continuar Deslizando
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MatchModal;
