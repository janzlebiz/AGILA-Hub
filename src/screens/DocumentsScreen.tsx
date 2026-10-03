import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Plus,
  Search,
  Download,
  Filter,
  Shield,
  Clock,
  Sparkles,
  X,
  FileCode,
} from 'lucide-react';
import { DocumentCategory, DocumentItem } from '../types';

export const DocumentsScreen: React.FC = () => {
  const { documents, addDocument, currentUser } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload modal form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Club Resolutions');
  const [classification, setClassification] = useState<'Public' | 'Members Only' | 'Officers Only'>('Members Only');
  const [fileType, setFileType] = useState<'PDF' | 'DOCX' | 'XLSX'>('PDF');
  const [description, setDescription] = useState('');

  const isOfficer =
    currentUser.roles.includes('President') ||
    currentUser.roles.includes('Secretary') ||
    currentUser.roles.includes('Treasurer') ||
    currentUser.roles.includes('Club_Admin');

  const filteredDocs = documents.filter((doc) => {
    if (categoryFilter !== 'all' && doc.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return doc.title.toLowerCase().includes(q) || doc.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addDocument({
      title: title.trim(),
      category,
      classification,
      scope: 'Club',
      fileType,
      fileSize: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      version: 'v1.0',
      uploadedBy: `${currentUser.gender === 'Female' ? 'Ate' : 'Kuya'} ${currentUser.nickname}`,
      description: description.trim() || 'Official document archive of Bantayog Elite Eagles Club.',
    });

    setIsUploadModalOpen(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-serif">Document Library</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Classified resolutions, minutes, financial audits & templates
          </p>
        </div>

        {isOfficer && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search documents by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Categories</option>
          <option value="Constitution & Bylaws">Constitution & Bylaws</option>
          <option value="Club Resolutions">Club Resolutions</option>
          <option value="Meeting Minutes">Meeting Minutes</option>
          <option value="Financial Reports">Financial Reports</option>
          <option value="Community Service Reports">Community Service Reports</option>
          <option value="Memoranda">Memoranda</option>
        </select>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap text-[10px]">
                <span className="font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300">
                  {doc.category}
                </span>

                <span
                  className={`font-semibold px-2 py-0.5 rounded-full ${
                    doc.classification === 'Public'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : doc.classification === 'Members Only'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-purple-500/20 text-purple-300'
                  }`}
                >
                  {doc.classification}
                </span>

                <span className="text-slate-400 font-mono">{doc.fileType} • {doc.fileSize}</span>
                <span className="text-slate-400">Ver: {doc.version}</span>
              </div>

              <h4 className="text-sm font-bold text-white font-serif">{doc.title}</h4>
              <p className="text-xs text-slate-300 line-clamp-2">{doc.description}</p>
              <p className="text-[10px] text-slate-500">
                Uploaded by {doc.uploadedBy} on {doc.uploadedAt}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => alert(`Downloading "${doc.title}" (${doc.fileType})`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-bold text-xs transition border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Upload Document */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white font-serif">Upload Official Document</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Club Resolution Approving Q2 Budget"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Club Resolutions">Club Resolutions</option>
                    <option value="Meeting Minutes">Meeting Minutes</option>
                    <option value="Financial Reports">Financial Reports</option>
                    <option value="Community Service Reports">Community Service Reports</option>
                    <option value="Memoranda">Memoranda</option>
                    <option value="Forms & Templates">Forms & Templates</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Classification</label>
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value as any)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Members Only">Members Only</option>
                    <option value="Officers Only">Officers Only</option>
                    <option value="Public">Public</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">File Format</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as any)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="PDF">PDF (Portable Document)</option>
                  <option value="DOCX">DOCX (Word Document)</option>
                  <option value="XLSX">XLSX (Excel Sheet)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description / Summary</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context, references, or signatories..."
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow"
              >
                Store in Scoped Library
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
