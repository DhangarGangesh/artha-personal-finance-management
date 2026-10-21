/* Shared signed-in page frame: header with navigation, theme toggle and logout. */
(function () {
  var el = Artha.dom.el;
  var LINKS = [
    { key: 'dashboard', href: '/pages/dashboard.html', label: 'Dashboard' },
    { key: 'transactions', href: '/pages/transactions.html', label: 'Transactions' },
    { key: 'budgets', href: '/pages/budgets.html', label: 'Budgets' },
    { key: 'goals', href: '/pages/goals.html', label: 'Goals' },
    { key: 'analytics', href: '/pages/analytics.html', label: 'Analytics' },
    { key: 'regression', href: '/pages/regression.html', label: 'Financial Trends' },
    { key: 'alerts', href: '/pages/alerts.html', label: 'Insights & Alerts' },
  ];

  function mount(active, user) {
    var header = document.getElementById('app-header');
    var nav = el('nav', { className: 'app-nav', attrs: { 'aria-label': 'Main' } });
    var pageLinks = LINKS.slice();
    if (user && user.role === 'admin') {
      pageLinks.push({ key: 'admin', href: '/pages/admin.html', label: 'Admin Panel' });
    }
    pageLinks.forEach(function (l) {
      var a = el('a', { href: l.href, text: l.label });
      if (l.key === active) a.setAttribute('aria-current', 'page');
      nav.appendChild(a);
    });
    header.appendChild(el('a', { className: 'app-header__brand', href: '/pages/dashboard.html', text: 'ARTHA' }));
    header.appendChild(nav);
    var userSpan = el('span', {}, 'Signed in as ', el('strong', { text: user.name }));
    if (user && user.role === 'admin') {
      userSpan.appendChild(el('span', { className: 'badge badge--primary', style: 'margin-left: 6px; font-size: 0.72rem; vertical-align: middle;' }, 'Admin'));
    }
    header.appendChild(el('div', { className: 'app-header__user' },
      userSpan,
      el('button', { className: 'btn btn--sm', type: 'button', text: 'Theme', attrs: { 'aria-label': 'Toggle light or dark theme' }, on: { click: function () { Artha.theme.toggle(); } } }),
      el('button', { className: 'btn btn--sm', type: 'button', text: 'Log out', on: { click: function () { Artha.auth.logout(); } } })
    ));
  }

  /* Standard bootstrap for a protected page: verify the session, draw the header, reveal the content. */
  function start(active, init) {
    Artha.auth.requireAuth().then(function (user) {
      mount(active, user);
      document.getElementById('protected-content').hidden = false;
      return init(user);
    }).catch(function (err) {
      var box = document.getElementById('load-error');
      box.textContent = err.message;
      box.hidden = false;
    });
  }

  window.Artha.layout = { start: start };
})();
