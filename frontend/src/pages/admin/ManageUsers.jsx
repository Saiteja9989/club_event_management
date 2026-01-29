// src/pages/admin/ManageUsers.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import adminApi from '../../api/adminApi';
import clubsApi from '../../api/clubsApi';
import { useToast } from "../../components/ui/useToast";

export default function ManageUsers() {
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [page, setPage] = useState(1);
  const usersPerPage = 10;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Club table states in modal
  const [clubSearch, setClubSearch] = useState('');
  const [clubPage, setClubPage] = useState(1);
  const clubsPerPage = 8;

  // Event table states in modal
  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('All');
  const [eventPage, setEventPage] = useState(1);
  const eventsPerPage = 8;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = [...users];

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.rollNumber?.toLowerCase().includes(term)
      );
    }

    if (roleFilter !== 'All') {
      result = result.filter((u) => u.role?.toLowerCase() === roleFilter.toLowerCase());
    }

    setFilteredUsers(result);
    setPage(1);
  }, [users, search, roleFilter]);

  const usersTotalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * usersPerPage,
    page * usersPerPage
  );

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAllUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const res = await adminApi.getUserDetails(userId);
      setSelectedUser(res.data.user);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load user details.",
      });
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await adminApi.toggleUserActive(user._id, !user.isActive);
      toast({
        title: "Success",
        description: `User ${user.isActive ? 'blocked' : 'unblocked'} successfully.`,
      });
      await fetchUsers();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user status.",
      });
    }
  };

  const handleViewDetails = async (user) => {
    setSelectedUser(user);
    setClubSearch('');
    setClubPage(1);
    setEventSearch('');
    setEventStatusFilter('All');
    setEventPage(1);
    setDetailsOpen(true);
    await fetchUserDetails(user._id);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await adminApi.deleteUser(userToDelete._id);
      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
      setDeleteUserOpen(false);
      setUserToDelete(null);
      await fetchUsers();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user.",
      });
    }
  };

  const handleRemoveFromClub = async (clubId) => {
    if (!window.confirm('Remove user from this club?')) return;
    try {
      await clubsApi.removeMember(clubId, selectedUser._id);
      toast({
        title: "Success",
        description: "User removed from club.",
      });
      await fetchUserDetails(selectedUser._id);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to remove from club.",
      });
    }
  };

  // Filtered & paginated clubs
  const getFilteredClubs = () => {
    let clubs = selectedUser?.joinedClubs || [];
    if (clubSearch.trim()) {
      const term = clubSearch.toLowerCase();
      clubs = clubs.filter((c) => c.name?.toLowerCase().includes(term));
    }
    const total = clubs.length;
    const start = (clubPage - 1) * clubsPerPage;
    const paginated = clubs.slice(start, start + clubsPerPage);
    return { paginated, total, totalPages: Math.ceil(total / clubsPerPage) };
  };

  // Filtered & paginated events
  const getFilteredEvents = () => {
    let events = selectedUser?.events || [];
    if (eventSearch.trim()) {
      const term = eventSearch.toLowerCase();
      events = events.filter((e) => e.title?.toLowerCase().includes(term));
    }
    if (eventStatusFilter !== 'All') {
      const isPresent = eventStatusFilter === 'Present';
      events = events.filter((e) => e.attended === isPresent);
    }
    const total = events.length;
    const start = (eventPage - 1) * eventsPerPage;
    const paginated = events.slice(start, start + eventsPerPage);
    return { paginated, total, totalPages: Math.ceil(total / eventsPerPage) };
  };

  return (
    <DashboardLayout title="Manage Users">
      <div className="max-w-[1400px] mx-auto py-8 px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-black text-[#131117] dark:text-white leading-tight tracking-[-0.033em]">
              Manage Users
            </h1>
            <p className="text-[#6b6487] dark:text-[#a19db8] text-base mt-1">
              Directory and status administration for all academic members.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1c192b] border border-[#dedce5] dark:border-[#2d2a3d] rounded-lg text-sm font-semibold hover:bg-[#f6f6f8] dark:hover:bg-[#141121] transition-colors">
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Filter
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1c192b] border border-[#dedce5] dark:border-[#2d2a3d] rounded-lg text-sm font-semibold hover:bg-[#f6f6f8] dark:hover:bg-[#141121] transition-colors">
              <span className="material-symbols-outlined text-lg">download</span>
              Export
            </button>
            <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all">
              <span className="material-symbols-outlined">person_add</span>
              Add New User
            </button>
          </div>
        </div>

        {/* Search & Role Filter */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-8 p-4 rounded-xl bg-white dark:bg-[#1c192b] border border-[#dedce5] dark:border-[#2d2a3d] shadow-sm">
          <div className="relative flex-1 max-w-lg">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6b6487] text-lg">
              search
            </span>
            <input
              className="w-full pl-12 pr-4 py-3 bg-[#f6f6f8] dark:bg-[#141121] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
              placeholder="Search by name, email or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-12 px-5 rounded-lg bg-[#f6f6f8] dark:bg-[#141121] border border-[#dedce5] dark:border-[#2d2a3d] text-sm focus:ring-2 focus:ring-primary outline-none"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="student">Student</option>
            <option value="leader">Leader</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-6xl text-primary">refresh</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-[#6b6487] dark:text-[#a19db8] text-lg">
            No users found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#dedce5] dark:border-[#2d2a3d] bg-white dark:bg-[#1c192b] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f6f6f8]/50 dark:bg-[#141121]/30 border-b border-[#dedce5] dark:border-[#2d2a3d]">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6b6487] dark:text-[#a19db8]">USER</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6b6487] dark:text-[#a19db8]">EMAIL / ROLL NO</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6b6487] dark:text-[#a19db8] text-center">ROLE</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6b6487] dark:text-[#a19db8]">CLUBS</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6b6487] dark:text-[#a19db8]">LAST LOGIN</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6b6487] dark:text-[#a19db8] text-center">STATUS</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6b6487] dark:text-[#a19db8] text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dedce5] dark:divide-[#2d2a3d]">
                  {paginatedUsers.map((user) => (
                    <tr key={user._id} className="group hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-center bg-cover border-2 border-primary/20 overflow-hidden">
                            <img
                              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-[#131117] dark:text-white">{user.name}</div>
                            <div className="text-xs text-[#6b6487] dark:text-[#a19db8]">{user.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm text-[#131117] dark:text-white">{user.email}</div>
                        <div className="text-xs text-[#6b6487] dark:text-[#a19db8]">ID: {user.rollNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                            user.role?.toLowerCase() === 'student'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : user.role?.toLowerCase() === 'leader'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {user.role?.toUpperCase() || 'USER'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm text-[#6b6487] dark:text-[#a19db8]">
                          {user.joinedClubs?.length || 0}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-[#6b6487] dark:text-[#a19db8]">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : 'Never'}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={user.isActive ?? true}
                            onChange={() => handleToggleActive(user)}
                          />
                          <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                        </label>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="p-2 hover:bg-white dark:hover:bg-[#141121] rounded-lg text-[#6b6487] dark:text-[#a19db8] hover:text-primary transition-all"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteUserOpen(true);
                            }}
                            className="p-2 hover:bg-white dark:hover:bg-[#141121] rounded-lg text-[#6b6487] dark:text-[#a19db8] hover:text-red-500 transition-all"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[#dedce5] dark:border-[#2d2a3d] bg-[#f6f6f8]/50 dark:bg-[#141121]/50">
              <p className="text-sm text-[#6b6487] dark:text-[#a19db8]">
                Showing{' '}
                <strong className="text-[#131117] dark:text-white">
                  {(page - 1) * usersPerPage + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-[#131117] dark:text-white">
                  {Math.min(page * usersPerPage, filteredUsers.length)}
                </strong>{' '}
                of{' '}
                <strong className="text-[#131117] dark:text-white">{filteredUsers.length}</strong> users
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center justify-center size-9 rounded-lg border border-[#dedce5] dark:border-[#2d2a3d] hover:bg-white dark:hover:bg-[#1c192b] disabled:opacity-50 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <span className="flex items-center justify-center size-9 rounded-lg border-2 border-primary bg-primary text-white font-bold text-sm">
                  {page}
                </span>
                <button
                  disabled={page >= usersTotalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center justify-center size-9 rounded-lg border border-[#dedce5] dark:border-[#2d2a3d] hover:bg-white dark:hover:bg-[#1c192b] transition-all"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="flex items-center gap-4 p-6 rounded-xl bg-white dark:bg-[#1c192b] border border-[#dedce5] dark:border-[#2d2a3d] shadow-sm">
            <div className="size-14 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-3xl">person</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#6b6487] dark:text-[#a19db8] uppercase tracking-wider">Total Students</p>
              <p className="text-3xl font-black text-[#131117] dark:text-white">
                {users.filter(u => u.role?.toLowerCase() === 'student').length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 rounded-xl bg-white dark:bg-[#1c192b] border border-[#dedce5] dark:border-[#2d2a3d] shadow-sm">
            <div className="size-14 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
              <span className="material-symbols-outlined text-3xl">star</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#6b6487] dark:text-[#a19db8] uppercase tracking-wider">Active Leaders</p>
              <p className="text-3xl font-black text-[#131117] dark:text-white">
                {users.filter(u => u.role?.toLowerCase() === 'leader' && u.isActive).length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 rounded-xl bg-white dark:bg-[#1c192b] border border-[#dedce5] dark:border-[#2d2a3d] shadow-sm">
            <div className="size-14 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-600">
              <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#6b6487] dark:text-[#a19db8] uppercase tracking-wider">Staff Admins</p>
              <p className="text-3xl font-black text-[#131117] dark:text-white">
                {users.filter(u => u.role?.toLowerCase() === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────── */}
        {/* USER DETAILS MODAL - WITH PAGINATION & SEARCH */}
        {/* ──────────────────────────────────────────────── */}
        {detailsOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:p-10">
            <div className="bg-white dark:bg-[#1c1a2e] w-full max-w-6xl h-full max-h-[850px] shadow-2xl rounded-xl flex flex-col overflow-hidden border border-[#e5e7eb] dark:border-[#2d2a45]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f0f4] dark:border-[#2d2a45] shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span>
                  <h2 className="text-lg font-bold text-[#131117] dark:text-white">
                    Admin User Management / <span className="text-[#6b6487]">Profile View</span>
                  </h2>
                </div>
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="text-[#6b6487] hover:text-[#131117] dark:hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              {/* Split View */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left - Profile Summary */}
                <aside className="w-1/3 min-w-[320px] bg-[#f9fafb] dark:bg-[#181628] border-r border-[#e5e7eb] dark:border-[#2d2a45] p-8 overflow-y-auto">
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                      <div
                        className="size-32 rounded-full border-4 border-white dark:border-[#2d2a45] shadow-md bg-center bg-cover"
                        style={{
                          backgroundImage: `url(${selectedUser.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(selectedUser.name)})`,
                        }}
                      />
                      <div className="absolute bottom-1 right-1 size-6 bg-green-500 border-4 border-white dark:border-[#181628] rounded-full" />
                    </div>
                    <h3 className="mt-4 text-2xl font-black text-[#131117] dark:text-white text-center">
                      {selectedUser.name}
                    </h3>
                    <div className="mt-2 px-4 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded">
                      {selectedUser.role?.toUpperCase() || 'USER'}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="border-b border-[#e5e7eb] dark:border-[#2d2a45] pb-3">
                      <p className="text-[#6b6487] text-xs font-semibold uppercase tracking-wider mb-1">Roll Number</p>
                      <p className="text-[#131117] dark:text-white font-medium">{selectedUser.rollNumber || 'N/A'}</p>
                    </div>
                    <div className="border-b border-[#e5e7eb] dark:border-[#2d2a45] pb-3">
                      <p className="text-[#6b6487] text-xs font-semibold uppercase tracking-wider mb-1">Department</p>
                      <p className="text-[#131117] dark:text-white font-medium">
                        {selectedUser.department || 'N/A'}
                      </p>
                    </div>
                    <div className="border-b border-[#e5e7eb] dark:border-[#2d2a45] pb-3">
                      <p className="text-[#6b6487] text-xs font-semibold uppercase tracking-wider mb-1">Email</p>
                      <p className="text-[#131117] dark:text-white font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-[#6b6487] text-xs font-semibold uppercase tracking-wider mb-1">Account Created</p>
                      <p className="text-[#131117] dark:text-white font-medium">
                        {new Date(selectedUser.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 flex flex-col gap-3">
                    <button className="w-full bg-primary text-white py-3 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors">
                      Edit Profile
                    </button>
                    <button className="w-full bg-white dark:bg-[#2d2a45] border border-[#e5e7eb] dark:border-[#2d2a45] text-[#131117] dark:text-white py-3 rounded-lg font-bold text-sm hover:bg-gray-50 dark:hover:bg-[#2d2a45]/50 transition-colors">
                      Reset Password
                    </button>
                  </div>
                </aside>

                {/* Right - Clubs & Events with Pagination & Search */}
                <main className="flex-1 overflow-y-auto bg-white dark:bg-[#1c1a2e] custom-scrollbar p-8">
                  {/* Clubs Section */}
                  <section>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <h4 className="text-xl font-bold text-[#131117] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">groups</span>
                        Club Memberships ({selectedUser.joinedClubs?.length || 0})
                      </h4>
                      <button className="text-primary text-sm font-bold hover:underline whitespace-nowrap">
                        View All
                      </button>
                    </div>

                    {/* Club Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                      <div className="relative w-full sm:w-80">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6487] text-lg">
                          search
                        </span>
                        <input
                          className="w-full pl-10 pr-4 py-2.5 bg-[#f6f6f8] dark:bg-[#141121] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                          placeholder="Search club name..."
                          value={clubSearch}
                          onChange={(e) => {
                            setClubSearch(e.target.value);
                            setClubPage(1);
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          disabled={clubPage === 1}
                          onClick={() => setClubPage((p) => Math.max(1, p - 1))}
                          className="flex items-center justify-center size-9 rounded-lg border border-[#dedce5] dark:border-[#2d2a3d] hover:bg-white dark:hover:bg-[#141121] disabled:opacity-50 transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        <span className="text-sm font-medium text-[#6b6487] dark:text-[#a19db8]">
                          Page {clubPage} of {getFilteredClubs().totalPages}
                        </span>
                        <button
                          disabled={clubPage >= getFilteredClubs().totalPages}
                          onClick={() => setClubPage((p) => p + 1)}
                          className="flex items-center justify-center size-9 rounded-lg border border-[#dedce5] dark:border-[#2d2a3d] hover:bg-white dark:hover:bg-[#141121] transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-[#dcdce5] dark:border-white/10">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-[#f9fafb] dark:bg-[#181628] border-b border-[#f1f0f4] dark:border-[#2d2a45]">
                            <th className="py-3 px-4 font-bold text-[#6b6487] dark:text-gray-300">Club Name</th>
                            <th className="py-3 px-4 font-bold text-[#6b6487] dark:text-gray-300">Position</th>
                            <th className="py-3 px-4 font-bold text-[#6b6487] dark:text-gray-300">Joined Date</th>
                            <th className="py-3 px-4 font-bold text-[#6b6487] dark:text-gray-300">Status</th>
                            <th className="py-3 px-4 font-bold text-[#6b6487] dark:text-gray-300 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1f0f4] dark:divide-[#2d2a45]">
                          {getFilteredClubs().paginated.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-10 text-center text-[#6b6487] dark:text-gray-400">
                                {clubSearch ? 'No matching clubs found' : 'No club memberships'}
                              </td>
                            </tr>
                          ) : (
                            getFilteredClubs().paginated.map((club) => (
                              <tr key={club._id} className="hover:bg-gray-50 dark:hover:bg-[#2d2a45]/50 transition-colors">
                                <td className="py-3 px-4 font-medium text-[#131117] dark:text-white">{club.name}</td>
                                <td className="py-3 px-4 text-[#6b6487] dark:text-gray-400">{club.position || 'Member'}</td>
                                <td className="py-3 px-4 text-[#6b6487] dark:text-gray-400">
                                  {club.joinedAt
                                    ? new Date(club.joinedAt).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })
                                    : 'N/A'}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                    Active
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleRemoveFromClub(club._id)}
                                    className="p-2 hover:bg-white dark:hover:bg-[#141121] rounded-lg text-red-500 transition-all"
                                    title="Remove from Club"
                                  >
                                    <span className="material-symbols-outlined text-lg">person_remove</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <p className="mt-3 text-sm text-[#6b6487] dark:text-[#a19db8] text-center">
                      Showing {getFilteredClubs().paginated.length} of {getFilteredClubs().total} clubs
                    </p>
                  </section>

                  {/* Events Section */}
                  <section className="mt-12">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <h4 className="text-xl font-bold text-[#131117] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">event_available</span>
                        Event Participation ({selectedUser.events?.length || 0})
                      </h4>
                      <button className="text-primary text-sm font-bold hover:underline whitespace-nowrap">
                        View History
                      </button>
                    </div>

                    {/* Event Controls */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-4">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6487] text-lg">
                          search
                        </span>
                        <input
                          className="w-full pl-10 pr-4 py-2.5 bg-[#f6f6f8] dark:bg-[#141121] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                          placeholder="Search event title..."
                          value={eventSearch}
                          onChange={(e) => {
                            setEventSearch(e.target.value);
                            setEventPage(1);
                          }}
                        />
                      </div>

                      <select
                        className="h-10 px-4 rounded-lg bg-[#f6f6f8] dark:bg-[#141121] border border-[#dedce5] dark:border-[#2d2a3d] text-sm focus:ring-2 focus:ring-primary outline-none min-w-[160px]"
                        value={eventStatusFilter}
                        onChange={(e) => {
                          setEventStatusFilter(e.target.value);
                          setEventPage(1);
                        }}
                      >
                        <option value="All">All Attendance</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                      </select>

                      <div className="flex items-center gap-3">
                        <button
                          disabled={eventPage === 1}
                          onClick={() => setEventPage((p) => Math.max(1, p - 1))}
                          className="flex items-center justify-center size-9 rounded-lg border border-[#dedce5] dark:border-[#2d2a3d] hover:bg-white dark:hover:bg-[#141121] disabled:opacity-50 transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        <span className="text-sm font-medium text-[#6b6487] dark:text-[#a19db8]">
                          Page {eventPage} of {getFilteredEvents().totalPages}
                        </span>
                        <button
                          disabled={eventPage >= getFilteredEvents().totalPages}
                          onClick={() => setEventPage((p) => p + 1)}
                          className="flex items-center justify-center size-9 rounded-lg border border-[#dedce5] dark:border-[#2d2a3d] hover:bg-white dark:hover:bg-[#141121] transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-[#dcdce5] dark:border-white/10">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-[#f9fafb] dark:bg-[#181628] border-b border-[#f1f0f4] dark:border-[#2d2a45]">
                            <th className="py-3 px-4 font-bold text-[#6b6487] dark:text-gray-300">Event Name</th>
                            <th className="py-3 px-4 font-bold text-[#6b6487] dark:text-gray-300">Date</th>
                            <th className="py-3 px-4 font-bold text-[#6b6487] dark:text-gray-300">Role</th>
                            <th className="py-3 px-4 font-bold text-[#6b6487] dark:text-gray-300">Attendance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1f0f4] dark:divide-[#2d2a45]">
                          {getFilteredEvents().paginated.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-10 text-center text-[#6b6487] dark:text-gray-400">
                                {eventSearch || eventStatusFilter !== 'All'
                                  ? 'No matching events found'
                                  : 'No event participation yet'}
                              </td>
                            </tr>
                          ) : (
                            getFilteredEvents().paginated.map((event) => (
                              <tr key={event._id} className="hover:bg-gray-50 dark:hover:bg-[#2d2a45]/50 transition-colors">
                                <td className="py-3 px-4 font-medium text-[#131117] dark:text-white">{event.title}</td>
                                <td className="py-3 px-4 text-[#6b6487] dark:text-gray-400">
                                  {event.date
                                    ? new Date(event.date).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })
                                    : 'N/A'}
                                </td>
                                <td className="py-3 px-4 text-[#6b6487] dark:text-gray-400">
                                  {event.role || 'Participant'}
                                </td>
                                <td className="py-3 px-4">
                                  {event.attended ? (
                                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                      <span className="material-symbols-outlined">check_circle</span>
                                      <span className="text-xs font-bold">Present</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                                      <span className="material-symbols-outlined">cancel</span>
                                      <span className="text-xs font-bold">Absent</span>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <p className="mt-3 text-sm text-[#6b6487] dark:text-[#a19db8] text-center">
                      Showing {getFilteredEvents().paginated.length} of {getFilteredEvents().total} events
                    </p>
                  </section>
                </main>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-white dark:bg-[#1c1a2e] border-t border-[#f1f0f4] dark:border-[#2d2a45] flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="px-6 py-2.5 rounded-lg border border-[#dedce5] dark:border-[#2d2a3d] text-[#131117] dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-[#2d2a45]/50 transition-colors"
                >
                  Close View
                </button>
                <button className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Confirmation */}
        {deleteUserOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1c192b] rounded-xl shadow-2xl max-w-md w-full p-8 space-y-6">
              <h2 className="text-2xl font-bold text-[#131117] dark:text-white">Delete User</h2>
              <p className="text-[#656487] dark:text-gray-400">
                Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setDeleteUserOpen(false)}
                  className="px-6 py-3 rounded-lg border border-[#dedce5] dark:border-[#2d2a3d] hover:bg-[#f6f6f8] dark:hover:bg-[#141121] font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-6 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}