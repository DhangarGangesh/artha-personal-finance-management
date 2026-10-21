import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Sparkles,
  X,
  Clock,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { financeService } from '../../services/financeService';

export const NotificationPopover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const popoverRef = useRef(null);

  const userId = user?._id || user?.id || null;
  const readKey = userId ? `artha_read_notifications_${userId}` : null;
  const dismissedKey = userId ? `artha_dismissed_notifications_${userId}` : null;

  const getStoredSet = useCallback((key) => {
    if (!key) return new Set();
    try {
      const raw = localStorage.getItem(key);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }, []);

  const saveStoredSet = useCallback((key, set) => {
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const res = await financeService.getAlerts();
      const rawList =
        (Array.isArray(res?.alerts) && res.alerts) ||
        (Array.isArray(res?.data?.alerts) && res.data.alerts) ||
        (Array.isArray(res) && res) ||
        [];

      const readSet = getStoredSet(readKey);
      const dismissedSet = getStoredSet(dismissedKey);

      const mapped = rawList
        .map((item, idx) => {
          const id = item.ruleId
            ? `${item.ruleId}_${item.category || 'all'}`
            : `alert_${idx}`;
          const severity = (item.severity || 'INFO').toUpperCase();

          let icon = Sparkles;
          let color = 'var(--brand-primary, #6366f1)';
          let bgColor = 'rgba(99, 102, 241, 0.12)';

          if (severity === 'CRITICAL') {
            icon = AlertCircle;
            color = '#ef4444';
            bgColor = 'rgba(239, 68, 68, 0.12)';
          } else if (severity === 'WARNING') {
            icon = AlertTriangle;
            color = '#f59e0b';
            bgColor = 'rgba(245, 158, 11, 0.12)';
          } else if (item.category === 'Goals' || item.category === 'Savings') {
            icon = TrendingUp;
            color = '#10b981';
            bgColor = 'rgba(16, 185, 129, 0.12)';
          }

          return {
            id,
            title: item.ruleName || item.category || 'Financial Alert',
            message:
              item.reason ||
              item.condition ||
              item.recommendation ||
              'Threshold condition detected',
            recommendation: item.recommendation,
            category: item.category,
            severity,
            time: item.asOf || 'Active',
            read: readSet.has(id),
            icon,
            color,
            bgColor,
          };
        })
        .filter((n) => !dismissedSet.has(n.id));

      setNotifications(mapped);
    } catch (err) {
      console.warn('Failed to fetch user-specific notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, readKey, dismissedKey, getStoredSet]);

  // Fetch alerts whenever user changes or mounts
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const readSet = getStoredSet(readKey);
    notifications.forEach((n) => readSet.add(n.id));
    saveStoredSet(readKey, readSet);
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const readSet = getStoredSet(readKey);
    readSet.add(id);
    saveStoredSet(readKey, readSet);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const dismissedSet = getStoredSet(dismissedKey);
    dismissedSet.add(id);
    saveStoredSet(dismissedKey, dismissedSet);
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchAlerts();
        }}
        aria-label="Notifications"
        title="Notifications"
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isOpen ? 'var(--bg-subtle)' : 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              boxShadow: '0 0 0 2px var(--bg-card)',
            }}
          />
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '390px',
            maxWidth: 'calc(100vw - 2rem)',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'fadeIn 0.18s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'var(--text-primary)',
                }}
              >
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--brand-primary)',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={fetchAlerts}
                title="Refresh alerts"
                aria-label="Refresh alerts"
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: loading ? 'default' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: loading ? 0.5 : 0.8,
                }}
              >
                <RefreshCw
                  size={13}
                  style={{
                    animation: loading ? 'spin 1s linear infinite' : 'none',
                  }}
                />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Check size={12} />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div
            style={{
              padding: '0.5rem 1.25rem',
              display: 'flex',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={{
                background: filter === 'all' ? 'var(--bg-card)' : 'transparent',
                border: filter === 'all' ? '1px solid var(--border-subtle)' : 'none',
                borderRadius: 'var(--radius-full)',
                padding: '0.2rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: filter === 'all' ? 700 : 500,
                color: filter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              style={{
                background: filter === 'unread' ? 'var(--bg-card)' : 'transparent',
                border: filter === 'unread' ? '1px solid var(--border-subtle)' : 'none',
                borderRadius: 'var(--radius-full)',
                padding: '0.2rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: filter === 'unread' ? 700 : 500,
                color:
                  filter === 'unread'
                    ? 'var(--brand-primary)'
                    : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {loading && notifications.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                Checking for alerts...
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.25rem',
                  }}
                >
                  <CheckCircle2 size={22} />
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {filter === 'unread' ? 'No unread notifications' : 'All caught up!'}
                </div>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.775rem',
                    maxWidth: '260px',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {filter === 'unread'
                    ? 'You have reviewed all active notifications for your account.'
                    : 'No active financial alerts or warnings. Your budget and savings metrics are in healthy condition.'}
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    style={{
                      padding: '0.85rem 1.25rem',
                      display: 'flex',
                      gap: '0.85rem',
                      alignItems: 'flex-start',
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: item.read
                        ? 'transparent'
                        : 'rgba(99, 102, 241, 0.04)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: item.bgColor,
                        color: item.color,
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.15rem',
                          gap: '0.5rem',
                        }}
                      >
                        <h4
                          style={{
                            fontSize: '0.825rem',
                            fontWeight: item.read ? 600 : 700,
                            color: 'var(--text-primary)',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.title}
                        </h4>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            flexShrink: 0,
                          }}
                        >
                          <Clock size={10} />
                          {item.time}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '0.775rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                          margin: 0,
                        }}
                      >
                        {item.message}
                      </p>
                      {item.recommendation && item.recommendation !== item.message && (
                        <div
                          style={{
                            marginTop: '0.35rem',
                            fontSize: '0.725rem',
                            color: 'var(--brand-primary)',
                            backgroundColor: 'rgba(99, 102, 241, 0.08)',
                            padding: '0.2rem 0.45rem',
                            borderRadius: '4px',
                            display: 'inline-block',
                          }}
                        >
                          Tip: {item.recommendation}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(item.id);
                      }}
                      aria-label="Dismiss notification"
                      title="Dismiss"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        opacity: 0.6,
                        flexShrink: 0,
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Link to Insights & Alerts */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: 'var(--bg-subtle)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '0.725rem',
                color: 'var(--text-muted)',
              }}
            >
              Account-isolated alerts
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/alerts');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-primary)',
                fontSize: '0.775rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '2px 4px',
              }}
            >
              View All Insights <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPopover;
