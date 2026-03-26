// src/pages/student/StudentMyEvents.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CertificateTemplate from '../../components/common/CertificateTemplate';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Calendar,
  QrCode,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Award,
} from 'lucide-react';
import AddToCalendarButton from '../../components/common/AddToCalendarButton';
import FeedbackModal from '../../components/common/FeedbackModal';
import { StarDisplay } from '../../components/common/StarRating';
import { useToast } from "@/components/ui/useToast";
import eventsApi from '../../api/eventsApi';

export default function StudentMyEvents() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState("registered");
  const [registered, setRegistered] = useState([]);
  const [attended, setAttended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState('');
  const [selectedEventTitle, setSelectedEventTitle] = useState('');

  // Certificate
  const [certData, setCertData] = useState(null);
  const [certId, setCertId] = useState('');
  const [certLoading, setCertLoading] = useState(null);
  const certRef = useRef(null);

  // Feedback
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackEvent, setFeedbackEvent] = useState(null);
  const [myRatings, setMyRatings] = useState({}); // { eventId: rating }

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const [regRes, attRes] = await Promise.all([
        eventsApi.getRegisteredEvents(),
        eventsApi.getAttendedEvents(),
      ]);
      setRegistered(regRes.data.registered || []);
      const attendedList = attRes.data.attended || [];
      setAttended(attendedList);

      // Load my ratings for all attended events
      const ratings = {};
      await Promise.allSettled(
        attendedList.map(async (ev) => {
          const r = await eventsApi.getMyFeedback(ev._id);
          if (r.data.feedback) ratings[ev._id] = r.data.feedback.rating;
        })
      );
      setMyRatings(ratings);
    } catch (err) {
      console.error('Fetch my events error:', err);
      setError('Failed to load your events. Please try again.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch events.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewQr = (event) => {
    if (!event.qrCode) {
      toast({
        variant: "destructive",
        title: "No QR Code",
        description: "QR code not available for this registration.",
      });
      return;
    }
    setSelectedQrCode(event.qrCode);
    setSelectedEventTitle(event.title);
    setQrDialogOpen(true);
  };

  const handleDownloadCertificate = async (event) => {
    setCertLoading(event._id);
    try {
      const res = await eventsApi.getCertificateData(event._id);
      const id = `CH-${event._id.toString().slice(-6).toUpperCase()}-${new Date(res.data.data.attendedAt).getFullYear()}`;
      setCertId(id);
      setCertData(res.data.data);

      // Wait for React to render the hidden certificate div
      await new Promise(resolve => setTimeout(resolve, 400));

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fffef7',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);

      const safeName = (event.title || 'Event').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      pdf.save(`Certificate_${safeName}.pdf`);

      toast({ description: 'Certificate downloaded successfully!' });
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to generate certificate.',
      });
    } finally {
      setCertLoading(null);
      setCertData(null);
      setCertId('');
    }
  };

  // Filter events based on search
  const filteredRegistered = registered.filter(event =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAttended = attended.filter(event =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Define displayedEvents BEFORE using it in pagination
  const displayedEvents = tab === "registered" ? filteredRegistered : filteredAttended;

  // Pagination logic (NOW safe)
  const totalPages = Math.ceil(displayedEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = displayedEvents.slice(startIndex, startIndex + itemsPerPage);

  return (
    <DashboardLayout title="My Events">
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <main className="flex-1 max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 py-8 space-y-8">
          {/* Heading + Search + Refresh */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                My Events
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your registered activities and event history.
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={fetchMyEvents}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your events..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-10"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex gap-8 overflow-x-auto">
              <button
                className={`flex items-center gap-2 pb-4 pt-2 font-bold text-sm whitespace-nowrap border-b-4 ${
                  tab === 'registered' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => {
                  setTab("registered");
                  setCurrentPage(1);
                }}
              >
                <Calendar className="h-5 w-5" />
                Registered Upcoming
                <Badge className="bg-primary text-white text-xs px-2 py-0.5">{filteredRegistered.length}</Badge>
              </button>
              <button
                className={`flex items-center gap-2 pb-4 pt-2 font-bold text-sm whitespace-nowrap border-b-4 ${
                  tab === 'attended' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => {
                  setTab("attended");
                  setCurrentPage(1);
                }}
              >
                <span className="material-symbols-outlined text-xl">history</span>
                Attended
                <Badge className="bg-primary text-white text-xs px-2 py-0.5">{filteredAttended.length}</Badge>
              </button>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : paginatedEvents.length === 0 ? (
            <div className="text-center py-32 text-muted-foreground bg-muted/30 rounded-xl border border-border">
              <Calendar className="h-16 w-16 mx-auto mb-6 opacity-60" />
              <h3 className="text-2xl font-medium">
                {tab === "registered" ? "No upcoming registered events" : "No attended events yet"}
              </h3>
              <p className="mt-3 text-lg">
                {tab === "registered"
                  ? "Browse and register for events to see them here."
                  : "Attend events to see them here."}
              </p>
              {tab === "registered" && (
                <Button className="mt-6" onClick={() => navigate('/student/events')}>
                  Browse Events
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground">Event Name</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground">Date & Time</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground">Host Club</th>
                      {tab === "registered" && (
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground text-right">Access</th>
                      )}
                      {tab === "attended" && (
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-foreground text-right">Certificate</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedEvents.map((event) => (
                      <tr key={event._id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-foreground font-semibold">{event.title || 'Untitled Event'}</span>
                            <span className="text-xs text-muted-foreground mt-1">
                              {event.category || 'Event'} • {event.type || ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-foreground text-sm">
                              {event.date ? new Date(event.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }) : 'N/A'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {event.time || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <Badge variant="outline" className="px-3 py-1 text-xs">
                            {event.clubName || 'Club Not Available'}
                          </Badge>
                        </td>
                        {tab === "registered" && (
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <AddToCalendarButton event={event} size="sm" />
                              <Button
                                size="sm"
                                className={`gap-2 ${event.qrCode ? 'bg-primary hover:bg-primary/90' : 'bg-muted hover:bg-muted/80'}`}
                                onClick={() => handleViewQr(event)}
                                disabled={!event.qrCode}
                              >
                                <QrCode className="h-4 w-4" />
                                {event.qrCode ? 'View QR' : 'No QR'}
                              </Button>
                            </div>
                          </td>
                        )}
                        {tab === "attended" && (
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {/* Rating display / Rate button */}
                              {myRatings[event._id] ? (
                                <button
                                  onClick={() => { setFeedbackEvent(event); setFeedbackModalOpen(true); }}
                                  className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                                  title="Edit your rating"
                                >
                                  {[1,2,3,4,5].map((s) => (
                                    <svg key={s} className="h-4 w-4" fill={s <= myRatings[event._id] ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                    </svg>
                                  ))}
                                  <span className="ml-1">{myRatings[event._id]}/5</span>
                                </button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setFeedbackEvent(event); setFeedbackModalOpen(true); }}
                                  className="gap-1.5 border-amber-300 text-amber-600 hover:bg-amber-50 hover:border-amber-400"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                  </svg>
                                  Rate
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => handleDownloadCertificate(event)}
                                disabled={certLoading === event._id}
                                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                              >
                                {certLoading === event._id
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <Award className="h-4 w-4" />
                                }
                                {certLoading === event._id ? 'Generating...' : 'Certificate'}
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && displayedEvents.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-8">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <span className="text-sm font-medium text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </main>

        {/* Feedback Modal */}
        <FeedbackModal
          open={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          event={feedbackEvent}
          onSubmitted={({ rating }) => {
            if (feedbackEvent) {
              setMyRatings((prev) => ({ ...prev, [feedbackEvent._id]: rating }));
            }
          }}
        />

        {/* Hidden certificate div — captured by html2canvas for PDF generation */}
        {certData && (
          <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
            <CertificateTemplate ref={certRef} data={certData} certId={certId} />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto border-t border-border py-10 px-6 md:px-10">
          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex flex-col items-center md:items-start gap-2">
              <p>© 2024 ClubHub Academic Event System</p>
              <p className="text-xs italic">Version 1.0.3</p>
            </div>
            <div className="flex flex-wrap gap-6 justify-center md:justify-end">
              <a href="#" className="hover:text-primary transition-colors">Support Center</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Event Guidelines</a>
            </div>
          </div>
        </footer>

        {/* QR Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold">
                QR Code - {selectedEventTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="py-8 flex flex-col items-center gap-6">
              {selectedQrCode ? (
                <>
                  <div className="p-4 bg-white rounded-xl shadow-lg border border-border">
                    <img
                      src={selectedQrCode}
                      alt="Your Attendance QR Code"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground max-w-xs">
                    Show this QR code at the event entrance for quick attendance marking
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p>Loading QR code...</p>
                </div>
              )}
            </div>
            <DialogFooter className="sm:justify-center">
              <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}