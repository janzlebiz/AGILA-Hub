import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  X,
  User,
  Sparkles,
  Download,
  RotateCcw,
  Scale,
  BookOpen,
} from 'lucide-react';
import { DuesType, FinancialTransaction } from '../types';

export const FinanceScreen: React.FC = () => {
  const { transactions, recordPayment, reverseTransaction, currentUser, allMembers, sessionToken } = useApp();

  const [activeTab, setActiveTab] = useState<'myDues' | 'clubLedger' | 'trialBalance' | 'overdue'>('myDues');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reversal state
  const [reversalTarget, setReversalTarget] = useState<FinancialTransaction | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversalLoading, setReversalLoading] = useState(false);
  const [reversalError, setReversalError] = useState<string | null>(null);

  // Double-entry trial balance state
  const [trialBalanceData, setTrialBalanceData] = useState<{
    accounts: Array<{ code: string; name: string; type: string; debit: number; credit: number }>;
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
  } | null>(null);

  const [journalEntries, setJournalEntries] = useState<any[]>([]);

  // Payment form state
  const [selectedMemberId, setSelectedMemberId] = useState(currentUser.id);
  const [paymentType, setPaymentType] = useState<DuesType>('Annual Membership Dues');
  const [paymentAmount, setPaymentAmount] = useState<number>(6000);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GCash' | 'Bank Transfer' | 'Check'>('GCash');
  const [referenceNumber, setReferenceNumber] = useState(`OR-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  const isTreasurerOrPresident =
    currentUser.roles.includes('Treasurer') ||
    currentUser.roles.includes('President') ||
    currentUser.roles.includes('Club_Admin') ||
    currentUser.roles.includes('Auditor');

  // Load Trial Balance & Journal Entries for Officers
  useEffect(() => {
    if (isTreasurerOrPresident && sessionToken) {
      fetch('/api/finance/trial-balance', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
        .then((r) => r.json())
        .then((data) => setTrialBalanceData(data))
        .catch(() => {});

      fetch('/api/finance/journal-entries', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
        .then((r) => r.json())
        .then((data) => setJournalEntries(data))
        .catch(() => {});
    }
  }, [isTreasurerOrPresident, sessionToken, transactions]);

  // Personal transactions
  const myTransactions = transactions.filter((t) => t.memberId === currentUser.id && t.status === 'Verified');
  const myPaidSum = myTransactions.reduce((acc, t) => acc + t.amount, 0);
  const annualTarget = 8000;
  const myBalance = Math.max(0, annualTarget - myPaidSum);

  // All club transactions
  const filteredTransactions = transactions.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.memberName.toLowerCase().includes(q) ||
        t.referenceNumber.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalClubCollections = transactions
    .filter((t) => t.status === 'Verified')
    .reduce((acc, t) => acc + t.amount, 0);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = allMembers.find((m) => m.id === selectedMemberId);
    if (!targetMember) return;

    await recordPayment({
      clubId: 'club-beec',
      memberId: targetMember.id,
      memberName: `${targetMember.gender === 'Female' ? 'Ate' : 'Kuya'} ${targetMember.firstName} ${targetMember.lastName}`,
      memberNumber: targetMember.membershipNumber,
      type: paymentType,
      amount: Number(paymentAmount),
      referenceNumber: referenceNumber.trim(),
      paymentMethod,
      date: paymentDate,
      recordedBy: `${currentUser.gender === 'Female' ? 'Ate' : 'Kuya'} ${currentUser.nickname} (${currentUser.positions[0] || 'Treasurer'})`,
      notes: paymentNotes.trim(),
    });

    setIsRecordModalOpen(false);
    setPaymentNotes('');
    setReferenceNumber(`OR-2026-${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleExecuteReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalTarget || !reversalReason.trim()) return;

    setReversalLoading(true);
    setReversalError(null);

    const result = await reverseTransaction(reversalTarget.id, reversalReason.trim());
    if (result.success) {
      setReversalTarget(null);
      setReversalReason('');
    } else {
      setReversalError(result.error || 'Failed to execute reversal.');
    }
    setReversalLoading(false);
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-serif">Dues & Double-Entry Financial Ledger</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable double-entry general ledger, dues collections, and trial balance accounting
          </p>
        </div>

        {/* Treasurer record action */}
        {isTreasurerOrPresident && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-4 text-xs font-bold text-slate-400 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('myDues')}
          className={`pb-2 whitespace-nowrap transition ${
            activeTab === 'myDues'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'hover:text-slate-200'
          }`}
        >
          My Dues Standing
        </button>

        {isTreasurerOrPresident && (
          <>
            <button
              onClick={() => setActiveTab('clubLedger')}
              className={`pb-2 whitespace-nowrap transition ${
                activeTab === 'clubLedger'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'hover:text-slate-200'
              }`}
            >
              Receipts & Ledger ({transactions.length})
            </button>

            <button
              onClick={() => setActiveTab('trialBalance')}
              className={`pb-2 whitespace-nowrap flex items-center gap-1.5 transition ${
                activeTab === 'trialBalance'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'hover:text-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Double-Entry & Trial Balance</span>
            </button>

            <button
              onClick={() => setActiveTab('overdue')}
              className={`pb-2 whitespace-nowrap transition ${
                activeTab === 'overdue'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'hover:text-slate-200'
              }`}
            >
              Arrears & Follow-ups
            </button>
          </>
        )}
      </div>

      {/* TAB 1: My Dues Standing */}
      {activeTab === 'myDues' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Total Remitted (2026)
              </span>
              <span className="text-xl font-black text-white font-mono">
                ₱{myPaidSum.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Outstanding Balance
              </span>
              <span
                className={`text-xl font-black font-mono ${
                  myBalance === 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                ₱{myBalance.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Fraternal Status
              </span>
              <span
                className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                  myBalance === 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {myBalance === 0 ? 'Member in Good Standing' : 'Partial Dues Remitted'}
              </span>
            </div>
          </div>

          {/* Dues Breakdown Guide */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Constitutional Dues Obligations (Article VI)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block">Annual Club Dues</span>
                <span className="text-sm font-bold text-white font-mono">₱6,000 / year</span>
                <p className="text-[10px] text-slate-500">Local club operations and meetings</p>
              </div>

              <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block">Regional Levies (BCNBR-1)</span>
                <span className="text-sm font-bold text-white font-mono">₱2,000 / year</span>
                <p className="text-[10px] text-slate-500">Regional assembly and disaster fund</p>
              </div>

              <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block">National Capitation</span>
                <span className="text-sm font-bold text-white font-mono">Included in dues</span>
                <p className="text-[10px] text-slate-500">Mutual-aid and national registry</p>
              </div>
            </div>
          </div>

          {/* Personal Transaction History */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              My Official Receipts & Ledger
            </h3>

            <div className="space-y-2">
              {myTransactions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No payment records found for your account.
                </div>
              ) : (
                myTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{tx.type}</span>
                        <span className="text-[10px] bg-slate-800 text-amber-300 font-mono px-1.5 py-0.2 rounded">
                          {tx.referenceNumber}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {tx.date} • Paid via {tx.paymentMethod} • Recorded by {tx.recordedBy}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        ₱{tx.amount.toLocaleString()}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-semibold uppercase">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Club Receipts Ledger (with Non-Destructive Reversals) */}
      {activeTab === 'clubLedger' && isTreasurerOrPresident && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-3xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Verified Collections</span>
              <h3 className="text-xl font-black text-amber-400 font-mono">
                ₱{totalClubCollections.toLocaleString()}
              </h3>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">OR Number</th>
                  <th className="pb-2">Member</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Method</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-center">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-850/50">
                    <td className="py-2.5 text-slate-400 whitespace-nowrap">{tx.date}</td>
                    <td className="py-2.5 font-mono text-amber-300 font-semibold">
                      {tx.referenceNumber}
                    </td>
                    <td className="py-2.5 font-medium text-white">{tx.memberName}</td>
                    <td className="py-2.5 text-slate-300">{tx.type}</td>
                    <td className="py-2.5 text-slate-400">{tx.paymentMethod}</td>
                    <td className={`py-2.5 font-mono font-bold text-right ${tx.amount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ₱{tx.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          tx.status === 'Verified'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      {tx.status === 'Verified' && tx.amount > 0 && (
                        <button
                          onClick={() => setReversalTarget(tx)}
                          className="inline-flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 hover:underline px-2 py-0.5 rounded border border-rose-500/30"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reverse</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Double-Entry General Ledger & Trial Balance */}
      {activeTab === 'trialBalance' && isTreasurerOrPresident && (
        <div className="space-y-5">
          {/* Trial Balance Overview */}
          {trialBalanceData && (
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                    <Scale className="w-5 h-5 text-amber-400" />
                    <span>General Ledger Trial Balance</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time verification of accounting equality: Total Debits must equal Total Credits
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                      trialBalanceData.isBalanced
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{trialBalanceData.isBalanced ? 'Balanced Ledger (100%)' : 'Out of Balance'}</span>
                  </span>
                </div>
              </div>

              {/* Chart of Accounts Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 font-mono">
                      <th className="pb-2">Account Code</th>
                      <th className="pb-2">Account Title</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2 text-right">Debit Balance</th>
                      <th className="pb-2 text-right">Credit Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {trialBalanceData.accounts.map((acc) => (
                      <tr key={acc.code} className="hover:bg-slate-850/50">
                        <td className="py-2.5 text-amber-400 font-bold">{acc.code}</td>
                        <td className="py-2.5 text-slate-200 font-sans font-medium">{acc.name}</td>
                        <td className="py-2.5 text-slate-400 font-sans">{acc.type}</td>
                        <td className="py-2.5 text-right text-emerald-400">
                          {acc.debit > 0 ? `₱${acc.debit.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-2.5 text-right text-cyan-400">
                          {acc.credit > 0 ? `₱${acc.credit.toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-700 font-bold text-white bg-slate-850/60 text-xs">
                      <td colSpan={3} className="py-3 text-right uppercase tracking-wider font-sans">
                        Trial Balance Totals:
                      </td>
                      <td className="py-3 text-right text-emerald-400">
                        ₱{trialBalanceData.totalDebits.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-cyan-400">
                        ₱{trialBalanceData.totalCredits.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Journal Entries Register */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Immutable Journal Entries Register ({journalEntries.length})</span>
            </h3>

            <div className="space-y-3">
              {journalEntries.map((je: any) => (
                <div
                  key={je.id}
                  className="p-4 rounded-2xl bg-slate-850 border border-slate-800 text-xs space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-amber-500/20">
                        {je.entryNumber}
                      </span>
                      <span className="font-medium text-white">{je.description}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>{je.entryDate}</span>
                      <span>•</span>
                      <span className="text-slate-300">{je.createdBy}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800/40">
                          <th className="pb-1 font-normal">Account</th>
                          <th className="pb-1 font-normal">Memo</th>
                          <th className="pb-1 font-normal text-right">Debit</th>
                          <th className="pb-1 font-normal text-right">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {je.lines.map((l: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-1 text-slate-300">
                              <span className="text-amber-400 font-bold mr-1.5">{l.accountCode}</span>
                              <span>{l.accountName}</span>
                            </td>
                            <td className="py-1 text-slate-400 font-sans text-[10px]">{l.memo || '—'}</td>
                            <td className="py-1 text-right text-emerald-400">
                              {l.debit > 0 ? `₱${l.debit.toLocaleString()}` : '—'}
                            </td>
                            <td className="py-1 text-right text-cyan-400">
                              {l.credit > 0 ? `₱${l.credit.toLocaleString()}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Arrears & Follow-ups */}
      {activeTab === 'overdue' && isTreasurerOrPresident && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Members with Outstanding Annual Balances
          </h3>

          <div className="space-y-2">
            {allMembers
              .filter((m) => m.membershipStatus === 'Active')
              .map((member) => {
                const paid = transactions
                  .filter((t) => t.memberId === member.id && t.status === 'Verified')
                  .reduce((sum, t) => sum + t.amount, 0);
                const balance = Math.max(0, 8000 - paid);

                if (balance === 0) return null;

                return (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-white">
                        {member.gender === 'Female' ? 'Ate' : 'Kuya'} {member.firstName}{' '}
                        {member.lastName}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {member.membershipNumber} • Remitted: ₱{paid.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-amber-400 font-mono">
                        ₱{balance.toLocaleString()}
                      </span>
                      <span className="block text-[10px] text-slate-400">Balance</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Modal: Record Payment */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-serif">Record Official Payment</h3>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Member
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.gender === 'Female' ? 'Ate' : 'Kuya'} {m.firstName} {m.lastName} ({m.membershipNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Dues Category
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as DuesType)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Annual Membership Dues">Annual Club Dues</option>
                    <option value="Regional Dues">Regional Dues</option>
                    <option value="National Dues">National Dues</option>
                    <option value="Special Assessment">Special Assessment</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Amount (₱)
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    OR / Ref Number
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Official bank deposit slip ref 4091"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Non-Destructive Financial Reversal */}
      {reversalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white font-serif">Reverse Financial Transaction</h3>
              </div>
              <button
                onClick={() => setReversalTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-xs text-rose-200/90 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Statutory Accounting Compliance:</span>
              </div>
              <p className="text-[11px] text-rose-300">
                In accordance with TFOE-PE financial audit rules, transactions are never deleted. A reversal posts an offsetting reversing journal entry (swapping Debits and Credits) with permanent audit trail tracking.
              </p>
            </div>

            <div className="p-3 bg-slate-850 rounded-2xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Reference:</span>
                <span className="font-mono text-amber-300 font-bold">{reversalTarget.referenceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member:</span>
                <span className="text-white font-medium">{reversalTarget.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-mono text-emerald-400 font-bold">₱{reversalTarget.amount.toLocaleString()}</span>
              </div>
            </div>

            {reversalError && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs">
                {reversalError}
              </div>
            )}

            <form onSubmit={handleExecuteReversal} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Reason for Reversal (Mandatory for Audit Trail)
                </label>
                <textarea
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="e.g. Inadvertent duplicate entry, correction of payment reference..."
                  rows={3}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReversalTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reversalLoading || !reversalReason.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold disabled:opacity-50"
                >
                  {reversalLoading ? 'Posting Reversal...' : 'Confirm Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
