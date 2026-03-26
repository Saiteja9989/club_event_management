import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  BarChart3,
  LogOut,
  UserCircle,
  MessageSquare,
} from "lucide-react";

function getClubIdFromToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.clubId || null;
  } catch {
    return null;
  }
}

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'te', label: 'తె' },
  { code: 'hi', label: 'हि' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const clubId = user?.clubId || getClubIdFromToken();

  const isActive = (path) => location.pathname === path;

  let navItems = [];

  if (user?.role === "admin") {
    navItems = [
      { label: t('nav.dashboard'), href: "/admin/dashboard", icon: LayoutDashboard },
      { label: t('nav.manage_clubs'), href: "/admin/clubs", icon: Users },
      { label: t('nav.manage_users'), href: "/admin/users", icon: Users },
      { label: t('nav.review_events'), href: "/admin/events", icon: Calendar },
      { label: t('nav.reports'), href: "/admin/reports", icon: BarChart3 },
    ];
  } else if (user?.role === "leader") {
    navItems = [
      { label: t('nav.dashboard'), href: "/leader/dashboard", icon: LayoutDashboard },
      { label: t('nav.memberships'), href: "/leader/memberships", icon: Users },
      { label: t('nav.events'), href: "/leader/events", icon: Calendar },
      { label: t('nav.attendance'), href: "/leader/attendance", icon: CheckSquare },
      ...(clubId ? [{ label: t('nav.club_chat'), href: `/club/${clubId}/chat`, icon: MessageSquare }] : []),
    ];
  } else if (user?.role === "student") {
    navItems = [
      { label: t('nav.dashboard'), href: "/student/dashboard", icon: LayoutDashboard },
      { label: t('nav.browse_clubs'), href: "/student/clubs", icon: Users },
      { label: t('nav.browse_events'), href: "/student/events", icon: Calendar },
      { label: t('nav.my_events'), href: "/student/my-events", icon: Calendar },
      { label: t('nav.my_profile'), href: "/student/profile", icon: UserCircle },
    ];
  }

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white/70 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
          <span className="text-sm font-bold">CH</span>
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">ClubHub</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
            {user?.role} {t('common.panel')}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-900/30 dark:text-indigo-400"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Language Switcher */}
      <div className="px-4 pb-3">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Language
        </p>
        <div className="flex gap-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                i18n.language === lang.code
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* User / Logout */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {t('common.logged_in_as')}
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {user?.email}
          </p>

          <button
            onClick={logout}
            className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
          >
            <LogOut className="h-4 w-4" />
            {t('common.sign_out')}
          </button>
        </div>
      </div>
    </aside>
  );
}
