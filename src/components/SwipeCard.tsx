import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Heart, X, Star, MapPin, Briefcase, ChevronLeft, ChevronRight, Info, ShieldAlert, Sparkles } from 'lucide-react';
import { User } from '../types';

interface SwipeCardProps {
  user: User;
  onSwipe: (direction: 'left' | 'right' | 'superlike') => void;
  onReportClick: (user: User) => void;
  onViewProfile?: (user: User) => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ user, onSwipe, onReportClick, onViewProfile }) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Motion values for swipe drag
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -20], [1, 0]);

  const photos = user.photos && user.photos.length > 0 ? user.photos : [user.avatar];

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex < photos.length - 1) {
      setPhotoIndex(photoIndex + 1);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex > 0) {
      setPhotoIndex(photoIndex - 1);
    }
  };

  return (
    <div className="relative w-full max-w-sm sm:max-w-md h-[580px] sm:h-[620px] mx-auto select-none">
      <motion.div
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        whileGrab={{ cursor: 'grabbing' }}
        className="absolute inset-0 rounded-[2rem] bg-[#111] border border-white/10 shadow-2xl overflow-hidden cursor-grab flex flex-col transition-all"
        id={`card-${user.id}`}
      >
        {/* Swipe Indicators overlay */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 left-8 z-30 border-4 border-red-600 rounded-2xl px-4 py-1.5 rotate-[-15deg] bg-[#050505]/80 backdrop-blur-md"
        >
          <span className="text-3xl font-black text-red-600 tracking-widest uppercase">CURTIR ❤️</span>
        </motion.div>

        <motion.div
          style={{ opacity: passOpacity }}
          className="absolute top-8 right-8 z-30 border-4 border-gray-400 rounded-2xl px-4 py-1.5 rotate-[15deg] bg-[#050505]/80 backdrop-blur-md"
        >
          <span className="text-3xl font-black text-gray-300 tracking-widest uppercase">PASSAR ❌</span>
        </motion.div>

        {/* Photo Gallery with Navigation */}
        <div className="relative flex-1 bg-[#050505] overflow-hidden">
          <img
            src={photos[photoIndex]}
            alt={user.name}
            className="w-full h-full object-cover transition-all duration-300 pointer-events-none"
          />

          {/* Photo Pagination Bar */}
          {photos.length > 1 && (
            <div className="absolute top-3 left-3 right-3 z-20 flex gap-1.5">
              {photos.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    idx === photoIndex ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Left / Right Photo Controls */}
          {photoIndex > 0 && (
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {photoIndex < photos.length - 1 && (
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Report Button overlay */}
          <button
            onClick={() => onReportClick(user)}
            title="Denunciar ou Bloquear"
            className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-black/50 hover:bg-red-950/80 backdrop-blur-md text-gray-300 hover:text-red-400 transition-all cursor-pointer border border-white/10"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>

          {/* Bottom Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent pointer-events-none" />

          {/* Card Main Info */}
          <div className="absolute inset-x-0 bottom-0 p-6 z-20 text-white flex flex-col gap-2">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
                    {user.name}, <span className="font-light">{user.age}</span>
                  </h2>
                  <span className={`w-2.5 h-2.5 rounded-full ${user.status === 'online' ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-gray-600'}`} />
                </div>

                <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-300 mt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    {user.location} ({user.distanceKm || 3} km)
                  </span>
                  {user.occupation && (
                    <span className="flex items-center gap-1 font-medium text-gray-400 border-l border-white/10 pl-3">
                      <Briefcase className="w-3.5 h-3.5 text-red-400" />
                      {user.occupation}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onViewProfile ? onViewProfile(user) : setShowDetails(!showDetails)}
                title="Ver perfil completo"
                className="p-2.5 rounded-full bg-[#1a1a1a] hover:bg-gray-800 text-white backdrop-blur-md transition-all cursor-pointer border border-white/10"
              >
                <Info className="w-5 h-5 text-red-500" />
              </button>
            </div>

            {/* Expandable Details / Bio */}
            {showDetails ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-3.5 rounded-2xl bg-[#0A0A0A]/90 border border-white/10 text-xs text-gray-300 space-y-2"
              >
                <p className="leading-relaxed">{user.bio}</p>
                {user.interests && user.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {user.interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-gray-200 text-[10px] font-bold uppercase tracking-wider"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <p className="text-xs text-gray-300 line-clamp-2 mt-1 drop-shadow">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="p-4 bg-[#0A0A0A] flex items-center justify-around border-t border-white/10">
          {/* PASS BUTTON */}
          <button
            onClick={() => onSwipe('left')}
            id={`btn-pass-${user.id}`}
            title="Passar (❌)"
            className="w-14 h-14 rounded-full bg-[#1a1a1a] hover:bg-gray-800 border border-white/10 hover:border-gray-400 text-gray-400 hover:text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-7 h-7" />
          </button>

          {/* SUPERLIKE BUTTON */}
          <button
            onClick={() => onSwipe('superlike')}
            id={`btn-superlike-${user.id}`}
            title="Superlike (⭐)"
            className="w-12 h-12 rounded-full bg-[#1a1a1a] hover:bg-amber-950/60 border border-amber-500/50 text-amber-400 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Star className="w-5 h-5 fill-amber-400/20" />
          </button>

          {/* LIKE BUTTON */}
          <button
            onClick={() => onSwipe('right')}
            id={`btn-like-${user.id}`}
            title="Curtir (❤️)"
            className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Heart className="w-8 h-8 fill-white" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SwipeCard;
