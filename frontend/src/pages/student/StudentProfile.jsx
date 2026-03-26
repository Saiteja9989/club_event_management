import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  Ticket,
  CheckCircle,
  TrendingUp,
  Loader2,
  AlertCircle,
  MapPin,
  ArrowLeft,
  Award,
  Mail,
  Hash,
} from 'lucide-react';
import { useToast } from '@/components/ui/useToast';
import studentApi from '../../api/studentApi';

export default function StudentProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await studentApi.getMyProfile();
        setProfile(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile.');
        toast({ variant: 'destructive', description: 'Could not load profile.' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Generate initials avatar
  const getInitials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  // Color from name for consistent avatar color
  const getAvatarColor = (name = '') => {
    const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#7c3aed', '#db2777'];
    let sum = 0;
    for (const c of name) sum += c.charCodeAt(0);
    return colors[sum % colors.length];
  };

  if (loading) {
    return (
      <DashboardLayout title="My Profile">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout title="My Profile">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-4">
          <AlertCircle className="h-14 w-14 mx-auto text-destructive" />
          <h2 className="text-2xl font-bold">Failed to load profile</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => navigate('/student/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const { name, email, rollNumber, createdAt, isActive, joinedClubs, stats, attendedEvents } = profile;
  const avatarColor = getAvatarColor(name);
  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <DashboardLayout title="My Profile">
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <main className="max-w-[900px] mx-auto px-6 py-10 space-y-8">

          {/* Back button */}
          <button
            onClick={() => navigate('/student/dashboard')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          {/* Profile Header Card */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Cover strip */}
            <div className="h-28 w-full" style={{ background: `linear-gradient(135deg, ${avatarColor}cc, ${avatarColor}44)` }} />

            <div className="px-8 pb-8">
              {/* Avatar */}
              <div className="flex items-end justify-between -mt-12 mb-6">
                <div
                  className="h-24 w-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-background"
                  style={{ background: avatarColor }}
                >
                  {getInitials(name)}
                </div>
                <Badge
                  className={`mb-2 px-3 py-1 text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Name & details */}
              <h1 className="text-3xl font-black text-foreground">{name}</h1>
              <p className="text-sm text-muted-foreground mt-1 capitalize">{profile.role} • Member since {memberSince}</p>

              <div className="mt-5 flex flex-wrap gap-5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>{email}</span>
                </div>
                {rollNumber && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    <span>Roll No: <strong className="text-foreground">{rollNumber}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Clubs Joined', value: stats.clubsJoined, icon: Users, color: 'text-indigo-500' },
              { label: 'Events Registered', value: stats.totalRegistered, icon: Ticket, color: 'text-sky-500' },
              { label: 'Events Attended', value: stats.totalAttended, icon: CheckCircle, color: 'text-emerald-500' },
              { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: TrendingUp, color: 'text-amber-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-card rounded-xl border border-border p-5 flex flex-col gap-2 shadow-sm">
                <Icon className={`h-5 w-5 ${color}`} />
                <p className="text-2xl font-black text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Joined Clubs */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Joined Clubs</h2>
            {joinedClubs.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">You haven't joined any clubs yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/student/clubs')}
                >
                  Browse Clubs
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {joinedClubs.map((club) => (
                  <div key={club._id} className="bg-card rounded-xl border border-border p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: getAvatarColor(club.name) }}
                    >
                      {getInitials(club.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{club.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {club.description || 'No description available.'}
                      </p>
                      {club.createdAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Since {new Date(club.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Attended Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Recently Attended Events</h2>
              <button
                onClick={() => navigate('/student/my-events')}
                className="text-sm text-primary hover:underline"
              >
                View all →
              </button>
            </div>

            {attendedEvents.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No events attended yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/student/events')}
                >
                  Browse Events
                </Button>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border shadow-sm divide-y divide-border">
                {attendedEvents.map((event) => (
                  <div key={event._id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{event.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {event.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {event.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.venue}
                          </span>
                        )}
                      </div>
                    </div>
                    {event.clubName && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {event.clubName}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </DashboardLayout>
  );
}
