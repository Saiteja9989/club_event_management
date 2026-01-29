// src/pages/admin/AdminReports.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import adminApi from '@/api/adminApi';
import { useToast } from "@/components/ui/useToast";
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

export default function AdminReports() {
  const { toast } = useToast();

  const [stats, setStats] = useState({
    activeUsers: 0,
    serverLoad: 0,
    pendingApprovals: 0,
    uptime: 0,
  });

  const [registrationsTrend, setRegistrationsTrend] = useState([]);
  const [lowActivityClubs, setLowActivityClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('current');
  const [timeRangeFilter, setTimeRangeFilter] = useState('last30days');

  useEffect(() => {
    fetchGlobalStats();
  }, [departmentFilter, termFilter, timeRangeFilter]);

  const fetchGlobalStats = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        timeRange: timeRangeFilter,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        term: termFilter !== 'current' ? termFilter : undefined,
      };

      const res = await adminApi.getReports(params);

      // Map real data
      setStats({
        activeUsers: res.data?.stats?.totalStudents || 0,
        serverLoad: res.data?.stats?.serverLoad || 14, // fallback if not in backend
        pendingApprovals: res.data?.stats?.pendingEvents || 0,
        uptime: res.data?.stats?.uptime || 99.9, // fallback
      });

      setRegistrationsTrend(res.data?.registrationsTrend || []);
      setLowActivityClubs(res.data?.lowActivityClubs || []);

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

  const exportPDF = () => {
    toast({
      title: "Export Started",
      description: "Generating PDF report...",
    });
    // Add real jsPDF or backend export later
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
              <button className="size-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined">help</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 h-10 px-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined">domain</span>
                All Departments
                <span className="material-symbols-outlined">expand_more</span>
              </button>

              <button className="flex items-center gap-2 h-10 px-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined">event_note</span>
                Current Term
                <span className="material-symbols-outlined">expand_more</span>
              </button>

              <button className="flex items-center gap-2 h-10 px-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined">history</span>
                Last 30 Days
                <span className="material-symbols-outlined">expand_more</span>
              </button>
            </div>

            <button
              onClick={exportPDF}
              className="flex items-center gap-2 h-10 px-6 rounded-lg bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90 transition-all"
            >
              <span className="material-symbols-outlined">file_download</span>
              Export PDF
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
                <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-bold">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  <span>+12.5%</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">vs last mo</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">
                    Server Load
                  </p>
                  <span className="material-symbols-outlined text-red-500 text-2xl">memory</span>
                </div>
                <p className="text-4xl font-black text-slate-900 dark:text-white">
                  {stats.serverLoad}%
                </p>
                <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-bold">
                  <span className="material-symbols-outlined text-sm">trending_down</span>
                  <span>-2.1%</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">Stable</span>
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
                <div className="flex items-center gap-1 mt-2 text-red-600 text-sm font-bold">
                  <span className="material-symbols-outlined text-sm">priority_high</span>
                  <span>+5</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">Requires action</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">
                    System Uptime
                  </p>
                  <span className="material-symbols-outlined text-green-500 text-2xl">cloud_done</span>
                </div>
                <p className="text-4xl font-black text-slate-900 dark:text-white">
                  {stats.uptime}%
                </p>
                <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-bold">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Online</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">Global regions</span>
                </div>
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Registrations Over Time - Real Line Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[400px] flex flex-col">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">Registrations Over Time</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Daily student event sign-ups</p>
                </div>
                <button className="text-slate-500 dark:text-slate-400 hover:text-primary">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              <div className="flex-1 p-4">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <div className="border-4 border-primary/30 border-t-primary rounded-full w-16 h-16 animate-spin"></div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Fetching real-time data...</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Connecting to registration service</p>
                    </div>
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" dark:stroke="#374151" />
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
              {/* Top 5 Registered Events - Empty */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[220px] flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-sm">Top 5 Registered Events</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="size-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-2xl">sentiment_neutral</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">No data available</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
                    There are no registrations recorded for the selected period.
                  </p>
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
                        Global engagement levels are above the 15% threshold for the current term.
                      </p>
                      <button className="mt-4 text-xs font-bold text-primary hover:underline">
                        View activity report
                      </button>
                    </>
                  ) : (
                    <div className="w-full px-4">
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
                The system is currently operating within optimal parameters. High-level engagement is observed across major departments. There are no critical failures reported in the last 24 hours. Data sync with the Registrar's office is scheduled for 11:00 PM UTC.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-sm mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <span className="material-symbols-outlined text-base">refresh</span>
                  Force Sync
                </button>
                <button className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <span className="material-symbols-outlined text-base">mail</span>
                  Admin Blast
                </button>
                <button className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <span className="material-symbols-outlined text-base">settings_ethernet</span>
                  API Logs
                </button>
                <button className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <span className="material-symbols-outlined text-base">health_and_safety</span>
                  Node Status
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}