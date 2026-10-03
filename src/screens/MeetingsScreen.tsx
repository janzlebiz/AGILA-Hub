import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarDays,
  Clock,
  MapPin,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Plus,
  Users,
  Search,
  Filter,
  Check,
  X,
  FileCheck2,
  ChevronDown,
  Sparkles,
  Camera,
} from 'lucide-react';
import { Meeting, MeetingType, AttendanceStatus } from '../types';

export const MeetingsScreen: React.FC = () => {
  const {
    meetings,
    attendanceRecords,
    attendanceCorrections,
    currentUser,
    allMembers,
    recordAttendance,
    requestAttendanceCorrection,
    decideAttendanceCorrection,
    createMeeting,
    setIsQRScannerOpen,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'corrections'>('upcoming');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(meetings[0]?.id || '');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isSelfCheckinModalOpen, setIsSelfCheckinModalOpen] = useState(false);

  // Correction form state
  const [correctionReason, setCorrectionReason] = useState('');
  const [requestedStatus, setRequestedStatus] = useState<AttendanceStatus>('Present');

  // New Meeting form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MeetingType>('GMM');
  const [newDate, setNewDate] = useState('2026-10-24');
  const [newTime, setNewTime] = useState('18:00 - 21:00 PST');
  const [newLocation, setNewLocation] = useState('Bantayog Elite Club Hall, Daet');
  const [newVenueType, setNewVenueType] = useState<'In-Person' | 'Hybrid' | 'Online'>('In-Person');
  const [newDescription, setNewDescription] = useState('');
  const [newAgenda, setNewAgenda] = useState('Call to Order\nPresidential Address\nCommittee Reports\nOpen Fellowship');

  const isOfficer =
    currentUser.roles.includes('President') ||
    currentUser.roles.includes('Secretary') ||
    currentUser.roles.includes('Club_Admin');

  const currentMeeting = meetings.find((m) => m.id === selectedMeetingId) || meetings[0];
  const meetingAttendance = attendanceRecords.filter((a) => a.meetingId === currentMeeting?.id);

  // Check if current user is checked in
  const myRecord = meetingAttendance.find((a) => a.memberId === currentUser.id);

  // Submit Self Check-in
  const handleSelfCheckin = () => {
    if (!currentMeeting) return;
    recordAttendance(currentMeeting.id, currentUser.id, 'Present', 'Member Self-Check-in');
    setIsSelfCheckinModalOpen(false);
  };

  // Submit Correction Request
  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMeeting || !correctionReason.trim()) return;
    const existingRec = myRecord?.id || 'att-placeholder';
    requestAttendanceCorrection(existingRec, currentMeeting.id, correctionReason.trim(), requestedStatus);
    setCorrectionReason('');
    setIsCorrectionModalOpen(false);
  };

  // Submit Schedule Meeting
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createMeeting({
      scope: 'Club',
      clubId: 'club-beec',
      type: newType,
      title: newTitle.trim(),
      date: newDate,
      time: newTime,
      location: newLocation,
      venueType: newVenueType,
      description: newDescription.trim() || 'Official fraternal gathering of Bantayog Elite Eagles Club.',
      status: 'Scheduled',
      createdBy: `${currentUser.gender === 'Female' ? 'Ate' : 'Kuya'} ${currentUser.nickname}`,
      agendaItems: newAgenda.split('\n').filter(Boolean),
    });
    setIsScheduleModalOpen(false);
    setNewTitle('');
  };

  // Attendance rate calculation
  const activeMembersCount = allMembers.filter((m) => m.membershipStatus === 'Active').length;
  const presentCount = meetingAttendance.filter((a) => a.status === 'Present' || a.status === 'Late').length;
  const attendancePercentage = activeMembersCount > 0 ? Math.round((presentCount / activeMembersCount) * 100) : 0;

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-serif">Meetings & Attendance Hub</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            General Membership Meetings (GMM), ExeCom, QR check-in & audits
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* QR Scanner trigger */}
          <button
            onClick={() => setIsQRScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
          >
            <QrCode className="w-4 h-4 stroke-[2.5]" />
            <span>QR Scanner</span>
          </button>

          {/* Schedule Meeting (Officers only) */}
          {isOfficer && (
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs transition"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-4 text-xs font-bold text-slate-400">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-2 transition flex items-center gap-1.5 ${
            activeTab === 'upcoming'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'hover:text-slate-200'
          }`}
        >
          <span>Scheduled Assemblies</span>
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full text-[10px]">
            {meetings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('corrections')}
          className={`pb-2 transition flex items-center gap-1.5 ${
            activeTab === 'corrections'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'hover:text-slate-200'
          }`}
        >
          <span>Attendance Corrections</span>
          {attendanceCorrections.filter((c) => c.approvalStatus === 'Pending').length > 0 && (
            <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-full text-[10px]">
              {attendanceCorrections.filter((c) => c.approvalStatus === 'Pending').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'upcoming' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Left Column: Meetings Selector List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Assembly
            </h3>
            <div className="space-y-2">
              {meetings.map((m) => {
                const isSelected = m.id === currentMeeting?.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMeetingId(m.id)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition border text-left ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-slate-800 text-amber-300">
                        {m.type}
                      </span>
                      <span
                        className={`font-semibold ${
                          m.status === 'Completed'
                            ? 'text-emerald-400'
                            : m.status === 'In Progress'
                            ? 'text-amber-400 animate-pulse'
                            : 'text-slate-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-1">{m.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{m.date}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Meeting Dossier & Attendance Roster */}
          {currentMeeting && (
            <div className="md:col-span-2 space-y-4">
              {/* Meeting Detail Card */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      {currentMeeting.type} • {currentMeeting.venueType}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white font-serif mt-1">
                      {currentMeeting.title}
                    </h3>
                  </div>

                  {/* Attendance check-in status pill */}
                  <div>
                    {myRecord ? (
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        You are {myRecord.status}
                      </span>
                    ) : (
                      <button
                        onClick={() => setIsSelfCheckinModalOpen(true)}
                        className="text-[10px] px-3 py-1.5 rounded-xl font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition shadow"
                      >
                        Self Check-In
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300">{currentMeeting.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-850 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{currentMeeting.date} ({currentMeeting.time})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{currentMeeting.location}</span>
                  </div>
                </div>

                {/* Agenda Items */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Order of Business / Agenda
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {currentMeeting.agendaItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Attendance Statistics Bar */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    Official Roll Call Quorum
                  </span>
                  <span className="font-bold text-amber-400">
                    {presentCount} / {activeMembersCount} Active Eagles ({attendancePercentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-right">
                  Quorum requirement (50% + 1):{' '}
                  <strong className="text-white">
                    {Math.floor(activeMembersCount / 2) + 1} Members
                  </strong>
                </p>
              </div>

              {/* Attendance Log Table */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                    Attendance Records ({meetingAttendance.length})
                  </h4>

                  <button
                    onClick={() => setIsCorrectionModalOpen(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    Request Correction
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                        <th className="pb-2">Member</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 hidden sm:table-cell">Method</th>
                        <th className="pb-2 hidden sm:table-cell">Recorded By</th>
                        {isOfficer && <th className="pb-2 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {meetingAttendance.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-500">
                            No attendance records logged yet for this meeting.
                          </td>
                        </tr>
                      ) : (
                        meetingAttendance.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-850/50">
                            <td className="py-2.5 font-medium text-white">
                              <div>
                                <span>{rec.memberName}</span>
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  {rec.memberNumber}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  rec.status === 'Present'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : rec.status === 'Late'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : rec.status === 'Excused'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-400 hidden sm:table-cell text-[11px]">
                              {rec.method}
                            </td>
                            <td className="py-2.5 text-slate-400 hidden sm:table-cell text-[11px]">
                              {rec.recordedBy}
                            </td>
                            {isOfficer && (
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() =>
                                    recordAttendance(
                                      currentMeeting.id,
                                      rec.memberId,
                                      rec.status === 'Present' ? 'Late' : 'Present',
                                      'Officer Manual Entry'
                                    )
                                  }
                                  className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold"
                                >
                                  Toggle Status
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Attendance Corrections Management */}
      {activeTab === 'corrections' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-serif">
                Attendance Correction Requests
              </h3>
              <p className="text-xs text-slate-400">
                Audited workflow for rectifying unrecorded or disputed logs
              </p>
            </div>
            <button
              onClick={() => setIsCorrectionModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
            >
              Submit Request
            </button>
          </div>

          <div className="space-y-3">
            {attendanceCorrections.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-850/50 rounded-2xl border border-slate-800">
                No attendance correction requests filed yet.
              </div>
            ) : (
              attendanceCorrections.map((corr) => (
                <div
                  key={corr.id}
                  className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{corr.memberName}</span>
                      <span className="text-[11px] text-slate-400 block font-serif">
                        {corr.meetingTitle}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        corr.approvalStatus === 'Approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : corr.approvalStatus === 'Rejected'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {corr.approvalStatus}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Reason:
                    </span>
                    {corr.reason}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      Requested change:{' '}
                      <strong className="text-rose-400">{corr.oldValue}</strong> →{' '}
                      <strong className="text-emerald-400">{corr.requestedValue}</strong>
                    </span>

                    {/* Officer decision buttons */}
                    {isOfficer && corr.approvalStatus === 'Pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => decideAttendanceCorrection(corr.id, 'Approved')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px] hover:bg-emerald-400"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => decideAttendanceCorrection(corr.id, 'Rejected')}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[10px] hover:bg-rose-500/30"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: Member Self-Check-in */}
      {isSelfCheckinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white font-serif">Member Self-Check-in</h3>
              <button
                onClick={() => setIsSelfCheckinModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                You are checking in for{' '}
                <strong className="text-amber-400">{currentMeeting?.title}</strong>.
              </p>

              <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Venue Geolocation:</span>
                  <span className="text-emerald-400 font-semibold">Verified in Range</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Member:</span>
                  <span className="text-white font-semibold">
                    {currentUser.firstName} {currentUser.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ID Number:</span>
                  <span className="font-mono text-amber-300">{currentUser.membershipNumber}</span>
                </div>
              </div>

              <button
                onClick={handleSelfCheckin}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow"
              >
                Confirm Present at Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Request Attendance Correction */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white font-serif">
                Request Attendance Correction
              </h3>
              <button
                onClick={() => setIsCorrectionModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Meeting</label>
                <input
                  type="text"
                  disabled
                  value={currentMeeting?.title || ''}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white opacity-80"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Requested Status</label>
                <select
                  value={requestedStatus}
                  onChange={(e) => setRequestedStatus(e.target.value as AttendanceStatus)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Excused">Excused</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reason / Justification</label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Explain why you were present (e.g. checked in manually with Vice President, assisted with sound system setup before scanner opened)"
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow"
              >
                Submit Correction for Approval
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Schedule New Meeting (Officers only) */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white font-serif">
                Schedule Official Eagle Assembly
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bantayog Elite 3rd Regular GMM"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Assembly Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as MeetingType)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="GMM">GMM</option>
                    <option value="Club Executive Committee Meeting">Club ExeCom</option>
                    <option value="Special GMM">Special GMM</option>
                    <option value="Fellowship">Fellowship</option>
                    <option value="Induction">Induction</option>
                    <option value="Emergency Meeting">Emergency Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Venue Format</label>
                  <select
                    value={newVenueType}
                    onChange={(e) => setNewVenueType(e.target.value as any)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="In-Person">In-Person</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Venue Location</label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description / Fraternal Call</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Agenda Items (one per line)
                </label>
                <textarea
                  rows={3}
                  value={newAgenda}
                  onChange={(e) => setNewAgenda(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow"
              >
                Publish Assembly Notice
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
