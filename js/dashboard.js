/* ============================================================
   RouteX — dashboard.js
   Parent dashboard single-page app:
     - Session guard
     - Overview, live tracking simulation, boarding logs
     - Route details, subscription, payments, receipts, history
     - Notifications, profile, logout
   All persisted with RouteX localStorage keys.
   ============================================================ */

(function () {
  'use strict';

  var FRACS = [0.12, 0.3, 0.47, 0.66, 0.88];
  var SPEED = 0.02; /* fraction of route per second */
  var DROP_DELAY = 75; /* seconds after arrival before drop confirmation */

  var V = {
    user: null,
    profile: null,
    routeRecord: null,
    route: null,
    sub: null,
    stopIndex: 1,
    boardFrac: 0.47,
    map: null,
    pendingPlan: null,
    currentReceipt: null,
    timer: null
  };

  function $(id) { return document.getElementById(id); }

  /* ---------------- section switching ---------------- */
  var SECTION_META = {
    overview: ['Overview', 'Your ride summary at a glance'],
    tracking: ['Live Bus Tracking', 'Simulated real-time position & arrival'],
    route: ['Route Details', 'Fixed schedule assigned at registration'],
    logs: ['Boarding & Alighting Logs', 'Daily ride records and statuses'],
    sub: ['Subscription', 'Plan, billing and renewal'],
    pay: ['Payments', 'Simulated UPI / card / net banking'],
    history: ['Payment History', 'Receipts — view, print or download'],
    notif: ['Notifications', 'Simulated alerts and reminders'],
    profile: ['Profile', 'Edit parent & child information']
  };

  function showSection(name) {
    if (!SECTION_META[name]) return;
    document.querySelectorAll('.dash-section').forEach(function (s) { s.classList.add('hidden'); });
    var sec = $('sec-' + name);
    if (sec) sec.classList.remove('hidden');
    document.querySelectorAll('.side-link').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-section') === name);
    });
    var meta = SECTION_META[name];
    var t = $('page-title'), p = $('page-sub');
    if (t) t.textContent = meta[0];
    if (p) p.textContent = meta[1];
    closeSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    RouteX.refreshIcons();
  }

  /* ---------------- sidebar ---------------- */
  function openSidebar() {
    var sb = $('dash-sidebar'), sc = $('dash-scrim');
    if (sb) sb.classList.remove('-translate-x-full');
    if (sc) sc.classList.remove('hidden');
  }
  function closeSidebar() {
    var sb = $('dash-sidebar'), sc = $('dash-scrim');
    if (sb && window.innerWidth < 1024) sb.classList.add('-translate-x-full');
    if (sc) sc.classList.add('hidden');
  }

  /* ---------------- helpers ---------------- */
  function todayLogIndex(logs) {
    var today = RouteX.todayISO();
    for (var i = 0; i < logs.length; i++) if (logs[i].date === today) return i;
    return -1;
  }
  function timeAgo(ts) {
    var s = Math.max(1, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return 'just now';
    var m = Math.round(s / 60);
    if (m < 60) return m + 'm ago';
    var h = Math.round(m / 60);
    if (h < 24) return h + 'h ago';
    var d = Math.round(h / 24);
    return d + 'd ago';
  }
  function unreadCount(notifs) {
    return notifs.filter(function (n) { return !n.read; }).length;
  }

  var STATUS_BADGE = {
    Boarded: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400',
    'On Time': 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400',
    Delayed: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
    Pending: 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    Dropped: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400'
  };
  function badge(status) {
    return '<span class="rounded-full px-2.5 py-1 text-[11px] font-bold ' + (STATUS_BADGE[status] || STATUS_BADGE.Pending) + '">' + (status || '—') + '</span>';
  }

  var NOTIF_META = {
    boarding: { icon: 'user-check', cls: 'text-emerald-500 bg-emerald-500/15' },
    drop: { icon: 'map-pin-check', cls: 'text-teal-500 bg-teal-500/15' },
    arrival: { icon: 'bus-front', cls: 'text-emerald-500 bg-emerald-500/15' },
    delayed: { icon: 'clock', cls: 'text-amber-500 bg-amber-500/15' },
    reminder: { icon: 'bell-ring', cls: 'text-sky-500 bg-sky-500/15' },
    route: { icon: 'route', cls: 'text-violet-500 bg-violet-500/15' },
    payment: { icon: 'credit-card', cls: 'text-brand-500 bg-brand-500/15' }
  };

  /* ---------------- overview ---------------- */
  function renderOverview() {
    var profile = V.profile,
      user = V.user,
      route = V.route,
      rr = V.routeRecord,
      sub = V.sub;

    var parentName = (profile && profile.parentName) || user.name || 'Parent';
    var childName = (profile && profile.childName) || 'your child';
    var school = (profile && profile.school) || 'School';
    var stop = rr.stop || route.stops[V.stopIndex].name;
    var stopInfo = route.stops[V.stopIndex] || route.stops[0];

    var hour = new Date().getHours();
    var greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    var tg = $('greet-greeting');
    if (tg) tg.textContent = greet + ', ' + parentName.split(' ')[0];
    var dd = $('greet-date');
    if (dd) dd.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    var track = currentTracking();
    var statusText = trackStatusText(track);
    var st = $('greet-status-text');
    if (st) st.textContent = statusText;

    var cards = $('ov-cards');
    cards.innerHTML = [
      {
        icon: 'graduation-cap', tint: 'bg-brand-600/10 text-brand-600 dark:text-amber-400',
        label: 'Child & School', title: childName, sub: school, href: 'profile'
      },
      {
        icon: 'bus', tint: 'bg-amber-400/20 text-amber-600 dark:text-amber-400',
        label: 'Assigned Bus', title: route.busNo, sub: route.name + ' • ' + route.driver, href: 'route'
      },
      {
        icon: 'map-pin', tint: 'bg-emerald-500/10 text-emerald-600',
        label: 'Pickup Stop', title: stop, sub: 'Board ' + stopInfo.pick + ' • Drop ' + stopInfo.drop, href: 'tracking'
      },
      {
        icon: 'clock', tint: 'bg-sky-500/10 text-sky-600',
        label: 'Today\'s Bus Status',
        title: track.phase === 'on-route' ? 'On route' : track.phase === 'arrived' ? 'Reached stop' : 'Ride completed',
        sub: statusText, href: 'tracking'
      }
    ].map(function (c) {
      return (
        '<button data-goto="' + c.href + '" class="card-lift text-left rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">' +
        '<div class="flex items-center justify-between">' +
        '<span class="flex h-11 w-11 items-center justify-center rounded-2xl ' + c.tint + '"><i data-lucide="' + c.icon + '" class="h-5 w-5"></i></span>' +
        '<i data-lucide="arrow-up-right" class="h-4 w-4 text-slate-300"></i></div>' +
        '<p class="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">' + c.label + '</p>' +
        '<p class="mt-1 truncate font-display text-base font-extrabold text-slate-900 dark:text-white">' + RouteX.escapeHtml(c.title) + '</p>' +
        '<p class="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">' + RouteX.escapeHtml(c.sub) + '</p></button>'
      );
    }).join('');
    RouteX.refreshIcons(cards);

    var subCard = $('ov-sub');
    subCard.innerHTML =
      '<div class="flex h-full flex-col justify-between rounded-3xl border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">' +
      '<div class="flex items-center gap-3">' +
      '<span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-600 dark:text-amber-400"><i data-lucide="credit-card" class="h-5 w-5"></i></span>' +
      '<div><p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Subscription</p>' +
      '<p class="font-display font-extrabold text-slate-900 dark:text-white">' + planName(sub.plan) + '</p></div>' +
      '<span class="ml-auto ' + (sub.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400') + ' rounded-full px-2.5 py-1 text-[11px] font-bold">' + sub.status + '</span></div>' +
      '<p class="mt-4 text-sm text-slate-500 dark:text-slate-400">' + RouteX.fmtMoney(sub.amount) + '/month • next bill ' + RouteX.fmtDateISO(sub.billingDate) + '</p>' +
      '<button data-goto="sub" class="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:gap-3 dark:text-amber-400 transition-all">Manage subscription <i data-lucide="arrow-right" class="h-4 w-4"></i></button></div>';
    RouteX.refreshIcons($('ov-sub'));

    var acts = $('ov-actions');
    var actions = [
      ['tracking', 'navigation', 'Live tracking', 'brand'],
      ['history', 'receipt', 'Payment history', ''],
      ['notif', 'bell-ring', 'Notifications', ''],
      ['logs', 'calendar-check', 'Ride logs', '']
    ];
    acts.innerHTML =
      '<div class="flex h-full flex-col justify-between rounded-3xl border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">' +
      '<div><p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quick actions</p>' +
      '<div class="mt-4 grid grid-cols-2 gap-3">' +
      actions.map(function (a) {
        return '<button data-goto="' + a[0] + '" class="rounded-xl border border-slate-200 px-3 py-3.5 text-sm font-bold text-slate-600 transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-300">' +
          '<i data-lucide="' + a[1] + '" class="mx-auto h-5 w-5"></i><span class="mt-1.5 block">' + a[2] + '</span></button>';
      }).join('') +
      '</div></div>' +
      '<a href="index.html" class="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-brand-600 dark:hover:text-amber-400"><i data-lucide="globe" class="h-4 w-4"></i>Back to RouteX homepage</a></div>';
    RouteX.refreshIcons($('ov-actions'));
  }

  /* ---------------- tracking ---------------- */
  function boardFracOf() {
    var idx = routeStopIndex();
    V.stopIndex = idx;
    V.boardFrac = FRACS[idx] || 0.47;
    return V.boardFrac;
  }
  function routeStopIndex() {
    var rr = V.routeRecord || {};
    var stops = V.route.stops;
    for (var i = 0; i < stops.length; i++) if (stops[i].name === rr.stop) return i;
    return 2;
  }

  function currentTracking() {
    var tr = RouteX.store.get('routex_tracking', null);
    var frac = boardFracOf();
    if (!tr) {
      tr = { f: 0, phase: 'on-route', startedAt: Date.now(), arrAt: null, dropAt: null, dropDelaySec: DROP_DELAY };
      RouteX.store.set('routex_tracking', tr);
      return tr;
    }
    var now = Date.now();
    if (tr.phase === 'on-route') {
      tr.f = Math.min(frac, tr.f + ((now - (tr.startedAt || now)) / 1000) * SPEED);
      tr.startedAt = now;
      if (tr.f >= frac) {
        tr.phase = 'arrived';
        tr.arrAt = now;
        RouteX.store.set('routex_tracking', tr);
        applyArrival(now);
      } else {
        RouteX.store.set('routex_tracking', tr);
      }
    } else if (tr.phase === 'arrived') {
      if (!tr.arrAt) { tr.arrAt = now; RouteX.store.set('routex_tracking', tr); }
      if (now >= tr.arrAt + DROP_DELAY * 1000) {
        tr.phase = 'dropped';
        tr.dropAt = now;
        RouteX.store.set('routex_tracking', tr);
        applyDrop(now);
      } else {
        RouteX.store.set('routex_tracking', tr);
      }
    }
    return tr;
  }

  function applyArrival(ts) {
    var logs = RouteX.store.get('routex_boarding_logs', []);
    var i = todayLogIndex(logs);
    if (i > -1 && (logs[i].boardStatus === 'Pending' || !logs[i].board)) {
      logs[i].board = RouteX.fmtTimeFull(ts);
      logs[i].boardStatus = 'Boarded';
      logs[i].boardTs = ts;
      RouteX.store.set('routex_boarding_logs', logs);
    } else if (i === -1) {
      logs.unshift({ date: RouteX.todayISO(), board: RouteX.fmtTimeFull(ts), boardStatus: 'Boarded', boardTs: ts, drop: '', dropStatus: 'Pending' });
      RouteX.store.set('routex_boarding_logs', logs);
    }
    addNotification('boarding', 'Bus arrived — boarding now', 'Your bus has arrived at ' + (V.routeRecord.stop || 'your stop') + '. ' + ((V.profile && V.profile.childName) || 'Your child') + ' is boarding now.', ts, false);
    RouteX.toast('Your bus has arrived at the pickup stop.', 'success', 'Bus arrival');
  }

  function applyDrop(ts) {
    var logs = RouteX.store.get('routex_boarding_logs', []);
    var i = todayLogIndex(logs);
    if (i > -1) {
      logs[i].drop = RouteX.fmtTimeFull(ts);
      logs[i].dropStatus = 'Dropped';
      logs[i].dropTs = ts;
      RouteX.store.set('routex_boarding_logs', logs);
    }
    addNotification('drop', 'Dropped off safely', ((V.profile && V.profile.childName) || 'Your child') + ' has been dropped off at the destination.', ts, false);
    RouteX.toast('Your child has been dropped off safely.', 'success', 'Drop confirmed');
  }

  function trackStatusText(tr) {
    if (tr.phase === 'dropped') {
      return 'Ride completed — dropped ' + RouteX.fmtTimeFull(tr.dropAt);
    }
    if (tr.phase === 'arrived') {
      return 'Reached your stop' + (tr.arrAt ? ' at ' + RouteX.fmtTimeFull(tr.arrAt) : '');
    }
    var eta = ((V.boardFrac - tr.f) / SPEED);
    if (eta <= 45) return 'Approaching stop • ETA ' + RouteX.fmtDuration(eta);
    return 'On route to ' + (V.routeRecord.stop || 'your stop') + ' • ETA ' + RouteX.fmtDuration(eta);
  }

  function stopsForMap(route) {
    var pickup = V.stopIndex;
    return route.stops.map(function (s, i) {
      var pt = RouteX.pointOnPath(route.coords, FRACS[i]);
      var type = i === route.stops.length - 1 ? 'school' : i === pickup ? 'pickup' : 'drop';
      return { x: pt.x, y: pt.y, label: s.name, type: type };
    });
  }

  function renderTrackingMap() {
    var svg = $('tr-map');
    V.map = RouteX.drawRouteMap(svg, V.route.coords, stopsForMap(V.route), V.route.color);
    var lbl = $('tr-route-label');
    if (lbl) lbl.textContent = V.route.name + ' — Bus ' + V.route.busNo;
    updateTrackingUI();
  }

  function updateTrackingUI() {
    var tr = currentTracking();
    if (!V.map) return;

    V.map.setBus(tr.phase === 'on-route' ? tr.f : V.boardFrac);

    var status = $('tr-status');
    status.textContent = tr.phase === 'dropped' ? 'Dropped' : tr.phase === 'arrived' ? 'Arrived' : 'On route';
    status.className =
      'rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ' +
      (tr.phase === 'on-route' ? 'bg-emerald-500/15 text-emerald-300'
        : tr.phase === 'arrived' ? 'bg-amber-500/15 text-amber-300'
        : 'bg-sky-500/15 text-sky-300');

    /* location: nearest previous stop */
    var locTx;
    var away = 0;
    if (tr.phase === 'on-route') {
      var nextIdx = -1;
      for (var i = 0; i < FRACS.length; i++) {
        if (FRACS[i] > tr.f) { nextIdx = i; break; }
      }
      away = Math.max(0, nextIdx);
      locTx = nextIdx > 0 ? 'Approaching ' + V.route.stops[nextIdx].name : 'Leaving depot';
    } else {
      away = 0;
      locTx = 'At ' + V.route.stops[V.stopIndex].name + (tr.phase === 'dropped' ? ' (departed)' : '');
    }
    var loc = $('tr-location');
    if (loc) loc.textContent = locTx;

    var eta = $('tr-eta');
    if (eta) eta.textContent = tr.phase === 'on-route' ? RouteX.fmtDuration((V.boardFrac - tr.f) / SPEED) : '—';

    var stopsTxt = $('tr-stops');
    if (stopsTxt) stopsTxt.textContent = tr.phase === 'on-route' ? RouteX.plural(away, 'stop') + ' away' : '0 stops away';

    /* demo note stays; cards */
    var cRoute = $('tr-card-route'), cBus = $('tr-card-bus'), cStop = $('tr-card-stop');
    if (cRoute) cRoute.innerHTML = cardLine('route', V.route.name, V.route.busNo + ' scheduled');
    if (cBus) cBus.innerHTML = cardLine('bus', 'Bus ' + V.route.busNo, V.route.driver + ' • ' + V.route.phone);
    if (cStop) cStop.innerHTML = cardLine('map-pin', V.routeRecord.stop || V.route.stops[V.stopIndex].name, 'Pickup at ' + (V.route.stops[V.stopIndex].pick || '—'));
  }

  function cardLine(icon, title, sub) {
    return '<div class="flex items-start gap-3">' +
      '<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:text-amber-400"><i data-lucide="' + icon + '" class="h-5 w-5"></i></span>' +
      '<div class="min-w-0"><p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Info</p>' +
      '<p class="truncate font-display font-bold text-slate-900 dark:text-white">' + RouteX.escapeHtml(title) + '</p>' +
      '<p class="truncate text-xs text-slate-500 dark:text-slate-400">' + RouteX.escapeHtml(sub) + '</p></div></div>';
  }

  /* ---------------- route details ---------------- */
  function renderRouteDetails() {
    var route = V.route, rr = V.routeRecord;
    var stop = route.stops[V.stopIndex] || route.stops[0];
    var box = $('route-details');
    var rows = [
      ['bus', 'Bus number', route.busNo],
      ['user', 'Driver', route.driver],
      ['phone', 'Driver contact', route.phone],
      ['route', 'Route', route.name],
      ['map-pin', 'Pickup stop', rr.stop || stop.name],
      ['clock', 'Pickup time', stop.pick],
      ['clock', 'Drop time', stop.drop],
      ['school', 'School arrival', route.stops[route.stops.length - 1].pick],
      ['map', 'Areas covered', route.areas.join(', ')]
    ];
    box.innerHTML = rows.map(function (r) {
      return '<div class="bg-white p-5 dark:bg-slate-900">' +
        '<p class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400"><i data-lucide="' + r[0] + '" class="h-3.5 w-3.5 text-brand-600 dark:text-amber-400"></i>' + r[1] + '</p>' +
        '<p class="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">' + RouteX.escapeHtml(r[2]) + '</p></div>';
    }).join('');
    RouteX.refreshIcons($('route-details'));
  }

  /* ---------------- boarding logs ---------------- */
  function renderLogs() {
    var logs = RouteX.store.get('routex_boarding_logs', []);
    var tbody = $('logs-tbody');
    if (!tbody) return;
    var today = RouteX.todayISO();
    tbody.innerHTML = logs.slice().reverse().map(function (l) {
      var isToday = l.date === today;
      return '<tr class="' + (isToday ? 'bg-brand-50/50 dark:bg-brand-900/10' : '') + '">' +
        '<td class="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-200">' + RouteX.fmtDateISO(l.date) + (isToday ? ' <span class="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-300">TODAY</span>' : '') + '</td>' +
        '<td class="px-4 py-3.5 text-slate-600 dark:text-slate-300">' + (l.board || '—') + '</td>' +
        '<td class="px-4 py-3.5">' + badge(l.boardStatus) + '</td>' +
        '<td class="px-4 py-3.5 text-slate-600 dark:text-slate-300">' + (l.drop || '—') + '</td>' +
        '<td class="px-4 py-3.5">' + badge(l.dropStatus) + '</td></tr>';
    }).join('');
  }

  /* ---------------- subscription ---------------- */
  function planName(id) {
    var p = RouteX.planById(id);
    return p ? p.name : 'Standard';
  }
  function renderSubscription() {
    var sub = V.sub;
    var plan = RouteX.planById(sub.plan);
    var box = $('sub-current');
    box.innerHTML =
      '<div class="p-6 sm:p-8">' +
      '<div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">' +
      '<div class="flex items-center gap-4">' +
      '<span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-600 dark:text-amber-400"><i data-lucide="gem" class="h-7 w-7"></i></span>' +
      '<div><p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current plan</p>' +
      '<p class="font-display text-2xl font-extrabold text-slate-900 dark:text-white">' + plan.name + '</p></div>' +
      '<span class="rounded-full px-3 py-1 text-[11px] font-bold ' + (sub.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400') + '">' + sub.status + '</span></div>' +
      '<div class="text-left md:text-right"><p class="font-display text-3xl font-extrabold text-brand-600 dark:text-amber-400">' + RouteX.fmtMoney(sub.amount) + '</p><p class="text-xs text-slate-400">per month, billed monthly</p></div>' +
      '</div>' +
      '<div class="mt-7 grid gap-4 border-t border-slate-200 pt-6 dark:border-slate-800 sm:grid-cols-3">' +
      '<div class="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Started</p><p class="mt-1 font-bold text-slate-900 dark:text-white">' + RouteX.fmtDateISO(sub.startDate) + '</p></div>' +
      '<div class="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Next billing</p><p class="mt-1 font-bold text-slate-900 dark:text-white">' + RouteX.fmtDateISO(sub.billingDate) + '</p></div>' +
      '<div class="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payment method</p><p class="mt-1 font-bold text-slate-900 dark:text-white">' + (sub.method || 'UPI') + '</p></div>' +
      '</div></div>';
    RouteX.refreshIcons($('sub-current'));

    var benefits = $('sub-benefits');
    if (benefits) {
      benefits.innerHTML = '<ul class="space-y-2">' + plan.features.map(function (f) {
        return '<li class="flex items-start gap-2"><i data-lucide="check" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"></i><span>' + f + '</span></li>';
      }).join('') + '</ul>';
      RouteX.refreshIcons($('sub-benefits'));
    }
  }

  function renderPlanOptions() {
    var wrap = $('plan-options');
    var current = V.sub.plan;
    wrap.innerHTML = RouteX.PLANS.map(function (p) {
      var on = current === p.id;
      return '<label class="flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition ' +
        (on ? 'border-brand-600 bg-brand-50/60 dark:border-amber-400 dark:bg-slate-800' : 'border-slate-200 hover:border-brand-300 dark:border-slate-700') + '">' +
        '<input type="radio" name="plan-choice" value="' + p.id + '" ' + (on ? 'checked' : '') + ' class="h-4 w-4 accent-brand-600">' +
        '<span class="flex-1"><span class="flex items-center gap-2 font-bold text-slate-900 dark:text-white">' + p.name +
        (p.popular ? '<span class="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-300">POPULAR</span>' : '') +
        '</span><span class="text-xs text-slate-500 dark:text-slate-400">' + p.features.length + ' features included</span></span>' +
        '<span class="font-display font-extrabold text-slate-900 dark:text-white">' + RouteX.fmtMoney(p.price) + '</span></label>';
    }).join('');
  }

  function renderPayInfo() {
    var sub = V.sub;
    var plan = RouteX.planById(sub.plan);
    var l = $('pay-plan-label'); if (l) l.textContent = plan.name;
    var b = $('pay-billing'); if (b) b.textContent = RouteX.fmtDateISO(sub.billingDate);
    var s = $('pay-status'); if (s) s.textContent = sub.status;
    var a = $('pay-amount'); if (a) a.textContent = RouteX.fmtMoney(sub.amount);
  }

  /* ---------------- payments ---------------- */
  function openPayment(planId, reason) {
    var plan = planId ? RouteX.planById(planId) : RouteX.planById(V.sub.plan);
    V.pendingPlan = planId || null;
    var amt = $('pay-modal-amount');
    if (amt) amt.textContent = RouteX.fmtMoney(plan.price);
    var lbl = $('pay-modal-plan');
    if (lbl) lbl.textContent = plan.name + ' plan' + (planId ? ' (switch)' : '');
    var sub = $('pay-modal-sub');
    if (sub) sub.textContent = reason || 'Pay monthly to keep tracking active.';
    selectMethod('upi');
    RouteX.openModal('modal-pay');
  }

  var METHOD = 'upi';
  function selectMethod(m) {
    METHOD = m;
    document.querySelectorAll('[data-pay-method]').forEach(function (b) {
      var on = b.getAttribute('data-pay-method') === m;
      b.className = 'flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold transition ' +
        (on ? 'border-brand-600 bg-brand-600/10 text-brand-700 dark:border-amber-400 dark:text-amber-300'
          : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400');
    });
    ['pay-upi', 'pay-card', 'pay-net'].forEach(function (id) {
      var el = $(id);
      if (el) el.classList.toggle('hidden', id !== 'pay-' + m);
    });
    RouteX.refreshIcons();
  }

  function validatePaymentMethod() {
    var ok = true;
    if (METHOD === 'upi') {
      var upi = $('pay-upi-id').value.trim();
      var e = document.querySelector('[data-err="pay-upi-id"]');
      if (!/@/.test(upi) || upi.length < 5) {
        $('pay-upi-id').classList.add('field-error');
        if (e) { e.textContent = 'Enter a valid UPI ID (you@bank).'; e.classList.remove('hidden'); }
        ok = false;
      } else {
        $('pay-upi-id').classList.remove('field-error');
        if (e) e.classList.add('hidden');
      }
    }
    if (METHOD === 'card') {
      var num = $('pay-card-num').value.replace(/\s/g, '').trim();
      var exp = $('pay-card-exp').value.trim();
      var cvv = $('pay-card-cvv').value.trim();
      var nm = $('pay-card-name').value.trim();
      var map = [
        ['pay-card-num', !/^\d{15,16}$/.test(num), 'Enter a valid 15–16 digit card number.'],
        ['pay-card-exp', !/^\d{2}\/\d{2}$/.test(exp), 'Use MM/YY format.'],
        ['pay-card-cvv', !/^\d{3,4}$/.test(cvv), 'Enter the 3–4 digit CVV.'],
        ['pay-card-name', nm.length < 3, 'Enter the name on the card.']
      ];
      map.forEach(function (m) {
        var el = $(m[0]); el.classList.toggle('field-error', m[1]);
        var e = document.querySelector('[data-err="' + m[0] + '"]');
        if (e) { e.textContent = m[1] ? m[2] : ''; e.classList.toggle('hidden', !m[1]); }
        if (m[1]) ok = false;
      });
    }
    if (METHOD === 'net') {
      var bank = $('pay-net-bank').value;
      var e2 = document.querySelector('[data-err="pay-net-bank"]');
      if (!bank) {
        $('pay-net-bank').classList.add('field-error');
        if (e2) { e2.textContent = 'Choose your bank.'; e2.classList.remove('hidden'); }
        ok = false;
      } else {
        $('pay-net-bank').classList.remove('field-error');
        if (e2) e2.classList.add('hidden');
      }
    }
    return ok;
  }

  function completePayment() {
    if (!validatePaymentMethod()) {
      RouteX.toast('Please fix the highlighted payment fields.', 'error', 'Payment details needed');
      return;
    }
    var plan = V.pendingPlan ? RouteX.planById(V.pendingPlan) : RouteX.planById(V.sub.plan);
    var btn = $('pay-submit');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Processing…';
    btn.querySelector('i').setAttribute('data-lucide', 'loader');
    RouteX.refreshIcons($('modal-pay'));

    setTimeout(function () {
      var profile = V.profile;
      var receipt = RouteX.makeReceipt({
        date: RouteX.todayISO(),
        plan: plan.name,
        amount: plan.price,
        method: METHOD.toUpperCase(),
        parent: (profile && profile.parentName) || V.user.name || 'Parent',
        email: V.user.email,
        child: (profile && profile.childName) || 'Child'
      });

      var payments = RouteX.store.get('routex_payments', []);
      payments.unshift(receipt);
      RouteX.store.set('routex_payments', payments);

      var sub = V.sub;
      if (V.pendingPlan) {
        sub.plan = plan.id;
        sub.amount = plan.price;
      }
      sub.status = 'Active';
      sub.method = METHOD.toUpperCase();
      sub.lastPaid = receipt.id;
      RouteX.store.set('routex_subscription', sub);
      V.sub = sub;

      addNotification('payment', 'Payment received', plan.name + ' plan payment of ' + RouteX.fmtMoney(plan.price) + ' confirmed. Receipt ' + receipt.id + ' generated.', Date.now(), false);

      btn.disabled = false;
      btn.querySelector('span').textContent = 'Pay';
      btn.querySelector('i').setAttribute('data-lucide', 'shield-check');
      RouteX.refreshIcons($('modal-pay'));

      V.pendingPlan = null;
      RouteX.closeModal('modal-pay');
      RouteX.toast('Payment of ' + RouteX.fmtMoney(plan.price) + ' successful. Receipt ready.', 'success', 'Payment completed');
      setReceipt(receipt);
      RouteX.openModal('modal-receipt');
      renderSubscription();
      renderPayInfo();
      renderHistory();
      renderOverview();
      renderNotifications();
      renderLogs();
    }, 1600);
  }

  /* ---------------- receipts ---------------- */
  function setReceipt(r) {
    V.currentReceipt = r;
    renderReceipt(r);
  }
  function renderReceipt(r) {
    var box = $('receipt-print');
    box.innerHTML =
      '<div class="rounded-2xl border-2 border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">' +
      '<div class="flex items-center justify-between border-b border-dashed border-slate-300 pb-4 dark:border-slate-700">' +
      '<div class="flex items-center gap-2"><span class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-900 text-amber-300"><i data-lucide="bus-front" class="h-4 w-4"></i></span>' +
      '<span class="font-display text-lg font-extrabold text-slate-900 dark:text-white">RouteX</span></div>' +
      '<span class="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">PAID</span></div>' +
      '<div class="py-4 text-center"><p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Payment receipt</p>' +
      '<p class="mt-1 font-display text-2xl font-extrabold text-slate-900 dark:text-white">' + r.id + '</p>' +
      '<p class="text-xs text-slate-400">' + r.date + '</p></div>' +
      '<dl class="space-y-2 border-t border-dashed border-slate-300 pt-4 text-sm dark:border-slate-700">' +
      '<div class="flex justify-between gap-3"><dt class="text-slate-500 dark:text-slate-400">Plan</dt><dd class="font-bold text-slate-900 dark:text-white">' + RouteX.escapeHtml(r.plan) + '</dd></div>' +
      '<div class="flex justify-between gap-3"><dt class="text-slate-500 dark:text-slate-400">Paid by</dt><dd class="text-slate-900 dark:text-white">' + RouteX.escapeHtml(r.parent) + '</dd></div>' +
      '<div class="flex justify-between gap-3"><dt class="text-slate-500 dark:text-slate-400">Child</dt><dd class="text-slate-900 dark:text-white">' + RouteX.escapeHtml(r.child) + '</dd></div>' +
      '<div class="flex justify-between gap-3"><dt class="text-slate-500 dark:text-slate-400">Amount</dt><dd class="font-display text-lg font-extrabold text-brand-600 dark:text-amber-400">' + RouteX.fmtMoney(r.amount) + '</dd></div>' +
      '<div class="flex justify-between gap-3"><dt class="text-slate-500 dark:text-slate-400">Method</dt><dd class="font-bold uppercase text-slate-900 dark:text-white">' + RouteX.escapeHtml(r.method) + '</dd></div>' +
      '<div class="flex justify-between gap-3"><dt class="text-slate-500 dark:text-slate-400">Transaction reference</dt><dd class="font-mono text-xs text-slate-900 dark:text-white">' + RouteX.escapeHtml(r.ref) + '</dd></div>' +
      '</dl>' +
      '<p class="mt-4 text-center text-[11px] text-slate-400">Safe Rides. Smarter Tracking. — Thank you for your trust in RouteX.</p></div>';
    RouteX.refreshIcons($('receipt-print'));
  }
  function printReceipt() {
    if (!V.currentReceipt) return;
    window.print();
  }
  function downloadReceipt() {
    var r = V.currentReceipt;
    if (!r) return;
    var lines = [
      '==============================================',
      '               RouteX - PAYMENT RECEIPT',
      '==============================================',
      'Receipt ID      : ' + r.id,
      'Date            : ' + r.date,
      'Transaction Ref : ' + r.ref,
      '----------------------------------------------',
      'Plan            : ' + r.plan,
      'Paid By         : ' + r.parent,
      'Child           : ' + r.child,
      'Amount          : ' + RouteX.fmtMoney(r.amount),
      'Method          : ' + r.method,
      'Status          : PAID',
      '----------------------------------------------',
      'Safe Rides. Smarter Tracking.',
      'Thank you for choosing RouteX.',
      '=============================================='
    ].join('\n');
    var blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'routex-receipt-' + r.id + '.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function viewReceipt(receipt) {
    setReceipt(receipt);
    RouteX.openModal('modal-receipt');
    RouteX.toast('Showing receipt ' + receipt.id, 'info', 'Receipt');
  }

  /* ---------------- payment history ---------------- */
  function renderHistory() {
    var payments = RouteX.store.get('routex_payments', []);
    var tbody = $('history-tbody');
    if (!tbody) return;
    tbody.innerHTML = payments.map(function (p, i) {
      return '<tr>' +
        '<td class="px-4 py-3.5"><button data-view-receipt="' + i + '" class="font-mono text-xs font-bold text-brand-600 hover:underline dark:text-amber-400">' + p.id + '</button></td>' +
        '<td class="px-4 py-3.5 text-slate-600 dark:text-slate-300">' + p.date + '</td>' +
        '<td class="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">' + RouteX.escapeHtml(p.plan) + '</td>' +
        '<td class="px-4 py-3.5 font-bold text-slate-900 dark:text-white">' + RouteX.fmtMoney(p.amount) + '</td>' +
        '<td class="px-4 py-3.5">' + badge(p.status) + '</td>' +
        '<td class="px-4 py-3.5"><div class="flex justify-end gap-1.5">' +
        '<button data-view-receipt="' + i + '" class="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-amber-400 dark:hover:text-amber-300" aria-label="View receipt"><i data-lucide="eye" class="h-4 w-4"></i></button>' +
        '<button data-print-receipt="' + i + '" class="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-amber-400 dark:hover:text-amber-300" aria-label="Print receipt"><i data-lucide="printer" class="h-4 w-4"></i></button>' +
        '<button data-download-receipt="' + i + '" class="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-amber-400 dark:hover:text-amber-300" aria-label="Download receipt"><i data-lucide="download" class="h-4 w-4"></i></button>' +
        '</div></td></tr>';
    }).join('');
    tbody.querySelectorAll('[data-view-receipt]').forEach(function (b) {
      b.addEventListener('click', function () { viewReceipt(payments[parseInt(b.getAttribute('data-view-receipt'), 10)]); });
    });
    tbody.querySelectorAll('[data-print-receipt]').forEach(function (b) {
      b.addEventListener('click', function () { setReceipt(payments[parseInt(b.getAttribute('data-print-receipt'), 10)]); printReceipt(); });
    });
    tbody.querySelectorAll('[data-download-receipt]').forEach(function (b) {
      b.addEventListener('click', function () { setReceipt(payments[parseInt(b.getAttribute('data-download-receipt'), 10)]); downloadReceipt(); RouteX.toast('Receipt downloaded.', 'success', 'Downloaded'); });
    });
    RouteX.refreshIcons($('history-tbody'));
  }

  /* ---------------- notifications ---------------- */
  function addNotification(type, title, text, time, read) {
    var notifs = RouteX.store.get('routex_notifications', []);
    notifs.unshift({
      id: RouteX.uid('NT'), type: type, title: title, text: text,
      time: time || Date.now(), read: !!read
    });
    RouteX.store.set('routex_notifications', notifs);
    renderNotifications();
  }
  function renderNotifications() {
    var notifs = RouteX.store.get('routex_notifications', []);
    var wrap = $('notif-list');
    if (!wrap) return;
    var unread = unreadCount(notifs);
    var badge = $('notif-badge');
    if (badge) { badge.textContent = unread; badge.classList.toggle('hidden', unread === 0); }
    var dot = $('top-notif-dot');
    if (dot) dot.classList.toggle('hidden', unread === 0);

    wrap.innerHTML = notifs.map(function (n, i) {
      var meta = NOTIF_META[n.type] || NOTIF_META.reminder;
      return '<div data-notif="' + i + '" class="flex items-start gap-4 rounded-2xl border p-4 transition ' +
        (n.read ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900' : 'border-brand-200 bg-brand-50/50 dark:border-brand-700/40 dark:bg-slate-900') + '">' +
        '<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ' + meta.cls + '"><i data-lucide="' + meta.icon + '" class="h-5 w-5"></i></span>' +
        '<div class="min-w-0 flex-1">' +
        '<div class="flex flex-wrap items-center gap-2"><p class="text-sm font-bold text-slate-900 dark:text-white">' + RouteX.escapeHtml(n.title) + '</p>' +
        (!n.read ? '<span class="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-extrabold text-white dark:bg-amber-400 dark:text-slate-900">NEW</span>' : '') +
        '<span class="ml-auto text-[11px] text-slate-400">' + timeAgo(n.time) + '</span></div>' +
        '<p class="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">' + RouteX.escapeHtml(n.text) + '</p>' +
        '</div>' +
        (!n.read ? '<button data-mark-read="' + i + '" class="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:hover:border-amber-400 dark:hover:text-amber-300" aria-label="Mark as read"><i data-lucide="check" class="h-4 w-4"></i></button>' : '') +
        '</div>';
    }).join('');
    if (!notifs.length) {
      wrap.innerHTML = '<p class="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400 dark:border-slate-700">No notifications yet.</p>';
    }
    wrap.querySelectorAll('[data-mark-read]').forEach(function (b) {
      b.addEventListener('click', function () {
        var notifs2 = RouteX.store.get('routex_notifications', []);
        notifs2[parseInt(b.getAttribute('data-mark-read'), 10)].read = true;
        RouteX.store.set('routex_notifications', notifs2);
        renderNotifications();
      });
    });
    RouteX.refreshIcons(wrap);
  }

  /* ---------------- profile ---------------- */
  function initProfileForm() {
    var sel = $('pf-route');
    if (sel) {
      sel.innerHTML = RouteX.ROUTES.map(function (r) {
        return '<option value="' + r.id + '"' + (r.id === V.routeRecord.routeId ? ' selected' : '') + '>' + r.name + ' (Bus ' + r.busNo + ')</option>';
      }).join('');
    }
    var pf = V.profile || {};
    setVal('pf-name', pf.parentName || V.user.name || '');
    setVal('pf-email', pf.email || V.user.email || '');
    setVal('pf-phone', (pf.phone || '').replace('+91 ', ''));
    setVal('pf-address', pf.address || '');
    setVal('pf-child', pf.childName || '');
    setVal('pf-school', pf.school || '');
    setVal('pf-pickup', pf.pickup || '');
  }
  function setVal(id, v) {
    var el = $(id);
    if (el) el.value = v;
  }
  function bindProfile() {
    $('profile-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var name = $('pf-name').value.trim();
      var email = $('pf-email').value.trim();
      var phone = $('pf-phone').value.trim();
      var child = $('pf-child').value.trim();
      var school = $('pf-school').value.trim();
      var pickup = $('pf-pickup').value.trim();

      function err(id, m) {
        var el = $(id), p = document.querySelector('[data-err="' + id + '"]');
        if (m) { el.classList.add('field-error'); if (p) { p.textContent = m; p.classList.remove('hidden'); } ok = false; }
        else { el.classList.remove('field-error'); if (p) { p.textContent = ''; p.classList.add('hidden'); } }
      }
      err('pf-name', name.length > 1 ? '' : 'Enter your full name.');
      err('pf-email', RouteX.auth ? RouteX.auth.emailValid(email) ? '' : 'Enter a valid email.' : email.length > 3 ? '' : 'Enter an email.');
      err('pf-phone', RouteX.auth ? RouteX.auth.phoneValid(phone) ? '' : 'Enter a valid 10-digit mobile number.' : phone.length > 6 ? '' : 'Enter your phone.');
      err('pf-child', child.length > 1 ? '' : 'Enter your child\'s name.');
      err('pf-school', school.length > 1 ? '' : 'Enter the school name.');
      err('pf-pickup', pickup.length > 2 ? '' : 'Enter a pickup stop.');
      if (!ok) { RouteX.toast('Please fix the highlighted fields.', 'error', 'Profile not saved'); return; }

      var cleaned = RouteX.auth ? RouteX.auth.phoneValid(phone) ? '+91 ' + phone : phone : phone;
      var profile = Object.assign({}, V.profile || {}, {
        parentName: name, email: email, phone: cleaned,
        address: $('pf-address').value.trim(),
        childName: child, school: school, pickup: pickup,
        routeId: $('pf-route').value
      });
      RouteX.saveProfile(profile);
      RouteX.setUser({ name: name, email: email, phone: cleaned });
      V.profile = profile;

      var rid = $('pf-route').value;
      var rr = V.routeRecord;
      rr.routeId = rid;
      rr.stop = (RouteX.routeById(rid).stops[1] || RouteX.routeById(rid).stops[0]).name;
      RouteX.store.set('routex_route', rr);
      V.routeRecord = rr;
      V.route = RouteX.routeById(rid);
      boardFracOf();

      RouteX.toast('Profile updated successfully.', 'success', 'Saved');
      renderOverview();
      renderRouteDetails();
      renderTrackingMap();
      renderSubscription();
      renderPayInfo();
    });
  }

  /* ---------------- subscription actions ---------------- */
  function bindSubActions() {
    $('btn-change-plan').addEventListener('click', function () {
      renderPlanOptions();
      RouteX.openModal('modal-change-plan');
    });
    $('btn-renew').addEventListener('click', function () {
      var sub = V.sub;
      if (sub.status === 'Cancelled') sub.status = 'Active';
      sub.billingDate = RouteX.addMonths(sub.billingDate, 1);
      RouteX.store.set('routex_subscription', sub);
      V.sub = sub;
      renderSubscription();
      renderPayInfo();
      RouteX.toast('Your plan has been renewed until ' + RouteX.fmtDateISO(sub.billingDate) + '.', 'success', 'Renewed');
    });
    $('btn-cancel').addEventListener('click', function () {
      var till = $('cancel-till');
      if (till) till.textContent = RouteX.fmtDateISO(V.sub.billingDate);
      RouteX.openModal('modal-cancel');
    });
    $('cancel-confirm').addEventListener('click', function () {
      V.sub.status = 'Cancelled';
      RouteX.store.set('routex_subscription', V.sub);
      RouteX.closeModal('modal-cancel');
      renderSubscription();
      renderPayInfo();
      RouteX.toast('Subscription cancelled. Tracking continues until ' + RouteX.fmtDateISO(V.sub.billingDate) + '.', 'info', 'Cancelled');
    });
    $('plan-confirm').addEventListener('click', function () {
      var sel = document.querySelector('input[name="plan-choice"]:checked');
      if (!sel) return;
      var pid = sel.value;
      if (pid === V.sub.plan) {
        RouteX.closeModal('modal-change-plan');
        RouteX.toast('You are already on the ' + planName(pid) + ' plan.', 'info', 'No change needed');
        return;
      }
      RouteX.closeModal('modal-change-plan');
      openPayment(pid, 'Switch to the ' + planName(pid) + ' plan for the next cycle.');
    });
  }

  /* ---------------- payments bind ---------------- */
  function bindPayments() {
    document.querySelectorAll('[data-pay-method]').forEach(function (b) {
      b.addEventListener('click', function () { selectMethod(b.getAttribute('data-pay-method')); });
    });
    $('pay-submit').addEventListener('click', completePayment);
  }

  /* ---------------- notifications bind ---------------- */
  function bindNotifications() {
    $('notif-mark-all').addEventListener('click', function () {
      var notifs = RouteX.store.get('routex_notifications', []);
      notifs.forEach(function (n) { n.read = true; });
      RouteX.store.set('routex_notifications', notifs);
      renderNotifications();
      RouteX.toast('All notifications marked as read.', 'success', 'Done');
    });
  }

  /* ---------------- receipt binds ---------------- */
  function bindReceipt() {
    $('receipt-print-btn').addEventListener('click', printReceipt);
    $('receipt-download-btn').addEventListener('click', function () {
      downloadReceipt();
      RouteX.toast('Receipt downloaded.', 'success', 'Downloaded');
    });
  }

  /* ---------------- tracking loop ---------------- */
  function startTracking() {
    if (V.timer) return;
    V.timer = setInterval(function () {
      if (document.hidden) return;
      var before = V.map ? V.map : null;
      updateTrackingUI();
      updateGreetCard();
      renderLogs();
    }, 1000);
  }

  function updateGreetCard() {
    var tr = currentTracking();
    var st = $('greet-status-text');
    if (st) st.textContent = trackStatusText(tr);
  }

  function restartTracking() {
    var tr = currentTracking();
    if (tr && (tr.phase === 'arrived' || tr.phase === 'dropped')) {
      /* reset today's log row back to pending */
      var logs = RouteX.store.get('routex_boarding_logs', []);
      var i = todayLogIndex(logs);
      if (i > -1) {
        logs[i].board = '';
        logs[i].boardStatus = 'Pending';
        logs[i].drop = '';
        logs[i].dropStatus = 'Pending';
        RouteX.store.set('routex_boarding_logs', logs);
      }
    }
    RouteX.store.set('routex_tracking', { f: 0, phase: 'on-route', startedAt: Date.now(), arrAt: null, dropAt: null, dropDelaySec: DROP_DELAY });
    RouteX.toast('Simulation restarted. The bus is leaving the depot now.', 'info', 'Restarted');
    updateTrackingUI();
    renderLogs();
    renderOverview();
    setIntervalCheck();
  }
  function setIntervalCheck() {
    if (V.timer) { clearInterval(V.timer); V.timer = null; }
    startTracking();
  }

  /* ---------------- wire up ---------------- */
  function bindUI() {
    document.querySelectorAll('[data-section]').forEach(function (b) {
      b.addEventListener('click', function () { showSection(b.getAttribute('data-section')); });
    });
    document.addEventListener('click', function (e) {
      var g = e.target && e.target.closest ? e.target.closest('[data-goto]') : null;
      if (g) showSection(g.getAttribute('data-goto'));
    });
    $('side-open').addEventListener('click', openSidebar);
    $('side-close').addEventListener('click', closeSidebar);
    $('dash-scrim').addEventListener('click', closeSidebar);
    $('dash-logout').addEventListener('click', doLogout);
    $('dash-logout-btn').addEventListener('click', doLogout);
    $('tr-restart').addEventListener('click', restartTracking);

    /* theme + dir toggles in the dashboard topbar */
    var themeBtn = $('dash-theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', function () {
      RouteX.toggleTheme();
      syncDashTheme();
      RouteX.refreshIcons();
    });
    var dirBtn = $('dash-dir-toggle');
    if (dirBtn) dirBtn.addEventListener('click', function () {
      RouteX.toggleDir();
      syncDashDir();
      RouteX.refreshIcons();
    });

    /* theme + dir toggles in the mobile sidebar */
    var sideThemeBtn = $('side-theme-toggle');
    if (sideThemeBtn) sideThemeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      RouteX.toggleTheme();
      syncDashTheme();
      RouteX.refreshIcons();
    });
    var sideDirBtn = $('side-dir-toggle');
    if (sideDirBtn) sideDirBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      RouteX.toggleDir();
      syncDashDir();
      RouteX.refreshIcons();
    });
    syncDashTheme();
    syncDashDir();
  }

  function syncDashTheme() {
    var dark = false;
    try { dark = RouteX.isDark(); } catch (e) {}
    var sels = document.querySelectorAll('.dash-theme-sun, .dash-theme-moon');
    sels.forEach(function (el) {
      var isSun = el.className.indexOf('dash-theme-sun') !== -1;
      el.classList.toggle('hidden', isSun ? !dark : dark);
    });
  }

  function syncDashDir() {
    var rtl = false;
    try { rtl = RouteX.isRTL(); } catch (e) {}
    var sels = document.querySelectorAll('.dash-dir-ltr, .dash-dir-rtl');
    sels.forEach(function (el) {
      var isLtr = el.className.indexOf('dash-dir-ltr') !== -1;
      el.classList.toggle('hidden', isLtr ? rtl : !rtl);
    });
  }

  function doLogout() {
    RouteX.logout();
    RouteX.toast('You have been logged out. See you soon!', 'info', 'Logged out');
    setTimeout(function () { window.location.href = 'login.html'; }, 600);
  }

  /* ---------------- boot ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof RouteX === 'undefined' || typeof RouteX.auth === 'undefined') return;

    V.user = RouteX.getUser();
    if (!V.user) {
      /* Dummy/demo mode: the dashboard works without a login. Seed a
         demo parent session so all sections have data to render. */
      RouteX.setUser({
        name: 'Demo Parent',
        email: 'parent@routex.com',
        phone: '+91 90000 00000',
        demo: true,
        parentName: 'Demo Parent'
      });
      V.user = RouteX.getUser();
    }

    RouteX.ensureDashboardData();
    V.profile = RouteX.getProfile() || {};
    V.routeRecord = RouteX.store.get('routex_route', { routeId: 'r1', stop: 'Maple Street' });
    V.route = RouteX.routeById(V.routeRecord.routeId);
    V.sub = RouteX.store.get('routex_subscription', {
      plan: 'standard', amount: 1499, startDate: '2026-07-15', billingDate: '2026-09-15', status: 'Active', method: 'UPI'
    });
    boardFracOf();

    initProfileForm();
    renderOverview();
    renderTrackingMap();
    renderRouteDetails();
    renderLogs();
    renderSubscription();
    renderPayInfo();
    renderHistory();
    renderNotifications();
    bindUI();
    bindProfile();
    bindSubActions();
    bindPayments();
    bindNotifications();
    bindReceipt();
    startTracking();
    showSection('overview');

    var params = new URLSearchParams(location.search);
    var plan = params.get('plan');
    var planObj = plan && RouteX.planById(plan);
    if (planObj) {
      showSection('sub');
      RouteX.toast('Pick the ' + planObj.name + ' plan and confirm to activate it.', 'info', planObj.name + ' plan selected');
      setTimeout(function () {
        renderPlanOptions();
        RouteX.openModal('modal-change-plan');
        var radios = document.querySelectorAll('input[name="plan-choice"]');
        radios.forEach(function (r) { r.checked = r.value === plan; });
      }, 400);
    }
  });
})();