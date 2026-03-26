// src/pages/admin/AdminReports.jsx
import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import adminApi from '@/api/adminApi';
import { useToast } from "@/components/ui/useToast";
import jsPDF from 'jspdf';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ── Tiny dropdown component ──────────────────────────────────
function FilterDropdown({ icon, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 h-10 px-5 rounded-lg bg-white dark:bg-slate-800 border text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${open ? 'border-primary' : 'border-slate-200 dark:border-slate-700'}`}
      >
        <span className="material-symbols-outlined text-base">{icon}</span>
        {current.label}
        <span className="material-symbols-outlined text-base">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg min-w-[180px] py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${value === opt.value ? 'font-bold text-primary' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TIME_RANGE_OPTIONS = [
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'thisSemester', label: 'This Semester' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'allTime', label: 'All Time' },
];

export default function AdminReports() {
  const { toast } = useToast();

  const [stats, setStats] = useState({
    activeUsers: 0,
    serverLoad: 0,
    pendingApprovals: 0,
    uptime: 0,
    totalEvents: 0,
    avgAttendance: 0,
    totalRegistrations: 0,
    activeClubs: 0,
  });

  const [registrationsTrend, setRegistrationsTrend] = useState([]);
  const [lowActivityClubs, setLowActivityClubs] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [timeRangeFilter, setTimeRangeFilter] = useState('last30days');

  // Modals
  const [apiLogsOpen, setApiLogsOpen] = useState(false);
  const [nodeStatusOpen, setNodeStatusOpen] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchGlobalStats();
  }, [timeRangeFilter]);

  const fetchGlobalStats = async () => {
    try {
      setLoading(true);
      setError('');

      const params = { timeRange: timeRangeFilter };
      const res = await adminApi.getReports(params);

      setStats({
        activeUsers: res.data?.stats?.totalStudents || 0,
        serverLoad: res.data?.stats?.serverLoad || 14,
        pendingApprovals: res.data?.stats?.pendingEvents || 0,
        uptime: res.data?.stats?.uptime || 99.9,
        totalEvents: res.data?.stats?.totalEvents || 0,
        avgAttendance: res.data?.stats?.avgAttendance || 0,
        totalRegistrations: res.data?.stats?.totalRegistrations || 0,
        activeClubs: res.data?.stats?.activeClubs || 0,
      });

      setRegistrationsTrend(res.data?.registrationsTrend || []);
      setLowActivityClubs(res.data?.lowActivityClubs || []);
      setTopEvents(res.data?.topEvents || []);
      setRecentActivity(res.data?.recentActivity || []);
    } catch (err) {
      console.error('Reports fetch error:', err);
      setError('Failed to load dashboard data.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reports dashboard.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Force Sync ─────────────────────────────────────────────
  const handleForceSync = async () => {
    setSyncing(true);
    await fetchGlobalStats();
    setSyncing(false);
    toast({ title: 'Synced', description: 'Dashboard data refreshed.' });
  };

  // ── Export PDF ─────────────────────────────────────────────
  const handleExportPDF = () => {
    setExportingPDF(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      let y = 50;

      // Header
      doc.setFillColor(67, 56, 202);
      doc.rect(0, 0, W, 80, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('ClubHub — Reports Dashboard', 40, 34);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const rangeLbl = TIME_RANGE_OPTIONS.find((o) => o.value === timeRangeFilter)?.label || timeRangeFilter;
      doc.text(`Period: ${rangeLbl}   |   Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 40, 58);
      y = 110;

      // ── Stats summary ──
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Metrics', 40, y);
      y += 18;
      doc.setDrawColor(220, 220, 220);
      doc.line(40, y, W - 40, y);
      y += 16;

      const statRows = [
        ['Active Users (Non-Admin)', String(stats.activeUsers)],
        ['Active Clubs', String(stats.activeClubs)],
        ['Total Events', String(stats.totalEvents)],
        ['Pending Approvals', String(stats.pendingApprovals)],
        ['Total Registrations', String(stats.totalRegistrations)],
        ['Avg Attendance Rate', `${stats.avgAttendance}%`],
      ];

      doc.setFontSize(11);
      statRows.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text(`${label}:`, 40, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 30, 30);
        doc.text(value, 260, y);
        y += 22;
      });

      y += 16;
      // ── Top 5 Events ──
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('Top 5 Registered Events', 40, y);
      y += 18;
      doc.line(40, y, W - 40, y);
      y += 16;

      if (topEvents.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(11);
        doc.setTextColor(120, 120, 120);
        doc.text('No event data for the selected period.', 40, y);
        y += 22;
      } else {
        doc.setFillColor(245, 245, 250);
        doc.rect(40, y - 14, W - 80, 20, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text('#', 48, y);
        doc.text('Event Title', 70, y);
        doc.text('Registrations', W - 120, y);
        y += 14;
        topEvents.forEach((ev, i) => {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 30, 30);
          doc.setFontSize(10);
          doc.text(String(i + 1), 48, y);
          const title = ev.title ? (ev.title.length > 50 ? ev.title.slice(0, 48) + '…' : ev.title) : 'N/A';
          doc.text(title, 70, y);
          doc.text(String(ev.count), W - 120, y);
          y += 18;
        });
      }

      y += 14;
      // ── Low Activity Clubs ──
      if (y > 660) { doc.addPage(); y = 50; }
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('Low Activity Clubs', 40, y);
      y += 18;
      doc.line(40, y, W - 40, y);
      y += 16;

      if (lowActivityClubs.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(11);
        doc.setTextColor(34, 197, 94);
        doc.text('All clubs are currently active.', 40, y);
      } else {
        doc.setFillColor(245, 245, 250);
        doc.rect(40, y - 14, W - 80, 20, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text('Club Name', 48, y);
        doc.text('Members', W - 120, y);
        y += 14;
        lowActivityClubs.forEach((club) => {
          if (y > 760) { doc.addPage(); y = 50; }
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 30, 30);
          doc.text(club.name || 'Unknown', 48, y);
          doc.text(String(club.members || 0), W - 120, y);
          y += 18;
        });
      }

      // Footer
      doc.setTextColor(160, 160, 160);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('ClubHub — Confidential Admin Report', 40, 820);

      doc.save(`ClubHub_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ description: 'PDF report downloaded.' });
    } catch (err) {
      toast({ variant: 'destructive', description: 'Failed to generate PDF.' });
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <DashboardLayout title="Reports Dashboard">
      <div className="flex h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Reports Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-slate-400">
                <span>Reports</span>
                <span>/</span>
                <span className="font-medium text-slate-900 dark:text-white">Global Status</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  search
                </span>
                <input
                  className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm placeholder-slate-400 shadow-sm"
                  placeholder="Search metrics..."
                  type="text"
                />
              </div>
              <button className="size-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button
                onClick={() => setNodeStatusOpen(true)}
                className="size-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                title="Node Status"
              >
                <span className="material-symbols-outlined">help</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap gap-3">
              <FilterDropdown
                icon="history"
                options={TIME_RANGE_OPTIONS}
                value={timeRangeFilter}
                onChange={setTimeRangeFilter}
              />
            </div>

            <button
              onClick={handleExportPDF}
              disabled={exportingPDF}
              className="flex items-center gap-2 h-10 px-6 rounded-lg bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              <span className="material-symbols-outlined text-lg">file_download</span>
              {exportingPDF ? 'Exporting…' : 'Export PDF'}
            </button>
          </div>

          {/* KPI Stats */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                  <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">
                    Active Users
                  </p>
                  <span className="material-symbols-outlined text-blue-500 text-2xl">person_check</span>
                </div>
                <p className="text-4xl font-black text-slate-900 dark:text-white">
                  {stats.activeUsers.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-2 text-slate-500 text-sm">
                  <span className="material-symbols-outlined text-sm">groups</span>
                  <span>{stats.activeClubs} active clubs</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">
                    Total Events
                  </p>
                  <span className="material-symbols-outlined text-purple-500 text-2xl">event</span>
                </div>
                <p className="text-4xl font-black text-slate-900 dark:text-white">
                  {stats.totalEvents}
                </p>
                <div className="flex items-center gap-1 mt-2 text-slate-500 text-sm">
                  <span className="material-symbols-outlined text-sm">how_to_reg</span>
                  <span>{stats.totalRegistrations} registrations</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">
                    Pending Approvals
                  </p>
                  <span className="material-symbols-outlined text-amber-500 text-2xl">pending_actions</span>
                </div>
                <p className="text-4xl font-black text-slate-900 dark:text-white">
                  {stats.pendingApprovals}
                </p>
                <div className={`flex items-center gap-1 mt-2 text-sm font-bold ${stats.pendingApprovals > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <span className="material-symbols-outlined text-sm">{stats.pendingApprovals > 0 ? 'priority_high' : 'check_circle'}</span>
                  <span>{stats.pendingApprovals > 0 ? 'Requires action' : 'All clear'}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">
                    Avg Attendance
                  </p>
                  <span className="material-symbols-outlined text-green-500 text-2xl">bar_chart</span>
                </div>
                <p className="text-4xl font-black text-slate-900 dark:text-white">
                  {stats.avgAttendance}%
                </p>
                <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-bold">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Attendance rate</span>
                </div>
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Registrations Over Time */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[400px] flex flex-col">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">Registrations Over Time</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Daily student event sign-ups</p>
                </div>
                <button
                  onClick={handleForceSync}
                  disabled={syncing}
                  title="Refresh chart"
                  className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
                >
                  <span className={`material-symbols-outlined ${syncing ? 'animate-spin' : ''}`}>refresh</span>
                </button>
              </div>
              <div className="flex-1 p-4">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <div className="border-4 border-primary/30 border-t-primary rounded-full w-16 h-16 animate-spin"></div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Fetching data…</p>
                  </div>
                ) : registrationsTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                    No registration data available for selected period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={registrationsTrend}
                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#64748b' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis
                        tick={{ fill: '#64748b' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#f1f5f9',
                        }}
                      />
                      <Legend wrapperStyle={{ color: '#64748b' }} />
                      <Line
                        type="monotone"
                        dataKey="registrations"
                        stroke="#5048e5"
                        strokeWidth={3}
                        dot={{ r: 5, stroke: '#5048e5', strokeWidth: 2, fill: '#fff' }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Top 5 Registered Events */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[220px] flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-sm">Top 5 Registered Events</h3>
                </div>
                <div className="flex-1 p-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-slate-400">Loading…</div>
                  ) : topEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <div className="size-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-2xl">sentiment_neutral</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">No data available</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        No registrations recorded for the selected period.
                      </p>
                    </div>
                  ) : (
                    <ol className="space-y-2">
                      {topEvents.map((ev, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <span className={`flex-none size-6 rounded-full text-xs font-black flex items-center justify-center ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{ev.title}</p>
                          </div>
                          <span className="flex-none text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {ev.count}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>

              {/* Low Activity Clubs */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[220px] flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-sm">Low Activity Clubs</h3>
                </div>
                <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                  {loading ? (
                    <div className="text-slate-500 dark:text-slate-400">Loading...</div>
                  ) : lowActivityClubs.length === 0 ? (
                    <>
                      <div className="size-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-green-600 dark:text-green-400">All clubs are currently active</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[240px]">
                        Global engagement levels are above the threshold for the current period.
                      </p>
                    </>
                  ) : (
                    <div className="w-full">
                      <ul className="space-y-3 text-left text-sm">
                        {lowActivityClubs.map(club => (
                          <li key={club._id} className="flex justify-between items-center">
                            <span className="font-medium">{club.name}</span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {club.members} members
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Summary + Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 pb-12">
            <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 border border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary">info</span>
                <h3 className="font-bold text-primary">Status Summary</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                The system is currently operating within optimal parameters.
                {stats.pendingApprovals > 0
                  ? ` There are ${stats.pendingApprovals} pending event approvals that require action.`
                  : ' All pending approvals are cleared.'
                }
                {' '}Total of {stats.totalRegistrations} event registrations recorded in the selected period.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-sm mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleForceSync}
                  disabled={syncing}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-base ${syncing ? 'animate-spin' : ''}`}>refresh</span>
                  {syncing ? 'Syncing…' : 'Force Sync'}
                </button>
                <button
                  onClick={() => toast({ title: 'Admin Blast', description: 'Email broadcast requires mail server integration.' })}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">mail</span>
                  Admin Blast
                </button>
                <button
                  onClick={() => setApiLogsOpen(true)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">settings_ethernet</span>
                  API Logs
                </button>
                <button
                  onClick={() => setNodeStatusOpen(true)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">health_and_safety</span>
                  Node Status
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── API Logs Modal ─────────────────────────────────────── */}
      {apiLogsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">settings_ethernet</span>
                <h2 className="font-bold text-lg">Recent Activity Log</h2>
              </div>
              <button onClick={() => setApiLogsOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {recentActivity.length === 0 ? (
                <p className="text-center text-slate-500 py-10">No recent activity for the selected period.</p>
              ) : (
                <ul className="space-y-3">
                  {recentActivity.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <span className={`material-symbols-outlined text-lg mt-0.5 ${
                        item.type === 'Event Approved' ? 'text-green-500' :
                        item.type === 'Event Rejected' ? 'text-red-500' :
                        item.type === 'New Registration' ? 'text-blue-500' :
                        'text-slate-400'
                      }`}>
                        {item.type === 'Event Approved' ? 'check_circle' :
                         item.type === 'Event Rejected' ? 'cancel' :
                         item.type === 'New Registration' ? 'person_add' :
                         'event_note'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{item.type}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-400">
                            {item.timestamp ? new Date(item.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                          </span>
                        </div>
                        <p className="text-sm text-slate-900 dark:text-white">{item.description}</p>
                        {item.club && item.club !== '-' && (
                          <p className="text-xs text-slate-400 mt-0.5">{item.club}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-right">
              <button onClick={() => setApiLogsOpen(false)} className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Node Status Modal ─────────────────────────────────── */}
      {nodeStatusOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500">health_and_safety</span>
                <h2 className="font-bold text-lg">Node Status</h2>
              </div>
              <button onClick={() => setNodeStatusOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'API Server', value: 'Online', color: 'text-green-500', icon: 'check_circle' },
                { label: 'Database', value: 'Connected', color: 'text-green-500', icon: 'check_circle' },
                { label: 'System Uptime', value: `${stats.uptime}%`, color: 'text-green-500', icon: 'timer' },
                { label: 'Server Load', value: `${stats.serverLoad}%`, color: stats.serverLoad > 80 ? 'text-red-500' : 'text-green-500', icon: 'memory' },
                { label: 'Active Users', value: String(stats.activeUsers), color: 'text-blue-500', icon: 'group' },
                { label: 'Active Clubs', value: String(stats.activeClubs), color: 'text-purple-500', icon: 'groups' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                  </div>
                  <span className={`text-sm font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-xs text-slate-400">Last checked: {new Date().toLocaleTimeString('en-IN')}</span>
              <button onClick={() => setNodeStatusOpen(false)} className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
