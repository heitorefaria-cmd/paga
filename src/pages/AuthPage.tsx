import React, { useState } from 'react';
import { Flame, Lock, User as UserIcon, Calendar, ArrowRight, Camera, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CameraPhotoModal from '../components/CameraPhotoModal';
import { Gender, LookingFor } from '../types';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onBackToLanding: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onBackToLanding }) => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('1999-05-14');
  const [gender, setGender] = useState<Gender>('woman');
  const [lookingFor, setLookingFor] = useState<LookingFor>('everyone');
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'register' && !avatarPhoto) {
      setError('A foto de perfil é obrigatória. Por favor, tire uma foto com a câmera ou envie um arquivo JPG/PNG.');
      return;
    }

    setLoading(true);
    setError(null);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login'
      ? { username, password }
      : {
          username,
          password,
          name,
          birthDate,
          gender,
          lookingFor,
          avatar: avatarPhoto || undefined,
        };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Falha na autenticação.');
      }
    } catch (err) {
      console.error('Auth submit error:', err);
      setError('Erro de conexão com o servidor. Verifique se o backend está ativo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-red-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md my-8">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 mb-4 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 p-0.5 shadow-xl shadow-red-600/30 group-hover:scale-110 transition-transform">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Flame className="w-7 h-7 text-red-500 fill-red-500/20" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight">IGNITE <span className="text-red-500">MATCH</span></span>
          </button>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            {mode === 'login' ? 'Acesse sua Conta' : 'Crie seu Perfil Gratuitamente'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'login' ? 'Digite suas credenciais para continuar' : 'Cadastre-se e comece a encontrar seus matches'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">

          {/* Tab Selector */}
          <div className="flex bg-zinc-950 p-1 rounded-2xl mb-6 border border-zinc-800">
            <button
              type="button"
              onClick={() => setMode('login')}
              id="auth-tab-login"
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              id="auth-tab-register"
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'register' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Camila Silva"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome de Usuário (Username)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: camila"
                required
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Data de Nascimento <span className="text-red-400 font-bold">(14 a 17 anos - Proibido 18+)</span>
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Exclusivo para menores de idade (14 a 17 anos).</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Gênero / Identidade</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
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
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Busco Por</label>
                    <select
                      value={lookingFor}
                      onChange={(e) => setLookingFor(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    >
                      <option value="everyone">Todos</option>
                      <option value="woman">Mulheres</option>
                      <option value="man">Homens</option>
                      <option value="lesbian">Lésbicas</option>
                      <option value="gay">Gays</option>
                      <option value="bisexual">Bissexuais</option>
                      <option value="trans">Transgêneros</option>
                      <option value="nonbinary">Não-binários</option>
                    </select>
                  </div>
                </div>

                {/* Profile Photo Capture (Mandatory) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Foto do Perfil <span className="text-red-400 font-bold">* (Obrigatória)</span>
                  </label>
                  <div className={`flex items-center gap-3 bg-zinc-950 p-3 rounded-2xl border transition-colors ${!avatarPhoto ? 'border-red-500/50 bg-red-950/10' : 'border-zinc-800'}`}>
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center text-zinc-500">
                      {avatarPhoto ? (
                        <img src={avatarPhoto} alt="Sua Foto" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-5 h-5 text-red-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setShowCameraModal(true)}
                        className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-red-600/20"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{avatarPhoto ? 'Alterar Foto (Câmera / JPG / PNG)' : 'Tirar Foto Agora ou Enviar *'}</span>
                      </button>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {avatarPhoto ? '✓ Foto anexada com sucesso!' : 'Atenção: O cadastro só é permitido com foto de perfil.'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              id="btn-auth-submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer mt-4"
            >
              <span>{loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar Minha Conta'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {showCameraModal && (
        <CameraPhotoModal
          onClose={() => setShowCameraModal(false)}
          onPhotoCaptured={(photoUrl) => setAvatarPhoto(photoUrl)}
        />
      )}
    </div>
  );
};

export default AuthPage;
