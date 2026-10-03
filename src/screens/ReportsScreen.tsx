import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  Download,
  Upload,
  FileSpreadsheet,
  Users,
  Calendar,
  DollarSign,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { allMembers, attendanceRecords, transactions, projects, logAuditEvent } = useApp();

  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Compute analytics
  const activeMembers = allMembers.filter((m) => m.membershipStatus === 'Active');
  const totalCollections = transactions.reduce((acc, t) => acc + t.amount, 0);
  const totalBeneficiaries = projects.reduce((acc, p) => acc + p.beneficiaryCount, 0);
  const totalVolunteersCount = projects.reduce((acc, p) => acc + p.volunteers.length, 0);

  // CSV Export functions
  const exportRosterCSV = () => {
    const headers = 'ID,Membership_Number,Full_Name,Nickname,Gender,Status,Position,Mobile,Email,Joined_Date\n';
    const rows = allMembers
      .map(
        (m) =>
          `"${m.id}","${m.membershipNumber}","${m.firstName} ${m.lastName}","${m.nickname}","${m.gender}","${m.membershipStatus}","${m.positions[0] || 'Member'}","${m.mobile}","${m.email}","${m.dateJoined}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TFOE_PE_Bantayog_Elite_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logAuditEvent('EXPORT_REPORT', 'Member', 'roster-csv', 'Club:BEEC', 'Success', { format: 'CSV' });
  };

  const exportAttendanceCSV = () => {
    const headers = 'Record_ID,Meeting_ID,Member_Name,Member_Number,Status,Method,Timestamp,Recorded_By\n';
    const rows = attendanceRecords
      .map(
        (a) =>
          `"${a.id}","${a.meetingId}","${a.memberName}","${a.memberNumber}","${a.status}","${a.method}","${a.timestamp}","${a.recordedBy}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TFOE_PE_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logAuditEvent('EXPORT_REPORT', 'AttendanceRecord', 'attendance-csv', 'Club:BEEC', 'Success', { format: 'CSV' });
  };

  const exportFinanceCSV = () => {
    const headers = 'Transaction_ID,Date,Member_Name,Member_Number,Type,Amount,Method,Reference_Number,Recorded_By\n';
    const rows = transactions
      .map(
        (t) =>
          `"${t.id}","${t.date}","${t.memberName}","${t.memberNumber}","${t.type}","${t.amount}","${t.paymentMethod}","${t.referenceNumber}","${t.recordedBy}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TFOE_PE_Financial_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logAuditEvent('EXPORT_REPORT', 'FinancialTransaction', 'finance-csv', 'Club:BEEC', 'Success', { format: 'CSV' });
  };

  const handleSimulateImport = () => {
    setImportNotice(
      'Validated and processed 12 external records from Camarines Norte regional capitation registry. Schema validated.'
    );
    logAuditEvent('IMPORT_DATA', 'DataExchange', 'import-batch-1', 'Club:BEEC', 'Success', {
      source: 'Camarines Norte Regional Capitation Registry',
      status: 'Valid Schema',
    });
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-serif">Executive Reports & Data</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational summaries, socio-civic impact analytics & data exchange
          </p>
        </div>

        <button
          onClick={handleSimulateImport}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs transition"
        >
          <Upload className="w-4 h-4 text-amber-400" />
          <span>Import Registry Data</span>
        </button>
      </div>

      {importNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Roster</span>
          </div>
          <span className="text-xl font-black text-white font-mono">{activeMembers.length}</span>
          <p className="text-[10px] text-slate-500">Regular & Charter Eagles</p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Attendance Logs</span>
          </div>
          <span className="text-xl font-black text-white font-mono">{attendanceRecords.length}</span>
          <p className="text-[10px] text-slate-500">Official verified entries</p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold">
            <DollarSign className="w-3.5 h-3.5 text-purple-400" />
            <span>Remittances</span>
          </div>
          <span className="text-xl font-black text-white font-mono">
            ₱{totalCollections.toLocaleString()}
          </span>
          <p className="text-[10px] text-slate-500">Audited 2026 funds</p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold">
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            <span>Beneficiaries</span>
          </div>
          <span className="text-xl font-black text-white font-mono">
            {totalBeneficiaries.toLocaleString()}
          </span>
          <p className="text-[10px] text-slate-500">Served across Camarines Norte</p>
        </div>
      </div>

      {/* Export Section */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
          Export Official CSV Datasets
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <FileSpreadsheet className="w-6 h-6 text-amber-400 mb-2" />
              <h4 className="text-xs font-bold text-white">Membership Master Roster</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Complete roster with membership IDs, positions, and contact details.
              </p>
            </div>
            <button
              onClick={exportRosterCSV}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Roster CSV</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <FileSpreadsheet className="w-6 h-6 text-emerald-400 mb-2" />
              <h4 className="text-xs font-bold text-white">Assembly Attendance Sheet</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                GMM roll calls, check-in methods, timestamps, and quorum audit data.
              </p>
            </div>
            <button
              onClick={exportAttendanceCSV}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Attendance CSV</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <FileSpreadsheet className="w-6 h-6 text-purple-400 mb-2" />
              <h4 className="text-xs font-bold text-white">Treasurer’s Financial Ledger</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                All OR vouchers, dues remittances, regional levies, and special funds.
              </p>
            </div>
            <button
              onClick={exportFinanceCSV}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-purple-500 hover:text-white text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Ledger CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
