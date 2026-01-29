// src/pages/leader/LeaderAttendance.jsx
import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import eventsApi from '@/api/eventsApi';
import { useToast } from "@/components/ui/useToast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  RefreshCw,
  QrCode,
  Download,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import * as XLSX from 'xlsx';

export default function LeaderAttendance() {
  const { toast } = useToast();

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [qrInput, setQrInput] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    fetchEvents();
  }, [page]);

  // Real-time search filter
  useEffect(() => {
    if (!events.length) return;

    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFilteredEvents(events);
      return;
    }

    const filtered = events.filter(event =>
      event.title?.toLowerCase().includes(q) ||
      event.description?.toLowerCase().includes(q) ||
      event.venue?.toLowerCase().includes(q)
    );

    setFilteredEvents(filtered);
  }, [searchQuery, events]);

  // QR scanner effect
  useEffect(() => {
    if (!scanModalOpen) return;

    const timer = setTimeout(() => {
      const reader = document.getElementById('qr-reader');
      if (!reader) return;

      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }

      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          videoConstraints: { facingMode: "environment" },
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          setQrInput(decodedText.trim());
          toast({ title: "Success", description: "QR code scanned!" });
        },
        () => {} // ignore errors
      );
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scanModalOpen]);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const res = await eventsApi.getMyEvents();

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to load events');
      }

      let allEvents = [
        ...(res.data.data.approvedUpcomingEvents || []),
        ...(res.data.data.completedEvents || []).filter(e => {
          const eventDate = new Date(e.date);
          const now = new Date();
          return (now - eventDate) < 30 * 24 * 60 * 60 * 1000; // last 30 days
        }),
      ];

      // Sort by date descending (newest first)
      allEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Client-side pagination
      const start = (page - 1) * pageSize;
      const paginated = allEvents.slice(start, start + pageSize);

      setEvents(paginated);
      setFilteredEvents(paginated);
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

  const getStatusBadge = (event) => {
    const now = new Date();
    const eventDate = new Date(event.date);

    if (eventDate.toDateString() === now.toDateString()) {
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Live Today</Badge>;
    }

    if (event.status !== 'approved') {
      return <Badge variant="outline">Not Approved</Badge>;
    }

    const eventTime = new Date(`${event.date}T${event.time || '00:00'}`);

    if (eventTime < now) {
      return <Badge variant="secondary">Past Event</Badge>;
    }

    const isLive = eventTime <= now && now <= new Date(eventTime.getTime() + 4 * 60 * 60 * 1000);
    if (isLive) {
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Live Now</Badge>;
    }

    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Upcoming</Badge>;
  };

  const openScanner = (event) => {
    setSelectedEvent(event);
    setQrInput('');
    setScanModalOpen(true);
  };

  const markAttendance = async () => {
    if (!qrInput.trim()) {
      toast({ variant: "destructive", description: "No QR code data" });
      return;
    }

    try {
      await eventsApi.markAttendance(selectedEvent._id, qrInput.trim());
      toast({ title: "Success", description: "Attendance marked!" });
      setScanModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast({
        variant: "destructive",
        description: err.response?.data?.message || "Failed to mark attendance",
      });
    }
  };

  const downloadAttendance = async (event) => {
    try {
      const res = await eventsApi.getAttendedStudents(event._id);
      const list = res.data?.data || [];

      if (list.length === 0) {
        toast({ description: "No one has attended this event yet." });
        return;
      }

      const data = list.map(s => ({
        "Student Name": s.name || "Unknown",
        "Roll No": s.rollNumber || "-",
        "Email": s.email || "-",
        "Attended At": s.attendedAt
          ? new Date(s.attendedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
          : "-"
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");

      const safeName = (event.title || "Event").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
      XLSX.writeFile(wb, `${safeName}_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({ description: "Attendance list downloaded!" });
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to download attendance list.",
      });
    }
  };

  return (
    <DashboardLayout title="Mark Attendance">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
          <a href="#" className="hover:text-primary transition-colors">Home</a>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <a href="#" className="hover:text-primary transition-colors">Attendance</a>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-slate-900 dark:text-white font-medium">Events List</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Mark Attendance
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage and record attendance for your club's events. Use QR scanning for rapid check-ins.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchEvents}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Events
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search by title, description, or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <TableHead className="px-6 py-4 text-slate-900 dark:text-white text-xs md:text-sm font-bold uppercase tracking-wider">
                    EVENT TITLE
                  </TableHead>
                  <TableHead className="px-6 py-4 text-slate-900 dark:text-white text-xs md:text-sm font-bold uppercase tracking-wider">
                    STATUS
                  </TableHead>
                  <TableHead className="px-6 py-4 text-slate-900 dark:text-white text-xs md:text-sm font-bold uppercase tracking-wider">
                    DATE & TIME
                  </TableHead>
                  <TableHead className="px-6 py-4 text-slate-900 dark:text-white text-xs md:text-sm font-bold uppercase tracking-wider">
                    VENUE
                  </TableHead>
                  <TableHead className="px-6 py-4 text-slate-900 dark:text-white text-xs md:text-sm font-bold uppercase tracking-wider">
                    ATTENDANCE
                  </TableHead>
                  <TableHead className="px-6 py-4 text-right text-slate-900 dark:text-white text-xs md:text-sm font-bold uppercase tracking-wider">
                    ACTIONS
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex justify-center items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span>Loading events...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">
                      No events match your search
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <TableCell className="px-6 py-5 font-medium text-slate-900 dark:text-white">
                        {event.title}
                        {event.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                            {event.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        {getStatusBadge(event)}
                      </TableCell>
                      <TableCell className="px-6 py-5 text-slate-600 dark:text-slate-300 text-sm">
                        {event.date ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBD'}
                        {' • '}
                        {event.time || 'TBD'}
                      </TableCell>
                      <TableCell className="px-6 py-5 text-slate-600 dark:text-slate-300 text-sm">
                        {event.venue || 'TBD'}
                      </TableCell>
                      <TableCell className="px-6 py-5 font-medium text-slate-900 dark:text-white">
                        {(event.attendedCount)} / {(event.totalRegistrations)}
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-white gap-1.5 px-4"
                            onClick={() => openScanner(event)}
                          >
                            <QrCode className="h-4 w-4" />
                            Scan QR
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9"
                            onClick={() => downloadAttendance(event)}
                            title="Download attended students list"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && filteredEvents.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing 1 to {filteredEvents.length} of {filteredEvents.length} events
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-4 py-2 text-sm font-medium bg-primary text-white rounded">
                  {page}
                </span>
                <Button variant="outline" size="icon" disabled={true}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-10 flex justify-center">
          <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 max-w-2xl border border-primary/20">
            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-full">
              <HelpCircle className="text-primary text-3xl" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-slate-900 dark:text-white font-bold mb-1">
                Need help marking attendance?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Download the ClubHub Mobile App for leaders to scan member IDs offline or print attendance sheets for manual entry.
              </p>
            </div>
            <Button variant="outline" className="whitespace-nowrap px-5">
              View Guide
            </Button>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {scanModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Scan QR – {selectedEvent?.title}
              </h2>
              <button
                onClick={() => setScanModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col items-center justify-center">
              <div id="qr-reader" className="w-full max-w-[320px] aspect-square bg-black rounded-lg overflow-hidden" />

              <div className="mt-6 w-full max-w-[320px]">
                <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">
                  Or paste QR code manually
                </label>
                <Input
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Paste QR data here..."
                  className="text-base py-6"
                />
              </div>

              {qrInput && (
                <Button
                  className="mt-4 w-full max-w-[320px]"
                  onClick={markAttendance}
                >
                  Mark as Attended
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}