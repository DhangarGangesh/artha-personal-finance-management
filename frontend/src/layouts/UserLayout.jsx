import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  BarChart3,
  TrendingUp,
  Bell,
  Sun,
  Moon,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  User,
  Settings,
  HelpCircle,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationPopover } from '../components/common/NotificationPopover';
import { ArthaLogo } from '../components/common/ArthaLogo';

export const UserLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const menuNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { to: '/budgets', label: 'Budgets', icon: PieChart },
    { to: '/goals', label: 'Goals', icon: Target },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/trends', label: 'Trends', icon: TrendingUp },
  ];

  const generalNavItems = [
    { to: '/settings', label: 'Setting', icon: Settings },
    { to: '/help', label: 'Help Center', icon: HelpCircle },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const userName = user?.name || 'Ethan Cole';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Sidebar - Sleek Dark Aesthetic as shown in reference */}
      <aside
        className={`user-sidebar ${mobileMenuOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          minWidth: '260px',
          backgroundColor: '#121624',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          zIndex: 50,
          transition: 'transform 0.25s ease',
          padding: '1.5rem 1.25rem',
        }}
      >
        <style>{`
          @media (max-width: 960px) {
            .user-sidebar {
              position: fixed !important;
              top: 0;
              bottom: 0;
              left: 0;
              transform: translateX(-100%);
              box-shadow: 0 0 30px rgba(0,0,0,0.5);
            }
            .user-sidebar.open {
              transform: translateX(0);
            }
            .user-sidebar-backdrop {
              position: fixed;
              inset: 0;
              background-color: rgba(0,0,0,0.6);
              z-index: 45;
              backdrop-filter: blur(2px);
            }
          }
          @media (min-width: 961px) {
            .user-sidebar-backdrop {
              display: none !important;
            }
          }
        `}</style>

        {/* Top: Logo & Nav sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Logo Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <NavLink
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
            >
              <ArthaLogo size="md" subtitle="PERSONAL WEALTH" />
            </NavLink>

            {/* Close button for mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
              className="mobile-close-btn"
            >
              <style>{`
                @media (max-width: 960px) {
                  .mobile-close-btn { display: block !important; }
                }
              `}</style>
              <X size={20} />
            </button>
          </div>

          {/* MENU Section */}
          <div>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '0.65rem',
                paddingLeft: '0.5rem',
              }}
            >
              MENU
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {menuNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#ffffff' : '#94a3b8',
                      backgroundColor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                      borderLeft: isActive ? '3px solid #818cf8' : '3px solid transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    })}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* GENERAL Section */}
          <div>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '0.65rem',
                paddingLeft: '0.5rem',
              }}
            >
              GENERAL
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {generalNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#ffffff' : '#94a3b8',
                      backgroundColor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                      borderLeft: isActive ? '3px solid #818cf8' : '3px solid transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    })}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section: Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#94a3b8',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={17} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="user-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflowX: 'hidden',
        }}
      >
        {/* Top Header Bar */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0.85rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* Left Greeting & Mobile toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '4px',
              }}
              className="mobile-toggle-btn"
              aria-label="Open menu"
            >
              <style>{`
                @media (max-width: 960px) {
                  .mobile-toggle-btn { display: block !important; }
                }
              `}</style>
              <Menu size={22} />
            </button>

            <div>
              <h1
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  lineHeight: 1.2,
                }}
              >
                Wellcome, {userName} <span role="img" aria-label="wave">👋</span>
              </h1>
            </div>
          </div>

          {/* Right Section: Search Bar, Notifications, Theme, Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Search Input */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
              className="desktop-search"
            >
              <style>{`
                @media (max-width: 640px) {
                  .desktop-search { display: none !important; }
                }
              `}</style>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{
                  padding: '0.45rem 2.5rem 0.45rem 2.25rem',
                  borderRadius: 'var(--radius-full)',
                  border: searchFocused ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.825rem',
                  width: searchFocused ? '260px' : '210px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              ) : (
                <span
                  style={{
                    position: 'absolute',
                    right: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-card)',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                    pointerEvents: 'none',
                  }}
                >
                  ↵
                </span>
              )}
            </form>

            {/* Notification Popover */}
            <NotificationPopover />

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} />}
            </button>

            {/* Admin Switcher if authorized */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className="btn btn-outline btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.65rem',
                  borderColor: 'var(--brand-secondary)',
                  color: 'var(--brand-secondary)',
                }}
              >
                <ShieldAlert size={14} />
                <span>Admin</span>
              </NavLink>
            )}

            {/* Profile Avatar */}
            <NavLink
              to="/settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
              title="View Settings & Profile"
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  border: '2px solid var(--bg-card)',
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            </NavLink>
          </div>
        </header>

        {/* Page View Body */}
        <main
          style={{
            flex: 1,
            padding: '1.75rem',
            maxWidth: '1440px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
