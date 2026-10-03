import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Member } from '../types';
import { Shield, Award, CheckCircle2, RotateCw, ExternalLink, Calendar, MapPin, Sparkles } from 'lucide-react';

interface DigitalIdCardProps {
  member: Member;
  compact?: boolean;
  onOpenFull?: () => void;
}

export const DigitalIdCard: React.FC<DigitalIdCardProps> = ({ member, compact = false, onOpenFull }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    // Generate secure QR code containing opaque signed payload
    QRCode.toDataURL(
      member.qrOpaqueCode,
      {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [member.qrOpaqueCode]);

  const greetingPrefix = member.gender === 'Female' ? 'Ate' : 'Kuya';

  return (
    <div className={`relative perspective-1000 ${compact ? 'max-w-md' : 'max-w-lg'} w-full mx-auto select-none`}>
      <div
        className={`relative transition-all duration-700 transform-style-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* FRONT OF THE DIGITAL CARD */}
        <div
          className={`w-full rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden backface-hidden border border-amber-500/30 bg-gradient-to-br from-slate-900 via-blue-950 to-amber-950/80 ${
            compact ? 'min-h-[220px]' : 'min-h-[260px]'
          }`}
        >
          {/* Background Watermark Eagle Seal */}
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <svg width="260" height="260" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15 8L21 9L16.5 14L18 20L12 17L6 20L7.5 14L3 9L9 8L12 2Z" />
            </svg>
          </div>

          {/* Golden Eagle Top Header */}
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
                🦅
              </div>
              <div>
                <h4 className="text-[11px] font-extrabold tracking-wider text-amber-400 uppercase font-serif">
                  TFOE-PE, INC.
                </h4>
                <p className="text-[9px] text-slate-300 font-medium tracking-tight">
                  The Fraternal Order of Eagles
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                {member.membershipStatus}
              </span>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
                title="Flip to QR Code"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(!isFlipped);
                }}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Member Details & Portrait */}
          <div className="flex gap-4 items-center">
            <div className="relative shrink-0">
              <img
                src={member.profilePhoto}
                alt={member.nickname}
                className="w-20 h-20 rounded-xl object-cover border-2 border-amber-400 shadow-md shadow-black/40"
              />
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-amber-400 text-xs font-semibold">{greetingPrefix}</span>
                <h3 className="text-base font-bold text-white truncate font-serif">
                  {member.firstName} {member.lastName}
                </h3>
              </div>
              <p className="text-xs text-amber-200/90 font-medium">"{member.nickname}"</p>

              <div className="mt-2 space-y-0.5 text-[10px] text-slate-300">
                <div className="flex items-center gap-1 text-slate-200 font-semibold truncate">
                  <Award className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">{member.positions[0] || 'Regular Member'}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 truncate">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">Bantayog Elite Eagles Club • BCNBR-1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer with Membership Numbers */}
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center text-[10px]">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Member ID No.</span>
              <span className="font-mono font-bold text-amber-400 tracking-wider">
                {member.membershipNumber}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Card ID</span>
              <span className="font-mono text-slate-300 font-medium">{member.membershipCardId}</span>
            </div>
          </div>
        </div>

        {/* BACK OF THE DIGITAL CARD (SECURE QR CODE) */}
        <div
          className={`w-full rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden backface-hidden rotate-y-180 border border-amber-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 ${
            compact ? 'min-h-[220px]' : 'min-h-[260px]'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
                Secure QR Verification
              </span>
            </div>
            <button
              type="button"
              className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Flip to Front"
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped(!isFlipped);
              }}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-lg shrink-0">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-24 h-24 rounded" />
              ) : (
                <div className="w-24 h-24 flex items-center justify-center text-slate-500 text-xs">
                  Generating...
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-[10px] space-y-1.5">
              <p className="text-slate-300 leading-snug">
                Official signed token for instant GMM attendance & fraternal identification.
              </p>
              <div className="bg-slate-800/80 rounded p-1.5 font-mono text-[9px] text-amber-300 truncate">
                {member.qrOpaqueCode}
              </div>
              <div className="text-[9px] text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                Inducted: {member.dateInducted || 'Active 2026'}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
            <span>Verified by TFOE-PE AGILA Cryptographic Protocol</span>
            {onOpenFull && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFull();
                }}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-0.5"
              >
                <span>Fullscreen</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-2 flex items-center justify-center gap-1">
        <RotateCw className="w-3 h-3 text-amber-400/80" />
        Tap card to toggle Digital ID / QR Attendance Code
      </p>
    </div>
  );
};
