import React, { useMemo } from 'react';
import { User } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { MetricCard } from '../analytics/MetricCard';
import { ResponsivePieChart } from '../analytics/ResponsivePieChart';
import { UserManagementTable } from '../UserManagementTable';
import { GlassCard } from '../ui';

interface UsersTabProps {
  users: User[];
}

export const UsersTab: React.FC<UsersTabProps> = ({ users }) => {
  const { t } = useTranslations();

  // Calculate user counts by role
  const usersByRole = useMemo(() => {
    const roleCounts: Record<string, number> = {
      owner: 0,
      vet: 0,
      shelter: 0,
      volunteer: 0,
      super_admin: 0
    };

    users.forEach(user => {
      if (user.roles && user.roles.length > 0) {
        user.roles.forEach(role => {
          if (roleCounts[role] !== undefined) {
            roleCounts[role]++;
          }
        });
      } else if (user.activeRole) {
        if (roleCounts[user.activeRole] !== undefined) {
          roleCounts[user.activeRole]++;
        }
      }
    });

    return Object.entries(roleCounts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
        value
      }))
      .filter(item => item.value > 0);
  }, [users]);

  // Calculate active users (logged in within last 7 days)
  const activeUsers = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return users.filter(u => {
      const lastLogin = u.lastLoginAt || u.createdAt || 0;
      return lastLogin > weekAgo;
    }).length;
  }, [users]);

  // Calculate new users this week
  const newUsersThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return users.filter(u => (u.createdAt || 0) > weekAgo).length;
  }, [users]);

  // Calculate verified users
  const verifiedUsers = useMemo(() => {
    return users.filter(u => u.isVerified).length;
  }, [users]);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
          <span className="text-3xl">👥</span>
          {t('dashboard:admin.users.title')}
        </h2>
        <p className="text-sm text-slate-400 mt-1">{t('dashboard:admin.adminTabUsers')}</p>
      </div>

      {/* User Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('dashboard:admin.users.totalUsers')}
          value={users.length}
          icon="👥"
          colorClass="bg-cyan-500/10 text-cyan-400"
        />
        <MetricCard
          title="Active Users (7d)"
          value={activeUsers}
          icon="🟢"
          colorClass="bg-green-500/10 text-green-400"
        />
        <MetricCard
          title="New Users (7d)"
          value={newUsersThisWeek}
          icon="⭐"
          trend="up"
          colorClass="bg-blue-500/10 text-blue-400"
        />
        <MetricCard
          title="Verified Users"
          value={verifiedUsers}
          icon="✅"
          colorClass="bg-emerald-500/10 text-emerald-400"
        />
      </div>

      {/* Users by Role Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6 border-white/10 bg-black/40">
          <ResponsivePieChart
            data={usersByRole}
            title={t('dashboard:admin.users.byRole')}
            height={300}
            showLegend={true}
            emptyMessage={t('dashboard:admin.noEngagementData')}
          />
        </GlassCard>

        {/* User Stats Summary */}
        <GlassCard className="p-6 border-white/10 bg-black/40 space-y-4">
          <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-primary rounded-full"></span>
            User Statistics
          </h3>

          <div className="space-y-3">
            {usersByRole.map((role, index) => (
              <div key={role.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20">
                    {index + 1}
                  </div>
                  <span className="text-sm font-bold text-white">{role.name}</span>
                </div>
                <span className="text-2xl font-black text-primary font-mono">{role.value}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-mono uppercase">Total Roles Assigned</span>
              <span className="text-white font-bold">{usersByRole.reduce((sum, r) => sum + r.value, 0)}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* User Management Table */}
      <UserManagementTable />
    </div>
  );
};
