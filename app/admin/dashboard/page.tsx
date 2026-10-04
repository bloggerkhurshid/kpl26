'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { kplApi } from '@/lib/api';
import {
  Users, Shield, CreditCard, ClipboardList,
  TrendingUp, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react';

interface Stats {
  teams: number;
  activePlayers: number;
  totalPayments: number;
  paymentsAmount: number;
  pendingTeamRegs: number;
  pendingPlayerRegs: number;
  successPayments: number;
  auctionEligible: number;
}

interface RecentReg {
  id: string;
  name: string;
  type: 'team' | 'player';
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    teams: 0, activePlayers: 0, totalPayments: 0, paymentsAmount: 0,
    pendingTeamRegs: 0, pendingPlayerRegs: 0, successPayments: 0, auctionEligible: 0,
  });
  const [recent, setRecent] = useState<RecentReg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await kplApi.getDashboardMetrics();
        if (res && res.stats) {
          setStats({
            teams: res.stats.active_teams || 0,
            activePlayers: res.stats.active_players || 0,
            totalPayments: res.stats.active_teams + res.stats.active_players,
            paymentsAmount: Number(res.stats.total_revenue) || 0,
            pendingTeamRegs: res.stats.pending_teams || 0,
            pendingPlayerRegs: res.stats.pending_players || 0,
            successPayments: res.stats.active_players || 0,
            auctionEligible: res.stats.auction_eligible || 0,
          });

          const recentItems: RecentReg[] = [
            ...(res.recent_team_registrations || []).map((r: any) => ({ id: r.id, name: r.team_name, type: 'team' as const, status: r.status, created_at: r.created_at })),
            ...(res.recent_player_registrations || []).map((r: any) => ({ id: r.id, name: r.player_name, type: 'player' as const, status: r.status, created_at: r.created_at })),
          ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

          setRecent(recentItems);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);


  const statCards = [
    { label: 'Active Teams', value: stats.teams, icon: Shield, color: '#f59e0b', sub: `${stats.pendingTeamRegs} pending registrations` },
    { label: 'Active Players', value: stats.activePlayers, icon: Users, color: '#2563eb', sub: `${stats.auctionEligible} auction eligible` },
    { label: 'Total Payments', value: `₹${stats.paymentsAmount.toLocaleString('en-IN')}`, icon: CreditCard, color: '#10b981', sub: `${stats.successPayments} successful` },
    { label: 'Pending Reviews', value: stats.pendingTeamRegs + stats.pendingPlayerRegs, icon: ClipboardList, color: '#f97316', sub: `${stats.pendingTeamRegs} teams, ${stats.pendingPlayerRegs} players` },
  ];

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back. Here&apos;s what&apos;s happening with KPL Season 3.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          {statCards.map(card => (
            <div className="admin-stat-card" key={card.label}>
              <div className="admin-stat-icon" style={{ '--stat-color': card.color } as React.CSSProperties}>
                <card.icon size={20} />
              </div>
              <div className="admin-stat-body">
                <div className="admin-stat-value">
                  {loading ? <span className="admin-skeleton" style={{ width: 60, height: 24, display: 'inline-block' }} /> : card.value}
                </div>
                <div className="admin-stat-label">{card.label}</div>
                <div className="admin-stat-sub">{card.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="admin-quick-actions">
          <h2>Quick Actions</h2>
          <div className="admin-quick-grid">
            {[
              { label: 'Manage Teams', href: '/admin/teams', icon: Shield, desc: 'Edit, add, or disable teams' },
              { label: 'Manage Players', href: '/admin/players', icon: Users, desc: 'Assign, unassign, auction control' },
              { label: 'View Payments', href: '/admin/payments', icon: CreditCard, desc: 'Track all payment records' },
              { label: 'Edit Content', href: '/admin/content', icon: TrendingUp, desc: 'Update frontend text & settings' },
            ].map(item => (
              <a key={item.label} href={item.href} className="admin-quick-card">
                <item.icon size={20} />
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Recent registrations */}
        <div className="admin-recent">
          <h2>Recent Registrations</h2>
          {loading ? (
            <div className="admin-loading-rows">
              {[...Array(5)].map((_, i) => <div className="admin-skeleton-row" key={i} />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="admin-empty">No registrations yet.</div>
          ) : (
            <div className="admin-recent-list">
              {recent.map(item => (
                <div className="admin-recent-item" key={item.id}>
                  <div className={`admin-recent-type admin-recent-type-${item.type}`}>
                    {item.type === 'team' ? <Shield size={13} /> : <Users size={13} />}
                    {item.type}
                  </div>
                  <div className="admin-recent-name">{item.name}</div>
                  <div className={`admin-status-badge admin-status-${item.status}`}>
                    {item.status === 'pending' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                    {item.status}
                  </div>
                  <div className="admin-recent-time">
                    {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
