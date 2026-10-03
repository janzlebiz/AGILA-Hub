import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Shield,
  Lock,
  User,
  Bell,
  Heart,
  FileText,
  ExternalLink,
  Award,
  Sparkles,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { currentUser, updateMemberProfile, club, region, organization } = useApp();

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-serif">Preferences & Fraternal Oath</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Member profile privacy, fraternal protocols & charter specifications
          </p>
        </div>
      </div>

      {/* Directory Privacy Settings */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white font-serif">
            Member Directory Privacy Controls
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Control which personal details are visible to non-officer members in the club directory.
        </p>

        <div className="space-y-3 pt-1">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-850 border border-slate-800 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-white block">Hide Mobile Number</span>
              <span className="text-[11px] text-slate-400">
                Only Club Officers and Regional Leaders can view your direct mobile line.
              </span>
            </div>
            <input
              type="checkbox"
              checked={currentUser.privacySettings.hideMobile}
              onChange={(e) =>
                updateMemberProfile(currentUser.id, {
                  privacySettings: {
                    ...currentUser.privacySettings,
                    hideMobile: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 accent-amber-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-850 border border-slate-800 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-white block">Hide Residential Address</span>
              <span className="text-[11px] text-slate-400">
                Mask your home address in the general club directory view.
              </span>
            </div>
            <input
              type="checkbox"
              checked={currentUser.privacySettings.hideAddress}
              onChange={(e) =>
                updateMemberProfile(currentUser.id, {
                  privacySettings: {
                    ...currentUser.privacySettings,
                    hideAddress: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 accent-amber-500 rounded"
            />
          </label>
        </div>
      </div>

      {/* Fraternal Code of Conduct */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white font-serif">The Eagle’s Creed & Motto</h3>
        </div>

        <blockquote className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 to-slate-850 border border-amber-500/30 text-xs text-amber-200/90 italic font-serif leading-relaxed">
          "Humanitarian Service Through Strong Brotherhood. An Eagle is born to serve, to uplift the downtrodden, and to protect the unity of the fraternal brotherhood under God and Country."
        </blockquote>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300 pt-2">
          <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800">
            <span className="font-bold text-amber-400 block mb-1">Fraternal Titles:</span>
            <p className="text-[11px]">Male members are addressed as <strong>"Kuya"</strong> and female members as <strong>"Ate"</strong> followed by their nickname.</p>
          </div>

          <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800">
            <span className="font-bold text-amber-400 block mb-1">Two-Year Officer Term:</span>
            <p className="text-[11px]">All elected club and regional officers serve for a fixed term of two (2) years (e.g. 2026-2028).</p>
          </div>
        </div>
      </div>

      {/* About App & Legal Info */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 text-xs">
        <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
          About AGILA Hub Platform
        </h3>

        <div className="space-y-1.5 text-slate-300">
          <p>
            <strong>Platform:</strong> AGILA Hub v1.0 (Mobile-first PWA)
          </p>
          <p>
            <strong>Charter Chapter:</strong> {club.name} ({club.code})
          </p>
          <p>
            <strong>Regional Council:</strong> {region.name} ({region.code})
          </p>
          <p>
            <strong>National Body:</strong> {organization.legalName}
          </p>
          <p>
            <strong>e-Constitution Source:</strong>{' '}
            <a
              href="https://e-constitution.tfoe-peinc.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline"
            >
              https://e-constitution.tfoe-peinc.com/
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
