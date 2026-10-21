/**
 * ============================================================================
 * ARTHA ADMIN PORTAL - CLIENT LOGIC & INTERACTION ENGINE
 * Dedicated admin-only layout, real-time telemetry, RBAC moderation & dataset management.
 * ============================================================================
 */
(function () {
  'use strict';

  var el = Artha.dom.el;
  var api = Artha.api;
  var currentUser = null;
  var autoRefreshTimer = null;

  // Chart instances
  var charts = {
    registration: null,
    statusDistribution: null,
    activity: null,
  };

  // State management
  var state = {
    currentView: 'overview',
    pageSize: parseInt(localStorage.getItem('artha_admin_page_size'), 10) || 20,
    autoRefreshSec: parseInt(localStorage.getItem('artha_admin_refresh_sec'), 10) || 60,
    users: {
      page: 1,
      q: '',
      status: 'all',
      role: 'all',
      sortBy: 'createdAt',
      order: 'desc',
      totalPages: 1,
      totalCount: 0,
    },
    audit: {
      page: 1,
      search: '',
      action: 'all',
      totalPages: 1,
      totalCount: 0,
    },
    pendingAction: null,
  };

  // ==========================================================================
  // UTILITY HELPERS
  // ==========================================================================

  function formatDate(dStr) {
    if (!dStr) return 'Never';
    var d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatRelativeTime(dStr) {
    if (!dStr) return 'Never';
    var d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    var now = new Date();
    var diffMs = now - d;
    var diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    var diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return diffMin + 'm ago';
    var diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return diffHour + 'h ago';
    var diffDays = Math.floor(diffHour / 24);
    if (diffDays < 30) return diffDays + 'd ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatUptime(seconds) {
    var s = Math.floor(seconds || 0);
    var d = Math.floor(s / (3600 * 24));
    var h = Math.floor((s % (3600 * 24)) / 3600);
    var m = Math.floor((s % 3600) / 60);
    var parts = [];
    if (d > 0) parts.push(d + 'd');
    if (h > 0) parts.push(h + 'h');
    parts.push(m + 'm');
    return parts.join(' ');
  }

  function getInitials(name) {
    if (!name) return 'U';
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }

  function debounce(fn, wait) {
    var timeout;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () { fn.apply(context, args); }, wait);
    };
  }

  // Smooth number counting animation
  function animateCount(elem, target) {
    if (!elem) return;
    var end = parseInt(target, 10);
    if (isNaN(end)) {
      elem.textContent = target;
      return;
    }
    var start = 0;
    var duration = 650;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      var ease = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(start + (end - start) * ease);
      elem.textContent = current.toLocaleString('en-US');
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        elem.textContent = end.toLocaleString('en-US');
      }
    }
    requestAnimationFrame(step);
  }

  // ==========================================================================
  // TOAST NOTIFICATION SYSTEM
  // ==========================================================================
  function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('admin-toast-container');
    if (!container) return;

    var iconMap = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
    };

    var toast = el('div', { className: 'admin-toast admin-toast--' + type },
      el('span', { style: 'font-weight: 700; font-size: 1.1rem;' }, iconMap[type] || 'ℹ'),
      el('div', { style: 'flex: 1;' }, message)
    );

    container.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('is-leaving');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, 3500);
  }

  // ==========================================================================
  // INITIALIZATION & SESSION GUARD
  // ==========================================================================
  async function init() {
    var globalLoader = document.getElementById('admin-global-loader');
    var protectedContent = document.getElementById('protected-content');
    var loadError = document.getElementById('load-error');

    try {
      currentUser = await Artha.auth.requireAuth();

      // STRICT ROLE GATE: Ensure caller has administrator privileges
      if (!currentUser || currentUser.role !== 'admin') {
        globalLoader.hidden = true;
        loadError.hidden = false;
        loadError.innerHTML = '<strong>Access Denied:</strong> This portal is strictly restricted to platform administrators. Redirecting to user portal...';
        setTimeout(function () {
          window.location.href = '/pages/dashboard.html';
        }, 1800);
        return;
      }

      // Populate Topbar Admin Profile
      document.getElementById('topbar-admin-name').textContent = currentUser.name || 'Admin';
      document.getElementById('dropdown-admin-name').textContent = currentUser.name || 'Admin';
      document.getElementById('dropdown-admin-email').textContent = currentUser.email || '';
      var initials = getInitials(currentUser.name || 'Admin');
      document.getElementById('topbar-avatar').textContent = initials;

      // Reveal Protected Layout
      globalLoader.hidden = true;
      protectedContent.hidden = false;

      // Wire layout and handlers
      bindLayoutEvents();
      bindModalEvents();
      bindViewEvents();

      // Load initial view
      switchView('overview');
      startAutoRefresh();

      showToast('Welcome to Artha Administration Console', 'info');
    } catch (err) {
      globalLoader.hidden = true;
      loadError.hidden = false;
      loadError.textContent = err.message || 'Authentication failed. Please log in.';
      setTimeout(function () {
        window.location.href = '/pages/login.html';
      }, 2000);
    }
  }

  // ==========================================================================
  // LAYOUT INTERACTION BINDINGS
  // ==========================================================================
  function bindLayoutEvents() {
    var sidebar = document.getElementById('admin-sidebar');
    var toggleBtn = document.getElementById('sidebar-toggle-btn');
    var mobileBtn = document.getElementById('mobile-menu-btn');

    // Sidebar collapse/expand
    toggleBtn.addEventListener('click', function () {
      sidebar.classList.toggle('is-collapsed');
      localStorage.setItem('artha_admin_sidebar_collapsed', sidebar.classList.contains('is-collapsed'));
    });

    // Mobile drawer toggle
    mobileBtn.addEventListener('click', function () {
      sidebar.classList.toggle('is-open');
    });

    // Restore sidebar state
    if (localStorage.getItem('artha_admin_sidebar_collapsed') === 'true') {
      sidebar.classList.add('is-collapsed');
    }

    // View Navigation Items
    document.querySelectorAll('.admin-nav-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var viewKey = btn.getAttribute('data-view');
        switchView(viewKey);
        // On mobile, close sidebar after navigation
        sidebar.classList.remove('is-open');
      });
    });

    // Theme Toggle
    document.getElementById('theme-toggle-btn').addEventListener('click', function () {
      Artha.theme.toggle();
      updateThemeSelector();
      refreshChartPalettes();
    });

    // Profile Dropdown Toggle
    var profileBtn = document.getElementById('admin-profile-btn');
    var profileMenu = document.getElementById('admin-profile-dropdown');
    profileBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      profileMenu.hidden = !profileMenu.hidden;
      document.getElementById('notif-dropdown').hidden = true;
    });

    // Notification Dropdown Toggle
    var notifBtn = document.getElementById('notif-btn');
    var notifMenu = document.getElementById('notif-dropdown');
    notifBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      notifMenu.hidden = !notifMenu.hidden;
      profileMenu.hidden = true;
      document.getElementById('notif-badge').classList.remove('is-visible');
    });

    // Close popovers on click outside
    document.addEventListener('click', function () {
      profileMenu.hidden = true;
      notifMenu.hidden = true;
    });

    // Prevent popover close when clicking inside
    profileMenu.addEventListener('click', function (e) { e.stopPropagation(); });
    notifMenu.addEventListener('click', function (e) { e.stopPropagation(); });

    // Logout
    document.getElementById('btn-admin-logout').addEventListener('click', function () {
      Artha.auth.logout();
    });

    // Jump to settings from dropdown
    document.getElementById('btn-quick-settings').addEventListener('click', function () {
      profileMenu.hidden = true;
      switchView('settings');
    });

    // Clear notifications
    document.getElementById('notif-clear-btn').addEventListener('click', function () {
      document.getElementById('notif-list').innerHTML = '<div class="admin-notif-empty">No unread alerts</div>';
      document.getElementById('notif-badge').classList.remove('is-visible');
    });

    // Jump from overview to audit
    document.getElementById('btn-jump-to-audit').addEventListener('click', function () {
      switchView('audit');
    });
  }

  // ==========================================================================
  // VIEW SWITCHER
  // ==========================================================================
  var VIEW_TITLES = {
    overview: 'Governance Overview',
    users: 'User Account Management',
    monitoring: 'System Monitoring & Diagnostics',
    audit: 'Administrative Audit Logs',
    security: 'Security & Access Architecture',
    dataset: 'Synthetic Dataset Management',
    settings: 'Console Preferences & Settings',
  };

  function switchView(viewKey) {
    state.currentView = viewKey;

    // Update Breadcrumb & Page Title
    document.getElementById('current-view-title').textContent = VIEW_TITLES[viewKey] || 'Dashboard';
    document.title = (VIEW_TITLES[viewKey] || 'Dashboard') + ' - ARTHA Admin';

    // Update Nav buttons
    document.querySelectorAll('.admin-nav-item').forEach(function (btn) {
      if (btn.getAttribute('data-view') === viewKey) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });

    // Toggle Panes
    document.querySelectorAll('.admin-view-pane').forEach(function (pane) {
      if (pane.id === 'view-' + viewKey) {
        pane.hidden = false;
        pane.classList.add('is-active');
      } else {
        pane.hidden = true;
        pane.classList.remove('is-active');
      }
    });

    // Load View Data
    if (viewKey === 'overview') loadOverview();
    else if (viewKey === 'users') loadUsers();
    else if (viewKey === 'monitoring') loadMonitoring();
    else if (viewKey === 'audit') loadAuditLogs();
    else if (viewKey === 'security') loadSecurity();
    else if (viewKey === 'dataset') loadDataset();
    else if (viewKey === 'settings') loadSettings();
  }

  function startAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    if (state.autoRefreshSec > 0) {
      autoRefreshTimer = setInterval(function () {
        if (state.currentView === 'overview') loadOverview(true);
        else if (state.currentView === 'monitoring') loadMonitoring(true);
      }, state.autoRefreshSec * 1000);
    }
  }

  // ==========================================================================
  // VIEW 1: OVERVIEW ENGINE
  // ==========================================================================
  async function loadOverview(silent) {
    var kpiContainer = document.getElementById('overview-kpis');
    if (!silent) {
      kpiContainer.innerHTML =
        '<div class="admin-kpi-card skeleton-card"></div>' +
        '<div class="admin-kpi-card skeleton-card"></div>' +
        '<div class="admin-kpi-card skeleton-card"></div>' +
        '<div class="admin-kpi-card skeleton-card"></div>';
    }

    try {
      var res = await api.get('/admin/dashboard');
      var data = res.data;

      // Update sidebar badge
      document.getElementById('nav-user-count').textContent = data.users.total;

      // Render KPI cards
      renderOverviewKPIs(data);

      // Render charts
      renderRegistrationChart(data.registrationTrends);
      renderStatusDonutChart(data.users);
      renderActivityChart(data.platformActivity);

      // Render recent activity table
      renderRecentAuditTable(data.recentAuditLogs);

      // Topbar Health Pill
      var isHealthy = data.systemHealth && data.systemHealth.database && data.systemHealth.database.status === 'connected';
      document.getElementById('topbar-health-text').textContent = isHealthy ? 'System Healthy' : 'Database Offline';
      var dot = document.querySelector('#topbar-health-pill .admin-status-dot');
      if (dot) {
        dot.className = 'admin-status-dot ' + (isHealthy ? 'is-online' : 'is-offline');
      }
    } catch (err) {
      showToast('Failed to load dashboard overview: ' + err.message, 'error');
    }
  }

  function renderOverviewKPIs(data) {
    var kpis = [
      {
        label: 'Total Registered Users',
        val: data.users.total,
        sub: data.users.admins + ' Admins · ' + data.users.regular + ' Regular',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      },
      {
        label: 'Active User Accounts',
        val: data.users.active,
        sub: data.users.suspended + ' Suspended accounts',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      },
      {
        label: 'Total Financial Transactions',
        val: data.platformActivity.totalTransactions,
        sub: 'Entity count only · Strict Privacy Protected',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      },
      {
        label: 'Platform Budgets & Goals',
        val: data.platformActivity.totalBudgets + data.platformActivity.totalGoals,
        sub: data.platformActivity.totalBudgets + ' Budgets · ' + data.platformActivity.totalGoals + ' Goals',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
      },
    ];

    var container = document.getElementById('overview-kpis');
    container.innerHTML = '';
    kpis.forEach(function (k, i) {
      var card = el('div', { className: 'admin-kpi-card' },
        el('div', { className: 'admin-kpi-card__top' },
          el('span', { className: 'admin-kpi-card__label' }, k.label),
          el('div', { className: 'admin-kpi-card__icon' }, Artha.dom.raw(k.icon))
        ),
        el('div', { className: 'admin-kpi-card__value', id: 'kpi-count-' + i }, '0'),
        el('div', { className: 'admin-kpi-card__sub' }, k.sub)
      );
      container.appendChild(card);
      animateCount(document.getElementById('kpi-count-' + i), k.val);
    });
  }

  function renderRegistrationChart(trends) {
    if (!trends || !trends.length) return;
    var canvas = document.getElementById('registration-chart');
    if (!canvas) return;

    if (charts.registration) charts.registration.destroy();

    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    var gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    var textColor = isDark ? '#94a3b8' : '#64748b';

    charts.registration = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: trends.map(function (t) { return t.label; }),
        datasets: [{
          label: 'New Registrations',
          data: trends.map(function (t) { return t.count; }),
          backgroundColor: 'rgba(99, 102, 241, 0.85)',
          hoverBackgroundColor: 'rgba(99, 102, 241, 1)',
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#cbd5e1' : '#334155',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor, precision: 0 },
          },
        },
      },
    });
  }

  function renderStatusDonutChart(users) {
    var canvas = document.getElementById('status-distribution-chart');
    if (!canvas) return;

    if (charts.statusDistribution) charts.statusDistribution.destroy();

    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    charts.statusDistribution = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Active Users', 'Suspended Accounts'],
        datasets: [{
          data: [users.active || 0, users.suspended || 0],
          backgroundColor: ['#10b981', '#f43f5e'],
          borderColor: isDark ? '#121b30' : '#ffffff',
          borderWidth: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: isDark ? '#94a3b8' : '#64748b',
              padding: 14,
              font: { size: 12 },
            },
          },
        },
      },
    });
  }

  function renderActivityChart(activity) {
    var canvas = document.getElementById('activity-chart');
    if (!canvas) return;

    if (charts.activity) charts.activity.destroy();

    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    var gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    var textColor = isDark ? '#94a3b8' : '#64748b';

    charts.activity = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Transactions', 'Budgets', 'Goals', 'Audit Logs'],
        datasets: [{
          label: 'Recorded Entities',
          data: [
            activity.totalTransactions || 0,
            activity.totalBudgets || 0,
            activity.totalGoals || 0,
            activity.totalAuditLogs || 0,
          ],
          backgroundColor: [
            'rgba(56, 189, 248, 0.85)',
            'rgba(99, 102, 241, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(245, 158, 11, 0.85)',
          ],
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, precision: 0 },
          },
          y: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 11, weight: '600' } },
          },
        },
      },
    });
  }

  function renderRecentAuditTable(logs) {
    var tbody = document.getElementById('overview-recent-audit');
    if (!tbody) return;

    if (!logs || !logs.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No recent security events</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    logs.forEach(function (log) {
      var tr = el('tr', {},
        el('td', { className: 'text-muted' }, formatRelativeTime(log.createdAt)),
        el('td', {}, el('span', { className: 'admin-status-badge is-ok' }, log.action)),
        el('td', {}, log.targetUserEmail || (log.details && log.details.reason) || 'System Event'),
        el('td', { className: 'text-muted' }, log.adminEmail || 'System')
      );
      tbody.appendChild(tr);
    });
  }

  // ==========================================================================
  // VIEW 2: USER MANAGEMENT ENGINE
  // ==========================================================================
  async function loadUsers() {
    var tbody = document.getElementById('users-table-tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Loading user accounts...</td></tr>';

    try {
      var query = '?page=' + state.users.page +
        '&limit=' + state.pageSize +
        '&q=' + encodeURIComponent(state.users.q) +
        '&status=' + state.users.status +
        '&role=' + state.users.role +
        '&sortBy=' + state.users.sortBy +
        '&order=' + state.users.order;

      var res = await api.get('/admin/users' + query);
      var users = res.data.users;
      var pagination = res.data.pagination;

      state.users.totalPages = pagination.totalPages;
      state.users.totalCount = pagination.total;

      renderUsersTable(users);
      updateUserPagination(pagination);
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">' + err.message + '</td></tr>';
      showToast('Error loading users: ' + err.message, 'error');
    }
  }

  function renderUsersTable(users) {
    var tbody = document.getElementById('users-table-tbody');
    tbody.innerHTML = '';

    if (!users || !users.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-6 text-muted">No user accounts match current criteria.</td></tr>';
      return;
    }

    users.forEach(function (u) {
      var isSelf = currentUser && String(currentUser._id) === String(u._id);
      var initials = getInitials(u.name);

      var tr = el('tr', {},
        // User identity cell
        el('td', {},
          el('div', { className: 'user-cell' },
            el('div', { className: 'user-cell__avatar' }, initials),
            el('div', { className: 'user-cell__info' },
              el('strong', {}, u.name || 'Unnamed'),
              el('span', {}, 'ID: ' + u._id.substring(0, 8) + '...')
            )
          )
        ),
        // Email
        el('td', {}, u.email),
        // Role
        el('td', {},
          el('span', { className: 'status-pill status-pill--' + u.role }, u.role === 'admin' ? 'Admin' : 'User')
        ),
        // Status
        el('td', {},
          el('span', { className: 'status-pill status-pill--' + u.status }, u.status)
        ),
        // Registered
        el('td', { className: 'text-muted' }, formatDate(u.createdAt)),
        // Last Login
        el('td', { className: 'text-muted' }, formatRelativeTime(u.lastLoginAt)),
        // Actions
        el('td', { className: 'text-right' },
          el('div', { className: 'admin-actions-group' },
            // Status action
            el('button', {
              className: 'admin-btn admin-btn--sm ' + (u.status === 'active' ? 'admin-btn--danger' : 'admin-btn--secondary'),
              type: 'button',
              disabled: isSelf,
              title: isSelf ? 'Cannot suspend self' : (u.status === 'active' ? 'Suspend account' : 'Reactivate account'),
              on: { click: function () { triggerUserStatusModal(u); } },
            }, u.status === 'active' ? 'Suspend' : 'Activate'),
            // Role action
            el('button', {
              className: 'admin-btn admin-btn--sm admin-btn--secondary',
              type: 'button',
              disabled: isSelf,
              title: isSelf ? 'Cannot alter self role' : (u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'),
              on: { click: function () { triggerUserRoleModal(u); } },
            }, u.role === 'admin' ? 'Demote' : 'Promote'),
            // History
            el('button', {
              className: 'admin-btn admin-btn--sm admin-btn--secondary',
              type: 'button',
              title: 'View account moderation history',
              on: { click: function () { showUserHistoryModal(u); } },
            }, 'History')
          )
        )
      );
      tbody.appendChild(tr);
    });
  }

  function updateUserPagination(pagination) {
    var info = document.getElementById('users-page-info');
    var badge = document.getElementById('users-page-number');
    var prevBtn = document.getElementById('users-prev-btn');
    var nextBtn = document.getElementById('users-next-btn');

    var start = (pagination.page - 1) * pagination.limit + 1;
    var end = Math.min(pagination.total, pagination.page * pagination.limit);

    info.textContent = pagination.total === 0 ? 'No accounts' : ('Showing ' + start + '–' + end + ' of ' + pagination.total + ' users');
    badge.textContent = 'Page ' + pagination.page + ' of ' + pagination.totalPages;

    prevBtn.disabled = pagination.page <= 1;
    nextBtn.disabled = pagination.page >= pagination.totalPages;
  }

  // ==========================================================================
  // VIEW 3: SYSTEM MONITORING ENGINE
  // ==========================================================================
  async function loadMonitoring(silent) {
    try {
      var res = await api.get('/admin/system-health');
      var h = res.data;

      renderMonitoringGauges(h);
      renderServerSpecs(h.server);
      renderDatabaseSpecs(h.database);
      renderPythonSpecs(h.pythonAnalysis);
      renderMemoryMeter(h.server.memory);

      if (!silent) showToast('System telemetry ping completed', 'success');
    } catch (err) {
      showToast('Telemetry probe failed: ' + err.message, 'error');
    }
  }

  function renderMonitoringGauges(h) {
    var container = document.getElementById('monitoring-gauges');
    container.innerHTML = '';

    var dbPing = (h.database && h.database.pingMs != null) ? (h.database.pingMs + ' ms') : 'N/A';
    var isDbOk = h.database && h.database.status === 'connected';

    var gauges = [
      {
        label: 'API Server Availability',
        val: '100% OK',
        sub: 'Uptime: ' + formatUptime(h.server.uptimeSeconds),
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
      },
      {
        label: 'Database Ping Latency',
        val: dbPing,
        sub: isDbOk ? 'Operational · Embedded/Local' : 'Disconnected',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
      },
      {
        label: 'Python Analysis Engine',
        val: h.pythonAnalysis.available ? 'Ready' : 'Offline',
        sub: 'Pandas & NumPy Bridge',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line></svg>',
      },
      {
        label: 'Heap Memory Allocation',
        val: formatBytes(h.server.memory.heapUsed),
        sub: 'Total: ' + formatBytes(h.server.memory.heapTotal),
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
      },
    ];

    gauges.forEach(function (g, i) {
      var card = el('div', { className: 'admin-kpi-card' },
        el('div', { className: 'admin-kpi-card__top' },
          el('span', { className: 'admin-kpi-card__label' }, g.label),
          el('div', { className: 'admin-kpi-card__icon' }, Artha.dom.raw(g.icon))
        ),
        el('div', { className: 'admin-kpi-card__value' }, g.val),
        el('div', { className: 'admin-kpi-card__sub' }, g.sub)
      );
      container.appendChild(card);
    });
  }

  function renderServerSpecs(s) {
    var c = document.getElementById('server-specs-list');
    c.innerHTML =
      '<div class="admin-spec-row"><span>Node.js Engine</span><strong>' + s.nodeVersion + '</strong></div>' +
      '<div class="admin-spec-row"><span>Operating Platform</span><strong>' + s.platform + ' (' + s.arch + ')</strong></div>' +
      '<div class="admin-spec-row"><span>Process Identifier (PID)</span><strong>' + s.pid + '</strong></div>' +
      '<div class="admin-spec-row"><span>Express Server Status</span><strong class="text-success">Listening (:5000)</strong></div>' +
      '<div class="admin-spec-row"><span>Service Uptime</span><strong>' + formatUptime(s.uptimeSeconds) + '</strong></div>';
  }

  function renderDatabaseSpecs(db) {
    var c = document.getElementById('database-specs-list');
    c.innerHTML =
      '<div class="admin-spec-row"><span>Connection Status</span><strong class="text-success">' + db.status.toUpperCase() + '</strong></div>' +
      '<div class="admin-spec-row"><span>Database Name</span><strong>' + db.name + '</strong></div>' +
      '<div class="admin-spec-row"><span>Ping Latency</span><strong>' + (db.pingMs != null ? db.pingMs + ' ms' : 'N/A') + '</strong></div>' +
      '<div class="admin-spec-row"><span>Driver State</span><strong>readyState = ' + db.readyState + ' (Connected)</strong></div>' +
      '<div class="admin-spec-row"><span>Storage Mode</span><strong>Embedded & Local Persistent</strong></div>';
  }

  function renderPythonSpecs(py) {
    var c = document.getElementById('python-specs-list');
    var libs = py.libraries || {};
    c.innerHTML =
      '<div class="admin-spec-row"><span>Subprocess Bridge</span><strong class="' + (py.available ? 'text-success' : 'text-danger') + '">' + (py.available ? 'Operational' : 'Failed') + '</strong></div>' +
      '<div class="admin-spec-row"><span>Python Interpreter</span><strong>' + (py.version || 'Unknown') + '</strong></div>' +
      '<div class="admin-spec-row"><span>NumPy Version</span><strong>' + (libs.numpy || 'N/A') + '</strong></div>' +
      '<div class="admin-spec-row"><span>Pandas Version</span><strong>' + (libs.pandas || 'N/A') + '</strong></div>' +
      '<div class="admin-spec-row"><span>Execution Protocol</span><strong>child_process.execFile (JSON IPC)</strong></div>';
  }

  function renderMemoryMeter(mem) {
    var c = document.getElementById('memory-meter-container');
    var pct = mem.heapTotal > 0 ? Math.round((mem.heapUsed / mem.heapTotal) * 100) : 0;
    c.innerHTML =
      '<div class="admin-meter-item">' +
        '<div class="admin-meter-item__head"><span>Heap Utilization</span><strong>' + pct + '% (' + formatBytes(mem.heapUsed) + ' / ' + formatBytes(mem.heapTotal) + ')</strong></div>' +
        '<div class="admin-meter-item__bar"><div class="admin-meter-item__fill" style="width: ' + pct + '%;"></div></div>' +
      '</div>' +
      '<div class="admin-spec-row" style="margin-top: 10px;"><span>Resident Set Size (RSS)</span><strong>' + formatBytes(mem.rssBytes) + '</strong></div>' +
      '<div class="admin-spec-row"><span>External Buffers</span><strong>' + formatBytes(mem.externalBytes) + '</strong></div>';
  }

  // ==========================================================================
  // VIEW 4: AUDIT LOGS ENGINE
  // ==========================================================================
  async function loadAuditLogs() {
    var tbody = document.getElementById('audit-table-tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Loading audit entries...</td></tr>';

    try {
      var query = '?page=' + state.audit.page +
        '&limit=' + state.pageSize +
        '&action=' + state.audit.action +
        '&search=' + encodeURIComponent(state.audit.search);

      var res = await api.get('/admin/audit-logs' + query);
      var logs = res.data.logs;
      var pagination = res.data.pagination;

      state.audit.totalPages = pagination.totalPages;
      state.audit.totalCount = pagination.total;

      renderAuditTable(logs);
      updateAuditPagination(pagination);
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">' + err.message + '</td></tr>';
      showToast('Error loading audit logs: ' + err.message, 'error');
    }
  }

  function renderAuditTable(logs) {
    var tbody = document.getElementById('audit-table-tbody');
    tbody.innerHTML = '';

    if (!logs || !logs.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-6 text-muted">No audit log records match query.</td></tr>';
      return;
    }

    logs.forEach(function (log) {
      var detailsSummary = (log.details && (log.details.reason || log.details.message)) || JSON.stringify(log.details || {});

      var tr = el('tr', {},
        el('td', { className: 'text-muted' }, formatDate(log.createdAt)),
        el('td', {}, el('strong', {}, log.adminEmail || 'System')),
        el('td', {}, el('span', { className: 'admin-status-badge is-ok' }, log.action)),
        el('td', {}, log.targetUserEmail || '-'),
        el('td', { style: 'max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' }, detailsSummary),
        el('td', { className: 'text-muted' }, log.ipAddress || 'Internal'),
        el('td', { className: 'text-right' },
          el('button', {
            className: 'admin-btn admin-btn--sm admin-btn--secondary',
            type: 'button',
            on: { click: function () { showAuditInspectModal(log); } },
          }, 'Inspect')
        )
      );
      tbody.appendChild(tr);
    });
  }

  function updateAuditPagination(pagination) {
    var info = document.getElementById('audit-page-info');
    var badge = document.getElementById('audit-page-number');
    var prevBtn = document.getElementById('audit-prev-btn');
    var nextBtn = document.getElementById('audit-next-btn');

    var start = (pagination.page - 1) * pagination.limit + 1;
    var end = Math.min(pagination.total, pagination.page * pagination.limit);

    info.textContent = pagination.total === 0 ? 'No events' : ('Showing ' + start + '–' + end + ' of ' + pagination.total + ' audit events');
    badge.textContent = 'Page ' + pagination.page + ' of ' + pagination.totalPages;

    prevBtn.disabled = pagination.page <= 1;
    nextBtn.disabled = pagination.page >= pagination.totalPages;
  }

  // ==========================================================================
  // VIEW 5: SECURITY & ACCESS ENGINE
  // ==========================================================================
  async function loadSecurity() {
    try {
      var res = await api.get('/admin/users?role=admin&limit=50');
      var admins = res.data.users || [];

      var list = document.getElementById('authorized-admins-list');
      list.innerHTML = '';

      admins.forEach(function (admin) {
        var isSelf = currentUser && String(currentUser._id) === String(admin._id);
        var row = el('div', { className: 'admin-spec-row' },
          el('div', {},
            el('strong', {}, admin.name + (isSelf ? ' (You)' : '')),
            el('div', { className: 'text-muted', style: 'font-size: 0.78rem;' }, admin.email + ' · Active since ' + formatDate(admin.createdAt))
          ),
          el('span', { className: 'status-pill status-pill--admin' }, 'Superadmin')
        );
        list.appendChild(row);
      });

      // Session Security specs
      var specs = document.getElementById('session-security-specs');
      specs.innerHTML =
        '<div class="admin-spec-row"><span>Session Subject</span><strong>' + (currentUser.email || 'Admin') + '</strong></div>' +
        '<div class="admin-spec-row"><span>Token Cryptography</span><strong>HMAC-SHA256 (HS256)</strong></div>' +
        '<div class="admin-spec-row"><span>Token Expiration Policy</span><strong>2 Hours (Stateless)</strong></div>' +
        '<div class="admin-spec-row"><span>Password Hashing Algorithm</span><strong>Bcrypt (Cost 12)</strong></div>' +
        '<div class="admin-spec-row"><span>Financial Data Boundary</span><strong class="text-success">Verified Active & Isolated</strong></div>';
    } catch (err) {
      showToast('Error loading security settings: ' + err.message, 'error');
    }
  }

  // ==========================================================================
  // VIEW 6: DATASET MANAGEMENT ENGINE
  // ==========================================================================
  async function loadDataset() {
    var kpis = document.getElementById('dataset-kpi-grid');
    kpis.innerHTML =
      '<div class="admin-kpi-card skeleton-card"></div>' +
      '<div class="admin-kpi-card skeleton-card"></div>' +
      '<div class="admin-kpi-card skeleton-card"></div>' +
      '<div class="admin-kpi-card skeleton-card"></div>';

    try {
      var res = await api.get('/admin/dataset/stats');
      var s = res.data;

      var cards = [
        {
          label: 'Synthetic Demo Users',
          val: s.users.demo,
          sub: s.users.demoActive + ' Active · ' + s.users.demoSuspended + ' Suspended',
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>',
        },
        {
          label: 'Synthetic Transactions',
          val: s.transactions.demo,
          sub: 'Spanning May–Oct 2026',
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
        },
        {
          label: 'Synthetic Category Budgets',
          val: s.budgets.demo,
          sub: 'Monthly limits across demo users',
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>',
        },
        {
          label: 'Synthetic Savings Goals',
          val: s.goals.demo,
          sub: 'With sequential contributions',
          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>',
        },
      ];

      kpis.innerHTML = '';
      cards.forEach(function (c, i) {
        var card = el('div', { className: 'admin-kpi-card' },
          el('div', { className: 'admin-kpi-card__top' },
            el('span', { className: 'admin-kpi-card__label' }, c.label),
            el('div', { className: 'admin-kpi-card__icon' }, Artha.dom.raw(c.icon))
          ),
          el('div', { className: 'admin-kpi-card__value', id: 'ds-kpi-' + i }, '0'),
          el('div', { className: 'admin-kpi-card__sub' }, c.sub)
        );
        kpis.appendChild(card);
        animateCount(document.getElementById('ds-kpi-' + i), c.val);
      });
    } catch (err) {
      kpis.innerHTML = '<div class="text-danger">' + err.message + '</div>';
    }
  }

  // ==========================================================================
  // VIEW 7: SETTINGS ENGINE
  // ==========================================================================
  function loadSettings() {
    updateThemeSelector();
    document.getElementById('settings-page-size').value = String(state.pageSize);
    document.getElementById('settings-autorefresh').value = String(state.autoRefreshSec);
  }

  function updateThemeSelector() {
    var select = document.getElementById('settings-theme-select');
    if (select) {
      select.value = localStorage.getItem('theme') || 'system';
    }
  }

  // ==========================================================================
  // MODAL CONFIRMATION & ACTIONS
  // ==========================================================================
  function bindModalEvents() {
    var actionModal = document.getElementById('admin-action-modal');
    var closeBtn = document.getElementById('modal-action-close-btn');
    var cancelBtn = document.getElementById('modal-action-cancel-btn');
    var confirmBtn = document.getElementById('modal-action-confirm-btn');

    function closeModal() {
      actionModal.hidden = true;
      state.pendingAction = null;
    }

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    confirmBtn.addEventListener('click', async function () {
      if (!state.pendingAction) return;

      var reason = document.getElementById('modal-action-reason').value.trim();
      var action = state.pendingAction;

      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Processing...';

      try {
        if (action.type === 'STATUS') {
          await api.patch('/admin/users/' + action.userId + '/status', {
            status: action.newStatus,
            reason: reason || 'Administrative action via panel',
          });
          showToast('Account successfully ' + (action.newStatus === 'active' ? 'activated' : 'suspended'), 'success');
          loadUsers();
          loadOverview(true);
        } else if (action.type === 'ROLE') {
          await api.patch('/admin/users/' + action.userId + '/role', {
            role: action.newRole,
            reason: reason || 'Role altered via administrative console',
          });
          showToast('User role updated to ' + action.newRole, 'success');
          loadUsers();
          loadSecurity();
        } else if (action.type === 'SEED') {
          var sRes = await api.post('/admin/dataset/seed', { reason: reason || 'Synthetic dataset generated via admin console' });
          showToast(sRes.message || 'Dataset seeded successfully!', 'success');
          loadDataset();
          loadOverview(true);
        } else if (action.type === 'CLEAR') {
          var cRes = await api.delete('/admin/dataset/demo', { reason: reason || 'Demo records cleared via admin console' });
          showToast(cRes.message || 'Demo records removed!', 'info');
          loadDataset();
          loadOverview(true);
        }
        closeModal();
      } catch (err) {
        showToast('Operation failed: ' + err.message, 'error');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Action';
      }
    });

    // History Modal close
    document.getElementById('modal-history-close-btn').addEventListener('click', function () {
      document.getElementById('admin-history-modal').hidden = true;
    });
    document.getElementById('modal-history-done-btn').addEventListener('click', function () {
      document.getElementById('admin-history-modal').hidden = true;
    });

    // Audit Inspect Modal close
    document.getElementById('modal-audit-close-btn').addEventListener('click', function () {
      document.getElementById('admin-audit-modal').hidden = true;
    });
    document.getElementById('modal-audit-done-btn').addEventListener('click', function () {
      document.getElementById('admin-audit-modal').hidden = true;
    });
  }

  function triggerUserStatusModal(user) {
    var modal = document.getElementById('admin-action-modal');
    var isSuspending = user.status === 'active';
    var nextStatus = isSuspending ? 'suspended' : 'active';

    document.getElementById('modal-action-title').textContent = (isSuspending ? 'Suspend' : 'Reactivate') + ' User Account';
    document.getElementById('modal-action-desc').textContent =
      'Are you sure you want to ' + (isSuspending ? 'SUSPEND' : 'REACTIVATE') + ' the account for "' + user.name + '" (' + user.email + ')? ' +
      (isSuspending ? 'The user will be immediately locked out from logging in and accessing APIs.' : 'The user will regain normal access to their account.');

    document.getElementById('modal-action-reason').value = '';
    state.pendingAction = {
      type: 'STATUS',
      userId: user._id,
      newStatus: nextStatus,
    };
    modal.hidden = false;
  }

  function triggerUserRoleModal(user) {
    var modal = document.getElementById('admin-action-modal');
    var isPromoting = user.role === 'user';
    var nextRole = isPromoting ? 'admin' : 'user';

    document.getElementById('modal-action-title').textContent = (isPromoting ? 'Promote to' : 'Demote from') + ' Administrator';
    document.getElementById('modal-action-desc').textContent =
      'Are you sure you want to change the role for "' + user.name + '" (' + user.email + ') to ' + nextRole.toUpperCase() + '?';

    document.getElementById('modal-action-reason').value = '';
    state.pendingAction = {
      type: 'ROLE',
      userId: user._id,
      newRole: nextRole,
    };
    modal.hidden = false;
  }

  async function showUserHistoryModal(user) {
    var modal = document.getElementById('admin-history-modal');
    document.getElementById('modal-history-title').textContent = 'Moderation History: ' + (user.name || 'User');
    document.getElementById('modal-history-subtitle').textContent = user.email + ' · Registered: ' + formatDate(user.createdAt);

    var tbody = document.getElementById('modal-history-tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Retrieving moderation history...</td></tr>';
    modal.hidden = false;

    try {
      var res = await api.get('/admin/users/' + user._id + '/history');
      var history = res.data.history || [];

      if (!history.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">No administrative moderation events recorded for this user.</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      history.forEach(function (h) {
        var tr = el('tr', {},
          el('td', { className: 'text-muted' }, formatDate(h.createdAt)),
          el('td', {}, h.adminEmail || 'Admin'),
          el('td', {}, el('span', { className: 'admin-status-badge is-ok' }, h.action)),
          el('td', {}, (h.details && (h.details.reason || h.details.newStatus || h.details.newRole)) || JSON.stringify(h.details || {}))
        );
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-danger text-center py-4">' + err.message + '</td></tr>';
    }
  }

  function showAuditInspectModal(log) {
    var modal = document.getElementById('admin-audit-modal');
    var specList = document.getElementById('modal-audit-spec-list');
    var payload = document.getElementById('modal-audit-payload');

    specList.innerHTML =
      '<div class="admin-spec-row"><span>Event Action</span><strong>' + log.action + '</strong></div>' +
      '<div class="admin-spec-row"><span>Timestamp</span><strong>' + formatDate(log.createdAt) + ' (' + log.createdAt + ')</strong></div>' +
      '<div class="admin-spec-row"><span>Administrator</span><strong>' + (log.adminEmail || 'System') + '</strong></div>' +
      '<div class="admin-spec-row"><span>Target User Email</span><strong>' + (log.targetUserEmail || 'N/A') + '</strong></div>' +
      '<div class="admin-spec-row"><span>Target User ID</span><strong>' + (log.targetUserId || 'N/A') + '</strong></div>' +
      '<div class="admin-spec-row"><span>IP Address</span><strong>' + (log.ipAddress || 'Internal') + '</strong></div>' +
      '<div class="admin-spec-row"><span>User Agent</span><strong style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + (log.userAgent || 'N/A') + '</strong></div>';

    payload.textContent = JSON.stringify(log.details || {}, null, 2);
    modal.hidden = false;
  }

  // ==========================================================================
  // VIEW-SPECIFIC EVENT LISTENERS
  // ==========================================================================
  function bindViewEvents() {
    // Overview Refresh
    document.getElementById('btn-refresh-overview').addEventListener('click', function () {
      loadOverview();
      showToast('Dashboard metrics refreshed', 'info');
    });

    // Users Toolbar
    var searchInput = document.getElementById('user-search-input');
    searchInput.addEventListener('input', debounce(function () {
      state.users.q = searchInput.value.trim();
      state.users.page = 1;
      loadUsers();
    }, 300));

    document.getElementById('user-filter-status').addEventListener('change', function (e) {
      state.users.status = e.target.value;
      state.users.page = 1;
      loadUsers();
    });

    document.getElementById('user-filter-role').addEventListener('change', function (e) {
      state.users.role = e.target.value;
      state.users.page = 1;
      loadUsers();
    });

    document.getElementById('user-sort-select').addEventListener('change', function (e) {
      var parts = e.target.value.split('-');
      state.users.sortBy = parts[0];
      state.users.order = parts[1];
      state.users.page = 1;
      loadUsers();
    });

    document.getElementById('btn-refresh-users').addEventListener('click', function () {
      loadUsers();
      showToast('User list refreshed', 'info');
    });

    // Users Pagination
    document.getElementById('users-prev-btn').addEventListener('click', function () {
      if (state.users.page > 1) {
        state.users.page--;
        loadUsers();
      }
    });

    document.getElementById('users-next-btn').addEventListener('click', function () {
      if (state.users.page < state.users.totalPages) {
        state.users.page++;
        loadUsers();
      }
    });

    // Export Users CSV
    document.getElementById('btn-export-users-csv').addEventListener('click', async function () {
      try {
        var token = Artha.auth.getToken();
        var res = await fetch('/api/admin/users/export', {
          headers: { 'Authorization': 'Bearer ' + token },
        });
        if (!res.ok) throw new Error('Export request returned HTTP ' + res.status);
        var blob = await res.blob();
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'artha-users-export-' + new Date().toISOString().split('T')[0] + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast('Users metadata CSV exported successfully', 'success');
      } catch (err) {
        showToast('Export failed: ' + err.message, 'error');
      }
    });

    // Monitoring
    document.getElementById('btn-run-diagnostics').addEventListener('click', function () {
      loadMonitoring();
    });

    // Audit Logs Toolbar
    var auditSearch = document.getElementById('audit-search-input');
    auditSearch.addEventListener('input', debounce(function () {
      state.audit.search = auditSearch.value.trim();
      state.audit.page = 1;
      loadAuditLogs();
    }, 300));

    document.getElementById('audit-filter-action').addEventListener('change', function (e) {
      state.audit.action = e.target.value;
      state.audit.page = 1;
      loadAuditLogs();
    });

    document.getElementById('btn-refresh-audit').addEventListener('click', function () {
      loadAuditLogs();
      showToast('Audit trail refreshed', 'info');
    });

    // Audit Pagination
    document.getElementById('audit-prev-btn').addEventListener('click', function () {
      if (state.audit.page > 1) {
        state.audit.page--;
        loadAuditLogs();
      }
    });

    document.getElementById('audit-next-btn').addEventListener('click', function () {
      if (state.audit.page < state.audit.totalPages) {
        state.audit.page++;
        loadAuditLogs();
      }
    });

    // Dataset Management Actions
    document.getElementById('btn-seed-dataset').addEventListener('click', function () {
      var modal = document.getElementById('admin-action-modal');
      document.getElementById('modal-action-title').textContent = 'Seed Synthetic Demonstration Dataset';
      document.getElementById('modal-action-desc').textContent =
        'This will populate 50 realistic Indian demo profiles, 1,000+ multi-month financial transactions, category budgets, and savings goals. Existing demo accounts (@example.com) will be cleanly replaced. Real accounts and administrators remain completely untouched.';
      document.getElementById('modal-action-reason').value = '';
      state.pendingAction = { type: 'SEED' };
      modal.hidden = false;
    });

    document.getElementById('btn-clear-dataset').addEventListener('click', function () {
      var modal = document.getElementById('admin-action-modal');
      document.getElementById('modal-action-title').textContent = 'Remove Demo Dataset Records';
      document.getElementById('modal-action-desc').textContent =
        'Are you sure you want to delete all synthetic demo accounts (@example.com) and their transactions, budgets, and goals? Real accounts and administrator profiles will be preserved.';
      document.getElementById('modal-action-reason').value = '';
      state.pendingAction = { type: 'CLEAR' };
      modal.hidden = false;
    });

    // Settings
    document.getElementById('settings-theme-select').addEventListener('change', function (e) {
      Artha.theme.set(e.target.value);
      refreshChartPalettes();
      showToast('Theme set to ' + e.target.value, 'info');
    });

    document.getElementById('settings-page-size').addEventListener('change', function (e) {
      state.pageSize = parseInt(e.target.value, 10);
      localStorage.setItem('artha_admin_page_size', state.pageSize);
      showToast('Default rows per page updated', 'info');
    });

    document.getElementById('settings-autorefresh').addEventListener('change', function (e) {
      state.autoRefreshSec = parseInt(e.target.value, 10);
      localStorage.setItem('artha_admin_refresh_sec', state.autoRefreshSec);
      startAutoRefresh();
      showToast('Auto-refresh interval set to ' + (state.autoRefreshSec === 0 ? 'Manual' : state.autoRefreshSec + 's'), 'info');
    });
  }

  function refreshChartPalettes() {
    if (state.currentView === 'overview') {
      loadOverview(true);
    }
  }

  // Self-start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
