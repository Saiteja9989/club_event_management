// src/pages/student/StudentEventDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  IndianRupee,
  Users,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Tag,
  User,
} from 'lucide-react';
import eventsApi from '../../api/eventsApi';
import { useToast } from '@/components/ui/useToast';
import AddToCalendarButton from '../../components/common/AddToCalendarButton';

export default function StudentEventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await eventsApi.getEventById(eventId);
        setEvent(res.data.event);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [eventId]);

  const handleFreeRegister = async () => {
    setRegistering(true);
    try {
      await eventsApi.registerForEvent(eventId);
      toast({ title: 'Registered!', description: "Check 'My Events' for your QR code." });
      // Refresh to update isRegistered state
      const res = await eventsApi.getEventById(eventId);
      setEvent(res.data.event);
    } catch (err) {
      toast({ variant: 'destructive', description: err.response?.data?.message || 'Registration failed.' });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Event Details">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !event) {
    return (
      <DashboardLayout title="Event Details">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-4">
          <AlertCircle className="h-14 w-14 mx-auto text-destructive" />
          <h2 className="text-2xl font-bold">Event not found</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => navigate('/student/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Events
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const formattedDate = new Date(event.date).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const seatsLeft = event.seatsLeft;
  const seatsFull = seatsLeft !== null && seatsLeft <= 0;
  const seatsUrgent = seatsLeft !== null && seatsLeft > 0 && seatsLeft <= 10;

  return (
    <DashboardLayout title="Event Details">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* Back button */}
        <button
          onClick={() => navigate('/student/events')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </button>

        {/* Hero */}
        <div className="rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
          {event.poster ? (
            <div className="relative h-72 md:h-96 w-full">
              <img
                src={event.poster}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2">
                {event.isPaid ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-white">PAID</span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white">FREE</span>
                )}
                {event.club?.name && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
                    {event.club.name}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="h-48 w-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center">
              <Calendar className="h-20 w-20 text-primary/30" />
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {!event.poster && (
                <>
                  {event.isPaid ? (
                    <Badge className="bg-primary text-white">PAID</Badge>
                  ) : (
                    <Badge className="bg-green-500 text-white">FREE</Badge>
                  )}
                  {event.club?.name && (
                    <Badge variant="outline">{event.club.name}</Badge>
                  )}
                </>
              )}
              {seatsLeft !== null && !seatsFull && (
                <Badge variant={seatsUrgent ? 'destructive' : 'secondary'} className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {seatsLeft} seats left{seatsUrgent ? ' — Almost Full!' : ''}
                </Badge>
              )}
              {seatsFull && (
                <Badge variant="destructive">Fully Booked</Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-6">
              {event.title}
            </h1>

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Date</p>
                  <p className="font-semibold text-foreground">{formattedDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Time</p>
                  <p className="font-semibold text-foreground">{event.time || 'TBD'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Venue</p>
                  <p className="font-semibold text-foreground">{event.venue || 'TBD'}</p>
                </div>
              </div>
              {event.maxParticipants && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                  <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Capacity</p>
                    <p className="font-semibold text-foreground">
                      {event.totalRegistrations || 0} / {event.maxParticipants} registered
                    </p>
                  </div>
                </div>
              )}
              {event.isPaid && event.price > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <IndianRupee className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Entry Fee</p>
                    <p className="text-2xl font-black text-primary">₹{event.price?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )}
              {event.club?.leader?.name && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                  <User className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Organized by</p>
                    <p className="font-semibold text-foreground">{event.club.leader.name}</p>
                    {event.club?.name && (
                      <p className="text-xs text-muted-foreground">{event.club.name}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  About this Event
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="border-t border-border pt-6">
              {event.isRegistered ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    You're registered for this event
                  </div>
                  <Button variant="outline" onClick={() => navigate('/student/my-events')}>
                    View in My Events →
                  </Button>
                  <AddToCalendarButton event={event} size="md" />
                </div>
              ) : seatsFull ? (
                <Button size="lg" className="w-full sm:w-auto" disabled>
                  Fully Booked
                </Button>
              ) : event.isPaid ? (
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Entry fee</p>
                    <p className="text-3xl font-black text-primary">₹{event.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <Button
                    size="lg"
                    className="sm:flex-1 text-lg font-semibold"
                    onClick={() => navigate(`/student/pay/${event._id}`)}
                  >
                    <IndianRupee className="h-5 w-5 mr-1" />
                    Pay & Register
                  </Button>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg font-semibold"
                  onClick={handleFreeRegister}
                  disabled={registering}
                >
                  {registering ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Registering...</>
                  ) : (
                    'Register Free'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
