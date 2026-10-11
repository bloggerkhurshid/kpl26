'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  CreditCard,
  FileText,
  Gavel,
  LogOut,
  Menu,
  X,
  Trophy,
  ChevronRight,
  Settings,
  Image as ImageIcon,
  UserCheck,
  Camera,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { isLoggedIn, adminLogout } from '@/lib/adminAuth';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/teams', label: 'Teams', icon: Shield },
  { href: '/admin/players', label: 'Players', icon: Users },
  { href: '/admin/management', label: 'Management', icon: UserCheck },
  { href: '/admin/sponsors', label: 'Sponsors', icon: Sparkles },
  { href: '/admin/gallery', label: 'Photo Gallery', icon: Camera },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/content', label: 'Home Sections', icon: FileText },
  { href: '/admin/highlights', label: 'Highlights', icon: ImageIcon },
  { href: '/admin/auction', label: 'Auction', icon: Gavel },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lightMode, setLightMode] = useState(false);

  useEffect(() => {
    if (!isLoggedIn() && pathname !== '/admin') {
      window.location.href = '/admin';
    }
  }, [pathname]);

  useEffect(() => {
    const isLight = localStorage.getItem('kpl_admin_light') === 'true';
    if (isLight) {
      setLightMode(true);
      document.documentElement.classList.add('light-mode');
    }
  }, []);

  const toggleTheme = () => {
    const nextMode = !lightMode;
    setLightMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('kpl_admin_light', 'true');
    } else {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('kpl_admin_light', 'false');
    }
  };

  if (pathname === '/admin') return <>{children}</>;

  return (
    <div className="admin-shell">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="admin-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar-open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <Trophy size={16} />
          </div>
          <div>
            <span className="admin-brand-title">KPL Console</span>
            <span className="admin-brand-sub">Season 3 · 2026</span>
          </div>
          <button className="admin-sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <nav className="admin-nav">
          <span className="admin-nav-label">Overview & Registry</span>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`admin-nav-item ${active ? 'admin-nav-item-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={16} />
                <span>{label}</span>
                {active && <ChevronRight size={13} className="admin-nav-arrow" />}
              </Link>
            );
          })}
        </nav>

        <button className="admin-logout-btn" onClick={adminLogout}>
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main content */}
      <div className="admin-main">
        <header className="admin-header">
          <button className="admin-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={18} />
          </button>
          <div className="admin-header-right">
            <button onClick={toggleTheme} className="admin-theme-toggle" aria-label="Toggle theme">
              {lightMode ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            <span className="admin-badge">Admin</span>
            <Link href="/" target="_blank" className="admin-view-site">
              Live Site ↗
            </Link>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}
