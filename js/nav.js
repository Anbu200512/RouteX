/* ============================================================
   RouteX — nav.js
   Injects the global header/navbar into #site-header on every
   page. Handles active link highlight, auth-aware buttons,
   mobile menu and the dark/light theme toggle.
   ============================================================ */

(function () {
  'use strict';

  var LINKS = [
    {
      href: 'index.html', label: 'Home', icon: 'home',
      children: [
        { href: 'index.html', label: 'Home 1' },
        { href: 'home2.html', label: 'Home 2' }
      ]
    },
    { href: 'about.html', label: 'About', icon: 'info' },
    { href: 'routes.html', label: 'Routes', icon: 'map' },
    { href: 'safety.html', label: 'Safety', icon: 'shield-check' },
    { href: 'plans.html', label: 'Plans', icon: 'gem' },
    { href: 'contact.html', label: 'Contact', icon: 'phone' },
    {
      href: 'dashboard.html', label: 'Dashboard', icon: 'layout-dashboard',
      children: [
        { href: 'admin.html', label: 'Admin' },
        { href: 'dashboard.html', label: 'Parent' }
      ]
    }
  ];

  function currentPage() {
    var p = location.pathname.split('/').pop() || '';
    p = p.split('?')[0];
    if (!p || p === '') return 'index.html';
    if (p === '/') return 'index.html';
    return p;
  }

  function isActive(href) {
    var page = currentPage();
    if (href === page) return true;
    var isHome = href === 'index.html' || href === 'home2.html';
    if (page === '404.html') return false;
    if (href === 'dashboard.html' && page === 'login.html') return false;
    if (href === 'dashboard.html' && page === 'dashboard.html') return true;
    return false;
  }

  function brand() {
    return (
      '<a href="index.html" class="flex items-center gap-2.5" aria-label="RouteX home">' +
      '<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 text-amber-300 shadow-lg shadow-brand-600/30">' +
      '<i data-lucide="bus-front" class="h-5 w-5"></i></span>' +
      '<span class="leading-tight">' +
      '<span class="block font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Route<span class="text-brand-600 dark:text-amber-400">X</span></span>' +
      '</span></a>'
    );
  }

  function themeToggleMarkup(isMobile) {
    var id = isMobile ? 'theme-toggle-mobile' : 'theme-toggle-desktop';
    return (
      '<button type="button" id="' + id + '" class="theme-toggle relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-amber-400" aria-label="Toggle dark mode">' +
      '<i data-lucide="sun" class="theme-sun h-5 w-5"></i>' +
      '<i data-lucide="moon" class="theme-moon h-5 w-5"></i>' +
      '</button>'
    );
  }

  function dirToggleMarkup(isMobile) {
    var id = isMobile ? 'dir-toggle-mobile' : 'dir-toggle-desktop';
    return (
      '<button type="button" id="' + id + '" class="dir-toggle relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-amber-400" aria-label="Toggle text direction" title="Toggle RTL/LTR">' +
      '<i data-lucide="arrow-right-left" class="dir-rtl h-5 w-5 hidden"></i>' +
      '<i data-lucide="arrow-left-right" class="dir-ltr h-5 w-5"></i>' +
      '</button>'
    );
  }

  function desktopLinkMarkup(l) {
    var on = isActive(l.href) ? ' text-brand-600 dark:text-amber-400' : ' text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-amber-400';
    var dot = isActive(l.href)
      ? '<span class="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-600 dark:bg-amber-400"></span>'
      : '';
    if (l.children && l.children.length) {
      var items = l.children.map(function (c) {
        var onC = isActive(c.href) ? ' bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-amber-400' : ' text-slate-600 hover:bg-slate-100 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-amber-400';
        return '<a href="' + c.href + '" class="dd-item flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold ' + onC + '">' + c.label + '</a>';
      }).join('');
      return (
        '<div class="nav-drop relative">' +
        '<button type="button" class="dropdown-toggle relative inline-flex items-center gap-1 py-1 text-sm font-semibold transition ' + on + '" aria-haspopup="true" aria-expanded="false">' + l.label +
        '<i data-lucide="chevron-down" class="dd-chevron h-3.5 w-3.5 transition-transform duration-200"></i>' + dot + '</button>' +
        '<div class="dropdown-panel invisible absolute top-full z-50 ltr:left-0 rtl:right-0 translate-y-1 pt-2 opacity-0 transition-all duration-150">' +
        '<div class="w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-brand-900/10 dark:border-slate-700 dark:bg-slate-900">' + items + '</div>' +
        '</div></div>'
      );
    }
    return '<a href="' + l.href + '" class="relative py-1 text-sm font-semibold transition ' + on + '">' + l.label + dot + '</a>';
  }

  function mobileLinkMarkup(l) {
    if (l.children && l.children.length) {
      var items = l.children.map(function (c) {
        var onC = isActive(c.href);
        return '<a href="' + c.href + '" class="block rounded-lg py-2 pr-2 text-sm font-semibold ' +
          (onC ? 'text-brand-700 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200') + '">' + c.label + '</a>';
      }).join('');
      return (
        '<div class="rounded-xl px-4 py-3">' +
        '<p class="text-sm font-bold text-slate-800 dark:text-slate-100">' + l.label + '</p>' +
        '<div class="mt-2 ml-5 space-y-1 border-l border-slate-200 pl-3 dark:border-slate-700">' + items + '</div>' +
        '</div>'
      );
    }
    var on = isActive(l.href);
    return (
      '<a href="' + l.href + '" class="block rounded-xl px-4 py-3 text-sm font-semibold transition ' +
      (on ? 'bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-amber-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800') + '">' + l.label + '</a>'
    );
  }

  function renderHeader(user) {
    var holder = document.getElementById('site-header');
    if (!holder) return;

    var isAuthPage = currentPage() === 'login.html' || currentPage() === 'signup.html';
    if (isAuthPage) {
      holder.innerHTML =
        '<header class="no-print border-b border-slate-200/70 bg-white/85 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/85">' +
        '<nav class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">' +
        brand() +
        '<div class="flex items-center gap-2">' +
        themeToggleMarkup(false) + dirToggleMarkup(false) +
        '</div>' +
        '</nav>' +
        '</header>';
      RouteX.refreshIcons(holder);
      syncThemeIndicators();
      holder.querySelectorAll('.theme-toggle').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          RouteX.toggleTheme();
          syncThemeIndicators();
        });
      });
      holder.querySelectorAll('.dir-toggle').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          RouteX.toggleDir();
          syncDirIndicators();
        });
      });
      return;
    }

    var desktopLinks = LINKS.map(desktopLinkMarkup).join('');

    var desktopRight =
      themeToggleMarkup(false) + dirToggleMarkup(false) +
      '<a href="login.html" class="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-600 dark:text-slate-200 dark:hover:border-amber-400 dark:hover:text-amber-300 xl:px-4">' +
      '<i data-lucide="log-in" class="h-4 w-4"></i>Login</a>' +
      '<a href="signup.html" class="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 xl:px-4">' +
      '<i data-lucide="user-plus" class="h-4 w-4"></i>Sign up</a>';

    var mobileItems = LINKS.map(mobileLinkMarkup).join('');

    holder.innerHTML =
      '<header class="no-print border-b border-slate-200/70 bg-white/85 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/85">' +
      '<nav id="site-nav" class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-6 xl:px-8">' +
      brand() +
      '<div class="hidden items-center gap-4 lg:flex xl:gap-7">' + desktopLinks + '</div>' +
      '<div class="hidden items-center gap-2 lg:flex">' + desktopRight + '</div>' +
      '<div class="flex items-center gap-2 lg:hidden">' +
      '<button id="menu-toggle" type="button" class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" aria-label="Toggle menu" aria-expanded="false">' +
      '<i data-lucide="menu" class="h-5 w-5 menu-open-icon"></i>' +
      '<i data-lucide="x" class="h-5 w-5 menu-close-icon hidden"></i>' +
      '</button></div>' +
      '</nav>' +
      '<div id="mobile-menu" class="grid lg:hidden transition-[grid-template-rows] duration-300 ease-in-out" style="grid-template-rows:0fr">' +
      '<div class="min-h-0 overflow-hidden">' +
      '<div class="space-y-1 border-t border-slate-200/70 bg-white/95 px-4 py-4 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/95">' +
      mobileItems +
      '<div class="mt-1 flex items-center justify-center gap-4 border-t border-slate-200/70 pt-3 dark:border-slate-800">' +
      themeToggleMarkup(true) + dirToggleMarkup(true) +
      '</div>' +
      '<div class="grid grid-cols-2 gap-2 pt-3">' +
      '<a href="login.html" class="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"><i data-lucide="log-in" class="h-4 w-4"></i>Login</a>' +
      '<a href="signup.html" class="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow shadow-brand-600/30"><i data-lucide="user-plus" class="h-4 w-4"></i>Sign up</a>' +
      '</div></div></div></div></header>';

    RouteX.refreshIcons(holder);
    syncThemeIndicators();

    /* mobile menu toggle */
    var menuToggle = document.getElementById('menu-toggle');
    var mobileMenu = document.getElementById('mobile-menu');
    var menuOpen = false;
    function setMobileMenu(open) {
      menuOpen = open;
      mobileMenu.style.gridTemplateRows = open ? '1fr' : '0fr';
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      var openIcon = menuToggle.querySelector('.menu-open-icon');
      var closeIcon = menuToggle.querySelector('.menu-close-icon');
      if (openIcon) openIcon.classList.toggle('hidden', open);
      if (closeIcon) closeIcon.classList.toggle('hidden', !open);
    }
    if (menuToggle && mobileMenu) {
      setMobileMenu(false);
      menuToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        setMobileMenu(!menuOpen);
      });
      mobileMenu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { setMobileMenu(false); });
      });
      document.addEventListener('click', function (e) {
        if (menuOpen && !e.target.closest('#site-header')) setMobileMenu(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menuOpen) setMobileMenu(false);
      });
    }

    /* theme toggles */
    holder.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        RouteX.toggleTheme();
        syncThemeIndicators();
      });
    });

    /* rtl/ltr toggles */
    holder.querySelectorAll('.dir-toggle').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        RouteX.toggleDir();
        syncDirIndicators();
      });
    });
  }

  function syncThemeIndicators() {
    var dark = RouteX.isDark();
    document.querySelectorAll('.theme-sun').forEach(function (el) {
      el.classList.toggle('hidden', !dark);
    });
    document.querySelectorAll('.theme-moon').forEach(function (el) {
      el.classList.toggle('hidden', dark);
    });
  }

  function syncDirIndicators() {
    var rtl = RouteX.isRTL();
    document.querySelectorAll('.dir-ltr').forEach(function (el) {
      el.classList.toggle('hidden', rtl);
    });
    document.querySelectorAll('.dir-rtl').forEach(function (el) {
      el.classList.toggle('hidden', !rtl);
    });
  }

  function setDrop(navDrop, open) {
    if (!navDrop) return;
    navDrop.classList.toggle('dd-open', open);
    var toggle = navDrop.querySelector('.dropdown-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    var panel = navDrop.querySelector('.dropdown-panel');
    if (panel) {
      panel.classList.toggle('invisible', !open);
      panel.classList.toggle('opacity-0', !open);
      panel.classList.toggle('translate-y-1', !open);
    }
    var chevron = navDrop.querySelector('.dd-chevron');
    if (chevron) chevron.classList.toggle('rotate-180', open);
  }

  function bindDropdowns() {
    /* click on a toggle: toggle that dropdown, close the rest.
       click anywhere else (outside a toggle): close all. */
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('.dropdown-toggle') : null;
      var wasOpen = !!(btn && btn.closest('.nav-drop') && btn.closest('.nav-drop').classList.contains('dd-open'));
      document.querySelectorAll('.nav-drop').forEach(function (d) { setDrop(d, false); });
      if (btn && !wasOpen) setDrop(btn.closest('.nav-drop'), true);
    });

    /* close when clicking a child link inside an open panel */
    document.addEventListener('click', function (e) {
      var item = e.target && e.target.closest ? e.target.closest('.dd-item') : null;
      if (item) { var wrap = item.closest('.nav-drop'); if (wrap) setDrop(wrap, false); }
    });

    /* desktop hover: open on enter, close on leave */
    document.querySelectorAll('.nav-drop').forEach(function (d) {
      d.addEventListener('mouseenter', function () { setDrop(d, true); });
      d.addEventListener('mouseleave', function () { setDrop(d, false); });
    });

    /* close open dropdowns on scroll */
    window.addEventListener('scroll', function () {
      document.querySelectorAll('.nav-drop.dd-open').forEach(function (d) { setDrop(d, false); });
    }, { passive: true });

    /* Escape closes open dropdown */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.nav-drop.dd-open').forEach(function (d) { setDrop(d, false); });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof RouteX === 'undefined') return;
    renderHeader(RouteX.getUser());
    RouteX.onThemeChange(syncThemeIndicators);
    RouteX.onDirChange(syncDirIndicators);
    syncThemeIndicators();
    syncDirIndicators();
    bindDropdowns();
  });
})();