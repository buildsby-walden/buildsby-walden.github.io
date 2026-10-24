/* Booking app concept (Builds by Walden): the shared data layer. Everything lives in this browser (localStorage), so
   the customer app and the owner's view show the same bookings. A real version would keep this on a server.
   Every studio's preview shares one web address, so each keeps its own saved data under its own key. */
(function () {
  const D = window.SS;
  const KEY = "app-" + (D.studio.key || "studio");
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const hm = d => pad(d.getHours()) + ":" + pad(d.getMinutes());
  const dayStart = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function hash(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }

  /* the weekly timetable (one week in data.js), repeated from today onwards */
  const template = (() => {
    const first = new Date(D.sessions[0].start), end = new Date(first.getTime() + 7 * 864e5);
    return D.sessions.filter(s => new Date(s.start) < end).map(s => { const t = new Date(s.start); return Object.assign({}, s, { dow: t.getDay(), time: hm(t) }); });
  })();
  function schedule(days = 14, from = new Date()) {
    const out = [], start = dayStart(from);
    for (let i = -1; i < days; i++) {
      const d = new Date(start.getTime() + i * 864e5);
      template.filter(t => t.dow === d.getDay()).forEach(t => {
        const [h, m] = t.time.split(":").map(Number);
        const at = new Date(d); at.setHours(h, m, 0, 0);
        const id = t.cls + "-" + ymd(d).replace(/-/g, "") + "-" + t.time.replace(":", "");
        const weeks = Math.max(0, Math.floor((at - start) / (7 * 864e5)));
        const r = rng(hash(id));
        const base = Math.max(0, Math.min(t.cap, Math.round(t.booked * (weeks ? 0.55 + r() * 0.3 : 1) + (weeks ? 0 : 0))));
        out.push({ id, cls: t.cls, start: at, mins: t.mins, cap: t.cap, baseBooked: base, coach: t.coach });
      });
    }
    return out.sort((a, b) => a.start - b.start);
  }

  /* saved state */
  const blank = () => ({ users: {}, me: null, extra: {}, waitlists: {}, settings: { stampsFor: 10, reward: "a free class of your choice", referral: "a free class when your friend books their first class", pin: "2468" }, nudges: [] });
  let st;
  try { st = JSON.parse(localStorage.getItem(KEY)) || blank(); } catch (e) { st = blank(); }
  st.settings = Object.assign(blank().settings, st.settings || {});
  // the bring-a-friend reward now goes only to the customer who shares their code (24 Oct 2026)
  if (st.settings.referral === "a free class each when they book their first") st.settings.referral = blank().settings.referral;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} window.dispatchEvent(new Event("ss-change")); };
  window.addEventListener("storage", e => { if (e.key === KEY) { try { st = JSON.parse(e.newValue) || blank(); } catch (x) {} window.dispatchEvent(new Event("ss-change")); } });

  const cls = k => D.classes.find(c => c.key === k);
  const coach = k => (k && (D.team || []).find(t => t.key === k)) || { name: k || "", img: "" };
  const price = k => D.prices.find(p => p.key === k);
  /* the numbers the wording needs: single class, the class pass, the two memberships */
  const P = (() => { const s = price("single"), p = price("six"), g = price("gold"), pl = price("platinum");
    return { single: s.price, packN: p.credits, pack: p.price, packEach: p.price / p.credits, packName: p.name, goldN: g.credits, gold: g.price, goldEach: g.price / g.credits, plat: pl.price }; })();
  const money = v => "£" + (Math.round(v * 100) % 100 ? (Math.round(v * 100) / 100).toFixed(2) : Math.round(v));
  const me = () => (st.me && st.users[st.me]) || null;
  const booked = s => s.baseBooked + (st.extra[s.id] || 0);
  const spaces = s => Math.max(0, s.cap - booked(s));

  function signUp(name, email, phone) {
    email = email.trim().toLowerCase();
    if (!st.users[email]) st.users[email] = { name: name.trim(), email, phone: (phone || "").trim(), created: Date.now(), plan: null, credits: 0, stamps: 0, cards: 0, rewards: 0, rewardsUsed: 0, bookings: [], code: (name.trim().split(" ")[0] || "FRIEND").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8) + Math.floor(100 + Math.random() * 900) };
    st.me = email; save(); return st.users[email];
  }
  function signOut() { st.me = null; save(); }
  function signIn(email) { email = email.trim().toLowerCase(); if (st.users[email]) { st.me = email; save(); return st.users[email]; } return null; }

  function buy(kind) {
    const u = me(); if (!u) return null;
    const p = price(kind);
    if (p.kind === "membership") { u.plan = { kind, since: Date.now(), renews: Date.now() + 30 * 864e5, used: 0 }; }
    else u.credits += p.credits;
    (u.purchases = u.purchases || []).push({ kind, at: Date.now(), amount: p.price });
    save(); return u;
  }
  /* how a booking can be paid for, best first */
  function payOptions(u) {
    const out = [];
    if (u && u.rewards > u.rewardsUsed) out.push({ key: "reward", label: "Use your free class", sub: "Earned on your loyalty card", price: "Free" });
    if (u && u.plan && (u.plan.kind === "platinum" || (u.plan.used || 0) < P.goldN)) out.push({ key: "plan", label: price(u.plan.kind).name, sub: u.plan.kind === "platinum" ? "Unlimited classes" : (P.goldN - (u.plan.used || 0)) + " of " + P.goldN + " classes left this month", price: "Included" });
    if (u && u.credits > 0) out.push({ key: "credit", label: "Use a class credit", sub: u.credits + " credit" + (u.credits === 1 ? "" : "s") + " left", price: "1 credit" });
    out.push({ key: "single", label: "Pay for this class", sub: "Full price · earns a loyalty stamp", price: money(P.single) });
    out.push({ key: "six", label: "Buy a " + P.packName, sub: money(P.packEach) + " a class · uses one now, " + (P.packN - 1) + " left", price: money(P.pack) });
    return out;
  }
  /* stamps are only for classes paid at the full price. Passes and memberships already cost less per class, so
     they don't earn stamps on top (members get a guest pass each month instead), and a free class never earns one. */
  const EARNS = ["single"];
  function book(s, pay) {
    const u = me();
    if (spaces(s) <= 0) return { error: "full" };
    if (u && u.bookings.some(b => b.sid === s.id && b.status === "booked")) return { error: "already" };
    let paidWith = pay;
    if (u) {
      if (pay === "reward") u.rewardsUsed++;
      else if (pay === "plan") u.plan.used = (u.plan.used || 0) + 1;
      else if (pay === "credit") u.credits--;
      else if (pay === "six") { buy("six"); u.credits--; }
      else if (pay === "single") (u.purchases = u.purchases || []).push({ kind: "single", at: Date.now(), amount: P.single });
    }
    st.extra[s.id] = (st.extra[s.id] || 0) + 1;
    let stamp = null;
    if (u) {
      const stamped = EARNS.includes(pay);
      u.bookings.push({ sid: s.id, cls: s.cls, start: s.start.getTime(), coach: s.coach, at: Date.now(), status: "booked", paid: paidWith, stamped });
      if (stamped) {
        u.stamps++; stamp = u.stamps;
        if (u.stamps >= st.settings.stampsFor) { u.stamps = 0; u.cards++; u.rewards++; stamp = "reward"; }
      }
    }
    save(); return { ok: true, stamp, paid: pay };
  }
  function cancel(sid) {
    const u = me(); if (!u) return null;
    const b = u.bookings.find(x => x.sid === sid && x.status === "booked"); if (!b) return null;
    const late = b.start - Date.now() < 12 * 3600e3;
    b.status = late ? "late-cancel" : "cancelled";
    st.extra[sid] = (st.extra[sid] || 0) - 1;
    if (!late) { if (b.paid === "plan" && u.plan) u.plan.used = Math.max(0, (u.plan.used || 0) - 1); else if (b.paid === "reward") u.rewardsUsed--; else u.credits++; }
    // the stamp goes with the class
    if (b.stamped && u.stamps > 0) u.stamps--;
    promote(sid, late);
    save(); return { late };
  }
  // someone on the waitlist moves up
  function promote(sid, late) { const wl = st.waitlists[sid] || []; if (wl.length && !late) { const next = wl.shift(); (st.users[next] || {}).promoted = sid; } }

  /* members' guest pass: one free class for a friend each calendar month (the month of the class) */
  const month = d => { d = new Date(d); return d.getFullYear() * 12 + d.getMonth(); };
  function guestPass(u, when) {
    if (!u || !u.plan) return null;
    return (u.guests || []).some(g => g.status !== "cancelled" && month(g.start) === month(when || Date.now())) ? "used" : "ready";
  }
  function bookGuest(s, name, email) {
    const u = me();
    if (guestPass(u, s.start) !== "ready") return { error: "used" };
    if (spaces(s) <= 0) return { error: "full" };
    (u.guests = u.guests || []).push({ sid: s.id, cls: s.cls, start: s.start.getTime(), coach: s.coach, at: Date.now(), status: "booked", name: (name || "").trim() || "Your friend", email: (email || "").trim().toLowerCase() });
    st.extra[s.id] = (st.extra[s.id] || 0) + 1;
    save(); return { ok: true };
  }
  function cancelGuest(sid) {
    const u = me(); if (!u) return null;
    const g = (u.guests || []).find(x => x.sid === sid && x.status === "booked"); if (!g) return null;
    const late = g.start - Date.now() < 12 * 3600e3;
    g.status = late ? "late-cancel" : "cancelled";     // a late cancel uses up the pass
    st.extra[sid] = (st.extra[sid] || 0) - 1;
    promote(sid, late);
    save(); return { late };
  }
  function joinWaitlist(s) { const u = me(); const k = u ? u.email : "guest-" + Date.now(); (st.waitlists[s.id] = st.waitlists[s.id] || []).includes(k) || st.waitlists[s.id].push(k); save(); return st.waitlists[s.id].length; }

  /* milestones: what a regular can earn */
  const MILESTONES = [
    { key: "first", label: "First class", test: s => s.total >= 1 },
    { key: "ten", label: "10 classes", test: s => s.total >= 10 },
    { key: "fifty", label: "50 club", test: s => s.total >= 50 },
    ...(D.classes.some(c => c.heated) ? [{ key: "heat", label: "Felt the heat", test: s => s.heated >= 1 }] : [{ key: "five", label: "5 in a month", test: s => s.month >= 5 }]),
    { key: "explorer", label: "Tried 5 classes", test: s => s.kinds >= 5 },
    { key: "early", label: "Early riser", test: s => s.early >= 1 },
  ];
  function stats(u) {
    const done = (u.bookings || []).filter(b => b.status === "booked");
    const kinds = new Set(done.map(b => b.cls));
    const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
    const s = { total: done.length + (u.history || 0), heated: done.filter(b => (cls(b.cls) || {}).heated).length, kinds: kinds.size, early: done.filter(b => new Date(b.start).getHours() < 7).length, month: done.filter(b => b.start >= m0.getTime()).length };
    const weeks = new Set(done.map(b => { const d = new Date(b.start); const j = new Date(d.getFullYear(), 0, 1); return d.getFullYear() + "-" + Math.ceil(((d - j) / 864e5 + j.getDay() + 1) / 7); }));
    s.weeks = weeks.size;
    s.milestones = MILESTONES.map(m => Object.assign({ got: m.test(s) }, m));
    return s;
  }

  /* calendar file for one class */
  function ics(s) {
    const c = cls(s.cls), f = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const end = new Date(s.start.getTime() + s.mins * 6e4);
    const who = coach(s.coach).name;
    return "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Builds by Walden//Booking concept//EN\r\nBEGIN:VEVENT\r\nUID:" + s.id + "@" + (D.studio.key || "studio") + "\r\nDTSTAMP:" + f(new Date()) + "\r\nDTSTART:" + f(s.start) + "\r\nDTEND:" + f(end) +
      "\r\nSUMMARY:" + c.name + " at " + D.studio.name + "\r\nLOCATION:" + (D.studio.address || "").replace(/,/g, "\\,") + "\r\nDESCRIPTION:" + (who ? "With " + who + ". " : "") + (c.heated ? "Heated class: bring a towel and water. " : "") + "Cancel up to 12 hours before for a credit.\r\nEND:VEVENT\r\nEND:VCALENDAR";
  }

  window.Store = { D, KEY, P, money, st: () => st, save, schedule, cls, coach, price, me, booked, spaces, signUp, signIn, signOut, buy, payOptions, book, cancel, guestPass, bookGuest, cancelGuest, joinWaitlist, stats, MILESTONES, ics, ymd, hm, dayStart, rng, hash };
})();
