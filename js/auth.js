/* ============================================================
   RouteX — auth.js
   Frontend-only demo authentication.
     - Reads parent accounts saved under routex_registration
     - Provides a demo account for quick login
     - Saves sessions under routex_user
     - Registers new parents + child details
   ============================================================ */

(function () {
  'use strict';

  var DEMO = {
    name: 'Demo Parent',
    email: 'parent@routex.com',
    password: 'routex123',
    phone: '+91 90000 00000'
  };

  function emailValid(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  function phoneValid(v) {
    return /^[6-9]\d{9}$/.test(String(v).replace(/\D/g, '').slice(-10));
  }

  function registrations() {
    return RouteX.store.get('routex_registration', []);
  }

  function findUser(email) {
    if (!email) return null;
    var key = email.trim().toLowerCase();
    if (key === DEMO.email) {
      return {
        name: DEMO.name, email: DEMO.email, password: DEMO.password, phone: DEMO.phone,
        demo: true, parentName: DEMO.name
      };
    }
    var regs = registrations();
    for (var i = 0; i < regs.length; i++) {
      if (regs[i] && String(regs[i].email || '').trim().toLowerCase() === key) {
        return regs[i];
      }
    }
    return null;
  }

  function authenticate(email, password) {
    var u = findUser(email);
    if (!u) return { ok: false, reason: 'No account found with that email. Please sign up first.' };
    if (u.password !== password) return { ok: false, reason: 'Incorrect password. Please try again.' };
    return { ok: true, user: u };
  }

  function registerUser(record) {
    var regs = registrations();
    var key = record.email.trim().toLowerCase();

    for (var i = 0; i < regs.length; i++) {
      if (regs[i] && String(regs[i].email || '').trim().toLowerCase() === key) {
        regs[i] = record;
        RouteX.store.set('routex_registration', regs);
        RouteX.saveProfile(profileFromRecord(record));
        return { ok: false, reason: 'An account with this email already exists. Please log in.' };
      }
    }

    regs.push(record);
    RouteX.store.set('routex_registration', regs);
    RouteX.saveProfile(profileFromRecord(record));

    var route = RouteX.routeById(record.child.routeId);
    RouteX.store.set('routex_route', {
      routeId: record.child.routeId,
      stop: (route.stops[1] || route.stops[0]).name
    });
    return { ok: true };
  }

  function profileFromRecord(r) {
    return {
      parentName: r.parentName,
      email: r.email,
      phone: r.phone,
      address: r.address || '',
      password: r.password,
      childName: r.child.name,
      school: r.child.school,
      pickup: r.child.pickupLocation,
      routeId: r.child.routeId
    };
  }

  function remember() {
    return RouteX.store.get('routex_remember', null);
  }
  function saveRemember(email) {
    RouteX.store.set('routex_remember', { email: email, at: Date.now() });
  }
  function clearRemember() {
    RouteX.store.remove('routex_remember');
  }

  window.RouteX = window.RouteX || {};
  window.RouteX.auth = {
    DEMO: DEMO,
    emailValid: emailValid,
    phoneValid: phoneValid,
    findUser: findUser,
    authenticate: authenticate,
    registerUser: registerUser,
    profileFromRecord: profileFromRecord,
    remember: remember,
    saveRemember: saveRemember,
    clearRemember: clearRemember
  };
})();