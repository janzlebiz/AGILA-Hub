import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Home,
  CalendarDays,
  Users,
  Briefcase,
  Menu,
  BookOpen,
  DollarSign,
  FileText,
  BarChart3,
  History,
  Settings,
  Bot,
  X,
  Sparkles,
  QrCode,
  ShieldAlert,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsQRScannerOpen, currentUser, allMembers, attendanceCorrections } = useApp();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Check pending badges for authorized roles
  const isOfficer = currentUser.roles.includes('President') || currentUser.roles.includes('Secretary');
  const pendingApplicantsCount = isOfficer
    ? allMembers.filter((m) => m.membershipStatus === 'Pending Approval').length
    : 0;
  const pendingCorrectionsCount = isOfficer
    ? attendanceCorrections.filter((c) => c.approvalStatus === 'Pending').length
    : 0;

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* "More" Drawer / Modal */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setIsMoreMenuOpen(false)}
          />
          <div className="relative z-10 bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl max-w-md mx-auto w-full animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  🦅
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-serif">AGILA Hub Modules</h3>
                  <p className="text-[10px] text-slate-400">TFOE-PE Socio-Civic Management</p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 py-1">
              {/* Constitution & AI */}
              <button
                onClick={() => handleNavClick('constitution')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
                  activeTab === 'constitution'
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                    : 'bg-slate-850 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 mb-1.5">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-center">Constitution AI</span>
                <span className="text-[9px] text-slate-400">e-RAG & Law</span>
              </button>

              {/* Finance & Dues */}
              <button
                onClick={() => handleNavClick('finance')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
                  activeTab === 'finance'
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                    : 'bg-slate-850 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 mb-1.5">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-center">Finance & Dues</span>
                <span className="text-[9px] text-slate-400">Ledger & Receipts</span>
              </button>

              {/* Documents Library */}
              <button
                onClick={() => handleNavClick('documents')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
                  activeTab === 'documents'
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                    : 'bg-slate-850 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 mb-1.5">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-center">Documents</span>
                <span className="text-[9px] text-slate-400">Resolutions & Docs</span>
              </button>

              {/* Reports & Data Exchange */}
              <button
                onClick={() => handleNavClick('reports')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
                  activeTab === 'reports'
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                    : 'bg-slate-850 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 mb-1.5">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-center">Reports & Data</span>
                <span className="text-[9px] text-slate-400">Export & Analytics</span>
              </button>

              {/* Audit Trail */}
              <button
                onClick={() => handleNavClick('audit')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
                  activeTab === 'audit'
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                    : 'bg-slate-850 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 mb-1.5">
                  <History className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-center">Audit Trail</span>
                <span className="text-[9px] text-slate-400">Security & History</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => handleNavClick('settings')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
                  activeTab === 'settings'
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                    : 'bg-slate-850 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-500/10 text-slate-300 mb-1.5">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-center">Settings</span>
                <span className="text-[9px] text-slate-400">Profile & Info</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating QR Quick Scanner Button (for mobile-first convenience) */}
      <div className="fixed bottom-20 right-4 z-40 sm:hidden">
        <button
          onClick={() => setIsQRScannerOpen(true)}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-bold p-3.5 shadow-xl shadow-amber-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition"
          title="Scan QR Attendance"
        >
          <QrCode className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Primary Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 py-1.5 px-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {/* 1. Home */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              activeTab === 'home'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Home</span>
          </button>

          {/* 2. Meetings */}
          <button
            onClick={() => setActiveTab('meetings')}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              activeTab === 'meetings'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarDays className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Meetings</span>
            {pendingCorrectionsCount > 0 && (
              <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          {/* 3. Members */}
          <button
            onClick={() => setActiveTab('members')}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              activeTab === 'members'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Members</span>
            {pendingApplicantsCount > 0 && (
              <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {pendingApplicantsCount}
              </span>
            )}
          </button>

          {/* 4. Services (Projects & Task Tracking Kanban) */}
          <button
            onClick={() => setActiveTab('services')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              activeTab === 'services'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Services</span>
          </button>

          {/* 5. More */}
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              ['finance', 'documents', 'reports', 'constitution', 'audit', 'settings'].includes(activeTab) ||
              isMoreMenuOpen
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
