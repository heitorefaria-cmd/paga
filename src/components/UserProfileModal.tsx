import React from 'react';
import { X, MapPin, Briefcase, Heart, ShieldAlert, MessageCircle, User as UserIcon, Calendar } from 'lucide-react';
import { User } from '../types';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  onOpenChat?: () => void;
  onReportClick?: (user: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onClose,
  onOpenChat,
  onReportClick,
}) => {
  // Calculate age if birthDate is available
  const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return user.age || '15';
    const bDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - bDate.getFullYear();
    const monthDiff = today.getMonth() - bDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bDate.getDate())) {
      age--;
    }
    return isNaN(age) ? user.age || '15' : age;
  };

  const ageDisplay = calculateAge(user.birthDate);

  const formatGender = (gender?: string) => {
    if (!gender) return 'Não informado';
    if (gender === 'male') return 'Masculino';
    if (gender === 'female') return 'Feminino';
    if (gender === 'non-binary') return 'Não-binário';
    return gender;
  };

  const formatLookingFor = (looking?: string) => {
    if (!looking) return 'Apenas amizades';
    if (looking === 'friendship') return 'Novas Amizades';
    if (looking === 'dating') return 'Relacionamento Sério';
    if (looking === 'chat') return 'Conversar e Conhecer';
    return looking;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 backdrop-blur-md transition-all cursor-pointer border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cover Photo / Header */}
        <div className="relative h-72 w-full bg-zinc-900">
          <img
            src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'}
            alt={user.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/30 to-transparent" />

          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-3 h-3 rounded-full border-2 border-[#0A0A0A] ${
                  user.status === 'online' ? 'bg-emerald-500' : 'bg-gray-500'
                }`}
              />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                {user.status === 'online' ? 'Online Agora' : 'Offline'}
              </span>
            </div>

            <h2 className="text-3xl font-black text-white flex items-center gap-2">
              <span>{user.name}</span>
              <span className="text-red-500 font-extrabold">{ageDisplay}</span>
            </h2>

            <p className="text-xs text-gray-400 font-mono mt-0.5">@{user.username}</p>
          </div>
        </div>

        {/* Profile Details Content */}
        <div className="p-6 space-y-6">
          {/* Quick Info Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {user.location && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>{user.location}</span>
              </div>
            )}

            {user.occupation && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                <Briefcase className="w-3.5 h-3.5 text-red-500" />
                <span>{user.occupation}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
              <UserIcon className="w-3.5 h-3.5 text-red-500" />
              <span>{formatGender(user.gender)}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span>{formatLookingFor(user.lookingFor)}</span>
            </div>
          </div>

          {/* Bio Section */}
          <div className="p-4 rounded-2xl bg-[#111] border border-white/5 space-y-1.5">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-500">Sobre Mim</h4>
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">
              {user.bio && user.bio.trim().length > 0 ? user.bio : 'Este usuário ainda não adicionou uma biografia.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {onOpenChat && (
              <button
                onClick={() => {
                  onOpenChat();
                  onClose();
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Iniciar Conversa</span>
              </button>
            )}

            {onReportClick && (
              <button
                onClick={() => {
                  onReportClick(user);
                  onClose();
                }}
                title="Denunciar ou Bloquear Usuário"
                className="p-3 rounded-2xl bg-white/5 hover:bg-red-950/60 text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-600/60 transition-all cursor-pointer"
              >
                <ShieldAlert className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
