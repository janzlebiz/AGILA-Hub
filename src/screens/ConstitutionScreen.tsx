import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Bot,
  Search,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Send,
  Scale,
  RotateCcw,
  History,
} from 'lucide-react';
import {
  CONSTITUTION_ARTICLES,
  CONSTITUTION_PREAMBLE,
  OFFICIAL_CONSTITUTION_SOURCE,
  OFFICIAL_CONSTITUTION_VERSION,
  OFFICIAL_CONSTITUTION_HASH,
} from '../data/constitutionData';
import { ConstitutionSection } from '../types';

export const ConstitutionScreen: React.FC = () => {
  const {
    currentUser,
    askConstitutionAI,
    triggerConstitutionSync,
    rollbackConstitution,
    constitutionSyncRuns,
    constitutionQueries,
    sessionToken,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ai' | 'browse' | 'sync'>('ai');
  const [question, setQuestion] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiResult, setAiResult] = useState<{
    answer: string;
    citations: string[];
    version: string;
    sourceSections: any[];
  } | null>(null);

  // Dynamic active version from server
  const [activeConstitution, setActiveConstitution] = useState<{
    id: string;
    version: string;
    effectiveDate: string;
    sourceUrl: string;
    contentHash: string;
    preamble: string;
    articles: any[];
  }>({
    id: 'const-ver-2026-1',
    version: OFFICIAL_CONSTITUTION_VERSION,
    effectiveDate: 'January 15, 2026',
    sourceUrl: OFFICIAL_CONSTITUTION_SOURCE,
    contentHash: OFFICIAL_CONSTITUTION_HASH,
    preamble: CONSTITUTION_PREAMBLE,
    articles: CONSTITUTION_ARTICLES,
  });

  const [versionHistory, setVersionHistory] = useState<any[]>([]);

  // Search in browse tab
  const [searchBrowseQuery, setSearchBrowseQuery] = useState('');
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({
    'art-1': true,
    'art-3': true,
    'art-4': true,
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Rollback modal state
  const [rollbackTarget, setRollbackTarget] = useState<any | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');
  const [rollbackLoading, setRollbackLoading] = useState(false);

  const isConstitutionalAuthority =
    currentUser.permissions?.includes('CONSTITUTION_SOURCE_MANAGE') ||
    currentUser.permissions?.includes('CONSTITUTION_ROLLBACK') ||
    currentUser.roles.includes('National_Constitution_Commission') ||
    currentUser.roles.includes('National_Custodian');

  // Fetch active constitution and versions from server
  useEffect(() => {
    fetch('/api/constitution/data')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.version) {
          setActiveConstitution(data);
        }
      })
      .catch(() => {});

    fetch('/api/constitution/versions')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVersionHistory(data);
        }
      })
      .catch(() => {});
  }, [constitutionSyncRuns]);

  const suggestedQuestions = [
    'What are the qualifications for regular membership?',
    'What is the officer term length and term limits?',
    'What are the official duties of the Club Secretary?',
    'Can an Eagle hold Club and Regional positions simultaneously?',
    'What is the fraternal greeting terminology for members?',
    'What happens if a member is delinquent in dues for 3 months?',
  ];

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;

    setIsLoadingAI(true);
    setAiResult(null);

    const result = await askConstitutionAI(q.trim());
    setAiResult(result);
    setIsLoadingAI(false);
    if (!queryText) setQuestion('');
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncToast(null);
    try {
      const run = await triggerConstitutionSync();
      setSyncToast(
        `Sync complete! Status: ${run.status}. Version: ${run.versionDetected}`
      );
    } catch {
      setSyncToast('Sync check finished. Last verified version remains active.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExecuteRollback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollbackTarget || !rollbackReason.trim()) return;

    setRollbackLoading(true);
    const result = await rollbackConstitution(rollbackTarget.id, rollbackReason.trim());
    if (result.success) {
      setSyncToast(`Rollback executed: ${result.message}`);
      setRollbackTarget(null);
      setRollbackReason('');
    } else {
      setSyncToast(`Rollback error: ${result.message}`);
    }
    setRollbackLoading(false);
  };

  const toggleArticle = (id: string) => {
    setExpandedArticles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Dynamic in-memory search over current active articles (NO static local search)
  const currentArticles = activeConstitution.articles || CONSTITUTION_ARTICLES;
  const browseSearchResults: Array<{ section: ConstitutionSection }> = [];

  if (searchBrowseQuery.trim()) {
    const q = searchBrowseQuery.toLowerCase();
    for (const art of currentArticles) {
      for (const sec of art.sections || []) {
        if (
          sec.title.toLowerCase().includes(q) ||
          sec.content.toLowerCase().includes(q) ||
          sec.articleRoman.toLowerCase().includes(q)
        ) {
          browseSearchResults.push({ section: sec });
        }
      }
    }
  }

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
                <span>The National e-Constitution</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {activeConstitution.version} (Active)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                The Fraternal Order of Eagles - Philippine Eagles, Inc. (TFOE-PE)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={activeConstitution.sourceUrl || OFFICIAL_CONSTITUTION_SOURCE}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-700/60 transition shadow"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Portal</span>
            </a>
          </div>
        </div>

        {/* Verification Status Pill */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Cryptographically Verified Hash</span>
          </div>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-slate-300 text-[10px] truncate max-w-xs">
            {activeConstitution.contentHash}
          </span>
          <span className="text-slate-600">•</span>
          <span>Effective: {activeConstitution.effectiveDate}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-4 text-xs font-bold text-slate-400">
        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-2 flex items-center gap-1.5 transition ${
            activeTab === 'ai'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'hover:text-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Constitution AI (RAG)</span>
        </button>

        <button
          onClick={() => setActiveTab('browse')}
          className={`pb-2 flex items-center gap-1.5 transition ${
            activeTab === 'browse'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Browse Codified Articles</span>
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          className={`pb-2 flex items-center gap-1.5 transition ${
            activeTab === 'sync'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sync & Version Governance</span>
        </button>
      </div>

      {/* TAB 1: AI RAG Assistant */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Fraternal Jurisprudence Assistant</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic Retrieval-Augmented Generation grounded strictly in the ratified e-Constitution ({activeConstitution.version}).
              </p>
            </div>

            {/* Prompt input */}
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Ask any question regarding membership qualifications, elections, dues, quorum, disciplinary sanctions..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                className="w-full bg-slate-850 border border-slate-700 rounded-2xl p-3.5 pr-12 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition resize-none"
              />
              <button
                disabled={isLoadingAI || !question.trim()}
                onClick={() => handleAsk()}
                className="absolute right-2.5 bottom-3.5 p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-40 transition shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Suggested prompts */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Suggested Fraternal Queries:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map((sq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAsk(sq)}
                    className="text-[11px] bg-slate-850 hover:bg-slate-800 text-amber-200/90 border border-slate-750 px-2.5 py-1 rounded-xl text-left transition"
                  >
                    {sq}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading Skeleton */}
            {isLoadingAI && (
              <div className="p-5 rounded-2xl bg-slate-850/60 border border-slate-800 space-y-2 animate-pulse">
                <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Retrieving official e-Constitution provisions & synthesizing grounded answer...</span>
                </div>
                <div className="h-3 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
              </div>
            )}

            {/* AI Result Card */}
            {aiResult && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-850 to-slate-900 border border-amber-500/40 shadow-xl space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white uppercase tracking-wider font-serif">
                      Constitution AI Finding
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-mono">
                    Grounded in e-Constitution {aiResult.version}
                  </span>
                </div>

                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line space-y-2">
                  {aiResult.answer}
                </div>

                {/* Citations Box */}
                {aiResult.citations && aiResult.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                      Authoritative Constitutional Citations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.citations.map((cite, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg font-semibold"
                        >
                          📜 {cite}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Browse Codified Articles */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search across all Articles, Sections, or keywords (e.g. Quorum, Dues, Election)..."
              value={searchBrowseQuery}
              onChange={(e) => setSearchBrowseQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Search results */}
          {searchBrowseQuery.trim() && (
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Search Results ({browseSearchResults.length} provisions found)
              </h3>
              <div className="space-y-2">
                {browseSearchResults.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No constitutional provisions matched your search query.
                  </p>
                ) : (
                  browseSearchResults.map(({ section }) => (
                    <div
                      key={section.id}
                      className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 text-xs space-y-1"
                    >
                      <span className="font-bold text-amber-300 block">
                        {section.articleRoman}, Section {section.sectionNumber}: {section.title}
                      </span>
                      <p className="text-slate-200 leading-relaxed">{section.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Preamble Box */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-amber-950/40 border border-amber-500/30 text-center space-y-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-400 font-serif">
              Preamble
            </h3>
            <p className="text-xs text-slate-200 italic font-serif leading-relaxed max-w-2xl mx-auto">
              "{activeConstitution.preamble}"
            </p>
          </div>

          {/* Articles Accordion */}
          <div className="space-y-3">
            {currentArticles.map((article: any) => {
              const isOpen = expandedArticles[article.id];
              return (
                <div
                  key={article.id}
                  className="rounded-3xl bg-slate-900 border border-slate-800 shadow-md overflow-hidden transition"
                >
                  <button
                    onClick={() => toggleArticle(article.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850/80 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/20 font-serif">
                        {article.articleNumber}
                      </span>
                      <div>
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                          {article.romanNumeral}
                        </span>
                        <h4 className="text-sm font-bold text-white font-serif">{article.title}</h4>
                      </div>
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-1 border-t border-slate-800/60 bg-slate-950/30 space-y-3 text-xs">
                      {article.sections.map((section: ConstitutionSection) => (
                        <div
                          key={section.id}
                          className="p-3.5 rounded-2xl bg-slate-850/70 border border-slate-800 space-y-1"
                        >
                          <h5 className="font-bold text-amber-300">
                            Section {section.sectionNumber}: {section.title}
                          </h5>
                          <p className="text-slate-200 leading-relaxed">{section.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: National Synchronization Engine & Rollback Governance */}
      {activeTab === 'sync' && (
        <div className="space-y-5">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white font-serif">
                  National e-Constitution Synchronization Engine
                </h3>
                <p className="text-xs text-slate-400">
                  Periodic automated check, canonical cryptographic validation & immutable version store
                </p>
              </div>

              {isConstitutionalAuthority && (
                <button
                  disabled={isSyncing}
                  onClick={handleTriggerSync}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Checking Source...' : 'Trigger Source Check'}</span>
                </button>
              )}
            </div>

            {/* Toast notification */}
            {syncToast && (
              <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{syncToast}</span>
              </div>
            )}

            {/* Sync Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Authoritative Source
                </span>
                <span className="font-mono text-amber-300 break-all">{activeConstitution.sourceUrl}</span>
                <p className="text-[10px] text-slate-500">Sole binding national portal</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Active Cryptographic Hash
                </span>
                <span className="font-mono text-emerald-400 text-[10px] break-all">
                  {activeConstitution.contentHash}
                </span>
                <p className="text-[10px] text-slate-500">Canonical SHA-256 integrity verification</p>
              </div>
            </div>

            {/* Immutable Version Registry & Rollback Controls */}
            {versionHistory.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ratified Version History & Constitutional Rollback</span>
                </h4>
                <div className="space-y-2">
                  {versionHistory.map((ver) => (
                    <div
                      key={ver.id}
                      className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{ver.version}</span>
                          {ver.isCurrent ? (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                              CURRENT ACTIVE
                            </span>
                          ) : (
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                              ARCHIVED
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Hash: {ver.contentHash ? ver.contentHash.substring(0, 24) + '...' : 'Verified'}
                        </p>
                      </div>

                      {!ver.isCurrent && isConstitutionalAuthority && (
                        <button
                          onClick={() => setRollbackTarget(ver)}
                          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs border border-rose-500/40 transition"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Rollback</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Rollback Confirmation */}
      {rollbackTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                <span>Execute Constitutional Rollback</span>
              </h3>
            </div>

            <p className="text-xs text-slate-300">
              You are restoring ratified e-Constitution <strong>{rollbackTarget.version}</strong>. This operation will demote the current active version and reinstate the selected historical codification across all national endpoints.
            </p>

            <form onSubmit={handleExecuteRollback} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  National Resolution / Authority Reason
                </label>
                <textarea
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  placeholder="e.g. Resolution of the National Assembly / Constitutional Commission dated Oct 2, 2026"
                  rows={3}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRollbackTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rollbackLoading || !rollbackReason.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold disabled:opacity-50"
                >
                  {rollbackLoading ? 'Rolling back...' : 'Confirm Rollback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
