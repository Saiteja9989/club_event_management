// src/pages/leader/ClubLeaderDashboard.jsx  (or LeaderEvents.jsx)
import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import eventsApi from '@/api/eventsApi';
import { useToast } from "@/components/ui/useToast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import AddToCalendarButton from '../../components/common/AddToCalendarButton';
import { StarDisplay } from '../../components/common/StarRating';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ClubLeaderDashboard() {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

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

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editFormData, setEditFormData] = useState({
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
  const [editPosterPreview, setEditPosterPreview] = useState('');
  const [creating, setCreating] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Feedback viewer
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackEvent, setFeedbackEvent] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

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

  const handleViewFeedback = async (event) => {
    setFeedbackEvent(event);
    setFeedbackOpen(true);
    setFeedbackData(null);
    setFeedbackLoading(true);
    try {
      const res = await eventsApi.getEventFeedback(event._id);
      setFeedbackData(res.data);
    } catch {
      toast({ variant: 'destructive', description: 'Failed to load feedback.' });
    } finally {
      setFeedbackLoading(false);
    }
  };

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

  const filteredEvents = getFilteredEvents();

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

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPosterPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPosterPreview('');
    }
  };

  const handleEditPosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditPosterPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setEditPosterPreview('');
    }
  };

  const toDateInputValue = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
  };

  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    setEditFormData({
      title: event.title || '',
      description: event.description || '',
      date: toDateInputValue(event.date),
      time: event.time || '',
      venue: event.venue || '',
      price: event.price?.toString() || '0',
      isPaid: event.isPaid || false,
      maxParticipants: event.maxParticipants?.toString() || '',
      visibility: event.visibility || 'open-to-all',
      registrationDeadline: toDateInputValue(event.registrationDeadline),
    });
    setEditPosterPreview(event.poster || '');
    if (editFileInputRef.current) editFileInputRef.current.value = '';
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editFormData.title || !editFormData.date) {
      toast({ variant: "destructive", description: "Title and date are required." });
      return;
    }

    setEditSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', editFormData.title);
      formDataToSend.append('description', editFormData.description);
      formDataToSend.append('date', editFormData.date);
      formDataToSend.append('time', editFormData.time);
      formDataToSend.append('venue', editFormData.venue);
      formDataToSend.append('isPaid', editFormData.isPaid);
      formDataToSend.append('price', editFormData.price);
      formDataToSend.append('maxParticipants', editFormData.maxParticipants || '');
      formDataToSend.append('visibility', editFormData.visibility);
      formDataToSend.append('registrationDeadline', editFormData.registrationDeadline || '');

      if (editFileInputRef.current?.files?.[0]) {
        formDataToSend.append('poster', editFileInputRef.current.files[0]);
      }

      await eventsApi.updateEvent(editingEvent._id, formDataToSend);

      toast({ title: "Success", description: "Event updated successfully." });
      setEditModalOpen(false);
      fetchMyEvents();
    } catch (err) {
      console.error('Update event error:', err);
      toast({
        variant: "destructive",
        description: err.response?.data?.message || "Failed to update event.",
      });
    } finally {
      setEditSaving(false);
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

    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(formData.registrationDeadline) < today) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Registration deadline must be today or later",
      });
      return;
    }

    setCreating(true);
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
    } finally {
      setCreating(false);
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
            {[
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'pending', label: 'Pending Approval' },
              { key: 'history', label: 'Event History' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`pb-2 pt-1 text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === key
                    ? 'border-b-2 border-primary text-primary'
                    : 'border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm placeholder-slate-400 shadow-sm"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Events List */}
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
                  {/* Status & Visibility */}
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
                      {event.status === 'approved' ? 'CONFIRMED' : event.status === 'pending' ? 'PENDING APPROVAL' : event.status?.toUpperCase() || 'REJECTED'}
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

                  {/* Details Grid */}
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

                  {/* Progress Bar */}
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
                  <div className="flex gap-2 justify-end mt-auto pt-2 flex-wrap">
                    {activeTab === 'upcoming' && (
                      <AddToCalendarButton event={event} size="sm" />
                    )}
                    {activeTab !== 'history' && (
                      <button
                        onClick={() => handleOpenEdit(event)}
                        className="h-8 px-3 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit
                      </button>
                    )}
                    {activeTab === 'history' && event.status === 'approved' && (
                      <button
                        onClick={() => handleViewFeedback(event)}
                        className="h-8 px-3 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-medium hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">star</span>
                        View Feedback
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-10 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-xs">
          © 2024 ClubHub Academic Event Management. All rights reserved.
          <div className="flex justify-center gap-5 mt-2">
            <a href="#" className="hover:text-primary transition-colors">Help Center</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          </div>
        </footer>
      </div>

      {/* ── Create Event Modal ── */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Event</h2>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Event Poster (optional)</label>
                <div className="relative group w-full aspect-[16/9] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="w-full h-full bg-center bg-cover" style={{ backgroundImage: posterPreview ? `url(${posterPreview})` : 'url(https://via.placeholder.com/1200x675?text=Upload+Poster)' }} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-slate-100">
                      Upload Poster
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePosterChange} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Event Title</label>
                <input name="title" value={formData.title} onChange={handleFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white" placeholder="Annual STEM Symposium 2024" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Location</label>
                <input name="venue" value={formData.venue} onChange={handleFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white" placeholder="Main Auditorium" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Visibility</label>
                <select name="visibility" value={formData.visibility} onChange={handleFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white" required>
                  <option value="open-to-all">Public (Anyone can see & register)</option>
                  <option value="club-only">Club Only (Members only)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Event Date</label>
                  <input name="date" type="date" value={formData.date} onChange={handleFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Event Time</label>
                  <input name="time" type="time" value={formData.time} onChange={handleFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Registration Deadline</label>
                <input name="registrationDeadline" type="date" value={formData.registrationDeadline} onChange={handleFormChange}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white ${formData.registrationDeadline && new Date(formData.registrationDeadline) < new Date(new Date().toDateString()) ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`} required />
                {formData.registrationDeadline && new Date(formData.registrationDeadline) < new Date(new Date().toDateString()) && (
                  <p className="text-red-500 text-xs mt-1">Deadline must be today or later</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Price (₹)</label>
                  <input name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white" placeholder="0 for free" />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="isPaid" name="isPaid" checked={formData.isPaid} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPaid: checked }))} />
                    <Label htmlFor="isPaid" className="text-sm font-medium">This is a paid event</Label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Max Participants</label>
                <input name="maxParticipants" type="number" min="1" value={formData.maxParticipants} onChange={handleFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white" placeholder="Leave blank for unlimited" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Description</label>
                <textarea name="description" value={formData.description} onChange={handleFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white min-h-[100px]" placeholder="Describe your event..." />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="px-5 py-2 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
                  {creating && <div className="border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin" />}
                  {creating ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Event Modal ── */}
      {editModalOpen && editingEvent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Event</h2>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Poster */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Event Poster (leave blank to keep existing)</label>
                <div className="relative group w-full aspect-[16/9] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="w-full h-full bg-center bg-cover" style={{ backgroundImage: editPosterPreview ? `url(${editPosterPreview})` : 'url(https://via.placeholder.com/1200x675?text=No+Poster)' }} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-slate-100">
                      Change Poster
                      <input ref={editFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleEditPosterChange} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Event Title</label>
                <input name="title" value={editFormData.title} onChange={handleEditFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Location</label>
                <input name="venue" value={editFormData.venue} onChange={handleEditFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Visibility</label>
                <select name="visibility" value={editFormData.visibility} onChange={handleEditFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white">
                  <option value="open-to-all">Public (Anyone can see & register)</option>
                  <option value="club-only">Club Only (Members only)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Event Date</label>
                  <input name="date" type="date" value={editFormData.date} onChange={handleEditFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Event Time</label>
                  <input name="time" type="time" value={editFormData.time} onChange={handleEditFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Registration Deadline</label>
                <input name="registrationDeadline" type="date" value={editFormData.registrationDeadline} onChange={handleEditFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Price (₹)</label>
                  <input name="price" type="number" min="0" step="0.01" value={editFormData.price} onChange={handleEditFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white" />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="editIsPaid" checked={editFormData.isPaid} onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, isPaid: checked }))} />
                    <Label htmlFor="editIsPaid" className="text-sm font-medium">Paid event</Label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Max Participants</label>
                <input name="maxParticipants" type="number" min="1" value={editFormData.maxParticipants} onChange={handleEditFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white" placeholder="Leave blank for unlimited" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5">Description</label>
                <textarea name="description" value={editFormData.description} onChange={handleEditFormChange} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none dark:bg-slate-800 dark:text-white min-h-[100px]" />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                <button type="button" onClick={() => setEditModalOpen(false)} className="px-5 py-2 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={editSaving} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
                  {editSaving && <div className="border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin" />}
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Viewer Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Event Feedback</DialogTitle>
            {feedbackEvent && <p className="text-sm text-muted-foreground truncate">{feedbackEvent.title}</p>}
          </DialogHeader>

          {feedbackLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !feedbackData || feedbackData.summary.count === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <div className="text-4xl mb-3">⭐</div>
              <p className="font-medium">No feedback yet</p>
              <p className="text-sm mt-1">Students who attended this event can leave ratings.</p>
            </div>
          ) : (
            <div className="space-y-6 py-2">
              {/* Summary */}
              <div className="flex items-center gap-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                <div className="text-center">
                  <p className="text-4xl font-black text-amber-600">{feedbackData.summary.avgRating}</p>
                  <div className="flex justify-center mt-1">
                    {[1,2,3,4,5].map((s) => (
                      <svg key={s} className="h-4 w-4" fill={s <= Math.round(feedbackData.summary.avgRating) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{feedbackData.summary.count} review{feedbackData.summary.count !== 1 ? 's' : ''}</p>
                </div>
                {/* Distribution bars */}
                <div className="flex-1 space-y-1.5">
                  {[5,4,3,2,1].map((star) => {
                    const count = feedbackData.summary.distribution[star] || 0;
                    const pct = feedbackData.summary.count ? Math.round((count / feedbackData.summary.count) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-muted-foreground text-right">{star}</span>
                        <div className="flex-1 h-2 rounded-full bg-amber-100 dark:bg-amber-900/30 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual reviews */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Reviews</p>
                {feedbackData.feedback.map((f) => (
                  <div key={f._id} className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{f.student?.name}</p>
                        <p className="text-xs text-muted-foreground">{f.student?.rollNumber}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((s) => (
                          <svg key={s} className="h-3.5 w-3.5" fill={s <= f.rating ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    {f.review && <p className="text-sm text-foreground/80 leading-relaxed">"{f.review}"</p>}
                    <p className="text-[10px] text-muted-foreground">{new Date(f.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
