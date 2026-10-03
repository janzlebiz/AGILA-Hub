import React from 'react';
import { useApp } from '../context/AppContext';
import { DigitalIdCard } from './DigitalIdCard';
import { X, ShieldCheck, Download, Share2 } from 'lucide-react';

export const DigitalIdModal: React.FC = () => {
  const { isDigitalIdModalOpen, setIsDigitalIdModalOpen, currentUser } = useApp();

  if (!isDigitalIdModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 text-slate-100 flex flex-col items-center">
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
              Official Eagles Digital Card
            </h3>
          </div>
          <button
            onClick={() => setIsDigitalIdModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Presentation */}
        <div className="w-full py-2">
          <DigitalIdCard member={currentUser} />
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 w-full flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[10px]">TFOE-PE Encrypted Credential</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Digital membership card saved to photos/files!')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs transition"
            >
              <Download className="w-3.5 h-3.5" /> Save ID
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
