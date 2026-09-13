'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Phone, UserCheck, Sparkles } from 'lucide-react';
import { kplApi, ManagementMember } from '@/lib/api';

export function ManagementSection() {
  const [members, setMembers] = useState<ManagementMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagement();
  }, []);

  const fetchManagement = async () => {
    try {
      setLoading(true);
      const data = await kplApi.getManagement('active');
      if (Array.isArray(data)) {
        setMembers(data);
      }
    } catch (err) {
      console.error('Failed to load management committee:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-emerald-950/20 text-white relative">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-emerald-800/30 rounded w-1/4 mx-auto"></div>
            <div className="h-4 bg-emerald-800/20 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (members.length === 0) {
    return null;
  }

  return (
    <section id="management" className="py-24 bg-gradient-to-b from-black via-emerald-950/20 to-black text-white relative overflow-hidden border-t border-emerald-900/30">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Shield className="w-3.5 h-3.5" />
            Leadership & Guidance
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            League <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-500">Management</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            The visionary team and committee members driving Khoraghat Premier League forward.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {members.map((member) => (
            <div
              key={member.id}
              className="group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-950/40 text-center flex flex-col items-center"
            >
              {/* Photo Avatar */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-5 rounded-full p-1 bg-gradient-to-br from-emerald-500 via-teal-400 to-emerald-700 shadow-lg group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 relative flex items-center justify-center">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCheck className="w-12 h-12 text-emerald-400 opacity-60" />
                  )}
                </div>
              </div>

              {/* Details */}
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors mb-1">
                {member.name}
              </h3>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/40 rounded-full px-3 py-1 mb-3">
                {member.designation}
              </p>

              {member.contact && (
                <div className="mt-auto pt-3 border-t border-slate-800/80 w-full flex items-center justify-center gap-2 text-slate-400 text-xs hover:text-white transition-colors">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{member.contact}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
