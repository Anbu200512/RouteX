/* ============================================================
   RouteX — routes.js
   Renders the Routes page: interactive route tabs + map-style
   board, mini-maps, and working search/filter for route, area
   and pickup zone.
   ============================================================ */

(function () {
  'use strict';

  var ROUTES = RouteX ? RouteX.ROUTES : [];

  var state = {
    selected: 'r1',
    anim: null
  };

  var NS = 'http://www.w3.org/2000/svg';
  function mk(name, attrs) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* ---------- stop coordinates for a route (spread along path) ---------- */
  var FRACS = [0.12, 0.3, 0.47, 0.66, 0.88];
  function schoolName(route) {
    var last = route.stops && route.stops.length ? route.stops[route.stops.length - 1].name : '';
    return String(last).replace(/\s*\(School\)/i, '') || 'Emerald Academy';
  }
  function stopsForMap(route) {
    return route.stops.map(function (s, i) {
      var pt = RouteX.pointOnPath(route.coords, FRACS[i]);
      var type = i === route.stops.length - 1 ? 'school' : i === 2 ? 'pickup' : 'drop';
      return { x: pt.x, y: pt.y, label: s.name, type: type };
    });
  }

  /* ---------- board ---------- */
  function renderTabs() {
    var wrap = document.getElementById('route-tabs');
    if (!wrap) return;
    wrap.innerHTML = '';
    ROUTES.forEach(function (r) {
      var b = mk('button');
      b.type = 'button';
      b.setAttribute('data-route-tab', r.id);
      b.className =
        'group flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition ' +
        (state.selected === r.id
          ? 'border-brand-500 bg-brand-600/10 text-brand-700 dark:border-amber-400/60 dark:text-amber-300'
          : 'border-slate-200 text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-600');
      b.innerHTML =
        '<span class="h-3 w-3 rounded-full shrink-0" style="background:' + r.color + '"></span>' +
        '<span class="min-w-0"><span class="block truncate">' + r.name + '</span>' +
        '<span class="block text-[11px] font-normal text-slate-400">' + r.busNo + ' • ' + r.driver.split(' ')[0] + '</span></span>' +
        '<span class="ml-auto text-[10px] font-bold uppercase tracking-wide ' + (r.availability === 'Available' ? 'text-emerald-500' : 'text-amber-500') + '">' +
        (r.availability === 'Available' ? 'Open' : 'Few seats') + '</span>';
      b.addEventListener('click', function () { selectRoute(r.id); });
      b.addEventListener('click', function () {
        var board = document.getElementById('map-board');
        if (board && window.innerWidth < 1024) board.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      wrap.appendChild(b);
    });
  }

  function parseTime(s) {
    if (!s) return null;
    var m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(String(s));
    if (!m) return null;
    var h = parseInt(m[1], 10) % 12, min = parseInt(m[2], 10);
    if (/pm/i.test(m[3])) h += 12;
    return (h * 60 + min) * 60000;
  }

  function selectRoute(id, opts) {
    state.selected = id;
    renderTabs();
    var route = RouteX.routeById(id);
    var svg = document.getElementById('board-map');

    var map = RouteX.drawRouteMap(svg, route.coords, stopsForMap(route), route.color);

    var title = document.getElementById('board-title');
    var avail = document.getElementById('board-availability');
    if (title) title.textContent = route.name;
    var selLabel = document.getElementById('board-selected');
    if (selLabel) selLabel.textContent = route.name;
    if (avail) {
      avail.textContent = route.availability;
      avail.className =
        'rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ' +
        (route.availability === 'Available' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300');
    }

    var bdBus = document.getElementById('bd-bus');
    var bdDriver = document.getElementById('bd-driver');
    var bdArrival = document.getElementById('bd-arrival');
    var bdSchool = document.getElementById('bd-school');
    var bdAreas = document.getElementById('bd-areas');
    var bdZones = document.getElementById('bd-zones');
    if (bdBus) bdBus.textContent = route.busNo;
    if (bdDriver) bdDriver.textContent = route.driver + ' • ' + route.phone;
    if (bdArrival) bdArrival.textContent = route.stops[route.stops.length - 1].pick + ' (school)';
    if (bdSchool) bdSchool.textContent = schoolName(route);
    if (bdAreas) bdAreas.innerHTML = route.areas.map(function (a) {
      return '<span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-slate-800 dark:text-amber-300">' + RouteX.escapeHtml(a) + '</span>';
    }).join('');
    if (bdZones) bdZones.textContent = route.zones.join(', ');

    /* duration estimate from first pickup to school arrival */
    var durText = '~25 min';
    var stops = route.stops || [];
    if (stops.length >= 2) {
      var t1 = parseTime(stops[0].pick), t2 = parseTime(stops[stops.length - 1].pick);
      if (t1 !== null && t2 !== null && t2 > t1) {
        var mins = Math.round((t2 - t1) / 60000);
        durText = '~' + mins + ' min';
      }
    }
    var stopsCount = stops.length - 1;
    var bdStops = document.getElementById('bd-stops');
    var bdDur = document.getElementById('bd-duration');
    if (bdStops) bdStops.textContent = stopsCount;
    if (bdDur) bdDur.textContent = durText;
    var chipStops = document.getElementById('board-stops');
    var chipDur = document.getElementById('board-duration');
    if (chipStops) chipStops.textContent = stopsCount + ' stops';
    if (chipDur) chipDur.textContent = durText;

    if (state.anim) clearInterval(state.anim);
    var p = 0.1, dir = 1;
    map.setBus(p);
    state.anim = setInterval(function () {
      if (p >= 0.9) dir = -1;
      if (p <= 0.05) dir = 1;
      p += 0.012 * dir;
      map.setBus(p);
    }, 90);

    var fromCard = opts && opts.card;
    if (fromCard) expose.notify(route.name);
  }

  /* ---------- mini maps ---------- */
  function miniMap(svg, route) {
    svg.innerHTML = '';
    var pts = route.coords;
    svg.appendChild(mk('path', {
      d: RouteX.polylinePath(pts), fill: 'none', stroke: '#94a3b8', 'stroke-width': 7,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.35
    }));
    svg.appendChild(mk('path', {
      d: RouteX.polylinePath(pts), fill: 'none', stroke: route.color, 'stroke-width': 3.5,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.9
    }));
    var g = mk('g', {});
    route.stops.forEach(function (s, i) {
      var pt = RouteX.pointOnPath(pts, FRACS[i]);
      var type = i === route.stops.length - 1 ? 'school' : i === 2 ? 'pickup' : 'drop';
      g.appendChild(mk('circle', {
        cx: pt.x, cy: pt.y, r: type === 'school' ? 7 : 5,
        fill: type === 'pickup' ? '#facc15' : type === 'school' ? '#34d399' : '#cbd5e1',
        stroke: '#0f172a', 'stroke-width': 2
      }));
    });
    svg.appendChild(g);
  }

  /* ---------- cards + filters ---------- */
  function buildCards(list) {
    var wrap = document.getElementById('route-cards');
    if (!wrap) return;
    wrap.innerHTML = list.map(function (r) {
      var stopsHtml = r.stops.slice(0, 3).map(function (s) {
        return '<li class="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 text-sm last:border-0 last:pb-0 dark:border-slate-800">' +
          '<span class="flex items-center gap-2 text-slate-600 dark:text-slate-300"><i data-lucide="map-pin" class="h-3.5 w-3.5 text-brand-500 dark:text-amber-400"></i>' + RouteX.escapeHtml(s.name) + '</span>' +
          '<span class="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">' + s.pick + ' → ' + s.drop + '</span></li>';
      }).join('');
      var areas = r.areas.map(function (a) {
        return '<span class="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 dark:bg-slate-800 dark:text-amber-300">' + RouteX.escapeHtml(a) + '</span>';
      }).join('');
      var zones = r.zones.map(function (z) {
        return '<span class="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-slate-800 dark:text-slate-300">' + RouteX.escapeHtml(z) + ' zone</span>';
      }).join('');

      return (
        '<article class="card-lift flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">' +
        '<div class="p-5">' +
        '<div class="flex items-start justify-between gap-2">' +
        '<div class="min-w-0">' +
        '<span class="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm" style="background:' + r.color + '"><i data-lucide="bus" class="h-5 w-5"></i></span>' +
        '<h3 class="mt-3 font-display text-lg font-bold text-slate-900 dark:text-white">' + RouteX.escapeHtml(r.name) + '</h3>' +
        '<p class="text-sm text-slate-500 dark:text-slate-400">' + r.busNo + ' • Driver: ' + RouteX.escapeHtml(r.driver) + '</p>' +
        '<p class="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><i data-lucide="school" class="h-3.5 w-3.5 text-brand-500 dark:text-amber-400"></i>School served: <span class="text-slate-700 dark:text-slate-200">' + RouteX.escapeHtml(schoolName(r)) + '</span></p>' +
        '</div>' +
        '<span class="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ' +
        (r.availability === 'Available'
          ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400'
          : 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400') + '">' + r.availability + '</span>' +
        '</div></div>' +
        '<div class="map-panel px-5 pb-4">' +
        '<svg class="w-full rounded-xl border border-slate-800" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>' +
        '</div>' +
        '<div class="flex-1 p-5 pt-4">' +
        (r.stops.length > 3 ? '<ul class="mb-3 space-y-2.5">' + stopsHtml + '</ul>' +
          '<p class="mb-3 text-xs font-semibold text-slate-400">+' + (r.stops.length - 3) + ' more stops</p>'
          : '<ul class="mb-3 space-y-2.5">' + stopsHtml + '</ul>') +
        '<div class="mb-4 flex flex-wrap gap-1.5">' +
        (zones ? '<span class="w-full pb-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Areas covered</span>' : '') +
        areas + '</div>' +
        (zones ? '<div class="mb-4 flex flex-wrap gap-1.5">' +
        '<span class="w-full pb-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Service zones</span>' +
        zones + '</div>' : '') +
        '<div class="flex gap-2">' +
        '<button data-use-map="' + r.id + '" class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-amber-400 dark:hover:text-amber-300">' +
        '<i data-lucide="map" class="h-3.5 w-3.5"></i>View on map</button>' +
        '<a href="signup.html?route=' + r.id + '" class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2.5 text-xs font-bold text-white shadow shadow-brand-600/25 transition hover:bg-brand-700">' +
        '<i data-lucide="clipboard-list" class="h-3.5 w-3.5"></i>Book route</a>' +
        '</div></div></article>'
      );
    }).join('');

    wrap.querySelectorAll('[data-use-map]').forEach(function (btn) {
      btn.addEventListener('click', function () { goSelect(btn.getAttribute('data-use-map'), true); });
    });
    RouteX.refreshIcons(wrap);

    wrap.querySelectorAll('svg').forEach(function (svgEl, i) {
      miniMap(svgEl, list[i]);
    });
  }

  function initFilters() {
    var areaSel = document.getElementById('filter-area');
    var zoneSel = document.getElementById('filter-zone');
    var areas = [], zones = [];
    ROUTES.forEach(function (r) {
      r.areas.forEach(function (a) { if (areas.indexOf(a) === -1) areas.push(a); });
      r.zones.forEach(function (z) { if (zones.indexOf(z) === -1) zones.push(z); });
    });
    areas.sort();
    zones.sort();
    areaSel.innerHTML = '<option value="">All areas</option>' + areas.map(function (a) { return '<option>' + a + '</option>'; }).join('');
    zoneSel.innerHTML = '<option value="">All pickup zones</option>' + zones.map(function (z) { return '<option>' + z + '</option>'; }).join('');
  }

  function applyFilters() {
    var q = (document.getElementById('filter-search').value || '').trim().toLowerCase();
    var a = document.getElementById('filter-area').value;
    var z = document.getElementById('filter-zone').value;
    var av = document.getElementById('filter-avail').value;

    var list = ROUTES.filter(function (r) {
      if (a && r.areas.indexOf(a) === -1) return false;
      if (z && r.zones.indexOf(z) === -1) return false;
      if (av && r.availability !== av) return false;
      if (q) {
        var hay = [r.name, r.busNo, r.driver, r.areas.join(' '), r.zones.join(' '), r.stops.map(function (s) { return s.name + ' ' + (s.zone || ''); }).join(' ')].join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    buildCards(list);

    var count = document.getElementById('filter-count');
    if (count) count.textContent = 'Showing ' + list.length + ' of ' + ROUTES.length + ' routes';

    var none = document.getElementById('no-results');
    if (none) none.classList.toggle('hidden', list.length > 0);
  }

  function goSelect(id, card) {
    selectRoute(id, { card: !!card });
    var board = document.getElementById('map-board');
    if (board) {
      setTimeout(function () {
        board.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 30);
    }
  }

  function resetFilters() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-area').value = '';
    document.getElementById('filter-zone').value = '';
    document.getElementById('filter-avail').value = '';
    applyFilters();
    var board = document.getElementById('map-board');
    if (board) board.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  var expose = {
    resetFilters: resetFilters,
    selectRoute: function (id, opts) { selectRoute(id, opts); },
    notify: function (name) { RouteX.toast(name + ' loaded on the map.', 'info', 'Route selected'); }
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof RouteX === 'undefined') return;
    renderTabs();
    initFilters();
    selectRoute(state.selected);
    buildCards(ROUTES);
    applyFilters();

    ['filter-search', 'filter-area', 'filter-zone', 'filter-avail'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', applyFilters);
      if (el && el.tagName === 'SELECT') el.addEventListener('change', applyFilters);
    });
    var reset = document.getElementById('filter-reset');
    if (reset) reset.addEventListener('click', resetFilters);
  });

  window.RouteXRoutes = expose;
})();