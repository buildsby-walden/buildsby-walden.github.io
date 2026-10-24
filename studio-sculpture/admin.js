/* Studio Sculpture concept: the owner's dashboard. Example history is generated from the studio's real weekly
   timetable, class sizes and how full each class type really is; real bookings made on the concept site are added on top. */
(function () {
  const S = window.Store, D = S.D;
  const $ = (q, el = document) => el.querySelector(q), $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const money = n => "£" + Math.round(n).toLocaleString("en-GB");
  const pct = n => Math.round(n * 100) + "%";
  const toast = m => { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 3000); };
  const DAY = 864e5, now = new Date(), today0 = S.dayStart(now).getTime();
  const ago = t => { const d = Math.floor((today0 - S.dayStart(new Date(t)).getTime()) / DAY); return d <= 0 ? "Today" : d === 1 ? "Yesterday" : d + " days ago"; };

  /* ------------------------------------------------ PIN */
  const gate = $("#gate"), inputs = $$(".pin input");
  inputs.forEach((inp, i) => {
    inp.addEventListener("input", () => { inp.value = inp.value.replace(/\D/g, ""); if (inp.value && inputs[i + 1]) inputs[i + 1].focus(); if (inputs.every(x => x.value)) check(); });
    inp.addEventListener("keydown", e => { if (e.key === "Backspace" && !inp.value && inputs[i - 1]) inputs[i - 1].focus(); });
  });
  function check() {
    if (inputs.map(x => x.value).join("") === S.st().settings.pin) { sessionStorage.setItem("ss-owner", "1"); open(); }
    else { inputs.forEach(x => x.value = ""); inputs[0].focus(); $(".gate-card").animate([{ transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "none" }], { duration: 250 }); }
  }
  $("#gate-form").onsubmit = e => { e.preventDefault(); check(); };
  $("#lock").onclick = e => { e.preventDefault(); sessionStorage.removeItem("ss-owner"); location.reload(); };

  /* ------------------------------------------------ example history */
  const FIRST = ["Amy", "Becky", "Chloe", "Danielle", "Emma", "Faye", "Gemma", "Hannah", "Isla", "Jess", "Kate", "Laura", "Megan", "Nicola", "Olivia", "Paige", "Rachel", "Sophie", "Tara", "Vicky", "Zoe", "Abbie", "Bethany", "Claire", "Debbie", "Ellie", "Fiona", "Georgia", "Helen", "Jade", "Kirsty", "Lisa", "Maria", "Natalie", "Philippa", "Rosie", "Sam", "Tina", "Wendy", "Alison", "Carly", "Donna", "Holly", "Jo", "Kelly", "Leanne", "Mel", "Nadia", "Sarah", "Steph", "Tom", "James", "Mark", "Dan"];
  const LAST = "ABCDEFGHJKLMNPRSTW";
  const r = S.rng(4253);
  const pick = a => a[Math.floor(r() * a.length)];
  const START = today0 - 180 * DAY;
  const members = [];
  const plans = [["platinum", 30, 2.4, 4], ["gold", 44, 2, 3], ["six", 38, .8, 1.5], ["drop", 40, .25, .8]];
  plans.forEach(([plan, n, lo, hi]) => { for (let i = 0; i < n; i++) {
    const joined = r() < .2 ? today0 - Math.floor(r() * 85) * DAY : START - Math.floor(r() * 420) * DAY;
    const lapsed = r() < (plan === "drop" ? .25 : .07) ? today0 - (15 + Math.floor(r() * 30)) * DAY : null;   // stopped coming at some point
    const early = r() < .25, evening = r() < .4;
    members.push({ id: "m" + members.length, name: pick(FIRST) + " " + pick(LAST.split("")) + ".", plan, rate: lo + r() * (hi - lo), joined, lapsed, early, evening, visits: [] });
  } });
  // popularity of each class type: how full it really is on their timetable
  const real = {};
  D.sessions.forEach(s => { const o = real[s.cls] = real[s.cls] || { b: 0, c: 0 }; o.b += Math.min(s.booked, s.cap); o.c += s.cap; });
  const fillOf = k => real[k] && real[k].c ? Math.max(.4, Math.min(1, real[k].b / real[k].c + .1)) : .6;
  const hist = S.schedule(194, new Date(START)).filter(s => s.start.getTime() < today0 + DAY);    // 180 days back, up to today
  hist.forEach(s => {
    const t = s.start.getTime(); if (t > now.getTime()) return;
    const trend = .9 + .1 * ((t - START) / (today0 - START));         // a little busier lately
    let target = Math.round(s.cap * Math.min(1, fillOf(s.cls) * trend + (r() - .45) * .2));
    target = Math.max(1, Math.min(s.cap, target));
    const pool = members.filter(m => m.joined <= t && (!m.lapsed || m.lapsed > t));
    const hour = s.start.getHours();
    const w = pool.map(m => m.rate * (hour < 8 ? (m.early ? 2.5 : .4) : hour >= 17 ? (m.evening ? 1.8 : .7) : 1) * (s.cls.startsWith("mumma") ? .3 : 1));
    const chosen = new Set();
    for (let k = 0; k < target && chosen.size < pool.length; k++) {
      let tot = w.reduce((a, b, i) => a + (chosen.has(i) ? 0 : b), 0), x = r() * tot;
      for (let i = 0; i < pool.length; i++) { if (chosen.has(i)) continue; x -= w[i]; if (x <= 0) { chosen.add(i); break; } }
    }
    s.att = [...chosen].map(i => pool[i]);
    s.status = s.att.map(() => { const q = r(); return q < .03 ? "late" : q < .055 ? "noshow" : "came"; });
    s.wait = s.att.length >= s.cap ? Math.floor(r() * 4) : 0;
    s.att.forEach((m, i) => s.status[i] === "came" && m.visits.push(t));
  });
  // a few pass and drop-in purchases a week (for revenue), memberships billed monthly
  const sales = [];
  for (let t = START; t <= today0; t += DAY) {
    const day = new Date(t);
    members.forEach(m => {
      if (m.joined > t || (m.lapsed && m.lapsed < t)) return;
      if ((m.plan === "platinum" || m.plan === "gold") && new Date(m.joined).getDate() === day.getDate()) sales.push({ t, kind: m.plan, amt: m.plan === "platinum" ? 120 : 99, who: m.name });
    });
    if (r() < .9) for (let k = 0, n = Math.floor(r() * 3); k < n; k++) sales.push({ t: t + r() * DAY, kind: "six", amt: 60, who: pick(members).name });
  }
  hist.forEach(s => s.att && s.att.forEach((m, i) => { if (m.plan === "drop" && s.status[i] !== "noshow") sales.push({ t: s.start.getTime(), kind: "single", amt: 12, who: m.name }); }));
  sales.sort((a, b) => a.t - b.t);
  // real demo customers and their bookings from the concept site
  function realUsers() { return Object.values(S.st().users || {}); }

  /* ------------------------------------------------ metrics for a period */
  function metrics(days, offset = 0) {
    const to = now.getTime() - offset * days * DAY, from = to - days * DAY;
    const ss = hist.filter(s => s.att && s.start.getTime() > from && s.start.getTime() <= to);
    const books = ss.reduce((a, s) => a + s.att.length, 0) + realUsers().reduce((a, u) => a + u.bookings.filter(b => b.at > from && b.at <= to).length, 0);
    const came = ss.reduce((a, s) => a + s.status.filter(x => x === "came").length, 0);
    const cap = ss.reduce((a, s) => a + s.cap, 0);
    const rev = sales.filter(x => x.t > from && x.t <= to).reduce((a, x) => a + x.amt, 0) + realUsers().reduce((a, u) => a + (u.purchases || []).filter(p => p.at > from && p.at <= to).reduce((b, p) => b + p.amount, 0), 0);
    const active = members.filter(m => m.visits.some(v => v > from && v <= to)).length + realUsers().filter(u => u.bookings.some(b => b.at > from && b.at <= to)).length;
    const fresh = members.filter(m => m.joined > from && m.joined <= to).length + realUsers().filter(u => u.created > from && u.created <= to).length;
    const prevFrom = from - days * DAY;
    const before = members.filter(m => m.visits.some(v => v > prevFrom && v <= from));
    const kept = before.filter(m => m.visits.some(v => v > from && v <= to)).length;
    const late = ss.reduce((a, s) => a + s.status.filter(x => x !== "came").length, 0);
    const wait = ss.reduce((a, s) => a + s.wait, 0);
    return { ss, books, came, cap, fill: cap ? (books - realUsers().reduce((a, u) => a + u.bookings.filter(b => b.at > from && b.at <= to).length, 0)) / cap : 0, rev, active, fresh, retention: before.length ? kept / before.length : 0, late, wait, from, to };
  }

  let period = 30;
  function open() { gate.hidden = true; gate.style.display = "none"; $("#shell").hidden = false; route(); }
  $$("#period button").forEach(b => b.onclick = () => { period = +b.dataset.d; $$("#period button").forEach(x => x.classList.toggle("on", x === b)); render(); });
  $$(".side a[data-p]").forEach(a => a.onclick = e => { e.preventDefault(); location.hash = a.dataset.p; });
  window.addEventListener("hashchange", route);
  function route() {
    const p = (location.hash || "#dash").slice(1);
    $$(".page").forEach(x => x.classList.toggle("on", x.id === "p-" + p));
    $$(".side a[data-p]").forEach(a => a.classList.toggle("on", a.dataset.p === p));
    const h = now.getHours();
    $("#page-title").textContent = { dash: (h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening") + ", Fran", classes: "Classes & register", members: "Members", loyalty: "Loyalty" }[p] || "Dashboard";
    $("#period").style.visibility = p === "classes" ? "hidden" : "visible";
    render();
  }
  $("#today-lbl").textContent = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()] + " " + now.getDate() + " " + MON[now.getMonth()];

  function render() {
    const p = (location.hash || "#dash").slice(1);
    if (p === "classes") return renderClasses();
    if (p === "members") return renderMembers();
    if (p === "loyalty") return renderLoyalty();
    renderDash();
  }

  /* ------------------------------------------------ dashboard */
  function kpi(label, val, cur, prev, fmt, invert) {
    const d = prev ? (cur - prev) / prev : 0, up = invert ? d < 0 : d >= 0;
    const flat = Math.round(d * 100) === 0;
    return `<div class="card kpi2"><small>${label}</small><b>${val}</b><span class="delta ${flat ? "" : up ? "up" : "down"}" style="${flat ? "color:var(--muted)" : ""}">${flat ? "→ no change" : (d >= 0 ? "▲ " : "▼ ") + Math.abs(Math.round(d * 100)) + "%"}</span> <span class="muted" style="font-size:.78rem">vs previous ${period} days</span></div>`;
  }
  function renderDash() {
    const m = metrics(period), pm = metrics(period, 1);
    $("#kpis").innerHTML = [
      kpi("Revenue", money(m.rev), m.rev, pm.rev),
      kpi("Bookings", m.books.toLocaleString("en-GB"), m.books, pm.books),
      kpi("Average class fill", pct(m.fill), m.fill, pm.fill),
      kpi("Active members", m.active, m.active, pm.active),
      kpi("New members", m.fresh, m.fresh, pm.fresh),
      kpi("Retention", pct(m.retention), m.retention, pm.retention),
      kpi("Late cancels & no-shows", m.late, m.late, pm.late, null, true),
      kpi("Waitlist requests", m.wait, m.wait, pm.wait),
    ].join("");
    revenueChart(); mixChart(); heatmap(m); popularity(m); todayList(); risk(); feed(); coaches(m);
  }

  function revenueChart() {
    const weeks = Math.min(13, Math.max(4, Math.round(period / 7) + 1)), W = 640, H = 230, pad = 34, bw = (W - pad * 2) / weeks;
    const data = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const to = now.getTime() - i * 7 * DAY, from = to - 7 * DAY, sl = sales.filter(x => x.t > from && x.t <= to);
      const extra = realUsers().reduce((a, u) => a + (u.purchases || []).filter(p => p.at > from && p.at <= to).reduce((b, p) => b + p.amount, 0), 0);
      data.push({ lbl: new Date(to).getDate() + " " + MON[new Date(to).getMonth()], mem: sl.filter(x => x.kind === "gold" || x.kind === "platinum").reduce((a, x) => a + x.amt, 0), pass: sl.filter(x => x.kind === "six").reduce((a, x) => a + x.amt, 0) + extra, drop: sl.filter(x => x.kind === "single").reduce((a, x) => a + x.amt, 0) });
    }
    const max = Math.max(...data.map(d => d.mem + d.pass + d.drop)) * 1.1 || 1;
    const y = v => H - pad - (v / max) * (H - pad * 2);
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weekly revenue">`;
    for (let g = 0; g <= 3; g++) { const v = max * g / 3; svg += `<line x1="${pad}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(255,255,255,.08)"/><text x="${pad - 6}" y="${y(v) + 4}" font-size="10" fill="#8f8b84" text-anchor="end">£${Math.round(v / 100) / 10}k</text>`; }
    data.forEach((d, i) => {
      const x = pad + i * bw + bw * .18, w = bw * .64; let base = 0;
      [["mem", "#f5f5f5"], ["pass", "#00c0b0"], ["drop", "#dca35a"]].forEach(([k, c]) => { const v = d[k]; if (!v) return; svg += `<rect x="${x}" y="${y(base + v)}" width="${w}" height="${y(base) - y(base + v)}" rx="3" fill="${c}"><title>${d.lbl}: ${money(v)}</title></rect>`; base += v; });
      if (weeks <= 8 || i % 2 === 0) svg += `<text x="${x + w / 2}" y="${H - 12}" font-size="10" fill="#8f8b84" text-anchor="middle">${d.lbl}</text>`;
    });
    $("#rev-chart").innerHTML = svg + "</svg>";
  }
  function mixChart() {
    const act = members.filter(m => !m.lapsed);
    const parts = [["Platinum", act.filter(m => m.plan === "platinum").length, "#f5f5f5"], ["Gold", act.filter(m => m.plan === "gold").length, "#dca35a"], ["Class passes", act.filter(m => m.plan === "six").length, "#00c0b0"], ["Drop-ins", act.filter(m => m.plan === "drop").length, "#5f5b55"]];
    const tot = parts.reduce((a, p) => a + p[1], 0); let a0 = -Math.PI / 2, svg = `<svg viewBox="0 0 220 220" style="max-width:200px;margin:0 auto">`;
    parts.forEach(([l, v, c]) => { const a1 = a0 + 2 * Math.PI * v / tot, big = a1 - a0 > Math.PI ? 1 : 0, R = 90, rr = 58, cx = 110, cy = 110;
      const p = (a, rad) => (cx + rad * Math.cos(a)).toFixed(1) + " " + (cy + rad * Math.sin(a)).toFixed(1);
      svg += `<path d="M${p(a0, R)} A${R} ${R} 0 ${big} 1 ${p(a1, R)} L${p(a1, rr)} A${rr} ${rr} 0 ${big} 0 ${p(a0, rr)}Z" fill="${c}"><title>${l}: ${v}</title></path>`; a0 = a1; });
    const mrr = parts[0][1] * 120 + parts[1][1] * 99;
    svg += `<text x="110" y="106" text-anchor="middle" font-family="Jost" font-size="26" fill="#f5f5f5">${money(mrr)}</text><text x="110" y="126" text-anchor="middle" font-size="10" fill="#8f8b84">memberships a month</text></svg>`;
    $("#mix").innerHTML = svg + `<div class="bars" style="margin-top:1rem">${parts.map(([l, v, c]) => `<div class="barrow" style="grid-template-columns:1fr auto"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${c};margin-right:.4rem"></i>${l}</span><b>${v}</b></div>`).join("")}</div>`;
  }
  function heatmap(m) {
    const bands = [["6am", h => h < 8], ["9am", h => h >= 8 && h < 11], ["Midday", h => h >= 11 && h < 15], ["5pm", h => h >= 15 && h < 18.5], ["7pm", h => h >= 18.5]];
    const order = [1, 2, 3, 4, 5, 6, 0];
    let html = `<div class="heat"><span></span>${order.map(d => `<span class="h">${DAYS[d]}</span>`).join("")}`;
    bands.forEach(([lbl, test]) => {
      html += `<span class="r">${lbl}</span>`;
      order.forEach(d => {
        const ss = m.ss.filter(s => s.start.getDay() === d && test(s.start.getHours() + s.start.getMinutes() / 60));
        if (!ss.length) { html += `<span class="c" style="background:transparent;border:1px dashed var(--line)"></span>`; return; }
        const f = ss.reduce((a, s) => a + s.att.length / s.cap, 0) / ss.length;
        const bg = `rgba(0,192,176,${(.12 + f * .88).toFixed(2)})`;
        html += `<span class="c" style="background:${bg};color:${f > .55 ? "#010101" : "var(--teal-deep)"}" title="${DAYS[d]} ${lbl}: ${pct(f)} full">${pct(f)}</span>`;
      });
    });
    $("#heat").innerHTML = html + "</div>";
  }
  function popularity(m) {
    const by = {};
    m.ss.forEach(s => { const o = by[s.cls] = by[s.cls] || { f: 0, n: 0, full: 0 }; o.f += s.att.length / s.cap; o.n++; if (s.att.length >= s.cap) o.full++; });
    const rows = Object.entries(by).map(([k, o]) => ({ k, f: o.f / o.n, full: o.full / o.n })).sort((a, b) => b.f - a.f).slice(0, 8);
    $("#pop").innerHTML = rows.map(x => `<div class="barrow"><span title="${E(S.cls(x.k).name)}">${E(S.cls(x.k).name.replace("Sculpture ", ""))}</span><span class="t"><i style="width:${Math.round(x.f * 100)}%"></i></span><b>${pct(x.f)}</b></div>`).join("") +
      `<p class="muted" style="font-size:.8rem;margin-top:.4rem">${E(S.cls(rows[0].k).name)} is full ${pct(rows[0].full)} of the time: worth adding another one?</p>`;
  }
  function attendeesFor(s) {
    // example names for the places already taken, plus real customers who booked on the concept site
    const rr = S.rng(S.hash(s.id)), names = [];
    const seen = new Set();
    for (let tries = 0; names.length < s.baseBooked && tries < 500; tries++) { const n = members[Math.floor(rr() * members.length)].name; if (!seen.has(n)) { seen.add(n); names.push(n); } }
    realUsers().forEach(u => u.bookings.forEach(b => { if (b.sid === s.id && b.status === "booked") names.push(u.name + " ★"); }));
    realUsers().forEach(u => (u.guests || []).forEach(g => { if (g.sid === s.id && g.status === "booked") names.push(g.name + " (guest of " + u.name.split(" ")[0] + ") ★"); }));
    return [...new Set(names)];
  }
  function todayList() {
    const ss = S.schedule(2).filter(s => S.ymd(s.start) === S.ymd(now));
    $("#today-sub").textContent = ss.length ? ss.length + " classes · " + ss.reduce((a, s) => a + S.booked(s), 0) + " people booked" : "No classes today";
    $("#today-list").innerHTML = ss.length ? ss.map(s => { const f = Math.min(1, S.booked(s) / s.cap); const past = s.start < now;
      return `<div class="cls-row"><b>${S.hm(s.start)}</b><div><div style="font-weight:600;color:var(--ink)">${E(S.cls(s.cls).name)}</div><small class="muted">${E(S.coach(s.coach).name)} · ${S.booked(s)}/${s.cap}${past ? " · finished" : ""}</small></div>${ring(f)}</div>`; }).join("") : `<p class="muted">Enjoy the day off.</p>`;
  }
  const ring = f => { const C = 2 * Math.PI * 18; return `<svg class="fillring" viewBox="0 0 46 46"><circle cx="23" cy="23" r="18" fill="none" stroke="var(--sand)" stroke-width="5"/><circle cx="23" cy="23" r="18" fill="none" stroke="${f >= 1 ? "#dca35a" : "#00c0b0"}" stroke-width="5" stroke-dasharray="${C * f} ${C}" transform="rotate(-90 23 23)" stroke-linecap="round"/><text x="23" y="27" text-anchor="middle" font-size="11" font-weight="600" fill="#f5f5f5">${Math.round(f * 100)}</text></svg>`; };
  function risk() {
    const nudged = S.st().nudges || [];
    const list = members.filter(m => (m.plan === "platinum" || m.plan === "gold" || m.rate > 1.4) && m.visits.length > 6)
      .map(m => ({ m, last: Math.max(...m.visits) })).filter(x => today0 - x.last > 14 * DAY).sort((a, b) => b.last - a.last).slice(0, 4);
    $("#risk").innerHTML = list.length ? list.map(({ m, last }) => `<div class="list-item" style="margin-bottom:.5rem"><div><b>${E(m.name)}</b><small>${m.plan === "platinum" ? "Platinum" : m.plan === "gold" ? "Gold" : "Pass"} · last class ${ago(last)}</small></div>
      <button class="btn btn-ghost btn-sm" data-nudge="${m.id}" ${nudged.includes(m.id) ? "disabled" : ""} type="button">${nudged.includes(m.id) ? "Sent ✓" : "Send a nudge"}</button></div>`).join("") : `<p class="muted">Everyone's been in recently.</p>`;
    $$("[data-nudge]").forEach(b => b.onclick = () => { const st = S.st(); (st.nudges = st.nudges || []).push(b.dataset.nudge); S.save(); b.textContent = "Sent ✓"; b.disabled = true; toast("Sent: “We've missed you! Your next class is waiting.” (In the real version this goes by text or email.)"); });
  }
  function feed() {
    const items = [];
    realUsers().forEach(u => { items.push({ t: u.created, txt: `<b>${E(u.name)}</b> created an account`, real: 1 });
      u.bookings.forEach(b => items.push({ t: b.at, txt: `<b>${E(u.name)}</b> ${b.status === "booked" ? "booked" : "cancelled"} ${E(S.cls(b.cls).name)}`, real: 1 }));
      (u.purchases || []).forEach(p => items.push({ t: p.at, txt: `<b>${E(u.name)}</b> bought ${E(S.price(p.kind).name)}`, real: 1 })); });
    sales.filter(x => x.t <= now.getTime()).slice(-12).forEach(x => items.push({ t: x.t, txt: `<b>${E(x.who)}</b> ${x.kind === "single" ? "dropped in" : x.kind === "six" ? "bought a 6 Class Pass" : "renewed " + (x.kind === "platinum" ? "Platinum" : "Gold")}` }));
    items.sort((a, b) => b.t - a.t);
    $("#feed").innerHTML = items.slice(0, 8).map(i => `<div><span class="dot" style="${i.real ? "" : "background:var(--stone)"}"></span><span>${i.txt}</span><small>${ago(i.t)}</small></div>`).join("");
  }
  function coaches(m) {
    const by = {};
    m.ss.forEach(s => { const o = by[s.coach] = by[s.coach] || { n: 0, f: 0, people: 0 }; o.n++; o.f += s.att.length / s.cap; o.people += s.att.length; });
    const rows = Object.entries(by).sort((a, b) => b[1].n - a[1].n);
    $("#coaches").innerHTML = `<tr><th>Instructor</th><th>Classes</th><th class="hide-sm">People taught</th><th>Average fill</th></tr>` +
      rows.map(([k, o]) => { const c = S.coach(k); return `<tr><td><span style="display:inline-flex;align-items:center;gap:.6rem">${c.img ? `<img src="${c.img}" alt="" style="width:30px;height:30px;border-radius:50%;object-fit:cover">` : ""}<span class="nm">${E(c.name)}</span></span></td><td>${o.n}</td><td class="hide-sm">${o.people}</td><td>${pct(o.f / o.n)}</td></tr>`; }).join("");
  }

  /* ------------------------------------------------ classes & register */
  let clsDay = S.ymd(now);
  function renderClasses() {
    const days = []; for (let i = 0; i < 7; i++) days.push(new Date(today0 + i * DAY));
    $("#cls-day").innerHTML = days.map(d => `<button data-d="${S.ymd(d)}" class="${S.ymd(d) === clsDay ? "on" : ""}" type="button">${S.ymd(d) === S.ymd(now) ? "Today" : DAYS[d.getDay()] + " " + d.getDate()}</button>`).join("");
    $$("#cls-day button").forEach(b => b.onclick = () => { clsDay = b.dataset.d; renderClasses(); });
    const ss = S.schedule(8).filter(s => S.ymd(s.start) === clsDay);
    $("#cls-list").innerHTML = ss.length ? ss.map(s => { const f = Math.min(1, S.booked(s) / s.cap), wl = (S.st().waitlists[s.id] || []).length;
      return `<div class="cls-row" style="cursor:pointer" data-s="${s.id}"><b>${S.hm(s.start)}</b><div><div style="font-weight:600;color:var(--ink)">${E(S.cls(s.cls).name)}</div><small class="muted">${E(S.coach(s.coach).name)} · ${S.booked(s)} of ${s.cap} booked${wl ? " · " + wl + " on the waitlist" : ""}</small></div>${ring(f)}</div>`; }).join("") : `<p class="muted">No classes on this day.</p>`;
    $$("#cls-list [data-s]").forEach(el => el.onclick = () => register(ss.find(s => s.id === el.dataset.s)));
  }
  function register(s) {
    const names = attendeesFor(s), key = "reg-" + s.id;
    let marked = {}; try { marked = JSON.parse(sessionStorage.getItem(key)) || {}; } catch (e) {}
    const modal = $("#modal"), scrim = $("#scrim");
    const draw = () => {
      modal.innerHTML = `<div class="modal-head"><button class="x" type="button" aria-label="Close"><svg class="ic"><use href="#i-x"/></svg></button><h3 style="font-size:1.6rem;font-weight:300">${E(S.cls(s.cls).name)}</h3><p class="muted">${DAYS[s.start.getDay()]} ${s.start.getDate()} ${MON[s.start.getMonth()]} · ${S.hm(s.start)} · ${E(S.coach(s.coach).name)} · ${names.length}/${s.cap}</p></div>
        <div class="modal-body"><p class="muted" style="font-size:.85rem;margin-bottom:.6rem">Tap a name to mark them in. ★ booked on the website.</p><div style="display:grid;gap:.4rem">${names.map(n => `<button class="list-item" data-n="${E(n)}" type="button" style="cursor:pointer;width:100%;text-align:left"><span><b>${E(n)}</b></span><span class="pill ${marked[n] ? "pass" : ""}">${marked[n] ? "✓ Here" : "Not in yet"}</span></button>`).join("") || `<p class="muted">Nobody booked yet.</p>`}</div>
        <p class="muted" style="font-size:.85rem;margin-top:1rem">${Object.values(marked).filter(Boolean).length} of ${names.length} checked in</p></div>`;
      $(".x", modal).onclick = close;
      $$("[data-n]", modal).forEach(b => b.onclick = () => { marked[b.dataset.n] = !marked[b.dataset.n]; sessionStorage.setItem(key, JSON.stringify(marked)); draw(); });
    };
    const close = () => { modal.classList.remove("open"); scrim.classList.remove("open"); };
    scrim.onclick = close; draw(); modal.classList.add("open"); scrim.classList.add("open");
  }

  /* ------------------------------------------------ members */
  function renderMembers() {
    const m = metrics(period), q = ($("#mem-q").value || "").toLowerCase();
    const realRows = realUsers().map(u => ({ name: u.name, plan: u.plan ? u.plan.kind : u.credits ? "six" : "drop", n: u.bookings.filter(b => b.status === "booked").length, last: Math.max(0, ...u.bookings.map(b => b.at)), joined: u.created, stamps: u.plan ? "Member" : u.stamps, real: 1 }));
    const rows = realRows.concat(members.map(x => { const n = x.visits.filter(v => v > m.from).length; return { name: x.name, plan: x.plan, n, last: x.visits.length ? Math.max(...x.visits) : 0, joined: x.joined, stamps: PAYG(x) ? x.visits.length % S.st().settings.stampsFor : MEMBER(x) ? "Member" : "On a pass", lapsed: x.lapsed }; }))
      .filter(x => !q || x.name.toLowerCase().includes(q)).sort((a, b) => (b.real || 0) - (a.real || 0) || b.n - a.n);
    $("#mem-sub").textContent = rows.length + " members · " + m.active + " came in the last " + period + " days";
    const P = { platinum: ["Platinum", "plat"], gold: ["Gold", "gold"], six: ["6 Class Pass", "pass"], drop: ["Pay as you go", ""] };
    $("#mem-table").innerHTML = `<tr><th>Member</th><th>Plan</th><th>Classes (${period}d)</th><th class="hide-sm">Last class</th><th class="hide-sm">Loyalty</th><th class="hide-sm">Joined</th></tr>` +
      rows.slice(0, 80).map(x => `<tr><td class="nm">${E(x.name)} ${x.real ? '<span class="pill new">Website</span>' : ""}</td><td><span class="pill ${P[x.plan][1]}">${P[x.plan][0]}</span></td><td>${x.n}</td><td class="hide-sm">${x.last ? ago(x.last) : "-"}</td><td class="hide-sm">${typeof x.stamps === "string" ? '<span class="muted">' + x.stamps + "</span>" : x.stamps + "/" + S.st().settings.stampsFor}</td><td class="hide-sm">${MON[new Date(x.joined).getMonth()]} ${new Date(x.joined).getFullYear()}</td></tr>`).join("");
    $("#mem-q").oninput = renderMembers;
  }

  /* ------------------------------------------------ loyalty */
  const PAYG = x => x.plan === "drop", MEMBER = x => x.plan === "gold" || x.plan === "platinum";
  /* guest passes → new members: a guest counts as joined once they buy a pass or membership themselves */
  function guestConversion(m, months) {
    const out = { guests: 0, joined: 0, payg: 0, by: { six: 0, gold: 0, platinum: 0 } };
    // example history: the same guests as "Guest passes used", each with a fixed chance of joining
    members.filter(MEMBER).forEach(x => { const r = S.rng(S.hash(x.name + "guest")); for (let i = 0; i < months; i++) if (r() < .3) {
      out.guests++; const j = S.rng(S.hash(x.name + "joined" + i))();
      if (j < .27) { out.joined++; out.by[j < .12 ? "six" : j < .22 ? "gold" : "platinum"]++; } else if (j < .42) out.payg++; } });
    // real guests booked on the concept site, matched to a later account by their email
    realUsers().forEach(u => (u.guests || []).filter(g => g.at > m.from && g.status !== "cancelled").forEach(g => {
      out.guests++;
      const them = g.email && S.st().users[g.email]; if (!them) return;
      const bought = (them.purchases || []).find(p => p.at > g.at && p.kind !== "single");
      if (bought) { out.joined++; out.by[bought.kind]++; } else if ((them.bookings || []).some(b => b.at > g.at)) out.payg++;
    }));
    const pct = out.guests ? Math.round(out.joined / out.guests * 100) : 0, max = Math.max(1, ...Object.values(out.by), out.payg);
    const bar = (label, n) => `<div class="bar"><span>${label}</span><i><b style="width:${n / max * 100}%"></b></i><span>${n}</span></div>`;
    $("#guest-conv").innerHTML = `<div><small class="muted" style="text-transform:uppercase;letter-spacing:.08em;font-weight:600;font-size:.78rem">Guest passes → new members</small>
        <div class="big">${pct}%</div><span class="muted" style="font-size:.85rem">${out.joined} of ${out.guests} guests went on to join · last ${period} days</span></div>
      <div class="bars">${bar("6 Class Pass", out.by.six)}${bar("Gold", out.by.gold)}${bar("Platinum", out.by.platinum)}${bar("Came back pay as you go", out.payg)}</div>`;
  }
  function renderLoyalty() {
    const m = metrics(period), set = S.st().settings;
    // stamps are pay-as-you-go only; members get a monthly guest pass instead
    const stamps = members.filter(PAYG).reduce((a, x) => a + x.visits.filter(v => v > m.from).length, 0) + realUsers().reduce((a, u) => a + u.bookings.filter(b => b.at > m.from && b.stamped).length, 0);
    const cards = Math.floor(stamps / set.stampsFor);
    const ready = members.filter(x => PAYG(x) && x.visits.length && x.visits.length % set.stampsFor === 0).length + realUsers().filter(u => u.rewards > u.rewardsUsed).length;
    const months = Math.max(1, Math.round(period / 30));
    const guests = members.filter(MEMBER).reduce((a, x) => { const r = S.rng(S.hash(x.name + "guest")); let n = 0; for (let i = 0; i < months; i++) if (r() < .3) n++; return a + n; }, 0)
      + realUsers().reduce((a, u) => a + (u.guests || []).filter(g => g.at > m.from && g.status !== "cancelled").length, 0);
    guestConversion(m, months);
    $("#loy-kpis").innerHTML = [["Stamps given", stamps], ["Cards completed", cards], ["Free classes waiting", ready], ["Guest passes used", guests]].map(([l, v]) => `<div class="card kpi2"><small>${l}</small><b>${v}</b><span class="muted" style="font-size:.78rem">last ${period} days</span></div>`).join("");
    const f = $("#loy-form"); f.stampsFor.value = set.stampsFor; f.reward.value = set.reward; f.referral.value = set.referral;
    f.onsubmit = e => { e.preventDefault(); Object.assign(S.st().settings, { stampsFor: +f.stampsFor.value, reward: f.reward.value.trim() || set.reward, referral: f.referral.value.trim() || set.referral }); S.save(); toast("Saved. Your website now shows the new loyalty card."); renderLoyalty(); };
    const top = members.map(x => ({ x, n: x.visits.filter(v => v > m.from).length })).sort((a, b) => b.n - a.n).slice(0, 8);
    $("#top-members").innerHTML = `<tr><th>Member</th><th>Classes</th><th>Plan</th></tr>` + top.map(({ x, n }, i) => `<tr><td class="nm">${i < 3 ? ["🥇", "🥈", "🥉"][i] + " " : ""}${E(x.name)}</td><td>${n}</td><td>${{ platinum: "Platinum", gold: "Gold", six: "6 Class Pass", drop: "Pay as you go" }[x.plan]}</td></tr>`).join("");
  }

  window.addEventListener("ss-change", () => { if (!$("#shell").hidden) render(); });
  if (sessionStorage.getItem("ss-owner") === "1") open(); else inputs[0].focus();     // last: everything above is ready
})();
