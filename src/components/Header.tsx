import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Wifi,
  WifiOff,
  UserCheck,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Check,
  ExternalLink,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    club,
    region,
    isOnline,
    setIsOnline,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setIsRoleSwitcherOpen,
    setIsDigitalIdModalOpen,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const greetingPrefix = currentUser.gender === 'Female' ? 'Ate' : 'Kuya';

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white">
      {/* Top Fraternal Branding Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 py-1 px-4 text-slate-950 text-[10px] font-extrabold tracking-wider flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-xs">🦅</span>
          <span className="truncate uppercase font-serif">
            {club.name} • {region.code} • TFOE-PE, INC.
          </span>
        </div>

        {/* Offline / Online Simulation Toggle */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          title="Click to toggle offline simulation"
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase transition ${
            isOnline
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
              : 'bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-2.5 h-2.5" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-2.5 h-2.5" />
              <span>Offline Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Main App Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setIsDigitalIdModalOpen(true)}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-105 transition shrink-0"
            title="View Digital Membership ID"
          >
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-serif font-black text-amber-400 text-lg">
              🦅
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight font-serif bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200 bg-clip-text text-transparent">
                AGILA Hub
              </h1>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-1.5 py-0.2 rounded font-mono">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              {club.name}
            </p>
          </div>
        </div>

        {/* Action Controls: Role Switcher & Notifications & Avatar */}
        <div className="flex items-center gap-2">
          {/* Quick Persona / RBAC Role Switcher */}
          <button
            onClick={() => setIsRoleSwitcherOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-amber-500/50 hover:bg-slate-850 text-xs text-slate-200 transition group shadow-sm"
            title="Switch User Role / Impersonate"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
            <span className="hidden sm:inline font-medium text-slate-300 text-[11px]">Role:</span>
            <span className="font-semibold text-amber-300 text-[11px] truncate max-w-[100px]">
              {currentUser.positions[0]?.split(' ')[0] || 'Member'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Fraternal Notifications
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-0.5"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-3 text-xs cursor-pointer transition ${
                          n.read
                            ? 'bg-slate-900/40 text-slate-400'
                            : 'bg-slate-850 text-slate-200 font-medium hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-amber-400 mb-1">
                          <span className="font-semibold">{n.type}</span>
                          <span className="text-slate-500">{n.createdAt}</span>
                        </div>
                        <p className="font-semibold text-white mb-0.5">{n.title}</p>
                        <p className="text-[11px] text-slate-300 line-clamp-2">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div
            onClick={() => setIsDigitalIdModalOpen(true)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer"
            title="Click to view Digital ID Card"
          >
            <img
              src={currentUser.profilePhoto}
              alt={currentUser.nickname}
              className="w-7 h-7 rounded-lg object-cover border border-amber-400/50"
            />
            <div className="text-left hidden xs:block">
              <p className="text-[11px] font-bold text-slate-200 leading-tight flex items-center gap-1">
                <span>{greetingPrefix} {currentUser.nickname}</span>
                <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
              </p>
              <p className="text-[9px] text-slate-400 truncate max-w-[90px]">
                {currentUser.membershipNumber}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
