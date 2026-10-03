import React from 'react';
import { useApp } from '../context/AppContext';
import { DigitalIdCard } from '../components/DigitalIdCard';
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Sparkles,
  ArrowRight,
  DollarSign,
  Briefcase,
  Users,
  Bot,
  AlertCircle,
  CheckCircle2,
  FileText,
  ChevronRight,
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const {
    currentUser,
    meetings,
    projects,
    transactions,
    announcements,
    setActiveTab,
    setIsQRScannerOpen,
    setIsDigitalIdModalOpen,
    allMembers,
    attendanceRecords,
  } = useApp();

  // Determine dynamic time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const title = currentUser.gender === 'Female' ? 'Ate' : 'Kuya';
    if (hour < 12) return `Good morning, ${title} ${currentUser.nickname}!`;
    if (hour < 18) return `Good afternoon, ${title} ${currentUser.nickname}!`;
    return `Good evening, ${title} ${currentUser.nickname}!`;
  };

  // Find next upcoming meeting
  const nextMeeting = meetings.find((m) => m.status === 'Scheduled' || m.status === 'In Progress') || meetings[0];

  // Calculate my dues balance
  const myTotalPaid = transactions
    .filter((t) => t.memberId === currentUser.id && t.status === 'Verified')
    .reduce((sum, t) => sum + t.amount, 0);
  const annualTarget = 8000; // P6,000 annual club dues + P2,000 regional
  const duesBalance = Math.max(0, annualTarget - myTotalPaid);

  // Active flagship community project
  const activeProject = projects.find((p) => p.status === 'Ongoing') || projects[0];
  const pendingTasks = activeProject ? activeProject.tasks.filter((t) => t.status !== 'Completed') : [];

  // Latest announcements
  const latestAnnouncements = announcements.slice(0, 2);

  // My attendance count
  const myAttendances = attendanceRecords.filter((a) => a.memberId === currentUser.id);

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* 1. Fraternal Personalized Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950/40 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-amber-400 font-serif">Mabuhay ang Agila!</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
              {currentUser.positions[0] || 'Member'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight">
            {getGreeting()}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Bantayog Elite Eagles Club • Camarines Norte • Term 2026-2028
          </p>
        </div>

        {/* Quick QR Attendance Scan trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsQRScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition"
          >
            <QrCode className="w-4 h-4 stroke-[2.5]" />
            <span>Scan Attendance</span>
          </button>
        </div>
      </div>

      {/* 2. Digital Membership ID Card */}
      <div className="relative">
        <DigitalIdCard member={currentUser} onOpenFull={() => setIsDigitalIdModalOpen(true)} />
      </div>

      {/* 3. Quick Action Feature Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('constitution')}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 text-left transition group shadow-md"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <Bot className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-white group-hover:text-amber-300">Constitution AI</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Official RAG Assistant</p>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 text-left transition group shadow-md"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <Briefcase className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-white group-hover:text-blue-300">Project Tasks</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Task Collaboration</p>
        </button>

        <button
          onClick={() => setActiveTab('meetings')}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 text-left transition group shadow-md"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <Calendar className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">GMM Schedule</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Meetings & Roll Call</p>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 text-left transition group shadow-md"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <DollarSign className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-white group-hover:text-purple-300">My Dues Ledger</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Balance & Receipts</p>
        </button>
      </div>

      {/* 4. Next Scheduled Meeting Spotlight */}
      {nextMeeting && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Next Fraternal Assembly
              </span>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {nextMeeting.type}
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white font-serif">
              {nextMeeting.title}
            </h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              {nextMeeting.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{nextMeeting.date} ({nextMeeting.time})</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">{nextMeeting.location}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => setActiveTab('meetings')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
            >
              <span>View Agenda & Attendance</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsQRScannerOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Check-in QR</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Two-Column Widget: Active Project Collaboration + Dues Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Community Service Task Collaboration Spotlight */}
        {activeProject && (
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                Active Project Sprint
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                {activeProject.status}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white font-serif line-clamp-1">
                {activeProject.title}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {activeProject.description}
              </p>
            </div>

            {/* Task Tracking summary */}
            <div className="bg-slate-850/80 rounded-2xl p-3 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Workflow Tasks</span>
                <span className="text-amber-400 font-bold">
                  {activeProject.tasks.filter((t) => t.status === 'Completed').length} of {activeProject.tasks.length} Done
                </span>
              </div>

              {/* Mini progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-amber-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      activeProject.tasks.length > 0
                        ? (activeProject.tasks.filter((t) => t.status === 'Completed').length /
                            activeProject.tasks.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                <span>Beneficiaries: <strong className="text-white">{activeProject.beneficiaryCount}</strong></span>
                <span>Volunteers: <strong className="text-white">{activeProject.volunteers.length} Eagles</strong></span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('services')}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>Manage Project Tasks Kanban</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* My Dues & Attendance Standing */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                Financial Standing
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  duesBalance === 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {duesBalance === 0 ? 'Fully Paid' : 'Balance Remaining'}
              </span>
            </div>

            <div className="bg-slate-850/80 rounded-2xl p-3 border border-slate-800 space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Total Dues Remitted</span>
                <span className="text-sm font-bold text-white font-mono">
                  ₱{myTotalPaid.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Annual Standing Balance</span>
                <span
                  className={`text-sm font-bold font-mono ${
                    duesBalance === 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  ₱{duesBalance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-slate-850/80 rounded-2xl p-3 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-300 font-semibold block">GMM Attendance</span>
                <span className="text-[10px] text-slate-400">Verified official logs</span>
              </div>
              <span className="text-sm font-bold text-amber-400 font-mono">
                {myAttendances.length} Meetings
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('finance')}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 mt-2"
          >
            <span>View Financial Records</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6. Official Announcements Feed */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Official Club Bulletins
          </span>
          <button
            onClick={() => setActiveTab('announcements')}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold"
          >
            View All
          </button>
        </div>

        <div className="space-y-2.5">
          {latestAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className="p-3.5 rounded-2xl bg-slate-850/80 border border-slate-800/80 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {ann.priority}
                </span>
                <span>{ann.publishAt}</span>
              </div>
              <h4 className="text-xs font-bold text-white mb-1">{ann.title}</h4>
              <p className="text-[11px] text-slate-300 line-clamp-2">{ann.content}</p>
              <p className="text-[9px] text-amber-400/80 mt-1.5 font-medium">
                Issued by: {ann.authorName} ({ann.authorPosition})
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
