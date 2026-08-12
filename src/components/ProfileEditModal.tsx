import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Image as ImageIcon, Camera, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CameraPhotoModal from './CameraPhotoModal';

interface ProfileEditModalProps {
  onClose: () => void;
}

const INTEREST_PRESETS = [
  'Café', 'Fotografia', 'Música', 'Cinema', 'Trilhas', 'Gastronomia',
  'Vinhos', 'Séries', 'Leitura', 'Tecnologia', 'Academia', 'Yoga',
  'Surf', 'Pets', 'Viagens', 'Arte', 'Design', 'Cozinha'
];

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ onClose }) => {
  const { user, token, updateUser } = useAuth();
  if (!user) return null;

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [occupation, setOccupation] = useState(user.occupation || '');
  const [gender, setGender] = useState(user.gender);
  const [lookingFor, setLookingFor] = useState(user.lookingFor);
  const [interests, setInterests] = useState<string[]>(user.interests || []);
  const [photos, setPhotos] = useState<string[]>(user.photos || [user.avatar]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      if (interests.length >= 8) return;
      setInterests([...interests, interest]);
    }
  };

  const handleAddPhotoUrl = () => {
    if (!newPhotoUrl.trim()) return;
    if (photos.length >= 6) {
      setError('Máximo de 6 fotos permitido.');
      return;
    }
    setPhotos([...photos, newPhotoUrl.trim()]);
    setNewPhotoUrl('');
  };

  const handlePhotoCaptured = (photoDataUrl: string) => {
    if (photos.length >= 6) {
      setError('Máximo de 6 fotos permitido.');
      return;
    }
    setPhotos([...photos, photoDataUrl]);
  };

  const handleRemovePhoto = (url: string) => {
    if (photos.length <= 1) {
      setError('Você deve ter pelo menos 1 foto no perfil.');
      return;
    }
    setPhotos(photos.filter((p) => p !== url));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          bio,
          location,
          occupation,
          gender,
          lookingFor,
          interests,
          photos,
          avatar: photos[0],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
        setSuccess('Perfil atualizado com sucesso!');
        setTimeout(() => onClose(), 800);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao atualizar perfil.');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setError('Erro de conexão com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 p-6 sm:p-8 rounded-[2rem] bg-[#0A0A0A] border border-white/10 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            <span>Editar Meu Perfil</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#111] text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-bold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Photo Gallery Manager */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Fotos do Perfil ({photos.length}/6)
            </label>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {photos.map((url, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square bg-[#050505] border border-white/10">
                  <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 px-2 py-0.5 rounded bg-red-600 text-[9px] font-bold uppercase text-white">
                      Principal
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(url)}
                    className="absolute top-1 right-1 p-1.5 rounded-lg bg-black/80 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {photos.length < 6 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowCameraModal(true)}
                  id="btn-open-camera-modal"
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tirar Foto Agora ou Enviar JPG/PNG</span>
                </button>

                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Ou cole a URL de foto (JPG / PNG)..."
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="flex-1 bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhotoUrl}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>URL</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Name & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Nome Exibido</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#111] border border-white/10 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Cidade / Estado</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: São Paulo, SP"
                className="w-full bg-[#111] border border-white/10 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Biografia</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Conte um pouco sobre você, seus hobbies e o que busca..."
              className="w-full bg-[#111] border border-white/10 focus:border-red-600 rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Profissão / Ocupação</label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="Ex: Arquitetura, Engenheiro, Designer..."
              className="w-full bg-[#111] border border-white/10 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Gender & Looking for */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Gênero / Orientação</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-[#111] border border-white/10 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="woman">Mulher</option>
                <option value="man">Homem</option>
                <option value="lesbian">Lésbica</option>
                <option value="gay">Gay</option>
                <option value="bisexual">Bissexual</option>
                <option value="trans">Transgênero</option>
                <option value="nonbinary">Não-binário</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Busco Por</label>
              <select
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value as any)}
                className="w-full bg-[#111] border border-white/10 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="everyone">Todos</option>
                <option value="woman">Mulheres</option>
                <option value="man">Homens</option>
                <option value="lesbian">Lésbicas</option>
                <option value="gay">Gays</option>
                <option value="bisexual">Bissexuals</option>
                <option value="trans">Transgêneros</option>
                <option value="nonbinary">Não-binários</option>
              </select>
            </div>
          </div>

          {/* Interests Chips */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Interesses ({interests.length}/8)
            </label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_PRESETS.map((item) => {
                const isSelected = interests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                        : 'bg-[#111] text-gray-300 border border-white/10 hover:text-white hover:border-gray-400'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            id="btn-save-profile"
            className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </form>

        {showCameraModal && (
          <CameraPhotoModal
            onClose={() => setShowCameraModal(false)}
            onPhotoCaptured={handlePhotoCaptured}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileEditModal;
