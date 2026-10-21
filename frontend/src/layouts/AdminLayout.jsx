import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Activity,
  FileText,
  ShieldCheck,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Wallet,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArthaLogo } from '../components/common/ArthaLogo';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // STRICT REQUIREMENT: Only admin items, NEVER user finance navigation items
  const adminNavItems = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/monitoring', label: 'System Monitoring', icon: Activity },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
    { to: '/admin/security', label: 'Security & Access', icon: ShieldCheck },
    { to: '/admin/datasets', label: 'Dataset Management', icon: Database },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // Breadcrumb generator
  const getBreadcrumb = () => {
    const current = adminNavItems.find((item) =>
      item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
    );
    return current ? current.label : 'Overview';
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Sidebar Desktop */}
      <aside
        style={{
          width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-card)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width var(--transition-normal)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 30,
        }}
        className="admin-sidebar"
      >
        <style>{`
          @media (max-width: 960px) {
            .admin-sidebar { display: none !important; }
            .admin-mobile-header { display: flex !important; }
          }
          @media (min-width: 961px) {
            .admin-mobile-header { display: none !important; }
          }
        `}</style>

        {/* Sidebar Header: Logo & Badge */}
        <div
          style={{
            height: '70px',
            padding: collapsed ? '0 1rem' : '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <NavLink to="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <ArthaLogo size={collapsed ? 'sm' : 'md'} showText={!collapsed} subtitle="ADMIN CONSOLE" />
          </NavLink>
        </div>

        {/* Navigation Items (STRICTLY Admin items only) */}
        <nav
          style={{
            flex: 1,
            padding: '1.25rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            overflowY: 'auto',
          }}
        >
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                title={collapsed ? item.label : undefined}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: collapsed ? '0.75rem 0' : '0.7rem 1rem',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--brand-primary-light)' : 'transparent',
                  borderLeft: isActive && !collapsed ? '3px solid var(--brand-primary)' : '3px solid transparent',
                  transition: 'all var(--transition-fast)',
                })}
              >
                <Icon size={19} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer: Switch to User Portal & Collapse button */}
        <div
          style={{
            padding: '1rem 0.75rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {/* Switch to Personal Finance view */}
          <NavLink
            to="/dashboard"
            title="Switch to Personal Finance"
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '0.5rem',
              width: '100%',
              fontSize: '0.8rem',
            }}
          >
            <Wallet size={16} />
            {!collapsed && <span>Personal Finance</span>}
          </NavLink>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="btn btn-ghost btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              width: '100%',
            }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {!collapsed && <span style={{ fontSize: '0.8rem' }}>Collapse sidebar</span>}
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Administrative Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header / App Bar */}
        <header
          style={{
            height: '70px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Breadcrumb & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Admin</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/</span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{getBreadcrumb()}</h2>
          </div>

          {/* Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Live Infrastructure Status Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--success)',
                backgroundColor: 'var(--success-bg)',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--success-border)',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success)',
                  boxShadow: '0 0 6px var(--success)',
                }}
              />
              <span>System Operational</span>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-ghost btn-sm"
              style={{ padding: '8px', borderRadius: 'var(--radius-md)' }}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} color="var(--warning)" /> : <Moon size={18} />}
            </button>

            {/* Admin Profile */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user?.name || 'Admin'}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Administrator</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              style={{ padding: '8px', color: 'var(--danger)' }}
              title="Sign out of Admin Console"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Mobile Header Bar */}
        <div
          className="admin-mobile-header"
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px' }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span style={{ fontWeight: 800 }}>ARTHA ADMIN</span>
          </div>
          <span className="badge badge-admin">Admin</span>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={() => setMobileOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--brand-primary-light)' : 'transparent',
                  })}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}

        {/* Admin Content Area */}
        <main style={{ flex: 1, padding: '2rem 1.75rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>

        {/* Admin Footer */}
        <footer
          style={{
            padding: '1.25rem 1.75rem',
            textAlign: 'center',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <p>ARTHA Administrative Governance System • Role-Based Security Verified</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
