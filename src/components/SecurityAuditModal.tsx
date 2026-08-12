import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle, AlertTriangle, RefreshCw, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RedTeamTestResult } from '../types';

interface SecurityAuditModalProps {
  onClose: () => void;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({ onClose }) => {
  const { token } = useAuth();
  const [running, setRunning] = useState(false);
  const [auditData, setAuditData] = useState<{
    timestamp: string;
    testedBy: string;
    totalTests: number;
    passedCount: number;
    vulnerableCount: number;
    results: RedTeamTestResult[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    if (!token) return;
    setRunning(true);
    setError(null);

    try {
      const res = await fetch('/api/security/audit/run', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAuditData(data);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao executar auditoria.');
      }
    } catch (err) {
      setError('Erro de conexão ao executar testes de segurança.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-red-900/60 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-950/80 border border-red-800 text-red-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Auditoria de Segurança — Red Team</h2>
              <p className="text-xs text-zinc-400">Verificação automatizada não destrutiva de vulnerabilidades web</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between p-4 mb-6 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="text-xs text-zinc-300">
            {auditData ? (
              <span>
                Último teste: <strong className="text-white">{new Date(auditData.timestamp).toLocaleTimeString()}</strong> por @{auditData.testedBy}
              </span>
            ) : (
              <span>Execute o scanner para testar BOLA/IDOR, XSS, JWT e privilégios.</span>
            )}
          </div>

          <button
            onClick={runAudit}
            disabled={running}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'Auditando...' : 'Iniciar Auditoria Red Team'}</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Audit Results */}
        {auditData && (
          <div className="space-y-4">
            {/* Score Summary Cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-2xl font-black text-white">{auditData.totalTests}</span>
                <span className="block text-[10px] uppercase font-bold text-zinc-400 mt-0.5">Testes</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-400">
                <span className="text-2xl font-black">{auditData.passedCount}</span>
                <span className="block text-[10px] uppercase font-bold mt-0.5">Aprovados</span>
              </div>

              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-400">
                <span className="text-2xl font-black">{auditData.vulnerableCount}</span>
                <span className="block text-[10px] uppercase font-bold mt-0.5">Vulneráveis</span>
              </div>
            </div>

            {/* Test Case Breakdown List */}
            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {auditData.results.map((res) => (
                <div
                  key={res.id}
                  className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      {res.status === 'passed' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <span>{res.name}</span>
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        res.status === 'passed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      {res.status === 'passed' ? 'SEGURO' : 'VULNERÁVEL'}
                    </span>
                  </div>

                  <p className="text-zinc-400 text-[11px] leading-relaxed">{res.description}</p>

                  <div className="p-2 rounded-lg bg-zinc-950 font-mono text-[10px] text-zinc-300 overflow-x-auto">
                    <span className="text-red-400 font-bold">Payload: </span>
                    {res.payloadTested}
                  </div>

                  <p className="text-[10px] text-zinc-500">
                    <strong className="text-zinc-400">Proteção ativa: </strong>
                    {res.remediation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityAuditModal;
