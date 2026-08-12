import React, { useState } from 'react';
import { User as UserIcon, Edit3, MapPin, Briefcase, Shield, LogOut, Heart, Sparkles, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileEditModal from '../components/ProfileEditModal';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Edit Profile Modal */}
      {showEditModal && <ProfileEditModal onClose={() => setShowEditModal(false)} />}

      {/* Main Profile Header Card */}
      <div className="relative rounded-[2rem] bg-[#0A0A0A] border border-white/10 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover ring-4 ring-red-600/60 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
            />
            <span
              className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-[#050505] ${
                user.status === 'online' ? 'bg-emerald-500' : 'bg-gray-600'
              }`}
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
                  <span>{user.name}</span>
                  <span className="text-gray-400 font-light">{user.age}</span>
                </h1>
                <p className="text-xs text-red-500 font-bold tracking-wider mt-0.5">@{user.username}</p>
              </div>

              <button
                onClick={() => setShowEditModal(true)}
                id="btn-edit-profile"
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editar Perfil</span>
              </button>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs text-gray-300 pt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                {user.location || 'Não informado'}
              </span>
              {user.occupation && (
                <span className="flex items-center gap-1 border-l border-white/10 pl-4">
                  <Briefcase className="w-3.5 h-3.5 text-red-400" />
                  {user.occupation}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-3">
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-500">Biografia</h3>
        <p className="text-sm text-gray-300 leading-relaxed">{user.bio || 'Nenhuma biografia adicionada.'}</p>
      </div>

      {/* Interests Section */}
      <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-3">
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-500">Seus Interesses</h3>
        <div className="flex flex-wrap gap-2">
          {user.interests && user.interests.length > 0 ? (
            user.interests.map((item, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-gray-200 text-[10px] font-bold uppercase tracking-wider"
              >
                {item}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500">Nenhum interesse selecionado.</span>
          )}
        </div>
      </div>

      {/* Photos Gallery */}
      <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-500">
            Galeria de Fotos ({user.photos?.length || 1})
          </h3>
          <button
            onClick={() => setShowEditModal(true)}
            className="text-xs text-red-400 hover:underline font-bold uppercase tracking-wider cursor-pointer"
          >
            Gerenciar fotos
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {user.photos?.map((photo, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-[#050505] border border-white/10">
              <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Account Settings / Logout */}
      <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/10 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-white text-sm">Conta & Sessão</h4>
          <p className="text-xs text-gray-400">Sua sessão está protegida com token criptografado JWT.</p>
        </div>

        <button
          onClick={logout}
          id="btn-profile-logout"
          className="px-4 py-2.5 rounded-xl bg-[#111] hover:bg-red-950/80 border border-white/10 hover:border-red-600/60 text-red-400 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
