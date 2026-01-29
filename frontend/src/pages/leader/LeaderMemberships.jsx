// src/pages/leader/LeaderMemberships.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, XCircle, AlertCircle, Search, RefreshCw, UserX } from 'lucide-react';
import { useToast } from "@/components/ui/useToast";
import clubsApi from '@/api/clubsApi';

export default function LeaderMemberships() {
  const { toast } = useToast();

  const [clubId, setClubId] = useState(null);
  const [clubName, setClubName] = useState('Loading...');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState('joining');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await clubsApi.getClubMembershipData();

      console.log('Full membership data:', response.data); // Debug

      setClubId(response.data.clubId);
      setClubName(response.data.clubName || 'Your Club');
      setPendingRequests(response.data.pendingRequests || []);
      setMembers(response.data.members || []);
      setHistory(response.data.history || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load membership data.');
    } finally {
      setLoading(false);
    }
  };

  // Search filter
  const filterBySearch = (list) => {
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(item => {
      const person = item.student || item; // members have direct fields
      return (
        (person.name || '').toLowerCase().includes(term) ||
        (person.email || '').toLowerCase().includes(term) ||
        (person.rollNumber || '').toLowerCase().includes(term)
      );
    });
  };

  const filteredPending = filterBySearch(pendingRequests);
  const filteredMembers = filterBySearch(members);
  const filteredHistory = filterBySearch(history);

  // Pagination
  const paginate = (list) => {
    const start = (currentPage - 1) * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
  };

  const paginatedPending = paginate(filteredPending);
  const paginatedMembers = paginate(filteredMembers);
  const paginatedHistory = paginate(filteredHistory);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const handleApprove = async (requestId) => {
    if (!window.confirm('Approve this membership request?')) return;
    setActionLoading(true);
    try {
      await clubsApi.reviewRequest(requestId, { action: 'approve' });
      toast({ title: "Success", description: "Approved!" });
      fetchAllData();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to approve",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Reject this request? Cannot be undone.')) return;
    setActionLoading(true);
    try {
      await clubsApi.reviewRequest(requestId, { action: 'reject' });
      toast({ title: "Success", description: "Rejected!" });
      fetchAllData();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to reject",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!clubId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Club ID not loaded. Refresh and try again.",
      });
      return;
    }
    if (!window.confirm('Remove this member? Cannot be undone.')) return;

    setActionLoading(true);
    try {
      await clubsApi.removeMember(clubId, userId);
      toast({ title: "Success", description: "Member removed!" });
      fetchAllData();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to remove member",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout title="Membership Management">
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold">
            {clubName} - Membership Management
          </h1>
          <Button
            variant="outline"
            className="gap-2"
            onClick={fetchAllData}
            disabled={loading || actionLoading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or roll no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-100 text-green-800 rounded-xl border border-green-300">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="joining">Joining Requests</TabsTrigger>
            <TabsTrigger value="members">Club Membership</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Tab 1: Joining Requests */}
          <TabsContent value="joining">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : paginatedPending.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-muted/30 rounded-xl border">
                No pending membership requests.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPending.map((req) => (
                      <TableRow key={req._id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{req.student?.name || 'N/A'}</TableCell>
                        <TableCell>{req.student?.email || 'N/A'}</TableCell>
                        <TableCell>{req.student?.rollNumber || 'N/A'}</TableCell>
                        <TableCell>
                          {req.requestedAt ? new Date(req.requestedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right space-x-3">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={actionLoading}>
                                Approve
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Approve Request</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Approve <strong>{req.student?.name || 'this student'}</strong> to join {clubName}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(req._id)}>
                                  Confirm Approve
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" disabled={actionLoading}>
                                Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject Request</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Reject <strong>{req.student?.name || 'this student'}</strong> from joining {clubName}? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleReject(req._id)}>
                                  Confirm Reject
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {Math.ceil(filteredPending.length / itemsPerPage) > 1 && (
                  <div className="flex justify-center items-center gap-6 mt-8">
                    <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-sm font-medium">Page {currentPage} of {Math.ceil(filteredPending.length / itemsPerPage)}</span>
                    <Button variant="outline" size="icon" disabled={currentPage === Math.ceil(filteredPending.length / itemsPerPage)} onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredPending.length / itemsPerPage), p + 1))}>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Club Membership Management */}
          <TabsContent value="members">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : paginatedMembers.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-muted/30 rounded-xl border">
                No current members yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Requested At</TableHead>
                      <TableHead>Reviewed/Joined At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMembers.map((member) => (
                      <TableRow key={member._id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{member.name || 'N/A'}</TableCell>
                        <TableCell>{member.email || 'N/A'}</TableCell>
                        <TableCell>{member.rollNumber || 'N/A'}</TableCell>
                        <TableCell>
                          {member.requestedAt 
                            ? new Date(member.requestedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {member.reviewedAt || member.joinedAt 
                            ? new Date(member.reviewedAt || member.joinedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" disabled={actionLoading}>
                                <UserX className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Remove <strong>{member.name || 'this member'}</strong> from {clubName}? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleRemoveMember(member._id)}>
                                  Confirm Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {Math.ceil(filteredMembers.length / itemsPerPage) > 1 && (
                  <div className="flex justify-center items-center gap-6 mt-8">
                    <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-sm font-medium">Page {currentPage} of {Math.ceil(filteredMembers.length / itemsPerPage)}</span>
                    <Button variant="outline" size="icon" disabled={currentPage === Math.ceil(filteredMembers.length / itemsPerPage)} onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredMembers.length / itemsPerPage), p + 1))}>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Tab 3: History */}
          <TabsContent value="history">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : paginatedHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-muted/30 rounded-xl border">
                No history found.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedHistory.map((req) => (
                      <TableRow key={req._id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{req.student?.name || 'N/A'}</TableCell>
                        <TableCell>{req.student?.email || 'N/A'}</TableCell>
                        <TableCell>{req.student?.rollNumber || 'N/A'}</TableCell>
                        <TableCell>
                          {req.requestedAt ? new Date(req.requestedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={req.status === 'approved' ? 'default' : 'destructive'}>
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {Math.ceil(filteredHistory.length / itemsPerPage) > 1 && (
                  <div className="flex justify-center items-center gap-6 mt-8">
                    <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-sm font-medium">Page {currentPage} of {Math.ceil(filteredHistory.length / itemsPerPage)}</span>
                    <Button variant="outline" size="icon" disabled={currentPage === Math.ceil(filteredHistory.length / itemsPerPage)} onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredHistory.length / itemsPerPage), p + 1))}>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}