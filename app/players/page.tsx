'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { kplApi, getImageUrl } from '@/lib/api';

type Player = {
  id: string;
  player_name: string;
  role: string;
  photo: string;
  player_category?: string;
  registration_number?: string;
};

const formatPlayerRole = (roleStr?: string) => {
  if (!roleStr) return 'ALL-ROUNDER';
  const roles = roleStr.split(',').map((r) => r.trim().toLowerCase());
  const isBat = roles.includes('batsman') || roles.includes('batter');
  const isBowl = roles.includes('bowler');
  const isWk = roles.includes('wicket-keeper') || roles.includes('wicketkeeper') || roles.includes('wk');

  if (isBat && isBowl) return 'ALL-ROUNDER';
  if (isWk && isBat) return 'WK-BATSMAN';

  return roleStr.toUpperCase();
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    kplApi
      .getPlayers({ status: 'active', limit: 1000 })
      .then((data) => {
        if (Array.isArray(data)) {
          setPlayers(data as Player[]);
        }
      })
      .catch((err) => {
        console.error('Error fetching players:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredPlayers = players.filter(
    (p) =>
      p.player_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.player_category && p.player_category.toLowerCase().includes(search.toLowerCase())) ||
      (p.role && p.role.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="bg-[#0f172a] min-h-screen pb-16" style={{ backgroundColor: 'var(--bg-main, #0f172a)' }}>
      <nav className={`site-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="nav-container max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="brand" aria-label="KPL home">
            <img src="/kpl-logo.jpg" alt="KPL" className="brand-logo" />
            <span className="brand-text">
              KHORAGHAT PREMIER LEAGUE
              <span>SEASON 03 • 2026</span>
            </span>
          </Link>
          <div style={{ display: 'flex' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', textDecoration: 'none', background: 'rgba(255, 255, 255, 0.1)', padding: '8px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <ArrowLeft size={16} /> Back
            </Link>
          </div>
        </div>
      </nav>

      <section className="section-pad pt-32" id="players" style={{ paddingTop: '120px' }}>
        <div className="page-width">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="section-label">All Registered Talent</span>
              <h1 className="sport-heading text-4xl text-white">Tournament Players</h1>
            </div>
            
            <div style={{ flex: '1', minWidth: '250px', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Search by name, role, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  backgroundColor: '#1e293b',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '15px'
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
              <div className="kpl-loading-bar-wrap" style={{ width: '200px' }}>
                <div className="kpl-loading-bar" />
              </div>
            </div>
          ) : (
            <div className="players-grid">
              {filteredPlayers.length === 0 ? (
                <p className="lead text-gray-400">No players found matching your search.</p>
              ) : (
                filteredPlayers.map((player) => (
                  <div className="player-card" key={player.id}>
                    {player.photo ? (
                      <img
                        src={getImageUrl(player.photo)}
                        alt={player.player_name}
                        className="player-photo"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="player-photo" style={{ display: 'grid', placeItems: 'center', background: 'var(--bg-subtle)' }}>
                        <Users size={48} color="var(--green-mint)" />
                      </div>
                    )}
                    <div className="player-info">
                      <h3 className="sport-heading text-white">{player.player_name}</h3>
                      <div className="player-badge-wrap">
                        <span className="player-role-badge">{formatPlayerRole(player.role)}</span>
                        {player.player_category && (
                          <span className="player-category-badge">{player.player_category}</span>
                        )}
                      </div>
                      {player.registration_number && (
                        <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b', letterSpacing: '0.5px' }}>
                          ID: {player.registration_number}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
