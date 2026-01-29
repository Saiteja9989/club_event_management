// src/pages/leader/ClubLeaderDashboard.jsx  (or LeaderEvents.jsx)
import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import eventsApi from '@/api/eventsApi';
import { useToast } from "@/components/ui/useToast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function ClubLeaderDashboard() {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('upcoming');
  const [events, setEvents] = useState({
    approvedUpcomingEvents: [],
    pendingForAdminApprovalEvents: [],
    completedEvents: [],
    rejectedEvents: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    price: '0',
    isPaid: false,
    maxParticipants: '',
    visibility: 'open-to-all',
    registrationDeadline: '',
  });

  const [posterPreview, setPosterPreview] = useState('');

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await eventsApi.getMyEvents();

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to fetch events');
      }

      setEvents({
        approvedUpcomingEvents: res.data.data.approvedUpcomingEvents || [],
        pendingForAdminApprovalEvents: res.data.data.pendingForAdminApprovalEvents || [],
        completedEvents: res.data.data.completedEvents || [],
        rejectedEvents: res.data.data.rejectedEvents || [],
      });
    } catch (err) {
      console.error('My events error:', err);
      setError('Failed to load your events.');
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not load events.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  //  HELPER FUNCTIONS – all defined before usage
  // ──────────────────────────────────────────────

  const getFilteredEvents = () => {
    let list = [];
    if (activeTab === 'upcoming') list = events.approvedUpcomingEvents;
    if (activeTab === 'pending') list = events.pendingForAdminApprovalEvents;
    if (activeTab === 'history') list = [...events.completedEvents, ...events.rejectedEvents];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q)
      );
    }

    return list;
  };

  const filteredEvents = getFilteredEvents(); // NOW DEFINED HERE – after getFilteredEvents

  const getProgressColor = (registered, total) => {
    if (!total) return 'bg-primary';
    const pct = (registered / total) * 100;
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-primary';
  };

  const getSeatsLeftText = (registered, total) => {
    if (!total) return 'Unlimited';
    const left = total - registered;
    if (left <= 0) return 'Full';
    if (left <= 5) return `Only ${left} left!`;
    return `${left} left`;
  };

  const getVisibilityLabel = (visibility) => {
    return visibility === 'open-to-all' ? 'Public' : 'Club Only';
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPosterPreview('');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.registrationDeadline || !formData.visibility) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Title, date, deadline, and visibility are required",
      });
      return;
    }

    if (new Date(formData.registrationDeadline) <= new Date()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Registration deadline must be in the future",
      });
      return;
    }

    try {
      const formDataToSend = new FormData();

      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('time', formData.time);
      formDataToSend.append('venue', formData.venue);
      formDataToSend.append('isPaid', formData.isPaid);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('maxParticipants', formData.maxParticipants || '');
      formDataToSend.append('visibility', formData.visibility);
      formDataToSend.append('registrationDeadline', formData.registrationDeadline || '');

      if (fileInputRef.current?.files?.[0]) {
        formDataToSend.append('poster', fileInputRef.current.files[0]);
      }

      console.log('Submitting FormData - poster included:', !!fileInputRef.current?.files?.[0]);

      await eventsApi.createEvent(formDataToSend);

      toast({
        title: "Success",
        description: "Event created — awaiting admin approval",
      });

      setCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        price: '0',
        isPaid: false,
        maxParticipants: '',
        visibility: 'open-to-all',
        registrationDeadline: '',
      });
      setPosterPreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      fetchMyEvents();
    } catch (err) {
      console.error('Create event error:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to create event.",
      });
    }
  };

  return (
    <DashboardLayout title="My Events">
      <div className="px-6 md:px-10 py-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            MY EVENTS
          </h1>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold shadow-md hover:bg-primary/90 transition-all"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Create Event
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 mb-5">
          <div className="flex gap-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-2 pt-1 text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'upcoming' ? 'border-b-2 border-primary text-primary' : 'border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-primary'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-2 pt-1 text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'pending' ? 'border-b-2 border-primary text-primary' : 'border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-primary'
              }`}
            >
              Pending Approval
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2 pt-1 text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'history' ? 'border-b-2 border-primary text-primary' : 'border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-primary'
              }`}
            >
              Event History
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm placeholder-slate-400 shadow-sm"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Events List – using filteredEvents (now defined above) */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="border-4 border-primary/30 border-t-primary rounded-full w-12 h-12 animate-spin"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-800">
            No {activeTab} events found
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow duration-200 flex flex-col md:flex-row group"
              >
                {/* Poster */}
                <div
                  className="w-full md:w-52 h-36 md:h-auto bg-cover bg-center shrink-0"
                  style={{
                    backgroundImage: `url(${event.poster || 'https://via.placeholder.com/400x300?text=No+Poster'})`,
                  }}
                />

                {/* Content */}
                <div className="p-4 flex-grow flex flex-col">
                  {/* Badges */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        event.status === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                          : event.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {event.status === 'approved'
                        ? 'CONFIRMED'
                        : event.status === 'pending'
                        ? 'PENDING APPROVAL'
                        : event.status?.toUpperCase() || 'REJECTED'}
                    </span>

                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        {event.visibility === 'open-to-all' ? 'public' : 'lock'}
                      </span>
                      {getVisibilityLabel(event.visibility)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-slate-900 dark:text-white text-base font-bold mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {event.title || 'Untitled Event'}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-600 dark:text-slate-400 text-xs line-clamp-2 mb-2.5">
                    {event.description || 'No description'}
                  </p>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-700 dark:text-slate-300 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">calendar_today</span>
                      {event.date ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBD'}
                      {' • '}
                      {event.time || 'TBD'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">location_on</span>
                      {event.venue || 'TBD'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">payments</span>
                      {event.isPaid && event.price > 0 ? `₹${event.price}` : 'Free'}
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-primary">
                      <span className="material-symbols-outlined text-base">group</span>
                      {event.totalRegistrations || 0}/{event.maxParticipants || '∞'}
                    </div>
                  </div>

                  {/* Progress */}
                  {activeTab === 'upcoming' && event.maxParticipants && (
                    <div className="mb-2">
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-slate-500 dark:text-slate-400">Progress</span>
                        <span className={event.totalRegistrations >= event.maxParticipants ? 'text-red-600' : 'text-primary'}>
                          {getSeatsLeftText(event.totalRegistrations, event.maxParticipants)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-1 transition-all ${getProgressColor(event.totalRegistrations, event.maxParticipants)}`}
                          style={{ width: `${Math.min((event.totalRegistrations / event.maxParticipants) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {activeTab === 'pending' && (
                    <div className="flex gap-2 justify-end mt-1">
                      <button className="h-8 px-3 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium hover:bg-slate-200 transition-colors">
                        Edit
                      </button>
                      <button className="h-8 px-3 rounded-md bg-primary text-white text-xs font-medium shadow-sm hover:bg-primary/90 transition-colors">
                        Manage
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-xs">
          © 2024 ClubHub Academic Event Management. All rights reserved.
          <div className="flex justify-center gap-5 mt-2">
            <a href="#" className="hover:text-primary transition-colors">Help Center</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          </div>
        </footer>
      </div>

      {/* Create Event Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Event</h2>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Poster - optional */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Event Poster (optional)
                </label>
                <div className="relative group w-full aspect-[16/9] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div
                    className="w-full h-full bg-center bg-cover"
                    style={{
                      backgroundImage: posterPreview
                        ? `url(${posterPreview})`
                        : 'url(https://via.placeholder.com/1200x675?text=Upload+Poster)',
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-slate-100">
                      Upload Poster
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePosterChange}
                      />
                    </label>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Recommended: 1200 × 675px (16:9). Leave blank for no poster.
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">
                  Event Title
                </label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none dark:bg-slate-800 dark:text-white"
                  placeholder="Annual STEM Symposium 2024"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">
                  Location
                </label>
                <input
                  name="venue"
                  value={formData.venue}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none dark:bg-slate-800 dark:text-white"
                  placeholder="Main Auditorium"
                />
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">
                  Visibility
                </label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none dark:bg-slate-800 dark:text-white"
                  required
                >
                  <option value="open-to-all">Public (Anyone can see & register)</option>
                  <option value="club-only">Club Only (Members only)</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">
                    Event Date
                  </label>
                  <input
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">
                    Event Time
                  </label>
                  <input
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">
                  Registration Deadline
                </label>
                <input
                  name="registrationDeadline"
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={handleFormChange}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none dark:bg-slate-800 dark:text-white ${
                    formData.registrationDeadline && new Date(formData.registrationDeadline) <= new Date()
                      ? 'border-red-500'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                  required
                />
                {formData.registrationDeadline && new Date(formData.registrationDeadline) <= new Date() && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    Deadline must be after today
                  </p>
                )}
              </div>

              {/* Price & Paid Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">
                    Price (₹)
                  </label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none dark:bg-slate-800 dark:text-white"
                    placeholder="0 for free"
                  />
                </div>

                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPaid"
                      name="isPaid"
                      checked={formData.isPaid}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPaid: checked }))}
                    />
                    <Label
                      htmlFor="isPaid"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      This is a paid event
                    </Label>
                  </div>
                </div>
              </div>

              {/* Max Participants */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">
                  Max Participants
                </label>
                <input
                  name="maxParticipants"
                  type="number"
                  min="1"
                  value={formData.maxParticipants}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none dark:bg-slate-800 dark:text-white"
                  placeholder="Leave blank for unlimited"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none dark:bg-slate-800 dark:text-white min-h-[100px]"
                  placeholder="Describe your event..."
                />
              </div>

              {/* Footer buttons */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-5 py-2 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}