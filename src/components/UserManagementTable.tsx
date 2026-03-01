import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { User, UserRole } from '../types';
import { useTranslation } from 'react-i18next';

export const UserManagementTable: React.FC = () => {
  const { t } = useTranslation('common');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = users.filter(user =>
      user.email.toLowerCase().includes(lowerTerm) ||
      user.uid.includes(lowerTerm)
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    try {
      await adminService.updateUserRole(uid, newRole);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, roles: [newRole], activeRole: newRole } : u));
    } catch (err) {
      console.error('Failed to update role', err);
      // Ideally show a toast here
    }
  };

  const handleStatusToggle = async (uid: string, currentStatus: string | undefined) => {
    const newStatus = currentStatus === 'active' || !currentStatus ? 'suspended' : 'active';
    try {
      await adminService.toggleUserStatus(uid, newStatus);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleSubscriptionToggle = async (uid: string, currentStatus: string | undefined) => {
    const isPro = currentStatus !== 'active';
    try {
      await adminService.toggleUserSubscription(uid, isPro);
      setUsers(prev => prev.map(u => u.uid === uid ? {
        ...u,
        subscription: {
          ...u.subscription,
          status: isPro ? 'active' : 'inactive',
          planId: isPro ? 'vet_pro' : 'vet_free'
        } as any
      } : u));
    } catch (err) {
      console.error('Failed to update subscription', err);
    }
  };

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (loading) return <div className="p-4 text-center text-primary font-mono">{t('loadingUsers')}</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/20">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">User Management</h2>
        <input
          type="text"
          placeholder={t('searchUsers')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Role</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Vet Verification</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Subscription</th>
              <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map(user => (
              <tr key={user.uid} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="p-3 text-gray-800 dark:text-gray-200">{user.email}</td>
                <td className="p-3">
                  <select
                    value={user.activeRole}
                    onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                    className="bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="owner">Owner</option>
                    <option value="vet">Vet</option>
                    <option value="shelter">Shelter</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'suspended' || user.status === 'banned'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                    {user.status || 'active'}
                  </span>
                </td>
                <td className="p-3">
                  {(user.activeRole === 'vet' || user.roles.includes('vet')) ? (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.verificationStatus === 'approved' || user.isVetVerified ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' :
                      user.verificationStatus === 'pending' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        user.verificationStatus === 'declined' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                      {user.verificationStatus === 'approved' || user.isVetVerified ? 'Verified' :
                        user.verificationStatus === 'pending' ? 'Pending' :
                          user.verificationStatus === 'declined' ? 'Declined' : 'Unverified'}
                    </span>
                  ) : <span className="text-gray-400 text-xs">-</span>}
                </td>
                <td className="p-3">
                  {(user.activeRole === 'vet' || user.roles.includes('vet')) && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.subscription?.status === 'active'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                      {user.subscription?.status === 'active' ? 'Pro' : 'Free'}
                    </span>
                  )}
                </td>
                <td className="p-3 flex items-center gap-2">
                  <button
                    onClick={() => handleStatusToggle(user.uid, user.status)}
                    className={`text-sm font-medium ${user.status === 'suspended'
                      ? 'text-green-600 hover:text-green-700'
                      : 'text-red-600 hover:text-red-700'
                      }`}
                  >
                    {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                  </button>

                  {(user.activeRole === 'vet' || user.roles.includes('vet')) && (
                    <button
                      onClick={() => handleSubscriptionToggle(user.uid, user.subscription?.status)}
                      className={`text-sm font-medium ${user.subscription?.status === 'active'
                        ? 'text-orange-600 hover:text-orange-700'
                        : 'text-teal-600 hover:text-teal-700'
                        }`}
                    >
                      {user.subscription?.status === 'active' ? 'Demote' : 'Promote'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Showing {paginatedUsers.length} of {filteredUsers.length} users
        </span>
        <div className="space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
