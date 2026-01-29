// src/pages/leader/ClubLeaderDashboard.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import clubLeaderApi from '@/api/clubsApi'; // Adjust path if needed
import { useToast } from "@/components/ui/useToast";

export default function ClubLeaderDashboard() {
  const { toast } = useToast();

  const [clubData, setClubData] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({
    activeEvents: 0,
    pendingRequests: 0,
    totalAttendees: 0,
    activeEventsChange: 0,        // +2, -1, etc.
    pendingRequestsChange: 0,
    totalAttendeesChange: 0,      // percentage
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClubDashboard();
  }, []);

  const fetchClubDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await clubLeaderApi.getMyClubDashboard();

      setClubData(res.data.clubData || {});
      setUpcomingEvents(res.data.clubData?.upcomingEvents || []);
      setRecentActivity(res.data.recentActivity || []);

      setStats({
        activeEvents: res.data.clubData?.ApprovedEvents || 0,
        pendingRequests: res.data.clubData?.pendingRequests || 0,
        totalAttendees: res.data.clubData?.totalRegistrations || 0,
        // Real changes — coming from backend
        activeEventsChange: res.data.clubData?.activeEventsChange || 0,
        pendingRequestsChange: res.data.clubData?.pendingRequestsChange || 0,
        totalAttendeesChange: res.data.clubData?.totalAttendeesChange || 0,
      });
    } catch (err) {
      console.error('Club dashboard error:', err);
      setError('Failed to load your club dashboard.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load club data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Activity Dashboard">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="border-4 border-primary/30 border-t-primary rounded-full w-16 h-16 animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-300">Loading your club dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !clubData) {
    return (
      <DashboardLayout title="Activity Dashboard">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
          <div className="text-red-500 mb-4">
            <span className="material-symbols-outlined text-6xl">error</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">{error || 'Club data not available'}</p>
          <button
            onClick={fetchClubDashboard}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const getChangeColor = (value) => {
    if (value > 0) return 'text-emerald-600';
    if (value < 0) return 'text-red-600';
    return 'text-slate-500 dark:text-slate-400';
  };

  const getChangeIcon = (value) => {
    if (value > 0) return 'trending_up';
    if (value < 0) return 'trending_down';
    return 'trending_flat';
  };

  return (
    <DashboardLayout title="Activity Dashboard">
      <div className="px-8 py-6 max-w-[1200px] w-full mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-slate-900 dark:text-white font-medium">Club Overview</span>
        </div>

        {/* Club Header Card */}
        <div className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
                    {clubData.name || 'Your Club'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/50">
                    ACTIVE CLUB
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium text-base">
                  Lead by: {clubData.leaderName || 'You'}
                </p>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
                {clubData.description || 'No club description provided yet.'}
              </p>
            </div>

            <div className="flex gap-3 shrink-0">
              <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Edit Profile
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                Club Settings
              </button>
            </div>
          </div>

          {/* Stats Row - Real Changes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 md:px-8 pb-6 md:pb-8 border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex justify-between items-center">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
                  ACTIVE EVENTS
                </p>
                <span className="material-symbols-outlined text-primary">calendar_month</span>
              </div>
              <p className="text-slate-900 dark:text-white text-3xl font-bold">{stats.activeEvents}</p>
              <p className={`text-[11px] font-semibold flex items-center gap-1 ${getChangeColor(stats.activeEventsChange)}`}>
                <span className="material-symbols-outlined text-[14px]">{getChangeIcon(stats.activeEventsChange)}</span>
                {stats.activeEventsChange > 0 ? '+' : ''}{stats.activeEventsChange} this week
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex justify-between items-center">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
                  PENDING MEMBERSHIP REQUESTS
                </p>
                <span className="material-symbols-outlined text-amber-500">pending_actions</span>
              </div>
              <p className="text-slate-900 dark:text-white text-3xl font-bold">{stats.pendingRequests}</p>
              <p className={`text-[11px] font-semibold flex items-center gap-1 ${getChangeColor(stats.pendingRequestsChange)}`}>
                <span className="material-symbols-outlined text-[14px]">{getChangeIcon(stats.pendingRequestsChange)}</span>
                {stats.pendingRequestsChange > 0 ? '+' : ''}{stats.pendingRequestsChange} this week
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex justify-between items-center">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
                  TOTAL ATTENDEES
                </p>
                <span className="material-symbols-outlined text-blue-500">groups</span>
              </div>
              <p className="text-slate-900 dark:text-white text-3xl font-bold">{stats.totalAttendees}</p>
              <p className={`text-[11px] font-semibold flex items-center gap-1 ${getChangeColor(stats.totalAttendeesChange)}`}>
                <span className="material-symbols-outlined text-[14px]">{getChangeIcon(stats.totalAttendeesChange)}</span>
                {stats.totalAttendeesChange >= 0 ? '+' : ''}{stats.totalAttendeesChange}% vs last month
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-slate-900 dark:text-white font-bold text-base">Upcoming Events</h3>
              <button className="text-primary text-xs font-bold hover:underline">View Calendar</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-3 text-slate-500 text-[11px] font-bold uppercase tracking-wider">EVENT NAME</th>
                    <th className="px-6 py-3 text-slate-500 text-[11px] font-bold uppercase tracking-wider">DATE & TIME</th>
                    <th className="px-6 py-3 text-slate-500 text-[11px] font-bold uppercase tracking-wider">VENUE</th>
                    <th className="px-6 py-3 text-slate-500 text-[11px] font-bold uppercase tracking-wider">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                          {event.title || 'Untitled Event'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {event.date ? new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'TBD'} {event.time ? `• ${event.time}` : ''}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                          {event.venue || 'TBD'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${
                              event.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : event.status === 'pending'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {event.status?.toUpperCase() || 'DRAFT'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        No upcoming events scheduled yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-slate-900 dark:text-white font-bold text-base">Recent Activity</h3>
            </div>
            <div className="p-6 flex-1">
              <div className="relative flex flex-col gap-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>

                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 6).map((item, idx) => (
                    <div key={idx} className="relative flex gap-4">
                      <div className="relative z-10 w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-900">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ring-4 ring-opacity-50 ${
                            item.type?.toLowerCase().includes('approved') || item.type?.toLowerCase().includes('joined')
                              ? 'bg-emerald-500 ring-emerald-50 dark:ring-emerald-900/10'
                              : item.type?.toLowerCase().includes('pending') || item.type?.toLowerCase().includes('requested')
                              ? 'bg-amber-500 ring-amber-50 dark:ring-amber-900/10'
                              : item.type?.toLowerCase().includes('rejected')
                              ? 'bg-red-500 ring-red-50 dark:ring-red-900/10'
                              : 'bg-slate-400 ring-slate-50 dark:ring-slate-800'
                          }`}
                        ></div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-slate-900 dark:text-slate-200 font-medium leading-normal">
                          {item.description || 'Club activity recorded'}
                        </p>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {new Date(item.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                    No recent activity recorded
                  </div>
                )}
              </div>

              {recentActivity.length > 6 && (
                <button className="mt-6 w-full py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Load more activity
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Event Success Rate</h4>
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-primary" style={{ width: `${clubData.ApprovedEvents / (clubData.ApprovedEvents + clubData.PendingEvents + clubData.RejectedEvents) * 100 || 75}%` }}></div>
              <div className="h-full bg-amber-400" style={{ width: `${clubData.PendingEvents / (clubData.ApprovedEvents + clubData.PendingEvents + clubData.RejectedEvents) * 100 || 15}%` }}></div>
              <div className="h-full bg-slate-300 dark:bg-slate-600" style={{ width: `${clubData.RejectedEvents / (clubData.ApprovedEvents + clubData.PendingEvents + clubData.RejectedEvents) * 100 || 10}%` }}></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-tighter">
                  Approved ({clubData.ApprovedEvents || 0})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-tighter">
                  Pending ({clubData.PendingEvents || 0})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-tighter">
                  Rejected ({clubData.RejectedEvents || 0})
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Report Ready</h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Your club activity report for last month is now available for download.
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Get PDF
            </button>
          </div>
        </div>

        {/* Floating New Activity Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <button className="flex items-center justify-center gap-2 rounded-full h-14 px-6 bg-primary text-white text-sm font-bold shadow-lg hover:bg-blue-700 transition-colors">
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Activity
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}