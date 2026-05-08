import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const clubId = user?.clubId || getClubIdFromToken();

  const isActive = (path) => location.pathname === path;

  let navItems = [];

  if (user?.role === "admin") {
    navItems = [
      { label: 'Dashboard', href: "/admin/dashboard", icon: LayoutDashboard },
      { label: 'Manage Clubs', href: "/admin/clubs", icon: Users },
      { label: 'Manage Users', href: "/admin/users", icon: Users },
      { label: 'Review Events', href: "/admin/events", icon: Calendar },
      { label: 'Reports', href: "/admin/reports", icon: BarChart3 },
    ];
  } else if (user?.role === "leader") {
    navItems = [
      { label: 'Dashboard', href: "/leader/dashboard", icon: LayoutDashboard },
      { label: 'Memberships', href: "/leader/memberships", icon: Users },
      { label: 'Events', href: "/leader/events", icon: Calendar },
      { label: 'Attendance', href: "/leader/attendance", icon: CheckSquare },
      ...(clubId ? [{ label: 'Club Chat', href: `/club/${clubId}/chat`, icon: MessageSquare }] : []),
    ];
  } else if (user?.role === "student") {
    navItems = [
      { label: 'Dashboard', href: "/student/dashboard", icon: LayoutDashboard },
      { label: 'Browse Clubs', href: "/student/clubs", icon: Users },
      { label: 'Browse Events', href: "/student/events", icon: Calendar },
      { label: 'My Events', href: "/student/my-events", icon: Calendar },
      { label: 'My Profile', href: "/student/profile", icon: UserCircle },
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
            {user?.role} panel
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

      {/* User / Logout */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Logged in as
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {user?.email}
          </p>

          <button
            onClick={logout}
            className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
