import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Plus,
  Shield,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  X,
  Sparkles,
  ExternalLink,
  Lock,
  UserCheck,
} from 'lucide-react';
import { Member, MembershipStatus } from '../types';

export const MembersScreen: React.FC = () => {
  const {
    allMembers,
    currentUser,
    approveMember,
    rejectMember,
    registerApplicant,
    updateMemberProfile,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'approvals'>('roster');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingMemberId, setRejectingMemberId] = useState<string | null>(null);

  // New applicant registration state
  const [regFirstName, setRegFirstName] = useState('');
  const [regMiddleName, setRegMiddleName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regGender, setRegGender] = useState<'Male' | 'Female'>('Male');
  const [regBirthdate, setRegBirthdate] = useState('1992-05-15');
  const [regMobile, setRegMobile] = useState('+63 917 ');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('Daet, Camarines Norte');
  const [regOccupation, setRegOccupation] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regEmergencyName, setRegEmergencyName] = useState('');
  const [regEmergencyMobile, setRegEmergencyMobile] = useState('');
  const [regEmergencyRelation, setRegEmergencyRelation] = useState('Spouse');

  const isOfficer =
    currentUser.roles.includes('President') ||
    currentUser.roles.includes('Secretary') ||
    currentUser.roles.includes('Club_Admin');

  // Filter members
  const filteredMembers = allMembers.filter((m) => {
    if (activeTab === 'roster' && m.membershipStatus === 'Pending Approval') return false;
    if (activeTab === 'approvals' && m.membershipStatus !== 'Pending Approval') return false;

    if (statusFilter !== 'all' && m.membershipStatus !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = `${m.firstName} ${m.lastName} ${m.nickname}`.toLowerCase().includes(q);
      const matchNum = m.membershipNumber.toLowerCase().includes(q);
      const matchPos = m.positions.some((p) => p.toLowerCase().includes(q));
      return matchName || matchNum || matchPos;
    }
    return true;
  });

  const pendingApprovalsCount = allMembers.filter((m) => m.membershipStatus === 'Pending Approval').length;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFirstName.trim() || !regLastName.trim() || !regNickname.trim()) return;

    registerApplicant({
      firstName: regFirstName.trim(),
      middleName: regMiddleName.trim(),
      lastName: regLastName.trim(),
      nickname: regNickname.trim(),
      gender: regGender,
      birthdate: regBirthdate,
      mobile: regMobile.trim(),
      email: regEmail.trim(),
      address: regAddress.trim(),
      occupation: regOccupation.trim(),
      companyBusiness: regCompany.trim(),
      emergencyContact: {
        name: regEmergencyName.trim() || 'Family Contact',
        mobile: regEmergencyMobile.trim() || regMobile.trim(),
        relation: regEmergencyRelation,
      },
      privacySettings: { hideMobile: false, hideEmail: false, hideAddress: false },
    });

    setIsRegisterModalOpen(false);
    alert('Applicant registration submitted successfully! Awaiting Club Officer approval.');
  };

  const handleConfirmReject = (memberId: string) => {
    rejectMember(memberId, rejectReason || 'Incomplete onboarding documentation');
    setRejectingMemberId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-serif">Membership & Onboarding</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified roster, self-registration, credentials & approval workflows
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Member</span>
          </button>
        </div>
      </div>

      {/* Tabs: Roster vs Approvals */}
      <div className="flex items-center border-b border-slate-800 gap-4 text-xs font-bold text-slate-400">
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-2 transition flex items-center gap-1.5 ${
            activeTab === 'roster'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'hover:text-slate-200'
          }`}
        >
          <span>Active Roster</span>
          <span className="bg-slate-800 text-slate-300 px-2 py-0.2 rounded-full text-[10px]">
            {allMembers.filter((m) => m.membershipStatus !== 'Pending Approval').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-2 transition flex items-center gap-1.5 ${
            activeTab === 'approvals'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'hover:text-slate-200'
          }`}
        >
          <span>Pending Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="bg-rose-500 text-white px-2 py-0.2 rounded-full text-[10px] animate-pulse">
              {pendingApprovalsCount}
            </span>
          )}
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, nickname, or membership number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {activeTab === 'roster' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
            <option value="Honorary">Honorary</option>
          </select>
        )}
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filteredMembers.length === 0 ? (
          <div className="col-span-2 p-10 text-center text-xs text-slate-500 bg-slate-900/60 rounded-3xl border border-slate-800">
            No members found matching your search.
          </div>
        ) : (
          filteredMembers.map((member) => {
            const greeting = member.gender === 'Female' ? 'Ate' : 'Kuya';
            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-850 transition cursor-pointer flex flex-col justify-between shadow-md group"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={member.profilePhoto}
                    alt={member.nickname}
                    className="w-14 h-14 rounded-2xl object-cover border border-amber-400/40 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-amber-400 font-semibold">{greeting}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          member.membershipStatus === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : member.membershipStatus === 'Pending Approval'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {member.membershipStatus}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white truncate font-serif">
                      {member.firstName} {member.lastName}
                    </h4>
                    <p className="text-xs text-amber-200/90 font-medium">"{member.nickname}"</p>

                    <p className="text-[11px] text-slate-300 font-medium truncate mt-1">
                      {member.positions[0] || 'Member'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono text-slate-300">{member.membershipNumber}</span>
                  <span className="text-amber-400 group-hover:translate-x-0.5 transition font-semibold">
                    View Dossier →
                  </span>
                </div>

                {/* Actions for Approvals Queue */}
                {activeTab === 'approvals' && isOfficer && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        approveMember(member.id);
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                    >
                      Approve & Induct
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRejectingMemberId(member.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs hover:bg-rose-500/30 transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Reject Reason Prompt */}
      {rejectingMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-5 text-slate-100 shadow-2xl">
            <h3 className="text-sm font-bold text-white font-serif mb-2">Reject Application</h3>
            <p className="text-xs text-slate-400 mb-3">
              State the reason for rejecting this applicant. This will be recorded in the audit trail.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Unverified sponsor endorsement, background investigation incomplete..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectingMemberId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmReject(rejectingMemberId)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Member Detailed Dossier */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                  Member Profile & Dossier
                </h3>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={selectedMember.profilePhoto}
                alt={selectedMember.nickname}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-lg"
              />
              <div>
                <span className="text-xs text-amber-400 font-semibold">
                  {selectedMember.gender === 'Female' ? 'Ate' : 'Kuya'}
                </span>
                <h3 className="text-lg font-bold text-white font-serif">
                  {selectedMember.firstName} {selectedMember.middleName} {selectedMember.lastName}
                </h3>
                <p className="text-xs text-amber-200/90 font-medium">"{selectedMember.nickname}"</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {selectedMember.membershipStatus}
                </span>
              </div>
            </div>

            {/* Position Assignment */}
            <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 space-y-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Positions Held:</span>
              {selectedMember.positions.map((p, idx) => (
                <p key={idx} className="font-semibold text-amber-300">
                  • {p}
                </p>
              ))}
            </div>

            {/* Contact & Professional Info (Privacy respected) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Info</span>
                <p className="flex items-center gap-2 text-slate-200">
                  <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {selectedMember.privacySettings.hideMobile && currentUser.id !== selectedMember.id ? (
                    <span className="text-slate-500 italic flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Private
                    </span>
                  ) : (
                    <span>{selectedMember.mobile}</span>
                  )}
                </p>
                <p className="flex items-center gap-2 text-slate-200">
                  <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{selectedMember.email}</span>
                </p>
                <p className="flex items-center gap-2 text-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{selectedMember.address}</span>
                </p>
              </div>

              <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Vocation & Business</span>
                <p className="flex items-center gap-2 text-slate-200">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-medium">{selectedMember.occupation}</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Entity: <strong className="text-slate-300">{selectedMember.companyBusiness}</strong>
                </p>
                <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                  <span>Emergency: </span>
                  <strong className="text-white">
                    {selectedMember.emergencyContact.name} ({selectedMember.emergencyContact.relation})
                  </strong>
                </div>
              </div>
            </div>

            {/* Membership History Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Membership History & Audit Logs
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedMember.membershipHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 text-xs space-y-0.5"
                  >
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-amber-400">{item.type}</span>
                      <span>{item.date}</span>
                    </div>
                    <p className="text-slate-200">{item.description}</p>
                    <p className="text-[9px] text-slate-500">Recorded by: {item.recordedBy}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Self Privacy Toggles (if viewing own profile) */}
            {currentUser.id === selectedMember.id && (
              <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs space-y-2">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">
                  Your Directory Privacy Settings
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Hide Mobile Number from public members:</span>
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
                    className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Register New Member (Self-Registration) */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white font-serif">
                Member Self-Registration Application
              </h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Fraternal Nickname</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Joel"
                    value={regNickname}
                    onChange={(e) => setRegNickname(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Gender</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as any)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Male">Male (Kuya)</option>
                    <option value="Female">Female (Ate)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    required
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Residential Address</label>
                <input
                  type="text"
                  required
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Occupation / Profession</label>
                  <input
                    type="text"
                    required
                    value={regOccupation}
                    onChange={(e) => setRegOccupation(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Company / Business</label>
                  <input
                    type="text"
                    required
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Emergency Contact
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={regEmergencyName}
                    onChange={(e) => setRegEmergencyName(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Emergency Phone"
                    value={regEmergencyMobile}
                    onChange={(e) => setRegEmergencyMobile(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow"
              >
                Submit Application for Club Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
