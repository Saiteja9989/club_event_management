// src/pages/student/BrowseEvents.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  IndianRupee,
  Loader2,
  AlertCircle,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import eventsApi from '../../api/eventsApi';
import { useToast } from "@/components/ui/useToast"; // Correct toast import

export default function BrowseEvents() {
  const navigate = useNavigate();
  const { toast } = useToast(); // Correctly destructured

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registeringId, setRegisteringId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 6;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [clubFilter, setClubFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await eventsApi.getUpcomingEvents();
      const eventList = res.data.upcoming || res.data.events || res.data || [];
      setEvents(eventList);
      setFilteredEvents(eventList);
    } catch (err) {
      console.error('Fetch upcoming events error:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...events];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(term) ||
        event.club?.name?.toLowerCase().includes(term)
      );
    }

    if (clubFilter !== 'all') {
      filtered = filtered.filter(event => event.club?._id === clubFilter);
    }

    if (priceFilter !== 'all') {
      filtered = filtered.filter(event =>
        priceFilter === 'free' ? !event.isPaid : event.isPaid
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }

    setFilteredEvents(filtered);
    setCurrentPage(1);
  }, [searchTerm, clubFilter, priceFilter, categoryFilter, events]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage);

  const handleFreeRegister = async (eventId) => {
    if (registeringId === eventId) return;

    setRegisteringId(eventId);
    setError('');

    try {
      await eventsApi.registerForEvent(eventId);
      toast({
        title: "Registered Successfully",
        description: "Check 'My Registrations' for your QR code.",
      });
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: err.response?.data?.message || 'Please try again.',
      });
    } finally {
      setRegisteringId(null);
    }
  };

  // Helper to get badge details for seats left
  const getBadgeDetails = (seatsLeft) => {
    if (seatsLeft <= 10) {
      return {
        variant: 'destructive',
        label: `${seatsLeft} seats left (Urgent!)`,
      };
    }
    if (seatsLeft <= 50) {
      return {
        variant: 'secondary', // yellow-ish if you have warning variant
        label: `${seatsLeft} seats left`,
      };
    }
    return {
      variant: 'default',
      label: `${seatsLeft} seats left`,
    };
  };

  return (
    <DashboardLayout title="Browse Events">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 lg:px-12 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black dark:text-white">
              Browse Events
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Discover what's happening around campus
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={fetchEvents}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="w-full lg:flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search events, workshops, or clubs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base bg-background border-border"
            />
          </div>

          <Select value={clubFilter} onValueChange={setClubFilter}>
            <SelectTrigger className="w-full lg:w-40 h-12">
              <SelectValue placeholder="Select Club" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clubs</SelectItem>
              {[...new Set(events.map(e => e.club?.name || 'Unknown'))].map(name => (
                <SelectItem key={name} value={events.find(e => e.club?.name === name)?.club?._id || name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-full lg:w-40 h-12">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full lg:w-40 h-12">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="summit">Summit</SelectItem>
              <SelectItem value="fest">Fest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : paginatedEvents.length === 0 ? (
          <div className="text-center py-32 text-muted-foreground bg-muted/30 rounded-xl border border-border">
            <Calendar className="h-16 w-16 mx-auto mb-6 opacity-60" />
            <h3 className="text-2xl font-medium">No events found</h3>
            <p className="mt-3 text-lg">Try adjusting your filters or search.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {paginatedEvents.map((event) => {
              const seatsLeft = ( event.maxParticipants ) - ( event.totalRegistrations || 0 );
              const { variant: seatsVariant, label: seatsLabel } = getBadgeDetails(seatsLeft);

              return (
                <div
                  key={event._id}
                  className="group flex flex-col md:flex-row rounded-xl bg-white dark:bg-slate-900 border border-border overflow-hidden hover:shadow-2xl hover:border-primary/30 transition-all duration-300"
                >
                  {/* Poster */}
                  <div className="md:w-80 h-64 md:h-auto overflow-hidden">
                    {event.poster ? (
                      <img
                        src={event.poster}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center">
                        <Calendar className="h-24 w-24 text-primary/30" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Badges */}
                      <div className="flex flex-wrap gap-3">
                        {event.club?.name && (
                          <Badge variant="outline" className="text-sm font-medium px-3 py-1">
                            {event.club.name}
                          </Badge>
                        )}
                        {/* Free / Paid badge */}
                        {event.isPaid ? (
                          <Badge className="bg-primary text-white px-3 py-1">
                            PAID
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-600 text-white px-3 py-1">
                            FREE
                          </Badge>
                        )}
                        {/* Seats left */}
                        {event.maxParticipants && (
                          <Badge variant={seatsVariant} className="px-3 py-1 flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {seatsLabel}
                          </Badge>
                        )}
                      </div>

                      {/* Title - Black */}
                      <h2 className="text-2xl md:text-3xl font-black tracking-tight text-black dark:text-white group-hover:text-primary transition-colors">
                        {event.title}
                      </h2>

                      {/* Date, Time, Venue */}
                      <div className="space-y-2 text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5" />
                          <span>
                            {new Date(event.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}{' '}
                            • {event.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5" />
                          <span className="line-clamp-1">{event.venue || 'Venue TBD'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1"
                        onClick={() => navigate(`/events/${event._id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="lg"
                        className="flex-1"
                        onClick={() =>
                          event.isPaid
                            ? navigate(`/student/pay/${event._id}`)
                            : handleFreeRegister(event._id)
                        }
                        disabled={registeringId === event._id}
                      >
                        {registeringId === event._id ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Registering...
                          </>
                        ) : event.isPaid ? (
                          <>
                            <IndianRupee className="h-5 w-5 mr-2" />
                            Pay ₹{event.price}
                          </>
                        ) : (
                          'Register Free'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredEvents.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-12">
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
      </div>
    </DashboardLayout>
  );
}

// Helper for seats left badge
function getBadgeDetails(seatsLeft) {
  if (seatsLeft <= 10) {
    return {
      variant: 'destructive',
      label: `${seatsLeft} seats left (Almost Full!)`,
    };
  }
  if (seatsLeft <= 50) {
    return {
      variant: 'secondary', // can customize to warning/yellow if needed
      label: `${seatsLeft} seats left`,
    };
  }
  return {
    variant: 'default',
    label: `${seatsLeft} seats left`,
  };
}