import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraPhotoModalProps {
  onClose: () => void;
  onPhotoCaptured: (photoDataUrl: string) => void;
}

export const CameraPhotoModal: React.FC<CameraPhotoModalProps> = ({ onClose, onPhotoCaptured }) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'upload'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setCapturedPhoto(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Não foi possível acessar a câmera do dispositivo. Verifique as permissões de câmera ou use o upload de arquivo JPG/PNG.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeMode]);

  // Capture Frame from Video
  const handleCaptureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror image horizontally for front camera natural feel
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  // Handle JPG / PNG File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict validation: Only JPG/JPEG and PNG allowed
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const lowerName = file.name.toLowerCase();
    const validExtension = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png');

    if (!validTypes.includes(file.type) || !validExtension) {
      setFileError('Segurança: Apenas arquivos de imagem JPG, JPEG ou PNG são permitidos.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setFileError('O arquivo excede o limite máximo de 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCapturedPhoto(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onPhotoCaptured(capturedPhoto);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-6 shadow-2xl text-white space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-base font-extrabold flex items-center gap-2">
            <Camera className="w-5 h-5 text-red-500" />
            <span>Adicionar Foto de Perfil</span>
          </h3>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full bg-[#111] text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-[#111] p-1 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setCapturedPhoto(null);
              setActiveMode('camera');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'camera' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Tirar Foto Agora</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCapturedPhoto(null);
              setActiveMode('upload');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'upload' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Enviar JPG / PNG</span>
          </button>
        </div>

        {/* CAMERA MODE */}
        {activeMode === 'camera' && (
          <div className="space-y-4">
            {capturedPhoto ? (
              <div className="space-y-4 text-center">
                <div className="relative aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden ring-2 ring-red-500/50 shadow-2xl">
                  <img src={capturedPhoto} alt="Foto Capturada" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 py-2.5 rounded-xl bg-[#111] hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Tirar Outra</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Usar Esta Foto</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {cameraError ? (
                  <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800 text-red-300 text-xs space-y-2 text-center">
                    <AlertCircle className="w-6 h-6 mx-auto text-red-400" />
                    <p>{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => setActiveMode('upload')}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wider"
                    >
                      Usar Upload de Arquivo
                    </button>
                  </div>
                ) : (
                  <div className="relative aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-black border border-white/10">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                )}

                {!cameraError && (
                  <button
                    type="button"
                    onClick={handleCaptureFrame}
                    id="btn-capture-camera"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capturar Foto Agora</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* UPLOAD MODE */}
        {activeMode === 'upload' && (
          <div className="space-y-4">
            {fileError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{fileError}</span>
              </div>
            )}

            {capturedPhoto ? (
              <div className="space-y-4 text-center">
                <div className="relative aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden ring-2 ring-red-500/50 shadow-2xl">
                  <img src={capturedPhoto} alt="Foto Selecionada" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCapturedPhoto(null)}
                    className="flex-1 py-2.5 rounded-xl bg-[#111] hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Escolher Outro</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Usar Esta Foto</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/20 hover:border-red-500 rounded-2xl p-8 text-center bg-[#111]/50 space-y-3 transition-colors relative">
                <input
                  type="file"
                  accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 mx-auto rounded-2xl bg-red-950/50 border border-red-800/80 flex items-center justify-center text-red-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-white">Clique para selecionar foto</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Permitido estritamente formatos <strong className="text-red-400">.JPG</strong> ou <strong className="text-red-400">.PNG</strong> (máx. 8MB).
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraPhotoModal;
