/* ============================================================
   RouteX — footer.js
   Injects the global footer into #site-footer on every page.
   ============================================================ */

(function () {
  'use strict';

  function render() {
    var holder = document.getElementById('site-footer');
    if (!holder) return;

    var year = new Date().getFullYear();
    var user = RouteX.getUser();
    var portalHref = user ? 'dashboard.html' : 'login.html';

    holder.innerHTML =
      '<footer class="no-print mt-auto border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">' +
      '<div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">' +
      '<div class="grid gap-10 md:grid-cols-2 lg:grid-cols-4">' +

      /* brand */
      '<div class="space-y-4">' +
      '<a href="index.html" class="flex items-center gap-2.5">' +
      '<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 text-amber-300 shadow-lg shadow-brand-600/30"><i data-lucide="bus-front" class="h-5 w-5"></i></span>' +
      '<span class="font-display text-lg font-extrabold text-slate-900 dark:text-white">Route<span class="text-brand-600 dark:text-amber-400">X</span></span></a>' +
      '<p class="max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">Safe Rides. Smarter Tracking. Real-time GPS-enabled school transport trusted by families and schools across the city.</p>' +
      '<div class="flex gap-2">' +
      '<a href="#" aria-label="Facebook" class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-amber-400">' +
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>' +
      '</a>' +
      '<a href="#" aria-label="Instagram" class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-amber-400">' +
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>' +
      '</a>' +
      '<a href="#" aria-label="X" class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-amber-400">' +
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20"/></svg>' +
      '</a>' +
      '<a href="#" aria-label="YouTube" class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-amber-400">' +
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>' +
      '</a>' +
      '</div></div>' +

      /* quick links */
      '<div>' +
      '<h3 class="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Quick Links</h3>' +
      '<ul class="space-y-2.5 text-sm">' +
      '<li><a href="index.html" class="text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-amber-400">Home</a></li>' +
      '<li><a href="routes.html" class="text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-amber-400">Routes</a></li>' +
      '<li><a href="safety.html" class="text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-amber-400">Safety Features</a></li>' +
      '<li><a href="plans.html" class="text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-amber-400">Subscription Plans</a></li>' +
      '<li><a href="contact.html" class="text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-amber-400">Contact Us</a></li>' +
      '</ul></div>' +

      /* parent portal */
      '<div>' +
      '<h3 class="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Parent Portal</h3>' +
      '<ul class="space-y-2.5 text-sm">' +
      '<li><a href="' + portalHref + '" class="text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-amber-400">Parent Portal</a></li>' +
      '<li><a href="login.html" class="text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-amber-400">Login</a></li>' +
      '<li><a href="signup.html" class="text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-amber-400">Create Account</a></li>' +
      '<li><a href="plans.html" class="text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-amber-400">Manage Subscription</a></li>' +
      '<li><a href="dashboard.html" class="text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-amber-400">Live Bus Tracking</a></li>' +
      '</ul></div>' +

      /* contact */
      '<div>' +
      '<h3 class="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Get in Touch</h3>' +
      '<ul class="space-y-3 text-sm text-slate-500 dark:text-slate-400">' +
      '<li class="flex items-start gap-2.5"><i data-lucide="map-pin" class="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-amber-400"></i><span>RouteX HQ, 5th Floor, Transport Bhavan, MG Road, Bengaluru 560001</span></li>' +
      '<li class="flex items-center gap-2.5"><i data-lucide="phone" class="h-4 w-4 shrink-0 text-brand-600 dark:text-amber-400"></i><a href="tel:+918000123456" class="hover:text-brand-600 dark:hover:text-amber-400">+91 80001 23456</a></li>' +
      '<li class="flex items-center gap-2.5"><i data-lucide="mail" class="h-4 w-4 shrink-0 text-brand-600 dark:text-amber-400"></i><a href="mailto:care@routex.com" class="hover:text-brand-600 dark:hover:text-amber-400">care@routex.com</a></li>' +
      '<li class="flex items-center gap-2.5"><i data-lucide="clock" class="h-4 w-4 shrink-0 text-brand-600 dark:text-amber-400"></i>Support 7:00 AM – 9:00 PM</li>' +
      '</ul></div>' +

      '</div>' +
      '<div class="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row">' +
      '<p>&copy; ' + year + ' RouteX. All rights reserved.</p>' +
      '<div class="flex gap-5">' +
      '<a href="#" class="transition hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</a>' +
      '<a href="#" class="transition hover:text-slate-600 dark:hover:text-slate-300">Terms of Service</a>' +
      '<a href="#" class="transition hover:text-slate-600 dark:hover:text-slate-300">Refund Policy</a>' +
      '</div>' +
      '<p class="font-medium text-slate-500 dark:text-slate-400">Safe Rides. Smarter Tracking.</p>' +
      '</div></div>' +
      '<div class="border-t border-slate-200 bg-slate-100/60 py-2.5 text-center text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500">This is a frontend demo. Bus tracking, notifications &amp; payments are simulated.</div>' +
      '</footer>';

    RouteX.refreshIcons(holder);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof RouteX === 'undefined') return;
    render();
  });
})();