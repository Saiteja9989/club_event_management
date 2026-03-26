// src/pages/leader/ClubLeaderDashboard.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import clubLeaderApi from '@/api/clubsApi';
import { useToast } from "@/components/ui/useToast";
import { useAuth } from '../../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

export default function ClubLeaderDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [clubData, setClubData] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({
    activeEvents: 0,
    pendingRequests: 0,
    totalAttendees: 0,
    activeEventsChange: 0,
    pendingRequestsChange: 0,
    totalAttendeesChange: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit Profile modal
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // Club Settings modal
  const [clubSettingsOpen, setClubSettingsOpen] = useState(false);
  const [clubForm, setClubForm] = useState({ name: '', description: '' });
  const [clubSaving, setClubSaving] = useState(false);

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

  // ── Edit Profile ──────────────────────────────────────────────
  const handleOpenEditProfile = () => {
    setProfileForm({
      name: user?.name || clubData?.leaderName || '',
      email: user?.email || '',
    });
    setEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast({ variant: 'destructive', description: 'Name and email are required.' });
      return;
    }
    setProfileSaving(true);
    try {
      const res = await clubLeaderApi.updateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      });
      setClubData(prev => ({ ...prev, leaderName: res.data.user.name }));
      // Sync localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...stored,
        name: res.data.user.name,
        email: res.data.user.email,
      }));
      setEditProfileOpen(false);
      toast({ description: 'Profile updated successfully!' });
    } catch (err) {
      toast({ variant: 'destructive', description: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Club Settings ─────────────────────────────────────────────
  const handleOpenClubSettings = () => {
    setClubForm({
      name: clubData?.name || '',
      description: clubData?.description || '',
    });
    setClubSettingsOpen(true);
  };

  const handleSaveClubSettings = async () => {
    if (!clubForm.name.trim()) {
      toast({ variant: 'destructive', description: 'Club name is required.' });
      return;
    }
    setClubSaving(true);
    try {
      const res = await clubLeaderApi.updateMyClub({
        name: clubForm.name.trim(),
        description: clubForm.description.trim(),
      });
      setClubData(prev => ({
        ...prev,
        name: res.data.club.name,
        description: res.data.club.description,
      }));
      setClubSettingsOpen(false);
      toast({ description: 'Club settings saved!' });
    } catch (err) {
      toast({ variant: 'destructive', description: err.response?.data?.message || 'Failed to update club.' });
    } finally {
      setClubSaving(false);
    }
  };

  // ── Get PDF ───────────────────────────────────────────────────
  const handleGetPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = 60;

    // Title
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 95);
    doc.text('Club Activity Report', margin, y);

    y += 20;
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      margin, y
    );

    y += 12;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 555, y);
    y += 22;

    // Club info
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Club: ${clubData.name || 'N/A'}`, margin, y);
    y += 18;
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Leader: ${clubData.leaderName || 'N/A'}`, margin, y);
    y += 14;
    const descLines = doc.splitTextToSize(clubData.description || 'No description provided.', 515);
    doc.text(descLines, margin, y);
    y += descLines.length * 14 + 22;

    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, 555, y);
    y += 22;

    // Stats
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 95);
    doc.text('Event Statistics', margin, y);
    y += 18;
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    [
      `Approved Events: ${clubData.ApprovedEvents || 0}`,
      `Pending Events:  ${clubData.PendingEvents || 0}`,
      `Rejected Events: ${clubData.RejectedEvents || 0}`,
      `Total Registrations: ${clubData.totalRegistrations || 0}`,
      `Total Members: ${clubData.memberCount || 0}`,
    ].forEach(line => { doc.text(line, margin, y); y += 16; });
    y += 10;

    // Upcoming events table
    if (upcomingEvents.length > 0) {
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y, 555, y);
      y += 22;
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 95);
      doc.text('Upcoming Events', margin, y);
      y += 18;

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text('EVENT', margin, y);
      doc.text('DATE', 250, y);
      doc.text('VENUE', 380, y);
      doc.text('STATUS', 500, y);
      y += 6;
      doc.setDrawColor(210, 210, 210);
      doc.line(margin, y, 555, y);
      y += 14;

      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      upcomingEvents.forEach(event => {
        if (y > 760) return;
        doc.text((event.title || 'Untitled').slice(0, 28), margin, y);
        doc.text(
          event.date
            ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'TBD',
          250, y
        );
        doc.text((event.venue || 'TBD').slice(0, 18), 380, y);
        doc.text((event.status || 'DRAFT').toUpperCase(), 500, y);
        y += 18;
      });
    }

    const safeName = (clubData.name || 'Club').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${safeName}_Activity_Report.pdf`);
    toast({ description: 'Report downloaded!' });
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
              <button
                onClick={handleOpenEditProfile}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={handleOpenClubSettings}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Club Settings
              </button>
            </div>
          </div>

          {/* Stats Row */}
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
            <button
              onClick={handleGetPDF}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
            >
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

      {/* Edit Profile Modal */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input
                id="p-name"
                value={profileForm.name}
                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-email">Email</Label>
              <Input
                id="p-email"
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setEditProfileOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={profileSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {profileSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Club Settings Modal */}
      <Dialog open={clubSettingsOpen} onOpenChange={setClubSettingsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Club Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Club Name</Label>
              <Input
                id="c-name"
                value={clubForm.name}
                onChange={e => setClubForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Club name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-desc">Description</Label>
              <Textarea
                id="c-desc"
                value={clubForm.description}
                onChange={e => setClubForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe your club..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setClubSettingsOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClubSettings}
              disabled={clubSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {clubSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {clubSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
