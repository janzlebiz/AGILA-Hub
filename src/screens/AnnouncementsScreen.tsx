import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Plus,
  Sparkles,
  Calendar,
  User,
  Shield,
  X,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { Announcement } from '../types';

export const AnnouncementsScreen: React.FC = () => {
  const { announcements, createAnnouncement, currentUser } = useApp();

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<any>('Official Notice');
  const [newScope, setNewScope] = useState<any>('Club');

  const canPost =
    currentUser.roles.includes('President') ||
    currentUser.roles.includes('Secretary') ||
    currentUser.roles.includes('PIO') ||
    currentUser.roles.includes('Club_Admin');

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    createAnnouncement({
      scope: newScope,
      clubId: 'club-beec',
      title: newTitle.trim(),
      content: newContent.trim(),
      priority: newPriority,
      status: 'Published',
      publishAt: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }) + ' PST',
      createdBy: currentUser.id,
      authorName: `${currentUser.gender === 'Female' ? 'Ate' : 'Kuya'} ${currentUser.nickname} ${currentUser.lastName}`,
      authorPosition: currentUser.positions[0] || 'Club Officer',
    });

    setIsPostModalOpen(false);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white font-serif">Official Club Bulletins</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Executive notices, regional memos, and community service updates
          </p>
        </div>

        {canPost && (
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Announcements Feed */}
      <div className="space-y-3.5">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl transition space-y-3"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    ann.priority === 'Urgent'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      : ann.priority === 'Official Notice'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  {ann.priority}
                </span>

                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  Scope: {ann.scope}
                </span>
              </div>

              <span className="text-[11px] text-slate-500 font-mono">{ann.publishAt}</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white font-serif">{ann.title}</h3>
              <p className="text-xs text-slate-200 mt-1.5 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-amber-400 font-medium">
                Issued by: <strong>{ann.authorName}</strong> ({ann.authorPosition})
              </span>
              <span className="text-slate-500 text-[10px]">Bantayog Elite Eagles Club</span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Post Announcement */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white font-serif">Publish Official Notice</h3>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urgent Reminder: Daet Medical Mission Volunteers Assembly"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Official Notice">Official Notice</option>
                    <option value="Urgent">Urgent</option>
                    <option value="General Announcement">General Announcement</option>
                    <option value="Event Update">Event Update</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Audience Scope</label>
                  <select
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Club">Club Members</option>
                    <option value="Region">Regional Assembly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Content / Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Draft fraternal announcement body..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow"
              >
                Broadcast to Club Feed
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
