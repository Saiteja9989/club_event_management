// src/pages/student/StudentClubs.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { useToast } from "@/components/ui/useToast";
import clubsApi from '../../api/clubsApi';

// Simple hash function to generate consistent color per club name
const getAvatarColor = (name) => {
  if (!name) return 'from-gray-400 to-gray-600';
  const colors = [
    'from-indigo-400 to-indigo-600',
    'from-teal-400 to-teal-600',
    'from-orange-400 to-orange-600',
    'from-rose-400 to-rose-600',
    'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600',
    'from-purple-400 to-purple-600',
    'from-amber-400 to-amber-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function StudentClubs() {
  const { toast } = useToast();

  const [availableToJoin, setAvailableToJoin] = useState([]);
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [alreadyMember, setAlreadyMember] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await clubsApi.getAllClubsForStudents();

      if (response.data?.success) {
        setAvailableToJoin(response.data.clubsAvailableToJoin || []);
        setPending(response.data.clubsReqPendingForAdminApproval || []);
        setHistory(response.data.clubsApprovedAndRejected || []);
        setAlreadyMember(response.data.clubsThatAreAlreadyMember || []);
      } else {
        throw new Error(response.data?.message || 'Failed to load clubs');
      }
    } catch (err) {
      console.error('Fetch clubs error:', err);
      setError(err.response?.data?.message || 'Failed to load clubs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async (clubId, clubName) => {
    if (!window.confirm(`Send join request to "${clubName}"?`)) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await clubsApi.requestJoin(clubId);
      setSuccess(`Join request sent to ${clubName}! Waiting for approval.`);
      toast({
        title: "Request Sent",
        description: `Your request to join ${clubName} is now pending.`,
      });
      fetchClubs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send request.';
      setError(msg);
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: msg,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Unified search filter
  const filterClubs = (clubs) => {
    if (!searchQuery) return clubs;
    const query = searchQuery.toLowerCase();
    return clubs.filter(club =>
      club.name?.toLowerCase().includes(query) ||
      club.description?.toLowerCase().includes(query) ||
      club.leader?.name?.toLowerCase().includes(query)
    );
  };

  const filteredAvailable = filterClubs(availableToJoin);
  const filteredPending = filterClubs(pending);
  const filteredHistory = filterClubs(history);
  const filteredMember = filterClubs(alreadyMember);

  return (
    <DashboardLayout title="My Clubs & Requests">
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <main className="flex-1 max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 py-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                My Clubs & Requests
              </h1>
              <p className="text-muted-foreground mt-2">
                Browse, join, and manage your club memberships and requests.
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={fetchClubs}
              disabled={loading || actionLoading}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 rounded-xl border border-green-200 dark:border-green-800/50">
              <CheckCircle2 className="h-5 w-5" />
              {success}
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
          </div>

          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="inline-flex border-b border-border w-full justify-start rounded-none bg-transparent p-0 mb-6 overflow-x-auto">
              <TabsTrigger value="browse" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary pb-4 pt-2 font-medium">
                Browse Clubs
              </TabsTrigger>
              <TabsTrigger value="member" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary pb-4 pt-2 font-medium">
                My Clubs
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary pb-4 pt-2 font-medium">
                Pending
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary pb-4 pt-2 font-medium">
                History
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Browse Clubs (Available to Join) */}
            <TabsContent value="browse">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : filteredAvailable.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-xl border border-border">
                  <Search className="h-16 w-16 mx-auto mb-4 opacity-60" />
                  <h3 className="text-xl font-medium">No clubs available to join</h3>
                  <p className="mt-3">Check back later or adjust your search.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAvailable.map(club => (
                    <Card key={club._id} className="overflow-hidden hover:shadow-lg transition-all border border-border group">
                      <div className={`h-48 relative overflow-hidden bg-gradient-to-br ${getAvatarColor(club.name)} flex items-center justify-center`}>
                        {club.poster ? (
                          <img
                            src={club.poster}
                            alt={club.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }} // fallback if image fails
                          />
                        ) : (
                          <div className="text-8xl font-bold text-white/70 drop-shadow-lg">
                            {club.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                          {club.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {club.description || 'No description available'}
                        </p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            {club.memberCount} members
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleRequestJoin(club._id, club.name)}
                            disabled={actionLoading}
                          >
                            Request to Join
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab 2: My Clubs (Already Member) */}
            <TabsContent value="member">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : filteredMember.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-xl border border-border">
                  <UserPlus className="h-16 w-16 mx-auto mb-4 opacity-60" />
                  <h3 className="text-xl font-medium">You are not in any club yet</h3>
                  <p className="mt-3">Join clubs from the Browse Clubs tab.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Club Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Leader</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMember.map(club => (
                        <TableRow key={club._id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {club.name?.charAt(0).toUpperCase()}
                              </div>
                              {club.name}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md truncate">{club.description || '-'}</TableCell>
                          <TableCell>{club.leader?.name || 'N/A'}</TableCell>
                          <TableCell>{club.memberCount}</TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                              <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                              Member
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Tab 3: Pending */}
            <TabsContent value="pending">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : filteredPending.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-xl border border-border">
                  <Clock className="h-16 w-16 mx-auto mb-4 opacity-60" />
                  <h3 className="text-xl font-medium">No pending requests</h3>
                  <p className="mt-3">Send requests from Browse Clubs.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Club Name</TableHead>
                        <TableHead>Requested At</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPending.map(club => (
                        <TableRow key={club._id}>
                          <TableCell className="font-medium">{club.name}</TableCell>
                          <TableCell>
                            {club.requestedAt ? new Date(club.requestedAt).toLocaleDateString('en-IN') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30">
                              <span className="size-1.5 rounded-full bg-yellow-500 mr-1.5"></span>
                              Pending
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Tab 4: History */}
            <TabsContent value="history">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-xl border border-border">
                  <Clock className="h-16 w-16 mx-auto mb-4 opacity-60" />
                  <h3 className="text-xl font-medium">No history yet</h3>
                  <p className="mt-3">Your approved and rejected requests will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Club Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested At</TableHead>
                        <TableHead>Reviewed At</TableHead>
                        <TableHead>Reason (if rejected)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map(club => (
                        <TableRow key={club._id}>
                          <TableCell className="font-medium">{club.name}</TableCell>
                          <TableCell>
                            {club.requestStatus === 'approved' ? (
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30">
                                <span className="size-1.5 rounded-full bg-green-500 mr-1.5"></span>
                                Approved
                              </div>
                            ) : (
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                                <span className="size-1.5 rounded-full bg-red-500 mr-1.5"></span>
                                Rejected
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{club.requestedAt ? new Date(club.requestedAt).toLocaleDateString('en-IN') : 'N/A'}</TableCell>
                          <TableCell>{club.reviewedAt ? new Date(club.reviewedAt).toLocaleDateString('en-IN') : '-'}</TableCell>
                          <TableCell className="text-sm text-destructive truncate max-w-xs">
                            {club.rejectionReason || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Pagination Placeholder */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-8">
            <p>Showing results • Page 1 of 1</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" disabled>
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-white">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="icon" disabled>
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </Button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto px-6 md:px-10 py-8 border-t border-border bg-background">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2024 ClubHub Academic Management System. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors">Help Center</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </footer>
      </div>
    </DashboardLayout>
  );
}