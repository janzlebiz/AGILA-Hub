import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, QrCode, CheckCircle2, User, Sparkles, AlertCircle, Camera } from 'lucide-react';
import { AttendanceStatus } from '../types';

export const QRScannerModal: React.FC = () => {
  const {
    isQRScannerOpen,
    setIsQRScannerOpen,
    meetings,
    allMembers,
    recordAttendance,
  } = useApp();

  const scheduledMeetings = meetings.filter((m) => m.status !== 'Cancelled');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(
    scheduledMeetings[0]?.id || ''
  );
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('Present');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSimulatingCamera, setIsSimulatingCamera] = useState(true);

  if (!isQRScannerOpen) return null;

  const handleSimulateScan = async (memberId: string) => {
    const res = await recordAttendance(selectedMeetingId, memberId, attendanceStatus, 'QR Scan');
    setScanResult(res);
  };

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-serif">QR Attendance Scanner</h2>
              <p className="text-xs text-slate-400">Instant GMM Verification</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsQRScannerOpen(false);
              setScanResult(null);
            }}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Meeting Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Target Meeting
            </label>
            <select
              value={selectedMeetingId}
              onChange={(e) => {
                setSelectedMeetingId(e.target.value);
                setScanResult(null);
              }}
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {scheduledMeetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.date})
                </option>
              ))}
            </select>
          </div>

          {/* Status selector (Present vs Late) */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAttendanceStatus('Present')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition border ${
                attendanceStatus === 'Present'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              Mark as Present
            </button>
            <button
              type="button"
              onClick={() => setAttendanceStatus('Late')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition border ${
                attendanceStatus === 'Late'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              Mark as Late
            </button>
          </div>

          {/* Simulated Scanner Viewfinder */}
          <div className="relative aspect-video rounded-2xl bg-black border-2 border-dashed border-amber-500/50 overflow-hidden flex flex-col items-center justify-center p-4 text-center">
            {/* Viewfinder crosshairs */}
            <div className="absolute inset-8 border border-amber-400/40 rounded-xl pointer-events-none animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 border-2 border-amber-400 rounded-lg opacity-60" />
            </div>

            <Camera className="w-8 h-8 text-amber-400/80 mb-2" />
            <p className="text-xs font-medium text-amber-200">
              Align member's Digital ID QR code inside the frame
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Cryptographic signature check is automatic
            </p>
          </div>

          {/* Result Alert Toast */}
          {scanResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2.5 animate-in slide-in-from-top-2 border ${
                scanResult.success
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{scanResult.message}</span>
            </div>
          )}

          {/* Quick-Scan Simulation Buttons (Test all members) */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Tap to Scan Member Digital Card:
            </p>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {allMembers
                .filter((m) => m.membershipStatus === 'Active')
                .map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleSimulateScan(member.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-500/10 hover:border-amber-500/40 border border-slate-700/60 text-left transition group text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={member.profilePhoto}
                        alt={member.nickname}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <div className="truncate">
                        <span className="font-semibold text-white group-hover:text-amber-300">
                          {member.gender === 'Female' ? 'Ate' : 'Kuya'} {member.nickname}{' '}
                          {member.lastName}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {member.membershipNumber}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                      Scan ID
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
