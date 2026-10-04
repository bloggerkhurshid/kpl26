import React, { useEffect, useState } from 'react';
import { Award, Sparkles, Building2, ExternalLink, ArrowUpRight } from 'lucide-react';
import { kplApi, getImageUrl } from '@/lib/api';

export interface Sponsor {
  id: string;
  name: string;
  tier: 'Title Sponsor' | 'Co-Powered By' | 'Associate Sponsor' | 'Official Partner' | 'Beverage Partner' | 'Digital Media Partner';
  tierBadgeColor: string;
  logo: string;
  description: string;
  highlight?: string;
  website?: string;
}

const defaultSponsors: Sponsor[] = [
  {
    id: '1',
    name: 'Projukti Soft',
    tier: 'Title Sponsor',
    tierBadgeColor: '#fbbf24',
    logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=500&q=80',
    description: 'Premier digital engineering & cloud technology enterprise powering high-scale community web platforms and tournament management software across Northeast India.',
    highlight: 'Official Technology & Title Partner',
    website: 'https://kpl.projuktisoft.com'
  },
  {
    id: '2',
    name: 'Apex Arena Sports',
    tier: 'Co-Powered By',
    tierBadgeColor: '#38bdf8',
    logo: 'https://images.unsplash.com/photo-1531415074868-8363325697c0?auto=format&fit=crop&w=500&q=80',
    description: 'Specialists in international cricket equipment, tournament match balls, stadium gear, and youth athletic training apparel.',
    highlight: 'Official Match Equipment Provider'
  },
  {
    id: '3',
    name: 'GreenValley Agro & Refreshments',
    tier: 'Beverage Partner',
    tierBadgeColor: '#4ade80',
    logo: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80',
    description: 'Pure hydration and natural organic energy beverages keeping players and crowd refreshed under the Assam stadium sun.',
    highlight: 'Hydration & Nutrition Partner'
  },
  {
    id: '4',
    name: 'Khoraghat Media Network',
    tier: 'Digital Media Partner',
    tierBadgeColor: '#c084fc',
    logo: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=500&q=80',
    description: 'High-definition multi-camera live broadcast, social media highlights, drone stadium sweeps, and real-time score updates.',
    highlight: 'Broadcasting & Broadcast Stream'
  }
];

export function SponsorshipSection() {
  const [sponsors, setSponsors] = useState<Sponsor[]>(defaultSponsors);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  useEffect(() => {
    async function load() {
      try {
        const data = await kplApi.getSponsors();
        if (Array.isArray(data) && data.length > 0) {
          setSponsors(data);
        }
      } catch (err) {
        // Fallback to default
      }
    }
    load();
  }, []);

  if (sponsors.length === 0) return null;

  const tiers = ['All', ...Array.from(new Set(sponsors.map((s) => s.tier)))];
  const filteredSponsors = selectedFilter === 'All' 
    ? sponsors 
    : sponsors.filter((s) => s.tier === selectedFilter);

  return (
    <section id="sponsors" className="section-pad sponsorship-section">
      {/* Background ambient lighting */}
      <div className="sponsor-bg-glow sponsor-bg-glow-left" />
      <div className="sponsor-bg-glow sponsor-bg-glow-right" />
      <div className="sponsor-grid-pattern" />

      <div className="page-width" style={{ position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div className="sponsorship-header">
          <div className="sponsorship-badge-pill">
            <Sparkles size={14} className="sponsorship-badge-icon" />
            <span>Official Tournament Backers</span>
          </div>
          <h2 className="sponsorship-display-title">
            Season 3 <em>Partners &amp; Sponsors</em>
          </h2>
          <p className="sponsorship-display-subtitle">
            Powering grassroots cricket excellence in Assam. Honoring the premier brands and visionary organizations backing Khoraghat Premier League 2026.
          </p>

          {/* Filter Pills */}
          {tiers.length > 2 && (
            <div className="sponsor-filter-row">
              {tiers.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedFilter(tier)}
                  className={`sponsor-filter-btn ${selectedFilter === tier ? 'is-active' : ''}`}
                >
                  {tier}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sponsor Cards Grid */}
        <div className="sponsorship-grid">
          {filteredSponsors.map((sponsor) => (
            <div key={sponsor.id} className="sponsor-card">
              <div className="sponsor-card-inner">
                {/* Brand Showcase Area */}
                <div className="sponsor-logo-box">
                  <img
                    src={getImageUrl(sponsor.logo)}
                    alt={sponsor.name}
                    className="sponsor-logo-img"
                    loading="lazy"
                  />
                  <div className="sponsor-logo-overlay" />
                  <span
                    className="sponsor-tier-badge"
                    style={{
                      borderColor: `${sponsor.tierBadgeColor}66`,
                      color: sponsor.tierBadgeColor,
                      boxShadow: `0 0 16px ${sponsor.tierBadgeColor}22`
                    }}
                  >
                    <Award size={12} />
                    {sponsor.tier}
                  </span>
                </div>

                {/* Body Details */}
                <div className="sponsor-content">
                  <div className="sponsor-title-row">
                    <h3 className="sponsor-title">{sponsor.name}</h3>
                    {sponsor.website && (
                      <a
                        href={sponsor.website}
                        target="_blank"
                        rel="noreferrer"
                        className="sponsor-link"
                        title="Visit Partner Website"
                      >
                        <ArrowUpRight size={15} />
                      </a>
                    )}
                  </div>

                  {sponsor.highlight && (
                    <div className="sponsor-highlight">
                      <span className="sponsor-highlight-dot" />
                      <span>{sponsor.highlight}</span>
                    </div>
                  )}

                  <p className="sponsor-description">{sponsor.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Partner Banner */}
        <div className="sponsor-cta-banner">
          <div className="sponsor-cta-info">
            <div className="sponsor-cta-icon-wrap">
              <Building2 size={24} />
            </div>
            <div>
              <h4 className="sponsor-cta-title">Want to sponsor Khoraghat Premier League 2026?</h4>
              <p className="sponsor-cta-sub">
                Put your brand in front of thousands of passionate stadium fans and high-engagement live streams.
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/919954910976?text=Hi%2C%20I%20would%20like%20to%20partner/sponsor%20KPL%20Season%203."
            target="_blank"
            rel="noreferrer"
            className="sponsor-cta-btn"
          >
            <span>Partner With Us</span>
            <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
