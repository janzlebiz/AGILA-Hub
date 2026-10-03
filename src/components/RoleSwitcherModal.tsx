import React from 'react';
import { useApp } from '../context/AppContext';
import { X, UserCheck, Check, Shield, Award, Sparkles, Building, Globe } from 'lucide-react';

export const RoleSwitcherModal: React.FC = () => {
  const {
    isRoleSwitcherOpen,
    setIsRoleSwitcherOpen,
    currentUser,
    allMembers,
    switchUser,
  } = useApp();

  if (!isRoleSwitcherOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-serif flex items-center gap-1.5">
                <span>RBAC Persona Switcher</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-semibold px-1.5 py-0.2 rounded border border-amber-500/30">
                  Audit Demo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Test permissions & scopes across Club, Region, and National tiers
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRoleSwitcherOpen(false)}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative callout */}
        <div className="px-5 py-3 bg-amber-950/30 border-b border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            Switching personas simulates the multi-tier organizational scope (PRD Phase 2). Each role enforces distinct permissions for onboarding approvals, attendance administration, financial recording, and Constitution sync.
          </p>
        </div>

        {/* Member Persona Roster List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 divide-y divide-slate-800/40">
          {allMembers.map((member) => {
            const isSelected = member.id === currentUser.id;
            const greeting = member.gender === 'Female' ? 'Ate' : 'Kuya';

            return (
              <div
                key={member.id}
                onClick={() => {
                  switchUser(member.id);
                  setIsRoleSwitcherOpen(false);
                }}
                className={`pt-2.5 first:pt-0 flex items-center justify-between p-3 rounded-2xl cursor-pointer transition border ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-md'
                    : 'bg-slate-850/60 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={member.profilePhoto}
                      alt={member.nickname}
                      className="w-12 h-12 rounded-xl object-cover border border-amber-500/30"
                    />
                    {isSelected && (
                      <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 shadow">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-white truncate">
                        {greeting} {member.firstName} {member.lastName}
                      </h4>
                      <span className="text-xs text-amber-300 font-medium">
                        "{member.nickname}"
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5 truncate">
                      <Award className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="font-medium text-amber-200/90 truncate">
                        {member.positions[0] || 'Member'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                        {member.membershipNumber}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400">
                        Status: <strong className="text-slate-200">{member.membershipStatus}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isSelected ? 'Active' : 'Select'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
