// src/pages/admin/ReviewEvents.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import eventsApi from '@/api/eventsApi';
import { useToast } from "@/components/ui/useToast";

export default function ReviewEvents() {
  const { toast } = useToast();

  const [pendingEvents, setPendingEvents] = useState([]);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [filteredPending, setFilteredPending] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  // Pagination
  const [page, setPage] = useState(1);
  const eventsPerPage = 10;

  // Modal states
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventsApi.getAllEventsForReview();

      const pending = res.data?.data?.pendingEvents || [];
      const approved = res.data?.data?.approvedEvents || [];
      const rejected = res.data?.data?.rejectedEvents || [];

      const history = [...approved, ...rejected];

      setPendingEvents(pending);
      setHistoryEvents(history);

      applySearch(pending, history, search);
      setPage(1); // Reset to page 1 after refresh
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load events.",
      });
    } finally {
      setLoading(false);
    }
  };

  const applySearch = (pending, history, term) => {
    const lower = term.toLowerCase();
    const filter = (list) =>
      list.filter(
        (e) =>
          e.title?.toLowerCase().includes(lower) ||
          e.club?.name?.toLowerCase().includes(lower) ||
          e.createdBy?.name?.toLowerCase().includes(lower)
      );

    setFilteredPending(filter(pending));
    setFilteredHistory(filter(history));
  };

  useEffect(() => {
    applySearch(pendingEvents, historyEvents, search);
  }, [search, pendingEvents, historyEvents]);

  const activeList = activeTab === 'active' ? filteredPending : filteredHistory;

  // Pagination calculation
  const totalPages = Math.ceil(activeList.length / eventsPerPage);
  const paginatedEvents = activeList.slice(
    (page - 1) * eventsPerPage,
    page * eventsPerPage
  );

  const handleReview = async (action) => {
    const msg = action === 'approved'
      ? `Approve "${selectedEvent.title}"?`
      : `Reject "${selectedEvent.title}"? This cannot be undone.`;

    if (!window.confirm(msg)) return;

    setActionLoading(true);

    // Optimistic update: immediately move event out of pending
    const eventId = selectedEvent._id;
    const newStatus = action === 'approved' ? 'approved' : 'rejected';

    // Update local state optimistically
    setPendingEvents(prev => prev.filter(e => e._id !== eventId));
    if (action === 'approved' || action === 'rejected') {
      setHistoryEvents(prev => [
        ...prev,
        { ...selectedEvent, status: newStatus }
      ]);
    }

    try {
      await eventsApi.reviewEvent(eventId, action);

      toast({
        title: "Success",
        description: `Event ${action === 'approved' ? 'approved' : 'rejected'}!`,
      });

      setReviewOpen(false);
      setSelectedEvent(null);

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || `Failed to ${action} event.`,
      });

      // Rollback on error (optional)
      await fetchEvents(); // Re-fetch to correct state
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReview = (event) => {
    setSelectedEvent(event);
    console.log(event);
    setReviewOpen(true);
  };

  const formatDateTime = (date, time) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      (time ? ` • ${time}` : '');
  };

  return (
    <DashboardLayout title="Review Events">
      <div className="max-w-[1280px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Review Events
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Manage and approve pending club event submissions from across the campus.
            </p>
          </div>
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
            <button
              onClick={() => { setActiveTab('active'); setPage(1); }}
              className={`pb-3 px-1 text-sm font-bold tracking-wide transition-all ${activeTab === 'active'
                  ? 'border-b-2 border-primary text-primary'
                  : 'border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              Active Requests
              <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                {filteredPending.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('history'); setPage(1); }}
              className={`pb-3 px-1 text-sm font-bold tracking-wide transition-all ${activeTab === 'history'
                  ? 'border-b-2 border-primary text-primary'
                  : 'border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative group max-w-xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl">
              search
            </span>
            <input
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-sm"
              placeholder="Search events, clubs, or venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-6xl text-primary">refresh</span>
          </div>
        ) : activeList.length === 0 ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-lg border rounded-xl bg-slate-50 dark:bg-slate-900/50">
            No {activeTab === 'active' ? 'pending' : 'historical'} events found
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">SL.NO</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">EVENT TITLE</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CLUB</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">DATE & TIME</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">VENUE</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">VISIBILITY</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">PRICE</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedEvents.map((event, idx) => (
                    <tr key={event._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
                        {(page - 1) * eventsPerPage + idx + 1}
                      </td>
                      <td className="px-6 py-5 font-medium text-slate-900 dark:text-white">
                        {event.title}
                      </td>
                      <td className="px-6 py-5 text-slate-600 dark:text-slate-300">
                        {event.club?.name || '—'}
                      </td>
                      <td className="px-6 py-5 text-slate-600 dark:text-slate-300">
                        {formatDateTime(event.date, event.time)}
                      </td>
                      <td className="px-6 py-5 text-slate-600 dark:text-slate-300">
                        {event.venue || '—'}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${event.visibility === 'public' || event.visibility === 'open-to-all'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                            }`}
                        >
                          {event.visibility === 'public' || event.visibility === 'open-to-all' ? 'Public' : 'Members'}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-medium text-slate-900 dark:text-white">
                        {event.isPaid && event.price > 0 ? `$${event.price}` : 'Free'}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => handleOpenReview(event)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 border border-primary text-primary hover:bg-primary/5 rounded-lg text-sm font-bold transition-all"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing <strong className="text-slate-900 dark:text-white">{(page - 1) * eventsPerPage + 1}</strong> to{' '}
                <strong className="text-slate-900 dark:text-white">{Math.min(page * eventsPerPage, activeList.length)}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white">{activeList.length}</strong> entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button className="px-4 py-2 bg-primary text-white border border-primary rounded text-xs font-bold">
                  {page}
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {reviewOpen && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[75%] rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <header className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 px-8 py-6 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-lg">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-2xl">event_upcoming</span>
                    <h2 className="text-gray-900 dark:text-white text-2xl font-bold tracking-tight">Review Event</h2>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{selectedEvent.title}</p>
                </div>
                <button
                  onClick={() => setReviewOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </header>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap gap-2 items-center text-sm">
                  <span className="text-primary font-medium">Admin Dashboard</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-primary font-medium">Event Approvals</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium">{selectedEvent.title}</span>
                </div>

                {/* Leader Information */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary">person</span>
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold">Leader Information</h3>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-6 py-3 text-slate-900 dark:text-white text-xs font-semibold uppercase tracking-wider">Submitted By</th>
                          <th className="px-6 py-3 text-slate-900 dark:text-white text-xs font-semibold uppercase tracking-wider">Club Name</th>
                          <th className="px-6 py-3 text-slate-900 dark:text-white text-xs font-semibold uppercase tracking-wider">Contact Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        <tr>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-sm">
                            {selectedEvent.createdBy?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 text-primary text-sm font-medium">
                            {selectedEvent.club?.name || '—'}
                          </td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-sm">
                            {selectedEvent.createdBy?.email || '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Event Details */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary">info</span>
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold">Event Details</h3>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-6 py-3 text-slate-900 dark:text-white text-xs font-semibold uppercase tracking-wider">Date & Time</th>
                          <th className="px-6 py-3 text-slate-900 dark:text-white text-xs font-semibold uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3 text-slate-900 dark:text-white text-xs font-semibold uppercase tracking-wider">Max participants</th>
                          <th className="px-6 py-3 text-slate-900 dark:text-white text-xs font-semibold uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        <tr>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-sm">
                            {formatDateTime(selectedEvent.date, selectedEvent.time)}
                          </td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-sm">
                            {selectedEvent.venue || '—'}
                          </td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-sm">
                            {selectedEvent.maxParticipants || '—'}
                          </td>
                          <td className="px-6 py-4">
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${selectedEvent.status === 'approved'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : selectedEvent.status === 'rejected'
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                  }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 mr-1.5 rounded-full ${selectedEvent.status === 'approved'
                                      ? 'bg-green-500'
                                      : selectedEvent.status === 'rejected'
                                        ? 'bg-red-500'
                                        : 'bg-amber-500'
                                    }`}
                                ></span>
                                {selectedEvent.status
                                  ? selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)
                                  : 'Pending'}
                              </span>
                            </td>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Description & Poster */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <section className="flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-primary">description</span>
                      <h3 className="text-slate-900 dark:text-white text-lg font-bold">Description</h3>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg p-6 flex-1">
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedEvent.description || 'No description provided.'}
                      </p>
                    </div>
                  </section>

                  <section className="flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-primary">image</span>
                      <h3 className="text-slate-900 dark:text-white text-lg font-bold">Event Poster</h3>
                    </div>ing Review
                    {selectedEvent.poster ? (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 group relative">
                        <div
                          className="aspect-[4/5] w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                          style={{ backgroundImage: `url(${selectedEvent.poster})` }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">fullscreen</span>
                            View Full Size
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center text-slate-500 dark:text-slate-400">
                        No poster uploaded
                      </div>
                    )}
                  </section>
                </div>
              </div>

              {/* Footer */}
              <footer className="border-t border-gray-200 dark:border-slate-800 px-8 py-6 sticky bottom-0 bg-white dark:bg-slate-900 z-10 rounded-b-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {/* Static avatars for "other admins" – can be dynamic later */}
                      <div className="size-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                        JD
                      </div>
                      <div className="size-8 rounded-full border-2 border-white dark:border-slate-900 bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                        SM
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs italic">
                      Other admins are currently reviewing this event.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      disabled={actionLoading || selectedEvent.status !== 'pending'}
                      onClick={() => handleReview('rejected')}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors text-sm font-bold"
                    >
                      <span className="material-symbols-outlined text-lg">cancel</span>
                      Reject Event
                    </button>
                    <button
                      disabled={actionLoading || selectedEvent.status !== 'pending'}
                      onClick={() => handleReview('approved')}
                      className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-bold shadow-lg shadow-emerald-500/20"
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      Approve & Publish
                    </button>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}