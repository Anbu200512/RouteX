/* ============================================================
   RouteX — main.js
   Core utilities: localStorage store, session, shared data
   (plans + routes), toasts, modals, SVG map engine, scroll
   reveal, back-to-top, theme helpers.
   ============================================================ */

(function () {
  'use strict';

  /* ---------------- localStorage store ---------------- */
  function get(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }
  function set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  /* ---------------- shared plans ---------------- */
  var PLANS = [
    {
      id: 'basic',
      name: 'Basic',
      price: 899,
      tagline: 'Essential one-way transport',
      description: 'Budget-friendly single-trip transport for one commute a day — with live tracking and SMS alerts so you always know where the bus is.',
      popular: false,
      features: [
        'One-way transport (morning or afternoon)',
        'Live GPS tracking in the app & dashboard',
        'Basic SMS notifications (boarding & delays)',
        'Verified driver & GPS-equipped bus',
        'Parent dashboard & profile',
        'Digital receipts every month',
        'Email support, Monday to Saturday',
        'Cancel anytime — no lock-in'
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 1499,
      tagline: 'Full-day coverage for growing families',
      description: 'The complete school day covered — to and from school — with boarding and drop confirmations, delay alerts and trip history for every ride.',
      popular: true,
      features: [
        'Two-way transport (to and from school)',
        'Live GPS tracking in the app & dashboard',
        'Boarding & drop confirmations',
        'Delay & route-change alerts',
        'Trip history & ride logs',
        'Parent dashboard & profile',
        'Digital receipts every month',
        'Parent support 7 days a week',
        'Free plan changes anytime',
        'Cancel anytime — no lock-in'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 2299,
      tagline: 'Priority care with advanced safety',
      description: 'Priority care with advanced tracking, a dedicated ride manager and 24x7 support — built for families who want the highest level of coverage.',
      popular: false,
      features: [
        'Two-way priority transport (guaranteed seat)',
        'Advanced live tracking (position every 5 seconds)',
        'All notification types (SMS, push & email)',
        'Priority 24x7 support line',
        'Dedicated ride manager',
        'Free schedule changes anytime',
        'Trip history & ride logs',
        'Profiles for up to 4 children',
        'Digital receipts & tax invoice',
        'Cancel anytime — no lock-in'
      ]
    }
  ];

  /* ---------------- shared routes ---------------- */
  var ROUTES = [
    {
      id: 'r1',
      name: 'Greenwood Route',
      busNo: 'SB-104',
      driver: 'Raj Sharma',
      phone: '+91 98765 00104',
      color: '#3b82f6',
      availability: 'Available',
      areas: ['Greenwood', 'Lakeview', 'Hillcrest'],
      zones: ['North', 'Central'],
      stops: [
        { name: 'Greenwood Park', zone: 'North', pick: '7:36 AM', drop: '4:26 PM' },
        { name: 'Lakeview Gate', zone: 'Central', pick: '7:42 AM', drop: '4:20 PM' },
        { name: 'Maple Street', zone: 'Central', pick: '7:48 AM', drop: '4:14 PM' },
        { name: 'Hillcrest Road', zone: 'North', pick: '7:54 AM', drop: '4:08 PM' },
        { name: 'Emerald Academy (School)', zone: '-', pick: '8:05 AM', drop: '-' }
      ],
      coords: [[40, 280], [110, 262], [180, 224], [250, 178], [320, 150], [390, 116], [470, 92], [545, 62], [600, 40]]
    },
    {
      id: 'r2',
      name: 'Sunrise Circuit',
      busNo: 'SB-108',
      driver: 'Meena Iyer',
      phone: '+91 98765 00108',
      color: '#f59e0b',
      availability: 'Few seats',
      areas: ['Sunrise', 'Palm Grove', 'Vista'],
      zones: ['West', 'Central'],
      stops: [
        { name: 'Palm Grove', zone: 'West', pick: '7:30 AM', drop: '4:32 PM' },
        { name: 'Sunrise Phase-2', zone: 'Central', pick: '7:38 AM', drop: '4:24 PM' },
        { name: 'Vista Towers', zone: 'West', pick: '7:45 AM', drop: '4:16 PM' },
        { name: 'Civic Center', zone: 'Central', pick: '7:52 AM', drop: '4:10 PM' },
        { name: 'Emerald Academy (School)', zone: '-', pick: '8:02 AM', drop: '-' }
      ],
      coords: [[60, 300], [140, 296], [210, 268], [250, 210], [310, 168], [250, 96], [330, 60], [430, 52], [560, 30]]
    },
    {
      id: 'r3',
      name: 'Maple Valley',
      busNo: 'SB-112',
      driver: 'Arun Verma',
      phone: '+91 98765 00112',
      color: '#10b981',
      availability: 'Available',
      areas: ['Maple', 'Riverdale', 'Old Town'],
      zones: ['South', 'East'],
      stops: [
        { name: 'Riverdale Bridge', zone: 'South', pick: '7:34 AM', drop: '4:28 PM' },
        { name: 'Old Town Market', zone: 'East', pick: '7:41 AM', drop: '4:22 PM' },
        { name: 'Maple Highrise', zone: 'East', pick: '7:47 AM', drop: '4:15 PM' },
        { name: 'Willow Lane', zone: 'South', pick: '7:53 AM', drop: '4:09 PM' },
        { name: 'Emerald Academy (School)', zone: '-', pick: '8:04 AM', drop: '-' }
      ],
      coords: [[30, 130], [120, 118], [200, 140], [260, 210], [330, 252], [420, 232], [500, 204], [580, 150], [610, 90]]
    },
    {
      id: 'r4',
      name: 'Hillcrest Line',
      busNo: 'SB-116',
      driver: 'Sneha Pillai',
      phone: '+91 98765 00116',
      color: '#8b5cf6',
      availability: 'Available',
      areas: ['Hillcrest', 'Cedar Ridge', 'North Town'],
      zones: ['North', 'East'],
      stops: [
        { name: 'Cedar Ridge', zone: 'North', pick: '7:32 AM', drop: '4:30 PM' },
        { name: 'Hillcrest Lane', zone: 'East', pick: '7:40 AM', drop: '4:22 PM' },
        { name: 'North Town Square', zone: 'East', pick: '7:46 AM', drop: '4:14 PM' },
        { name: 'Canyon Drive', zone: 'North', pick: '7:52 AM', drop: '4:08 PM' },
        { name: 'Emerald Academy (School)', zone: '-', pick: '8:03 AM', drop: '-' }
      ],
      coords: [[70, 90], [150, 74], [230, 110], [300, 170], [360, 240], [440, 272], [510, 300], [580, 268], [612, 210]]
    },
    {
      id: 'r5',
      name: 'Riverdale Express',
      busNo: 'SB-120',
      driver: 'Imran Khan',
      phone: '+91 98765 00120',
      color: '#f43f5e',
      availability: 'Few seats',
      areas: ['Riverdale', 'Harbor', 'Bayview'],
      zones: ['West', 'South'],
      stops: [
        { name: 'Harbor Point', zone: 'South', pick: '7:31 AM', drop: '4:31 PM' },
        { name: 'Bayview Colony', zone: 'West', pick: '7:39 AM', drop: '4:23 PM' },
        { name: 'Riverdale Center', zone: 'South', pick: '7:46 AM', drop: '4:15 PM' },
        { name: 'Delta Park', zone: 'West', pick: '7:53 AM', drop: '4:08 PM' },
        { name: 'Emerald Academy (School)', zone: '-', pick: '8:04 AM', drop: '-' }
      ],
      coords: [[510, 40], [430, 70], [350, 110], [280, 160], [230, 230], [250, 310], [180, 300], [90, 270], [30, 230]]
    },
    {
      id: 'r6',
      name: 'Emerald Loop',
      busNo: 'SB-124',
      driver: 'Kavita Rao',
      phone: '+91 98765 00124',
      color: '#06b6d4',
      availability: 'Available',
      areas: ['Emerald', 'Oakwood', 'Silverline'],
      zones: ['East', 'North'],
      stops: [
        { name: 'Oakwood', zone: 'East', pick: '7:35 AM', drop: '4:27 PM' },
        { name: 'Silverline', zone: 'North', pick: '7:43 AM', drop: '4:19 PM' },
        { name: 'Emerald Campus', zone: 'East', pick: '7:49 AM', drop: '4:12 PM' },
        { name: 'Birch Avenue', zone: 'North', pick: '7:55 AM', drop: '4:06 PM' },
        { name: 'Emerald Academy (School)', zone: '-', pick: '8:05 AM', drop: '-' }
      ],
      coords: [[30, 320], [90, 280], [170, 260], [250, 220], [250, 140], [330, 120], [410, 96], [500, 130], [600, 60]]
    }
  ];

  /* ---------------- helpers ---------------- */
  function planById(id) {
    for (var i = 0; i < PLANS.length; i++) if (PLANS[i].id === id) return PLANS[i];
    return PLANS[1];
  }
  function routeById(id) {
    for (var i = 0; i < ROUTES.length; i++) if (ROUTES[i].id === id) return ROUTES[i];
    return ROUTES[0];
  }
  function uid(prefix) {
    return (prefix || 'ID') + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  }
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtMoney(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return ('0' + n).slice(-2); }
  function fmtDateISO(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtTimeFull(ts) {
    return new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }
  function addMonths(iso, m) {
    var d = new Date(iso + 'T00:00:00');
    d.setMonth(d.getMonth() + m);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function fmtDuration(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + pad(s);
  }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

  /* ---------------- session / profile ---------------- */
  function getUser() {
    var u = get('routex_user', null);
    return u && u.session ? u : null;
  }
  function setUser(payload) {
    var base = getUser() || {};
    set('routex_user', Object.assign({}, base, payload, { session: true, loginAt: Date.now() }));
  }
  function logout() { remove('routex_user'); }
  function getProfile() {
    var p = get('routex_profile', null);
    if (p && p.email) return p;
    var regs = get('routex_registration', []);
    var user = getUser();
    if (user && user.email) {
      for (var i = 0; i < regs.length; i++) {
        if (regs[i] && regs[i].email === user.email) return regs[i];
      }
    }
    return null;
  }
  function saveProfile(p) { set('routex_profile', p); }

  /* ---------------- dashboard data seeding ---------------- */
  function ensureDashboardData() {
    var user = getUser();
    var profile = getProfile();

    if (get('routex_route', null) === null) {
      var rid = (profile && profile.routeId) || 'r1';
      var r = routeById(rid);
      set('routex_route', { routeId: rid, stop: r.stops[1] ? r.stops[1].name : r.stops[0].name });
    }

    if (get('routex_subscription', null) === null) {
      set('routex_subscription', {
        plan: 'standard',
        amount: 1499,
        startDate: '2026-07-15',
        billingDate: '2026-09-15',
        status: 'Active',
        method: 'UPI'
      });
    }

    if (get('routex_boarding_logs', null) === null) {
      set('routex_boarding_logs', [
        { date: '2026-08-25', board: '7:42 AM', boardStatus: 'On Time', drop: '4:18 PM', dropStatus: 'Dropped' },
        { date: '2026-08-26', board: '7:45 AM', boardStatus: 'On Time', drop: '4:20 PM', dropStatus: 'Dropped' },
        { date: '2026-08-27', board: '7:58 AM', boardStatus: 'Delayed', drop: '4:31 PM', dropStatus: 'Dropped' },
        { date: '2026-08-28', board: '7:43 AM', boardStatus: 'On Time', drop: '4:17 PM', dropStatus: 'Dropped' },
        { date: todayISO(), board: '', boardStatus: 'Pending', drop: '', dropStatus: 'Pending' }
      ]);
    }

    var now = Date.now();
    var h = 3600e3;
    if (get('routex_notifications', null) === null) {
      set('routex_notifications', [
        { id: uid('NT'), type: 'payment', title: 'Subscription payment received', text: 'Your Standard plan payment of ₹1,499 was received.', time: now - 26 * h, read: true },
        { id: uid('NT'), type: 'route', title: 'Route update — Maple Street', text: 'Minor route change effective Monday. Pickup time shifts by 2 minutes.', time: now - 49 * h, read: false },
        { id: uid('NT'), type: 'reminder', title: 'Pickup reminder', text: 'Tomorrow morning pickup at Maple Street at 7:48 AM.', time: now - 2 * h, read: false }
      ]);
    }

    if (get('routex_payments', null) === null) {
      set('routex_payments', [
        {
          id: 'RX-8F2K9D', ref: 'TXN-2026-07150941', date: '2026-07-15', plan: 'Standard', amount: 1499,
          method: 'UPI', status: 'Paid', parent: profile ? profile.parentName || profile.name || 'Parent' : 'Parent'
        },
        {
          id: 'RX-2M5P8Q', ref: 'TXN-2026-08150430', date: '2026-08-15', plan: 'Standard', amount: 1499,
          method: 'Card', status: 'Paid', parent: profile ? profile.parentName || profile.name || 'Parent' : 'Parent'
        }
      ]);
    }
  }

  /* ---------------- toast ---------------- */
  var TOAST_ICONS = {
    success: 'check-circle-2',
    error: 'alert-circle',
    info: 'info',
    warning: 'alert-triangle'
  };
  var TOAST_COLORS = {
    success: 'text-emerald-500 bg-emerald-500/15',
    error: 'text-rose-500 bg-rose-500/15',
    info: 'text-sky-500 bg-sky-500/15',
    warning: 'text-amber-500 bg-amber-500/15'
  };
  function toast(msg, type, title) {
    var box = document.getElementById('toast-stack');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast-stack';
      document.body.appendChild(box);
    }
    var t = type || 'success';
    var el = document.createElement('div');
    el.className = 'toast-item';
    el.setAttribute('role', 'status');
    el.innerHTML =
      '<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ' + TOAST_COLORS[t] + '">' +
      '<i data-lucide="' + TOAST_ICONS[t] + '" class="h-5 w-5"></i></span>' +
      '<span class="min-w-0">' +
      (title ? '<p class="text-sm font-bold">' + escapeHtml(title) + '</p>' : '') +
      '<p class="text-sm leading-snug text-slate-600 dark:text-slate-300">' + escapeHtml(msg) + '</p></span>' +
      '<button data-toast-close class="ml-auto -m-1 shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Dismiss">' +
      '<i data-lucide="x" class="h-4 w-4"></i></button>';
    box.appendChild(el);
    refreshIcons();
    var ttl = setTimeout(function () {
      if (el.parentNode) el.remove();
    }, 5200);
    el.querySelector('[data-toast-close]').addEventListener('click', function () {
      clearTimeout(ttl);
      if (el.parentNode) el.remove();
    });
  }

  /* ---------------- modal ---------------- */
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('hidden');
    m.classList.add('modal-open');
    document.body.classList.add('lock-scroll');
    m.setAttribute('aria-hidden', 'false');
    var f = m.querySelector('.modal-panel');
    if (f) f.scrollTop = 0;
  }
  function closeModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.add('hidden');
    m.classList.remove('modal-open');
    m.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal-overlay.modal-open')) {
      document.body.classList.remove('lock-scroll');
    }
  }
  function closeAllModals() {
    var list = document.querySelectorAll('.modal-overlay');
    list.forEach(function (m) { m.classList.add('hidden'); m.classList.remove('modal-open'); });
    document.body.classList.remove('lock-scroll');
  }

  /* ---------------- lucide refresh ---------------- */
  function refreshIcons(scope) {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      if (scope) window.lucide.createIcons({ attrs: { 'stroke-width': 2 } }, scope);
      else window.lucide.createIcons({ attrs: { 'stroke-width': 2 } });
    }
  }

  /* ---------------- SVG route map engine ---------------- */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function mkEl(name, attrs) {
    var e = document.createElementNS(SVG_NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function polylinePath(pts) {
    return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');
  }
  function pathLengths(pts) {
    var c = [0];
    for (var i = 1; i < pts.length; i++) {
      c.push(c[i - 1] + Math.sqrt(Math.pow(pts[i][0] - pts[i - 1][0], 2) + Math.pow(pts[i][1] - pts[i - 1][1], 2)));
    }
    return c;
  }
  function pointOnPath(pts, f) {
    var cum = pathLengths(pts);
    var total = cum[cum.length - 1];
    var target = Math.max(0, Math.min(1, f)) * total;
    for (var i = 1; i < cum.length; i++) {
      if (cum[i] >= target) {
        var seg = cum[i] - cum[i - 1];
        var t = seg ? (target - cum[i - 1]) / seg : 0;
        return {
          x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
          y: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t
        };
      }
    }
    return { x: pts[pts.length - 1][0], y: pts[pts.length - 1][1] };
  }

  /**
   * Draws a dark transit-map panel inside `svg`.
   * stops: [{x,y,label,type:'pickup'|'drop'|'school'|'depot'}]
   * Returns { setBus(f), stopEls, pathEl, busGroup }.
   */
  function drawRouteMap(svg, pts, stops, color) {
    svg.innerHTML = '';
    var busColor = color || '#facc15';

    var base = mkEl('path', {
      d: polylinePath(pts), fill: 'none', stroke: '#475569', 'stroke-width': 9,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.55
    });
    var main = mkEl('path', {
      d: polylinePath(pts), fill: 'none', stroke: color || '#60a5fa', 'stroke-width': 4,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'route-dash'
    });
    svg.appendChild(base);
    svg.appendChild(main);

    var stopEls = [];
    var stopG = mkEl('g', {});
    (stops || []).forEach(function (s, idx) {
      var dot = mkEl('circle', {
        cx: s.x, cy: s.y, r: s.type === 'school' ? 8 : s.type === 'pickup' ? 7 : 5.5,
        fill: s.type === 'pickup' ? '#facc15' : s.type === 'school' ? '#34d399' : '#cbd5e1',
        stroke: '#0f172a', 'stroke-width': 2.5
      });
      if (s.type === 'pickup') {
        var ring = mkEl('circle', {
          cx: s.x, cy: s.y, r: 9, fill: 'none', stroke: '#facc15', 'stroke-width': 2, opacity: 0.8, class: 'pulse-ring'
        });
        stopG.appendChild(ring);
      }
      var txt = mkEl('text', {
        x: s.x, y: s.y - (s.type === 'school' ? 18 : 14), 'text-anchor': s.type === 'school' ? 'end' : 'middle',
        fill: s.type === 'pickup' ? '#fde047' : '#e2e8f0', 'font-size': s.type === 'school' ? 13 : 11.5,
        'font-weight': 700
      });
      txt.textContent = s.label;
      stopG.appendChild(dot);
      stopG.appendChild(txt);
      stopEls.push(dot);
    });
    svg.appendChild(stopG);

    var busGroup = mkEl('g', {});
    var busGlow = mkEl('circle', { r: 14, fill: 'rgba(250,204,21,0.28)' });
    var busDot = mkEl('circle', { r: 8, fill: '#fde047', stroke: '#0f172a', 'stroke-width': 3 });
    busGroup.appendChild(busGlow);
    busGroup.appendChild(busDot);
    svg.appendChild(busGroup);

    return {
      setBus: function (f) {
        var p = pointOnPath(pts, f);
        busGroup.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
        return p;
      }
    };
  }

  /* ---------------- scroll reveal ---------------- */
  function initReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------------- back to top ---------------- */
  function initBackToTop() {
    var btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i data-lucide="arrow-up" class="h-5 w-5"></i>';
    btn.className =
      'no-print fixed bottom-5 left-5 z-[80] hidden h-11 w-11 items-center justify-center rounded-full ' +
      'bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700 ' +
      'hover:-translate-y-0.5';
    btn.style.display = 'none';
    document.body.appendChild(btn);
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    window.addEventListener('scroll', function () {
      btn.style.display = window.scrollY > 420 ? 'flex' : 'none';
    }, { passive: true });
    refreshIcons();
  }

  /* ---------------- theme helpers ---------------- */
  function themePref() {
    return get('routex_theme', null);
  }
  function isDark() {
    return document.documentElement.classList.contains('dark');
  }
  function applyTheme(theme) {
    var dark = theme === 'dark';
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }
  function setTheme(theme) {
    set('routex_theme', theme);
    applyTheme(theme);
    runThemeCallbacks();
  }
  function toggleTheme() {
    setTheme(isDark() ? 'light' : 'dark');
  }
  var themeCallbacks = [];
  function onThemeChange(fn) { themeCallbacks.push(fn); }
  function runThemeCallbacks() {
    themeCallbacks.forEach(function (fn) { try { fn(isDark()); } catch (e) {} });
  }

  /* ---------------- direction helpers (RTL/LTR) ---------------- */
  function dirPref() {
    return get('routex_dir', 'ltr');
  }
  function isRTL() {
    return (document.documentElement.getAttribute('dir') || 'ltr') === 'rtl';
  }
  function applyDir(dir) {
    var d = dir === 'rtl' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', d);
  }
  function setDir(dir) {
    var d = dir === 'rtl' ? 'rtl' : 'ltr';
    set('routex_dir', d);
    applyDir(d);
    runDirCallbacks();
  }
  function toggleDir() {
    setDir(isRTL() ? 'ltr' : 'rtl');
  }
  var dirCallbacks = [];
  function onDirChange(fn) { dirCallbacks.push(fn); }
  function runDirCallbacks() {
    dirCallbacks.forEach(function (fn) { try { fn(isRTL()); } catch (e) {} });
  }

  /* ---------------- receipt generation ---------------- */
  function makeReceipt(tx) {
    return {
      id: uid('RX'),
      ref: 'TXN-' + tx.date.replace(/-/g, '') + '-' + Math.floor(Math.random() * 9000 + 1000),
      date: tx.date,
      plan: tx.plan,
      amount: tx.amount,
      method: tx.method,
      status: 'Paid',
      parent: tx.parent,
      email: tx.email,
      child: tx.child
    };
  }

  /* ---------------- global click delegation ---------------- */
  function bindGlobal() {
    document.addEventListener('click', function (e) {
      var openBtn = e.target.closest('[data-modal-open]');
      if (openBtn) { openModal(openBtn.getAttribute('data-modal-open')); return; }
      var closeBtn = e.target.closest('[data-modal-close]');
      if (closeBtn) { closeModal(closeBtn.getAttribute('data-modal-close')); return; }
      var overlay = e.target.closest('.modal-overlay');
      if (overlay && e.target === overlay) closeAllModals();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllModals();
    });
  }

  /* ---------------- public API ---------------- */
  window.RouteX = {
    store: { get: get, set: set, remove: remove },
    PLANS: PLANS,
    planById: planById,
    ROUTES: ROUTES,
    routeById: routeById,
    uid: uid,
    escapeHtml: escapeHtml,
    fmtMoney: fmtMoney,
    todayISO: todayISO,
    fmtDateISO: fmtDateISO,
    fmtTimeFull: fmtTimeFull,
    addMonths: addMonths,
    fmtDuration: fmtDuration,
    plural: plural,
    getUser: getUser,
    setUser: setUser,
    logout: logout,
    getProfile: getProfile,
    saveProfile: saveProfile,
    ensureDashboardData: ensureDashboardData,
    toast: toast,
    openModal: openModal,
    closeModal: closeModal,
    closeAllModals: closeAllModals,
    refreshIcons: refreshIcons,
    polylinePath: polylinePath,
    pointOnPath: pointOnPath,
    drawRouteMap: drawRouteMap,
    initReveal: initReveal,
    initBackToTop: initBackToTop,
    themePref: themePref,
    isDark: isDark,
    applyTheme: applyTheme,
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    onThemeChange: onThemeChange,
    dirPref: dirPref,
    isRTL: isRTL,
    applyDir: applyDir,
    setDir: setDir,
    toggleDir: toggleDir,
    onDirChange: onDirChange,
    makeReceipt: makeReceipt
  };

  /* ---------------- boot ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    bindGlobal();
    initReveal();
    initBackToTop();
    refreshIcons();
  });
})();