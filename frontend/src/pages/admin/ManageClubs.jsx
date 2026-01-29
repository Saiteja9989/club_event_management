// src/pages/admin/ManageClubs.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useToast } from "../../components/ui/useToast"; // ← added
import clubsApi from '../../api/clubsApi';
import adminApi from '../../api/adminApi';

export default function ManageClubs() {
  const { toast } = useToast(); // ← added

  const [clubs, setClubs] = useState([]);
  const [filteredClubs, setFilteredClubs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '', leaderId: 'none' });
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clubToDelete, setClubToDelete] = useState(null);

  const [clubSearch, setClubSearch] = useState('');
  const [clubPage, setClubPage] = useState(1);
  const clubsPerPage = 10;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [assignLeaderOpen, setAssignLeaderOpen] = useState(false);
  const [selectedNewLeader, setSelectedNewLeader] = useState('');

  const [memberSearch, setMemberSearch] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const membersPerPage = 10;

  const [eventStatusFilter, setEventStatusFilter] = useState('All');
  const [eventPage, setEventPage] = useState(1);
  const eventsPerPage = 10;

  useEffect(() => {
    fetchClubs();
    fetchStudents();
  }, []);

  useEffect(() => {
    let result = [...clubs];
    if (clubSearch.trim()) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(clubSearch.toLowerCase()) ||
        c.description?.toLowerCase().includes(clubSearch.toLowerCase())
      );
    }
    setFilteredClubs(result);
    setClubPage(1);
  }, [clubs, clubSearch]);

  const clubsTotalPages = Math.ceil(filteredClubs.length / clubsPerPage);
  const paginatedClubs = filteredClubs.slice(
    (clubPage - 1) * clubsPerPage,
    clubPage * clubsPerPage
  );

  useEffect(() => {
    if (detailsOpen && selectedClub) {
      const fresh = clubs.find(c => c._id === selectedClub._id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(selectedClub)) {
        setSelectedClub(fresh);
      }
    }
  }, [clubs, detailsOpen, selectedClub]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const response = await clubsApi.getAllClubs();
      setClubs(response.data.clubs || response.data || []);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load clubs.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await adminApi.getAllUsers();
      setStudents(res.data.users.filter(u => u.role === 'student'));
    } catch (err) {
      console.error('Failed to load students');
    }
  };

  const handleViewDetails = (club) => {
    setSelectedClub(club);
    setMemberSearch('');
    setMemberPage(1);
    setEventStatusFilter('All');
    setEventPage(1);
    setSelectedNewLeader('');
    setDetailsOpen(true);
  };

  const handleAssignLeader = async () => {
    if (!selectedNewLeader) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a leader.",
      });
      return;
    }

    setActionLoading(true);
    try {
      await clubsApi.assignLeader(selectedClub._id, { userId: selectedNewLeader });
      toast({
        title: "Success",
        description: "Leader assigned successfully!",
      });
      setAssignLeaderOpen(false);
      setSelectedNewLeader('');
      const updatedClub = { ...selectedClub, leader: students.find(s => s._id === selectedNewLeader) };
      setSelectedClub(updatedClub);
      await fetchClubs();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to assign leader.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the club?')) return;

    setActionLoading(true);
    try {
      await clubsApi.removeMember(selectedClub._id, userId);
      toast({
        title: "Success",
        description: "Member removed successfully!",
      });
      const updatedMembers = selectedClub.members.filter(m => m._id !== userId);
      setSelectedClub({ ...selectedClub, members: updatedMembers });
      await fetchClubs();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to remove member.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (userId, isCurrentLeader) => {
    const newRole = isCurrentLeader ? 'Member' : 'Leader';
    if (!window.confirm(`Change role to ${newRole}?`)) return;

    setActionLoading(true);
    try {
      await clubsApi.changeMemberRole(selectedClub._id, userId, newRole);
      toast({
        title: "Success",
        description: `Role changed to ${newRole.toUpperCase()} successfully!`,
      });
      let updatedClub = { ...selectedClub };
      if (newRole === 'Leader') {
        const newLeader = updatedClub.members.find(m => m._id === userId);
        updatedClub.leader = newLeader;
      } else if (isCurrentLeader) {
        updatedClub.leader = null;
      }
      setSelectedClub(updatedClub);
      await fetchClubs();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to change role.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newClub.name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Club name is required.",
      });
      return;
    }

    setActionLoading(true);
    try {
      const data = {
        name: newClub.name.trim(),
        description: newClub.description.trim(),
      };
      if (newClub.leaderId && newClub.leaderId !== 'none') {
        data.leaderId = newClub.leaderId;
      }

      await clubsApi.createClub(data);
      toast({
        title: "Success",
        description: "Club created successfully!",
      });
      setNewClub({ name: '', description: '', leaderId: 'none' });
      setOpenCreateDialog(false);
      await fetchClubs();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to create club.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!clubToDelete) return;

    setActionLoading(true);
    try {
      await clubsApi.deleteClub(clubToDelete._id);
      toast({
        title: "Success",
        description: "Club deleted successfully!",
      });
      setDeleteDialogOpen(false);
      setClubToDelete(null);
      await fetchClubs();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to delete club.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getPaginatedMembers = () => {
    let filteredMembers = selectedClub?.members || [];
    if (memberSearch.trim()) {
      filteredMembers = filteredMembers.filter(m =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(memberSearch.toLowerCase())
      );
    }
    const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
    const paginatedMembers = filteredMembers.slice(
      (memberPage - 1) * membersPerPage,
      memberPage * membersPerPage
    );
    return { paginatedMembers, totalPages };
  };

  const getPaginatedEvents = () => {
    let filteredEvents = selectedClub?.events || [];
    if (eventStatusFilter !== 'All') {
      filteredEvents = filteredEvents.filter(e => e.status?.toLowerCase() === eventStatusFilter.toLowerCase());
    }
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
    const paginatedEvents = filteredEvents.slice(
      (eventPage - 1) * eventsPerPage,
      eventPage * eventsPerPage
    );
    return { paginatedEvents, totalPages };
  };

  return (
    <DashboardLayout title="Manage Clubs">
      <div className="max-w-[1200px] mx-auto py-8 px-6 lg:px-10">
        {/* Header & Stats */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-[#131117] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Manage Clubs</h1>
            <p className="text-[#6b6487] dark:text-[#a19db8] text-base font-normal leading-normal">
              Oversee and organize all academic student organizations
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1 px-5 py-3 rounded-xl bg-white dark:bg-[#1c192b] border border-[#dedce5] dark:border-[#2d2a3d] shadow-sm">
              <p className="text-[#6b6487] dark:text-[#a19db8] text-xs font-semibold uppercase tracking-wider">Active Clubs</p>
              <p className="text-2xl font-bold leading-tight">{clubs.length}</p>
            </div>
            <div className="flex flex-col gap-1 px-5 py-3 rounded-xl bg-white dark:bg-[#1c192b] border border-[#dedce5] dark:border-[#2d2a3d] shadow-sm">
              <p className="text-[#6b6487] dark:text-[#a19db8] text-xs font-semibold uppercase tracking-wider">Total Members</p>
              <p className="text-2xl font-bold leading-tight">
                {clubs.reduce((acc, c) => acc + (c.members?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 mb-6 rounded-xl bg-white dark:bg-[#1c192b] border border-[#dedce5] dark:border-[#2d2a3d] shadow-sm">
          <div className="flex flex-1 w-full md:w-auto items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6487] text-lg">search</span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-background-light dark:bg-background-dark border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                placeholder="Search clubs, leaders or categories..."
                type="text"
                value={clubSearch}
                onChange={(e) => setClubSearch(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-[#dedce5] dark:border-[#2d2a3d] rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors">
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Filters
            </button>
          </div>
          <button
            onClick={() => setOpenCreateDialog(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Add Club
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-5xl text-primary">refresh</span>
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-16 text-[#6b6487] dark:text-[#a19db8] text-lg">
            No clubs found. Add one to get started.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#dedce5] dark:border-[#2d2a3d] bg-white dark:bg-[#1c192b] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background-light/50 dark:bg-background-dark/30 border-b border-[#dedce5] dark:border-[#2d2a3d]">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#6b6487] dark:text-[#a19db8]">Club Name</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#6b6487] dark:text-[#a19db8]">Leader</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#6b6487] dark:text-[#a19db8]">Members</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#6b6487] dark:text-[#a19db8]">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#6b6487] dark:text-[#a19db8] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dedce5] dark:divide-[#2d2a3d]">
                  {paginatedClubs.map((club) => (
                    <tr key={club._id} className="group hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">group</span>
                          </div>
                          <span className="font-semibold text-sm">{club.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {club.leader?.name || 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-[#6b6487] dark:text-[#a19db8]">
                        {club.members?.length || 0}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-emerald-500"></span>
                          <span className="text-xs font-medium">Active</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(club)}
                            className="p-2 rounded-lg hover:bg-white dark:hover:bg-[#141121] text-[#6b6487] dark:text-[#a19db8] hover:text-primary transition-all border border-transparent hover:border-[#dedce5] dark:hover:border-[#2d2a3d]"
                          >
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setClubToDelete(club);
                              setDeleteDialogOpen(true);
                            }}
                            className="p-2 rounded-lg hover:bg-white dark:hover:bg-[#141121] text-[#6b6487] dark:text-[#a19db8] hover:text-red-500 transition-all border border-transparent hover:border-[#dedce5] dark:hover:border-[#2d2a3d]"
                          >
                            <span className="material-symbols-outlined text-xl">archive</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 border-t border-[#dedce5] dark:border-[#2d2a3d] bg-background-light/30 dark:bg-background-dark/30">
              <p className="text-sm text-[#6b6487] dark:text-[#a19db8]">
                Showing <span className="font-bold text-[#131117] dark:text-white">{(clubPage - 1) * clubsPerPage + 1}</span> to{' '}
                <span className="font-bold text-[#131117] dark:text-white">{Math.min(clubPage * clubsPerPage, filteredClubs.length)}</span> of{' '}
                <span className="font-bold text-[#131117] dark:text-white">{filteredClubs.length}</span> clubs
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={clubPage === 1}
                  onClick={() => setClubPage(p => p - 1)}
                  className="flex items-center justify-center size-9 rounded-lg border border-[#dedce5] dark:border-[#2d2a3d] hover:bg-white dark:hover:bg-[#1c192b] disabled:opacity-50 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <span className="flex items-center justify-center size-9 rounded-lg border-2 border-primary bg-primary text-white font-bold text-sm">
                  {clubPage}
                </span>
                <button
                  disabled={clubPage === clubsTotalPages}
                  onClick={() => setClubPage(p => p + 1)}
                  className="flex items-center justify-center size-9 rounded-lg border border-[#dedce5] dark:border-[#2d2a3d] hover:bg-white dark:hover:bg-[#1c192b] transition-all"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Club Modal */}
        {openCreateDialog && (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-[560px] rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <button onClick={() => setOpenCreateDialog(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="px-8 pt-8 pb-4">
                <div className="flex flex-col gap-1">
                  <h1 className="text-[#131117] dark:text-zinc-100 tracking-tight text-[28px] font-bold leading-tight">Create New Club</h1>
                  <p className="text-[#6b6487] dark:text-zinc-400 text-sm font-normal leading-normal">
                    Fill in the details below to register a new student organization in the system.
                  </p>
                </div>
              </div>
              <div className="px-8 py-4 space-y-6 overflow-y-auto max-h-[70vh]">
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col w-full">
                    <p className="text-[#131117] dark:text-zinc-200 text-sm font-semibold leading-normal pb-1">Club Name</p>
                    <input
                      className="w-full rounded-lg text-[#131117] dark:text-zinc-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dedce5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-primary h-12 placeholder:text-[#6b6487] dark:placeholder:text-zinc-500 px-4 text-base transition-all"
                      placeholder="e.g., Chess Club"
                      value={newClub.name}
                      onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                    />
                  </label>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col w-full">
                    <p className="text-[#131117] dark:text-zinc-200 text-sm font-semibold leading-normal pb-1">Club Description</p>
                    <textarea
                      className="w-full min-h-[120px] rounded-lg text-[#131117] dark:text-zinc-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dedce5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-primary p-4 text-base placeholder:text-[#6b6487] dark:placeholder:text-zinc-500 transition-all resize-none"
                      placeholder="Describe the club's purpose, goals, and membership requirements..."
                      value={newClub.description}
                      onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                    />
                  </label>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col w-full">
                    <p className="text-[#131117] dark:text-zinc-200 text-sm font-semibold leading-normal pb-1">Assign Leader</p>
                    <select
                      className="w-full h-12 px-4 rounded-lg border border-[#dedce5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none appearance-none text-[#131117] dark:text-zinc-100 text-base transition-all"
                      value={newClub.leaderId}
                      onChange={(e) => setNewClub({ ...newClub, leaderId: e.target.value })}
                    >
                      <option value="none">Select a student (or assign later)</option>
                      {students.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.rollNumber || 'N/A'})
                        </option>
                      ))}
                    </select>
                    <p className="text-[#6b6487] dark:text-zinc-500 text-[12px] mt-1">
                      The assigned leader will have admin permissions for this club.
                    </p>
                  </label>
                </div>
              </div>
              <div className="px-8 py-6 mt-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-4">
                <button
                  onClick={() => setOpenCreateDialog(false)}
                  className="px-6 h-11 rounded-lg border border-[#dedce5] dark:border-zinc-700 text-[#131117] dark:text-zinc-200 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={actionLoading}
                  className="px-6 h-11 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {actionLoading && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                  Create Club
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1c192b] rounded-xl shadow-2xl max-w-md w-full p-8 space-y-6">
              <h2 className="text-2xl font-bold text-[#121117] dark:text-white">Delete Club</h2>
              <p className="text-[#656487] dark:text-gray-400">
                Are you sure you want to delete <strong>{clubToDelete?.name}</strong>? This cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setDeleteDialogOpen(false)}
                  className="px-6 h-11 rounded-lg border border-[#dedce5] dark:border-[#2d2a3d] hover:bg-[#f6f6f8] dark:hover:bg-[#141121] font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="px-6 h-11 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center gap-2"
                >
                  {actionLoading && <span className="material-symbols-outlined animate-spin">refresh</span>}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {detailsOpen && selectedClub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-10">
            <div className="flex h-full w-full max-w-[1200px] flex-col overflow-hidden rounded-xl bg-white dark:bg-[#1b1a2e] shadow-2xl">
              <header className="flex items-center justify-between border-b border-solid border-[#f1f0f4] dark:border-white/10 px-8 py-5 sticky top-0 bg-white dark:bg-[#1b1a2e] z-10">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <h1 className="text-[#121117] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
                      {selectedClub.name}
                    </h1>
                    <p className="text-[#656487] dark:text-gray-400 text-sm font-medium">Overview & Management</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex h-10 items-center justify-center rounded-lg px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                    Edit Club Details
                  </button>
                  <button
                    onClick={() => setDetailsOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f1f0f4] dark:bg-white/10 text-[#121117] dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Left Column */}
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-[#121117] dark:text-white text-[20px] font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">info</span>
                        Club Information
                      </h2>
                      <div className="border-t border-b divide-y border-[#dcdce5] dark:border-white/10">
                        <div className="py-3 flex justify-between">
                          <p className="text-[#656487] dark:text-gray-400 text-xs uppercase tracking-wider">Description</p>
                          <p className="text-[#121117] dark:text-white text-sm">{selectedClub.description || 'N/A'}</p>
                        </div>
                        <div className="py-3 flex justify-between">
                          <p className="text-[#656487] dark:text-gray-400 text-xs uppercase tracking-wider">Founded</p>
                          <p className="text-[#121117] dark:text-white text-sm">
                            {new Date(selectedClub.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="py-3 flex justify-between">
                          <p className="text-[#656487] dark:text-gray-400 text-xs uppercase tracking-wider">Members</p>
                          <p className="text-[#121117] dark:text-white text-sm">{selectedClub.members?.length || 0}</p>
                        </div>
                        <div className="py-3 flex justify-between">
                          <p className="text-[#656487] dark:text-gray-400 text-xs uppercase tracking-wider">Events</p>
                          <p className="text-[#121117] dark:text-white text-sm">{selectedClub.events?.length || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-[#121117] dark:text-white text-[20px] font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person</span>
                        Leader Details
                      </h2>
                      {selectedClub.leader ? (
                        <div className="rounded-xl border border-[#dcdce5] dark:border-white/10 p-5 bg-background-light/50 dark:bg-white/5 flex items-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-primary">person</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg text-[#121117] dark:text-white">{selectedClub.leader.name}</h3>
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                                Leader
                              </span>
                            </div>
                            <a
                              href={`mailto:${selectedClub.leader.email}`}
                              className="text-primary text-sm hover:underline flex items-center gap-1 mt-1"
                            >
                              <span className="material-symbols-outlined text-[16px]">mail</span>
                              {selectedClub.leader.email}
                            </a>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAssignLeaderOpen(true)}
                          className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90"
                        >
                          Assign Leader
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Members */}
                  <div className="lg:col-span-2 space-y-10">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h2 className="text-[#121117] dark:text-white text-base font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-base">groups</span>
                          Members ({selectedClub.members?.length || 0})
                        </h2>
                        <div className="flex items-center gap-1.5">
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#656487] text-sm">
                              search
                            </span>
                            <input
                              className="h-7 w-44 rounded-md border-none bg-[#f1f0f4] dark:bg-white/10 pl-8 pr-2.5 text-[11px] focus:ring-1 focus:ring-primary outline-none"
                              placeholder="Search..."
                              value={memberSearch}
                              onChange={(e) => {
                                setMemberSearch(e.target.value);
                                setMemberPage(1);
                              }}
                            />
                          </div>
                          <button className="h-7 w-7 flex items-center justify-center rounded-md bg-[#f1f0f4] dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20">
                            <span className="material-symbols-outlined text-sm">filter_list</span>
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-[#dcdce5] dark:border-white/10">
                        <table className="w-full min-w-[620px] text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="bg-background-light/70 dark:bg-white/5 border-b border-[#dcdce5] dark:border-white/10">
                              <th className="px-3 py-2 font-semibold text-[#121117] dark:text-white w-1/4 truncate">Name</th>
                              <th className="px-3 py-2 font-semibold text-[#121117] dark:text-white w-1/4 truncate">Email</th>
                              <th className="px-3 py-2 font-semibold text-[#121117] dark:text-white w-20">Role</th>
                              <th className="px-3 py-2 font-semibold text-[#121117] dark:text-white w-24">Join Date</th>
                              <th className="px-3 py-2 font-semibold text-[#121117] dark:text-white w-20">Status</th>
                              <th className="px-3 py-2 font-semibold text-[#121117] dark:text-white text-right w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#dcdce5] dark:divide-white/10">
                            {getPaginatedMembers().paginatedMembers.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-3 py-4 text-center text-[#656487] dark:text-gray-400 text-[11px]">
                                  No members
                                </td>
                              </tr>
                            ) : (
                              getPaginatedMembers().paginatedMembers.map((member) => (
                                <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                  <td className="px-3 py-2 font-medium text-[#121117] dark:text-white truncate max-w-[120px]">
                                    {member.name}
                                  </td>
                                  <td className="px-3 py-2 text-[#656487] dark:text-gray-400 truncate max-w-[140px]">
                                    {member.email}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-medium ${
                                        member._id === selectedClub.leader?._id
                                          ? 'bg-primary/10 text-primary'
                                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      {member._id === selectedClub.leader?._id ? 'Leader' : 'Member'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-[#656487] dark:text-gray-400">
                                    {new Date(member.joinedAt || selectedClub.createdAt).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-[9px] font-medium text-green-700 dark:text-green-400">
                                      Active
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right space-x-1">
                                    <button
                                      onClick={() => handleChangeRole(member._id, member._id === selectedClub.leader?._id)}
                                      className="p-1 rounded hover:bg-white dark:hover:bg-[#141121] text-[#6b6487] dark:text-[#a19db8] hover:text-primary transition-all"
                                      title="Change Role"
                                    >
                                      <span className="material-symbols-outlined text-base">swap_horiz</span>
                                    </button>
                                    <button
                                      onClick={() => handleRemoveMember(member._id)}
                                      className="p-1 rounded hover:bg-white dark:hover:bg-[#141121] text-[#6b6487] dark:text-[#a19db8] hover:text-red-500 transition-all"
                                      title="Remove"
                                    >
                                      <span className="material-symbols-outlined text-base">person_remove</span>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 text-[11px]">
                        <p className="text-[#656487] dark:text-gray-400">
                          Showing <strong className="text-[#121117] dark:text-white">{getPaginatedMembers().paginatedMembers.length}</strong> of{' '}
                          <strong className="text-[#121117] dark:text-white">{selectedClub.members?.length || 0}</strong>
                          {memberSearch.trim() ? ' (filtered)' : ''}
                        </p>

                        <div className="flex items-center gap-1">
                          <button
                            disabled={memberPage === 1}
                            onClick={() => setMemberPage(p => Math.max(1, p - 1))}
                            className="size-7 flex items-center justify-center rounded-md border border-[#dedce5] dark:border-[#2d2a3d] hover:bg-white dark:hover:bg-[#1c192b] disabled:opacity-50 transition-all text-xs"
                          >
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                          </button>
                          <span className="size-7 flex items-center justify-center rounded-md border-2 border-primary bg-primary text-white font-medium text-xs">
                            {memberPage}
                          </span>
                          <button
                            disabled={memberPage >= getPaginatedMembers().totalPages}
                            onClick={() => setMemberPage(p => p + 1)}
                            className="size-7 flex items-center justify-center rounded-md border border-[#dedce5] dark:border-[#2d2a3d] hover:bg-white dark:hover:bg-[#1c192b] disabled:opacity-50 transition-all text-xs"
                          >
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Events Table (kept as is - can compact later if needed) */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-[#121117] dark:text-white text-[20px] font-bold flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">event</span>
                          Club Events
                        </h2>
                        <select
                          value={eventStatusFilter}
                          onChange={(e) => {
                            setEventStatusFilter(e.target.value);
                            setEventPage(1);
                          }}
                          className="h-9 px-4 rounded-lg bg-[#f1f0f4] dark:bg-white/10 text-sm focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="All">All</option>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-[#dcdce5] dark:border-white/10">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="bg-background-light dark:bg-white/5 border-b border-[#dcdce5] dark:border-white/10">
                              <th className="px-4 py-3 font-bold text-[#121117] dark:text-white">Event Title</th>
                              <th className="px-4 py-3 font-bold text-[#121117] dark:text-white">Date</th>
                              <th className="px-4 py-3 font-bold text-[#121117] dark:text-white">Attendance</th>
                              <th className="px-4 py-3 font-bold text-[#121117] dark:text-white">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#dcdce5] dark:divide-white/10">
                            {getPaginatedEvents().paginatedEvents.map((event) => (
                              <tr key={event._id}>
                                <td className="px-4 py-3 font-medium text-[#121117] dark:text-white">{event.title || 'Untitled'}</td>
                                <td className="px-4 py-3 text-[#656487] dark:text-gray-400">
                                  {event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-[#656487] dark:text-gray-400">{event.attendance || 0}</td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                                    {event.status || 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between mt-1 px-1 text-xs">
                        <p className="text-[#656487] dark:text-gray-400">
                          Showing {getPaginatedEvents().paginatedEvents.length} of {selectedClub.events?.length || 0} events
                        </p>
                        <div className="flex gap-1">
                          <button
                            disabled={eventPage === 1}
                            onClick={() => setEventPage(p => p - 1)}
                            className="h-8 w-8 rounded bg-[#f1f0f4] dark:bg-white/10 text-primary font-bold disabled:opacity-50"
                          >
                            &lt;
                          </button>
                          <span className="h-8 w-8 rounded bg-primary text-white flex items-center justify-center font-bold">
                            {eventPage}
                          </span>
                          <button
                            disabled={eventPage >= getPaginatedEvents().totalPages}
                            onClick={() => setEventPage(p => p + 1)}
                            className="h-8 w-8 rounded bg-[#f1f0f4] dark:bg-white/10 text-primary font-bold disabled:opacity-50"
                          >
                            &gt;
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <footer className="flex items-center justify-end border-t border-solid border-[#f1f0f4] dark:border-white/10 px-8 py-4 gap-4 bg-background-light dark:bg-[#1b1a2e]">
                <button className="px-5 h-10 rounded-lg text-sm font-bold text-[#656487] dark:text-gray-400 hover:bg-[#f1f0f4] dark:hover:bg-white/10 transition-colors">
                  Download Report
                </button>
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="px-5 h-10 rounded-lg text-sm font-bold bg-[#121117] dark:bg-white text-white dark:text-[#121117] hover:opacity-90 transition-opacity"
                >
                  Close Details
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* Assign Leader Modal */}
        {assignLeaderOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-[#1c192b] w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
              <div className="px-8 pt-8 pb-4 relative">
                <button
                  onClick={() => setAssignLeaderOpen(false)}
                  className="absolute top-5 right-6 text-[#6b6487] hover:text-[#131117] dark:text-[#a19db8] dark:hover:text-white"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
                <h1 className="text-3xl font-bold text-[#131117] dark:text-white">Assign Leader</h1>
                <p className="text-[#6b6487] dark:text-[#a19db8] mt-1">
                  Select a student to lead <strong>{selectedClub.name}</strong>.
                </p>
              </div>
              <div className="px-8 py-6 space-y-6">
                <select
                  className="w-full h-12 px-4 rounded-lg border border-[#dedce5] dark:border-[#2d2a3d] bg-white dark:bg-[#141121] focus:ring-2 focus:ring-primary/50 outline-none appearance-none text-[#131117] dark:text-white"
                  value={selectedNewLeader}
                  onChange={(e) => setSelectedNewLeader(e.target.value)}
                >
                  <option disabled value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.rollNumber || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="px-8 py-6 border-t border-[#dedce5] dark:border-[#2d2a3d] bg-[#f6f6f8]/50 dark:bg-[#141121]/50 flex justify-end gap-4">
                <button
                  onClick={() => setAssignLeaderOpen(false)}
                  className="px-6 h-11 rounded-lg border border-[#dedce5] dark:border-[#2d2a3d] text-[#131117] dark:text-white font-bold hover:bg-[#dedce5]/10 dark:hover:bg-white/10 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignLeader}
                  disabled={actionLoading || !selectedNewLeader}
                  className="px-6 h-11 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all disabled:opacity-60 flex items-center gap-2 text-sm"
                >
                  {actionLoading && <span className="material-symbols-outlined animate-spin">refresh</span>}
                  Assign Leader
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}