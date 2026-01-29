// src/pages/student/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Calendar,
  Ticket,
  TrendingUp,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Bell,
  FileText,
  Bolt,
  Clock,
  MapPin,
} from 'lucide-react';
import studentApi from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState({
    myClubs: 0,
    registeredEvents: 0,
    upcomingEvents: 0,
    attendanceRate: 0,
    upcomingEventList: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let timeoutId;

    const fetchDashboard = async () => {
      timeoutId = setTimeout(() => {
        setLoading(false);
        setError('Request timed out after 10 seconds. Check backend.');
      }, 10000);

      try {
        const response = await studentApi.getDashboardStats();

        if (!response?.data?.success) {
          throw new Error(response?.data?.message || 'API did not return success');
        }

        setData(response.data.data || {
          myClubs: 0,
          registeredEvents: 0,
          upcomingEvents: 0,
          attendanceRate: 0,
          upcomingEventList: [],
          recentActivity: [],
        });
      } catch (err) {
        console.error('FETCH ERROR DETAILS:', err);
        setError(err.message || 'Failed to load dashboard.');
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchDashboard();

    return () => clearTimeout(timeoutId);
  }, []);

  const handleViewEvent = () => navigate(`/student/my-events`);
  const handleBrowseClubs = () => navigate('/clubs');
  const handleBrowseEvents = () => navigate('/student/events');

  // Helper to get activity icon & color
  const getActivityIcon = (type) => {
    switch (type) {
      case 'Registered':
        return <Ticket className="h-5 w-5 text-primary" />;
      case 'Attended':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Announcement':
        return <Bell className="h-5 w-5 text-amber-500" />;
      case 'Approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        {/* Main Content */}
        <main className="flex-1 max-w-[1200px] mx-auto px-6 py-8 space-y-10">
          {/* Greeting */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="border-primary text-primary hover:bg-primary/10"
              onClick={() => navigate('/profile')}
            >
              View Profile
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-8 text-center space-y-4">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                <h3 className="text-xl font-medium text-destructive">Failed to load dashboard</h3>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border border-border/50 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-primary" />
                        <p className="text-lg font-semibold">My Clubs</p>
                      </div>
                    </div>
                    <p className="text-4xl font-black">{data.myClubs}</p>
                    <div className="flex items-center gap-2 mt-2 text-green-600 text-sm font-medium">
                      <TrendingUp className="h-4 w-4" />
                      +1
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/50 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Ticket className="h-6 w-6 text-primary" />
                        <p className="text-lg font-semibold">Registered Events</p>
                      </div>
                    </div>
                    <p className="text-4xl font-black">{data.registeredEvents}</p>
                    <div className="flex items-center gap-2 mt-2 text-green-600 text-sm font-medium">
                      <TrendingUp className="h-4 w-4" />
                      +2
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/50 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-6 w-6 text-primary" />
                        <p className="text-lg font-semibold">Upcoming Events</p>
                      </div>
                    </div>
                    <p className="text-4xl font-black">{data.upcomingEvents}</p>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm font-medium">
                      No change
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/50 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-primary" />
                        <p className="text-lg font-semibold">Attendance Rate</p>
                      </div>
                    </div>
                    <p className="text-4xl font-black">{data.attendanceRate || 0}%</p>
                    <div className="flex items-center gap-2 mt-2 text-green-600 text-sm font-medium">
                      <TrendingUp className="h-4 w-4" />
                      +2%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Grid */}
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Upcoming Events */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Upcoming Events</h2>
                    <Button variant="ghost" onClick={handleBrowseEvents}>
                      See all events <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  {data.upcomingEvents === 0 ? (
                    <Card className="p-10 text-center border-dashed">
                      <Calendar className="h-16 w-16 mx-auto text-muted-foreground/70 mb-4" />
                      <h3 className="text-xl font-medium">No upcoming events yet</h3>
                      <p className="text-muted-foreground mt-2 mb-6">
                        Join events from your clubs or browse open events to get started!
                      </p>
                      <Button onClick={handleBrowseEvents}>Browse Events</Button>
                    </Card>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {data.upcomingEventList.map((event) => (
                        <Card
                          key={event._id}
                          className="overflow-hidden hover:shadow-lg transition-all border border-border/50 group"
                        >
                          <div
                            className="h-48 bg-cover bg-center relative"
                            style={{ backgroundImage: `url(${event.poster || 'https://via.placeholder.com/600x400?text=No+Poster'})` }}
                          >
                            {event.maxParticipants && (
                              <div className="absolute top-3 right-3 bg-red-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <Bolt className="h-3 w-3" />
                                {event.maxParticipants - (event.totalRegistrations || 0)} seats left
                              </div>
                            )}
                          </div>
                          <CardContent className="p-5 space-y-3">
                            <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                              {event.title}
                            </h3>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {event.time}
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {event.venue || 'TBD'}
                              </div>
                              {event.club?.name && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  {event.club.name}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => handleViewEvent()}
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Activity – limited to 4 */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
                  <Card className="border border-border/50">
                    <CardContent className="p-0 divide-y divide-border/50">
                      {data.recentActivity.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          No recent activity yet
                        </div>
                      ) : (
                        data.recentActivity.slice(0, 4).map((activity, idx) => (
                          <div key={idx} className="p-5 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start gap-4">
                              <div className="p-2 bg-primary/10 rounded-full shrink-0">
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{activity.description}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {new Date(activity.timestamp).toLocaleString('en-IN', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Bottom Banner */}
              <div className="rounded-2xl bg-primary text-white px-8 py-12 relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                      Ready to explore more?
                    </h2>
                    <p className="text-primary-foreground/90 max-w-xl text-lg">
                      Join new student organizations and broaden your horizons this semester. Over 50+ active clubs waiting for you.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-6 font-bold"
                    onClick={handleBrowseClubs}
                  >
                    Discover Clubs
                  </Button>
                </div>

                {/* Decorative shapes */}
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
              </div>
            </>
          )}

          {/* Footer */}
          <footer className="py-10 border-t border-border mt-16 text-center text-sm text-muted-foreground">
            <p>ClubHub © 2024 University Student Services</p>
            <div className="flex justify-center gap-6 mt-4">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Help Center</a>
            </div>
          </footer>
        </main>
      </div>
    </DashboardLayout>
  );
}

// Helper for recent activity icons
function getActivityIcon(type) {
  switch (type) {
    case 'Registered':
      return <Ticket className="h-5 w-5 text-primary" />;
    case 'Attended':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'Announcement':
      return <Bell className="h-5 w-5 text-amber-500" />;
    case 'Approved':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    default:
      return <FileText className="h-5 w-5 text-purple-500" />;
  }
}