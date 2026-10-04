'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { kplApi } from '@/lib/api';
import {
  Users, Shield, CreditCard, ClipboardList,
  ArrowUpRight, Clock, CheckCircle2, ChevronRight,
  TrendingUp, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

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
    { label: 'Active Franchises', value: stats.teams, icon: Shield, sub: `${stats.pendingTeamRegs} awaiting verification` },
    { label: 'Registered Players', value: stats.activePlayers, icon: Users, sub: `${stats.auctionEligible} auction pool verified` },
    { label: 'Total Revenue', value: `₹${stats.paymentsAmount.toLocaleString('en-IN')}`, icon: CreditCard, sub: `${stats.successPayments} verified transactions` },
    { label: 'Pending Reviews', value: stats.pendingTeamRegs + stats.pendingPlayerRegs, icon: ClipboardList, sub: `${stats.pendingTeamRegs} teams · ${stats.pendingPlayerRegs} players` },
  ];

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1>Overview</h1>
            <p>Real-time tournament metrics, player roster, and league registrations.</p>
          </div>
        </div>

        {/* Minimal Metrics Grid */}
        <div className="admin-stats-grid">
          {statCards.map(card => (
            <div className="admin-stat-card" key={card.label}>
              <div className="admin-stat-icon">
                <card.icon size={18} />
              </div>
              <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
                <div className="admin-stat-label">{card.label}</div>
                <div className="admin-stat-value">
                  {loading ? <span className="admin-skeleton" style={{ width: 50, height: 24, display: 'inline-block' }} /> : card.value}
                </div>
                <div className="admin-stat-sub">{card.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="admin-quick-actions">
          <h2>Management Navigation</h2>
          <div className="admin-quick-grid">
            {[
              { label: 'Franchise Teams', href: '/admin/teams', icon: Shield, desc: 'Roster limits & owner verification' },
              { label: 'Player Registry', href: '/admin/players', icon: Users, desc: 'Profiles, documents & auction eligibility' },
              { label: 'Payments & UTR', href: '/admin/payments', icon: CreditCard, desc: 'Direct UPI receipts & cash ledger' },
              { label: 'Auction Pool', href: '/admin/auction', icon: TrendingUp, desc: 'Live hammer console & bidding controls' },
            ].map(item => (
              <Link key={item.label} href={item.href} className="admin-quick-card">
                <item.icon size={18} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
                </div>
                <ArrowUpRight size={14} style={{ color: 'var(--adm-text-muted)', marginLeft: 'auto' }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="admin-recent">
          <h2>Recent Activity</h2>
          {loading ? (
            <div className="admin-loading-rows">
              {[...Array(5)].map((_, i) => <div className="admin-skeleton-row" key={i} />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="admin-empty">No activity records yet.</div>
          ) : (
            <div className="admin-recent-list">
              {recent.map(item => (
                <div className="admin-recent-item" key={item.id}>
                  <div className={`admin-recent-type admin-recent-type-${item.type}`}>
                    {item.type === 'team' ? <Shield size={12} /> : <Users size={12} />}
                    {item.type}
                  </div>
                  <div className="admin-recent-name">{item.name}</div>
                  <div className={`admin-status-badge admin-status-${item.status}`}>
                    {item.status === 'pending' ? <Clock size={11} /> : <CheckCircle2 size={11} />}
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
