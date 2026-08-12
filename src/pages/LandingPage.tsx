import React from 'react';
import { motion } from 'motion/react';
import { Flame, Heart, MessageCircle, Shield, Sparkles, ArrowRight, CheckCircle2, Zap } from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between selection:bg-red-600 selection:text-white">
      {/* Background Ambient Crimson Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-red-800/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Bar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-red-600 p-0.5 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            <div className="w-full h-full bg-[#050505] rounded-[10px] flex items-center justify-center">
              <Flame className="w-6 h-6 text-red-500 fill-red-500/20" />
            </div>
          </div>
          <span className="text-2xl font-black tracking-tight">
            IGNITE <span className="text-red-500 font-black">TEEN</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth('login')}
            id="landing-btn-login"
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-[#111] hover:bg-white/10 border border-white/10 text-gray-200 transition-all cursor-pointer"
          >
            Entrar
          </button>

          <button
            onClick={() => onOpenAuth('register')}
            id="landing-btn-register"
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Criar Conta
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Copy */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111] border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Exclusivo Teen (14 a 17 Anos) • Proibido 18+</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            A chama que faltava para suas <span className="text-red-500 underline decoration-red-600/40">novas conexões</span>.
          </h1>

          <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
            Deslize, descubra perfis interessantes, encontre matches instantâneos e converse em tempo real com máxima segurança, privacidade e tecnologia de ponta.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <button
              onClick={() => onOpenAuth('register')}
              id="landing-hero-cta"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-red-600 text-white font-bold text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>Começar Agora Gratuitamente</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#111] hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-widest border border-white/10 transition-all cursor-pointer"
            >
              Já tenho uma conta
            </button>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10 text-center lg:text-left">
            <div>
              <div className="text-2xl font-black text-white">100%</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Perfis Reais</div>
            </div>
            <div>
              <div className="text-2xl font-black text-red-500">Realtime</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Chat Instantâneo</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">Red Team</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Segurança Total</div>
            </div>
          </div>
        </div>

        {/* Right Preview Card Mockup */}
        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative w-full max-w-sm h-[520px] rounded-[2rem] bg-[#111] border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-end p-6 group"
          >
            <img
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop"
              alt="Sofia Santos"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />

            {/* Float Match Notification */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute top-6 left-6 right-6 p-3.5 rounded-2xl bg-[#0A0A0A]/90 border border-red-600/60 backdrop-blur-md flex items-center gap-3 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
            >
              <div className="p-2 rounded-xl bg-red-600 text-white">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <div className="text-left text-xs">
                <span className="font-bold text-red-500 block uppercase tracking-wider text-[10px]">❤️ DEU MATCH!</span>
                <span className="text-gray-300">Você e Sofia se curtiram!</span>
              </div>
            </motion.div>

            {/* Profile Overlay Card */}
            <div className="relative z-10 space-y-2 text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-white">Sofia, 17</h3>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs text-gray-300 line-clamp-2">
                Arquiteta, apaixonada por café espresso, fotografia e boas conversas.
              </p>
              <div className="flex gap-1.5 pt-1">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-wider text-gray-200">
                  ☕ Café
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-wider text-gray-200">
                  📸 Fotografia
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        <p>© 2026 Ignite Match. Todos os direitos reservados. Projeto Full-Stack Seguro.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
