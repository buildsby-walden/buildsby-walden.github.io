/* Studio Sculpture concept: the customer site */
(function () {
  const S = window.Store, D = S.D;
  const $ = (q, el = document) => el.querySelector(q), $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (id, cls = "ic") => `<svg class="${cls}"><use href="#${id}"/></svg>`;
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const GROUPS = { all: "All classes", heat: "Infrared heat", strength: "Strength", pilates: "Pilates & mobility", mums: "Mums & babies", online: "Online" };
  const fmtDay = d => LONG[d.getDay()] + " " + d.getDate() + " " + MON[d.getMonth()];
  const toast = msg => { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 3200); };
  let sessions = S.schedule(14);
  const refresh = () => { sessions = S.schedule(14); };

  /* ------------------------------------------------ static sections */
  $("#yr").textContent = new Date().getFullYear();
  $("#hero-reviews").textContent = $("#rev-count").textContent = D.studio.reviews;
  $("#stat-members").textContent = D.studio.members;
  $("#stat-classes").textContent = D.classes.filter(c => c.group !== "online").length;
  $("#maps-link").href = D.studio.maps;
  $(".price-note").textContent = "Sculpture Junior classes are £11. Memberships can be cancelled at any time, with no notice period.";

  const intensity = n => `<span class="intensity" title="Intensity">${[1, 2, 3].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
  const groupBadge = c => c.heated ? `<span class="badge heat">${icon("i-flame")}Infrared</span>` : c.group === "mums" ? `<span class="badge mums">${icon("i-baby")}Mums</span>` : c.group === "online" ? `<span class="badge online">Online</span>` : `<span class="badge">${E(GROUPS[c.group])}</span>`;

  // classes
  let classGroup = "all", showAllClasses = false;
  function renderClasses() {
    $("#class-filters").innerHTML = Object.entries(GROUPS).map(([k, l]) => `<button class="chip ${k === classGroup ? "on" : ""}" data-g="${k}" type="button">${E(l)}</button>`).join("");
    $$("#class-filters .chip").forEach(b => b.onclick = () => { classGroup = b.dataset.g; renderClasses(); });
    const all = D.classes.filter(c => classGroup === "all" || c.group === classGroup || (classGroup === "heat" && c.heated));
    const short = window.innerWidth < 700 && !showAllClasses && all.length > 6;      // a phone shows six, then 'Show all'
    const list = short ? all.slice(0, 6) : all;
    $("#class-grid").innerHTML = list.map(c => `<button class="class-card" data-c="${c.key}" type="button">
      <div class="row" style="justify-content:space-between;align-items:center">${groupBadge(c)}${intensity(c.intensity)}</div>
      <h3>${E(c.name)}</h3><p>${E(c.short)}</p>
      <div class="class-meta"><span>${E(c.tag)}</span><span>60 min</span></div></button>`).join("");
    if (short) $("#class-grid").insertAdjacentHTML("beforeend", `<button class="btn btn-ghost" id="all-classes" type="button" style="width:100%">Show all ${all.length} classes</button>`);
    const ac = $("#all-classes"); if (ac) ac.onclick = () => { showAllClasses = true; renderClasses(); };
    $$("#class-grid .class-card").forEach(b => b.onclick = () => openClass(b.dataset.c));
  }

  // pricing
  function renderPricing() {
    const feat = { platinum: true };
    const lines = {
      six: ["6 classes to use as you like", "£10 a class instead of £12", "Use them on any class"],
      gold: ["12 classes every month", "£8.25 a class", "A free guest pass every month", "Cancel any time, no notice period"],
      platinum: ["Unlimited classes", "Come as often as you like", "A free guest pass every month", "Cancel any time, no notice period"],
    };
    const metal = { gold: "Gold", platinum: "Platinum" };      // the memberships are real metal cards
    $("#price-grid").innerHTML = D.prices.filter(p => p.key === "six" || p.kind === "membership").map(p => metal[p.key] ? `<div class="price metal tier-${p.key}">
      <div class="metal-top"><span class="tier-name">${metal[p.key]}</span><img class="metal-mark" src="img/mark.webp" alt=""></div>
      ${p.badge ? `<span class="badge tag">${E(p.badge)}</span>` : ""}
      <h3>${E(p.name)}</h3><div class="amt">£${p.price}${p.unit ? ` <small>${E(p.unit)}</small>` : ""}</div>
      <ul>${(lines[p.key] || []).map(l => `<li>${E(l)}</li>`).join("")}</ul>
      <button class="btn btn-metal" data-buy="${p.key}" type="button">Join ${metal[p.key]}</button></div>`
      : `<div class="price">
      ${p.badge ? `<span class="badge gold tag">${E(p.badge)}</span>` : ""}
      <h3>${E(p.name)}</h3><div class="amt">£${p.price}${p.unit ? ` <small>${E(p.unit)}</small>` : ""}</div>
      <ul>${(lines[p.key] || []).map(l => `<li>${E(l)}</li>`).join("")}</ul>
      <button class="btn btn-ghost" data-buy="${p.key}" type="button">Buy pass</button></div>`).join("");
    $$("[data-buy]").forEach(b => b.onclick = () => buyFlow(b.dataset.buy));
  }

  // events, team, reviews, faq, hours
  $("#events-grid").innerHTML = D.events.map(e => `<div class="event"><span class="when">${E(e.when)}${e.spaces ? " · " + E(e.spaces) : ""}</span><h3>${E(e.name)}</h3><p>${E(e.text)}</p>
    <button class="btn btn-ghost btn-sm" data-ev="${e.key}" type="button">Register interest</button></div>`).join("");
  $$("[data-ev]").forEach(b => b.onclick = () => { b.textContent = "Interest registered ✓"; b.disabled = true; toast("Thanks! The studio will be in touch about " + D.events.find(e => e.key === b.dataset.ev).name + "."); });
  $("#team-grid").innerHTML = D.team.filter(t => t.img).map(t => `<div class="member"><img src="${t.img}" alt="${E(t.name)}" loading="lazy"><b>${E(t.name)}</b><span>${E(t.role)}</span></div>`).join("");
  $("#reviews-grid").innerHTML = D.reviews.slice(0, 3).map(r => `<article class="review"><span class="stars">★★★★★</span><p>“${E(r.text.length > 330 ? r.text.slice(0, 330).replace(/\s\S*$/, "") + "…" : r.text)}”</p>
    <footer><b>${E(r.name)}</b><span>${E(r.when)} · Google</span></footer></article>`).join("");
  $("#faq").insertAdjacentHTML("beforeend", D.faq.map(([q, a]) => `<details><summary>${E(q)}</summary><p>${E(a)}</p></details>`).join(""));
  const today = new Date().getDay(), order = [1, 2, 3, 4, 5, 6, 0];
  $("#hours").innerHTML = order.map(i => { const h = D.studio.hours.find(x => x.startsWith(LONG[i])) || ""; return `<tr class="${i === today ? "today" : ""}"><td>${LONG[i]}</td><td>${E(h.split(": ")[1] || "Closed")}</td></tr>`; }).join("");

  /* ------------------------------------------------ coming up: the next five classes */
  function renderNext() {
    const now = Date.now(), todayK = S.ymd(new Date()), tmrK = S.ymd(new Date(now + 864e5));
    const up = sessions.filter(s => s.start > now).slice(0, 5);
    $("#next-row").innerHTML = up.map(s => {
      const c = S.cls(s.cls), co = S.coach(s.coach), left = S.spaces(s), k = S.ymd(s.start);
      const when = (k === todayK ? "Today" : k === tmrK ? "Tomorrow" : DAYS[s.start.getDay()] + " " + s.start.getDate()) + " · " + S.hm(s.start);
      return `<button class="next-card ${k === todayK ? "today" : ""}" data-s="${s.id}" type="button">
        <span class="nc-when">${when}</span><b>${E(c.name)}</b>
        <span class="nc-who">${co.img ? `<img src="${co.img}" alt="" loading="lazy">` : ""}${E(co.name.split(" ")[0])} · ${s.mins} min</span>
        <span class="nc-foot"><span class="nc-left ${left ? left <= 2 ? "low" : "" : "full"}">${left ? left + (left === 1 ? " space" : " spaces") + " left" : "Full · waitlist"}</span><span class="nc-go">${left ? "Book" : "Join"} ${icon("i-arrow")}</span></span></button>`;
    }).join("");
    $$("#next-row .next-card").forEach(b => b.onclick = () => openSession(b.dataset.s));
  }

  /* ------------------------------------------------ timetable */
  let ttGroup = "all", ttDay = (sessions.find(s => s.start > Date.now()) ? S.ymd(sessions.find(s => s.start > Date.now()).start) : S.ymd(new Date()));   // the first day with a class still to come
  function renderTimetable() {
    const now = new Date(), days = [];
    for (let i = 0; i < 14; i++) days.push(new Date(S.dayStart(now).getTime() + i * 864e5));
    $("#tt-days").innerHTML = days.map(d => { const k = S.ymd(d); const n = sessions.filter(s => S.ymd(s.start) === k).length;
      return `<button class="tt-day ${k === ttDay ? "on" : ""} ${k === S.ymd(now) ? "today" : ""}" data-d="${k}" type="button"><small>${k === S.ymd(now) ? "Today" : DAYS[d.getDay()]}</small><b>${d.getDate()}</b><small>${n} class${n === 1 ? "" : "es"}</small></button>`; }).join("");
    $$("#tt-days .tt-day").forEach(b => b.onclick = () => { ttDay = b.dataset.d; renderTimetable(); });
    $("#tt-filters").innerHTML = Object.entries(GROUPS).map(([k, l]) => `<button class="chip ${k === ttGroup ? "on" : ""}" data-g="${k}" type="button">${E(l)}</button>`).join("");
    $$("#tt-filters .chip").forEach(b => b.onclick = () => { ttGroup = b.dataset.g; renderTimetable(); });
    const u = S.me(), mine = new Set(u ? u.bookings.filter(b => b.status === "booked").map(b => b.sid) : []);
    const list = sessions.filter(s => S.ymd(s.start) === ttDay).filter(s => { const c = S.cls(s.cls); return ttGroup === "all" || c.group === ttGroup || (ttGroup === "heat" && c.heated); });
    $("#tt-list").innerHTML = list.length ? list.map(s => {
      const c = S.cls(s.cls), co = S.coach(s.coach), left = S.spaces(s), past = s.start < now, fill = Math.round(100 * S.booked(s) / s.cap);
      const btn = past ? `<span class="muted" style="font-size:.85rem">Finished</span>` : mine.has(s.id) ? `<button class="btn btn-ghost btn-sm" data-s="${s.id}" type="button">${icon("i-check")}Booked</button>`
        : left ? `<button class="btn btn-primary btn-sm" data-s="${s.id}" type="button">Book</button>` : `<button class="btn btn-ghost btn-sm" data-s="${s.id}" type="button">Join waitlist</button>`;
      return `<div class="slot ${past ? "past" : ""} ${mine.has(s.id) ? "mine" : ""}">
        <div class="time"><b>${S.hm(s.start)}</b><small>${s.mins} min</small></div>
        <div><div class="row" style="gap:.5rem;align-items:center;margin-bottom:.2rem">${groupBadge(c)}</div><h4>${E(c.name)}</h4>
          <div class="who">${co.img ? `<img src="${co.img}" alt="">` : ""}with ${E(co.name.split(" ")[0])} · ${E(c.tag)}</div></div>
        <div class="right"><div class="spaces ${left && left <= 2 ? "low" : ""}"><b>${left ? left + " of " + s.cap + " spaces" : "Full"}</b><div class="bar"><i style="width:${Math.min(100, fill)}%"></i></div></div>${btn}</div></div>`;
    }).join("") : `<div class="tt-empty">No ${ttGroup === "all" ? "" : GROUPS[ttGroup].toLowerCase() + " "}classes on this day. Try another day.</div>`;
    $$("#tt-list [data-s]").forEach(b => b.onclick = () => openSession(b.dataset.s));
  }

  /* ------------------------------------------------ modal + drawer */
  const scrim = $("#scrim"), modal = $("#modal");
  function openModal(html, dark) { modal.innerHTML = html; modal.classList.toggle("dark", !!dark); modal.classList.add("open"); modal.scrollTop = 0; scrim.classList.add("open"); const x = $(".x", modal); if (x) x.onclick = closeAll; }
  function closeAll() { modal.classList.remove("open"); scrim.classList.remove("open"); }
  scrim.onclick = closeAll;
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeAll(); });
  const xBtn = `<button class="x" type="button" aria-label="Close">${icon("i-x")}</button>`;

  function openClass(key) {
    const c = S.cls(key), next = sessions.filter(s => s.cls === key && s.start > Date.now()).slice(0, 4);
    openModal(`<div class="modal-head">${xBtn}<div class="row" style="gap:.5rem;margin-bottom:.6rem">${groupBadge(c)}${intensity(c.intensity)}</div><h3 style="font-size:1.9rem;font-weight:300">${E(c.name)}</h3><p class="muted" style="margin-top:.2rem">${E(c.tag)} · 60 minutes</p></div>
      <div class="modal-body"><p style="margin-bottom:1rem">${E(c.desc)}</p>${c.heated ? `<p class="note heat" style="margin-bottom:1rem">Performed under infrared heat. Bring a towel and plenty of water.</p>` : ""}
      <p class="h-sub">Next classes</p><div style="display:grid;gap:.5rem">${next.length ? next.map(s => `<div class="list-item"><div><b>${fmtDay(s.start)}, ${S.hm(s.start)}</b><small>with ${E(S.coach(s.coach).name)} · ${S.spaces(s) ? S.spaces(s) + " spaces left" : "full, waitlist open"}</small></div><button class="btn btn-primary btn-sm" data-s="${s.id}" type="button">${S.spaces(s) ? "Book" : "Waitlist"}</button></div>`).join("") : `<p class="muted">Not on the timetable in the next two weeks.</p>`}</div></div>`);
    $$("[data-s]", modal).forEach(b => b.onclick = () => openSession(b.dataset.s));
  }

  modal.addEventListener("click", e => { const a = e.target.closest("[data-about]"); if (a) openClass(a.dataset.about); });
  function openSession(sid) {
    refresh();
    const s = sessions.find(x => x.id === sid); if (!s) return;
    const c = S.cls(s.cls), co = S.coach(s.coach), u = S.me(), left = S.spaces(s);
    const head = `<div class="modal-head">${xBtn}<div class="row" style="gap:.5rem;margin-bottom:.6rem">${groupBadge(c)}</div><h3 style="font-size:1.8rem;font-weight:300">${E(c.name)}</h3>
      <p class="muted">${fmtDay(s.start)} · ${S.hm(s.start)} · ${s.mins} min · with ${E(co.name)}</p>
      <button class="link-btn" data-about="${c.key}" type="button">About this class ${icon("i-arrow")}</button></div>`;
    if (u && u.bookings.some(b => b.sid === sid && b.status === "booked")) {
      const late = s.start - Date.now() < 12 * 3600e3;
      const g = (u.guests || []).find(x => x.sid === sid && x.status === "booked");
      openModal(head + `<div class="modal-body"><p class="note">You're booked in${g ? ` with ${E(g.name)} as your guest` : ""}. ${late ? "It's within 12 hours of the class, so cancelling now won't return a credit." : "Cancel up to 12 hours before and you'll get your credit back."}</p>
        ${guestBtn(u, s)}
        <div class="row" style="margin-top:1rem"><button class="btn btn-ghost" id="ics" type="button">${icon("i-cal")}Add to calendar</button><button class="btn btn-ghost" id="cx" type="button">Cancel booking</button></div></div>`);
      $("#ics").onclick = () => downloadIcs(s);
      wireGuest(s);
      $("#cx").onclick = () => { const r = S.cancel(sid); toast(r.late ? "Cancelled. As it's within 12 hours, no credit is returned." : "Cancelled. Your credit is back in your account."); closeAll(); rerender(); };
      return;
    }
    if (!left) {
      openModal(head + `<div class="modal-body"><p class="note">This class is full. Join the waitlist and you'll be moved in automatically if someone cancels in time.</p><div class="row" style="margin-top:1rem"><button class="btn btn-primary" id="wl" type="button">Join the waitlist</button></div></div>`);
      $("#wl").onclick = () => { const n = S.joinWaitlist(s); openModal(head + `<div class="modal-body success"><div class="tick">${icon("i-check")}</div><h3>You're on the list</h3><p class="muted">You're number ${n}. We'll let you know straight away if a space opens.</p></div>`); };
      return;
    }
    if (!u) return authFlow(() => openSession(sid), `Sign in or create your free account to book. Every £12 class you book earns a stamp on your loyalty card.`);
    const opts = S.payOptions(u); let pick = opts[0].key;
    const draw = () => {
      openModal(head + `<div class="modal-body">
        ${c.heated ? `<p class="note heat">Infrared heat class: bring a towel and plenty of water.</p>` : ""}
        <p class="h-sub" style="margin-top:1rem">How would you like to pay?</p>
        <div class="pay-opts">${opts.map(o => `<button class="pay-opt ${o.key === pick ? "on" : ""}" data-p="${o.key}" type="button"><span class="rad"></span><span><b>${E(o.label)}</b><small>${E(o.sub)}</small></span><span class="price-r">${E(o.price)}</span></button>`).join("")}</div>
        ${u.plan ? "" : `<a class="pkg-link" href="#prices">Coming regularly? Check out our packages ${icon("i-arrow")}</a>`}
        <p class="note">${left <= 2 ? `<b>Only ${left} space${left === 1 ? "" : "s"} left.</b> ` : ""}Cancel up to 12 hours before for a credit. ${pick === "single" || pick === "six" ? "This concept doesn't take a real payment." : ""}</p>
        <div class="row end" style="margin-top:1.2rem"><button class="btn btn-primary" id="confirm" type="button">Confirm booking</button></div></div>`);
      $$(".pay-opt", modal).forEach(b => b.onclick = () => { pick = b.dataset.p; draw(); });
      $("#confirm").onclick = () => {
        const r = S.book(s, pick);
        if (r.error) { toast(r.error === "full" ? "Sorry, that class has just filled up." : "You're already booked in."); return; }
        const me = S.me(), n = S.st().settings.stampsFor, plan = me.plan ? S.price(me.plan.kind) : null;
        const msg = r.stamp === "reward" ? `<b>Card complete!</b> You've earned ${E(S.st().settings.reward)}. It's waiting in your account.`
          : r.stamp ? `Stamp added. <b>${n - me.stamps}</b> more for ${E(S.st().settings.reward)}.`
          : r.paid === "reward" ? `Enjoy your free class, you earned it.`
          : r.paid === "credit" || r.paid === "six" ? `1 class credit used, <b>${me.credits}</b> left.`
          : `Included in your ${E(plan ? plan.name : "membership")}.`;
        openModal(head + `<div class="modal-body success"><div class="tick">${icon("i-check")}</div><h3>You're booked in</h3>
          <p class="muted" style="margin-bottom:1.2rem">See you on the mat!</p>
          ${r.stamp ? `<div class="lcard">${cardInner(me, r.stamp)}</div>` : ""}
          <p style="margin-bottom:1rem">${msg}</p>
          ${guestBtn(me, s)}
          <div class="row" style="justify-content:center"><button class="btn btn-ghost" id="ics" type="button">${icon("i-cal")}Add to calendar</button><button class="btn btn-primary" id="done" type="button">Done</button></div></div>`);
        $("#ics").onclick = () => downloadIcs(s);
        wireGuest(s);
        $("#done").onclick = closeAll;
        rerender();
      };
    };
    draw();
  }

  /* members' guest pass */
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function guestBtn(u, s) {
    if (S.guestPass(u, s.start) !== "ready" || !S.spaces(s)) return "";
    return `<div class="guest-offer"><div><b>Bring a friend free</b><small>Your ${MONTHS[s.start.getMonth()]} guest pass: one free class for a friend each month.</small></div><button class="btn btn-gold btn-sm" id="guest-go" type="button">Add a guest</button></div>`;
  }
  function wireGuest(s) { const b = $("#guest-go"); if (b) b.onclick = () => guestFlow(s); }
  function guestFlow(s) {
    const c = S.cls(s.cls);
    openModal(`<div class="modal-head">${xBtn}<span class="eyebrow">Members' guest pass</span><h3 style="font-size:1.8rem;font-weight:300">Bring a friend free</h3>
      <p class="muted">${E(c.name)}, ${fmtDay(s.start)} at ${S.hm(s.start)}. Uses your ${MONTHS[s.start.getMonth()]} guest pass.</p></div>
      <div class="modal-body"><form id="gf"><label class="field">Your friend's first name<input name="name" required autocomplete="off"></label>
        <label class="field">Their email (optional)<input name="email" type="email" autocomplete="off" placeholder="So the studio can say hello"></label>
        <p class="note">Cancel up to 12 hours before and the pass is yours to use again this month.</p>
        <button class="btn btn-primary" style="width:100%;margin-top:1rem" type="submit">Book them in</button></form></div>`);
    $("#gf").onsubmit = e => {
      e.preventDefault(); const fd = new FormData(e.target), name = fd.get("name");
      const r = S.bookGuest(s, name, fd.get("email"));
      if (r.error) { toast(r.error === "full" ? "Sorry, that class has just filled up." : "You've already used this month's guest pass."); return; }
      openModal(`<div class="modal-head">${xBtn}</div><div class="modal-body success"><div class="tick">${icon("i-check")}</div><h3>${E(name.trim())} is booked in</h3>
        <p class="muted" style="margin-bottom:1.2rem">${E(c.name)}, ${fmtDay(s.start)} at ${S.hm(s.start)}. Your ${MONTHS[s.start.getMonth()]} guest pass is used.</p>
        <div class="row" style="justify-content:center"><button class="btn btn-primary" id="done" type="button">Done</button></div></div>`);
      $("#done").onclick = closeAll; rerender();
    };
  }

  function downloadIcs(s) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([S.ics(s)], { type: "text/calendar" }));
    a.download = S.cls(s.cls).name.replace(/\W+/g, "-") + ".ics"; a.click();
  }

  function authFlow(after, why) {
    let mode = "new";
    const draw = () => {
      openModal(`<div class="modal-head">${xBtn}<img src="img/mark.webp" alt="" style="width:56px;margin-bottom:.8rem"><h3 style="font-size:1.8rem;font-weight:300">${mode === "new" ? "Create your account" : "Welcome back"}</h3><p class="muted">${E(why || "")}</p></div>
        <div class="modal-body"><form id="af">
          ${mode === "new" ? `<label class="field">Your name<input name="name" required autocomplete="name"></label>` : ""}
          <label class="field">Email<input name="email" type="email" required autocomplete="email"></label>
          ${mode === "new" ? `<label class="field">Mobile (for class reminders)<input name="phone" type="tel" autocomplete="tel"></label>` : ""}
          <button class="btn btn-primary" style="width:100%" type="submit">${mode === "new" ? "Create account" : "Sign in"}</button></form>
          <p style="text-align:center;margin-top:1rem;font-size:.9rem" class="muted">${mode === "new" ? "Already have an account?" : "New to Studio Sculpture?"} <a href="#" id="sw">${mode === "new" ? "Sign in" : "Create an account"}</a></p></div>`);
      $("#sw").onclick = e => { e.preventDefault(); mode = mode === "new" ? "old" : "new"; draw(); };
      $("#af").onsubmit = e => {
        e.preventDefault(); const f = new FormData(e.target);
        const u = mode === "new" ? S.signUp(f.get("name"), f.get("email"), f.get("phone")) : S.signIn(f.get("email"));
        if (!u) { toast("We couldn't find that email. Create an account instead?"); return; }
        toast(mode === "new" ? "Welcome, " + u.name.split(" ")[0] + "! Your loyalty card is ready." : "Welcome back, " + u.name.split(" ")[0] + ".");
        rerender(); after ? after() : closeAll();
      };
    };
    draw();
  }

  function buyFlow(kind) {
    const p = S.price(kind);
    if (!S.me()) return authFlow(() => buyFlow(kind), `Create your free account to buy a ${p.name.toLowerCase()}.`);
    openModal(`<div class="modal-head">${xBtn}<h3 style="font-size:1.8rem;font-weight:300">${E(p.name)}</h3><p class="muted">${E(p.note)}</p></div>
      <div class="modal-body"><div class="list-item"><div><b>${E(p.name)}</b><small>${p.kind === "membership" ? "Renews monthly · cancel any time" : p.credits + " class credit" + (p.credits === 1 ? "" : "s")}</small></div><b style="font-family:Jost;font-size:1.4rem">£${p.price}${p.unit ? "<small style='font-size:.8rem;color:var(--muted)'> " + p.unit + "</small>" : ""}</b></div>
      <p class="note" style="margin-top:1rem">In the real site, this is where secure card payment (Stripe) would go. This concept doesn't take payment.</p>
      <div class="row end" style="margin-top:1.2rem"><button class="btn btn-primary" id="bp" type="button">${p.kind === "membership" ? "Start membership" : "Buy pass"}</button></div></div>`);
    $("#bp").onclick = () => { S.buy(kind); toast(p.kind === "membership" ? "Welcome to " + p.name + "!" : "Pass added: " + p.credits + " credits ready to use."); closeAll(); rerender(); go("me"); };
  }

  /* ------------------------------------------------ loyalty card */
  function cardInner(u, newStamp) {
    const n = S.st().settings.stampsFor, have = u ? u.stamps : 6;
    const fresh = newStamp === "reward" ? n : newStamp;
    const shown = newStamp === "reward" ? n : have;
    return `<div class="top"><div><small>Loyalty card</small><b>${u ? E(u.name) : "Your name here"}</b></div><img src="img/mark.webp" alt="" style="width:42px"></div>
      <div class="stamps">${Array.from({ length: n }, (_, i) => `<div class="stamp ${i < shown ? "on" : ""} ${i === n - 1 ? "reward" : ""} ${fresh && i === fresh - 1 ? "new" : ""}"></div>`).join("")}</div>
      <div class="foot"><span>${shown} of ${n} stamps</span><span>${u && u.rewards > u.rewardsUsed ? "★ Free class ready" : "Studio Sculpture"}</span></div>`;
  }
  function memberInner(u) {
    const plan = S.price(u.plan.kind), now = new Date(), pass = S.guestPass(u, now);
    return `<div class="top"><div><small>${E(plan.name)}</small><b>${E(u.name)}</b></div><img src="img/mark.webp" alt="" style="width:42px"></div>
      <div class="perk-big"><small>Guest pass · ${MONTHS[now.getMonth()]}</small><b>${pass === "ready" ? "Ready to use" : "Used this month"}</b></div>
      <div class="foot"><span>${u.plan.kind === "platinum" ? "Unlimited classes" : (12 - (u.plan.used || 0)) + " of 12 classes left"}</span><span>${u.rewards > u.rewardsUsed ? "★ Free class ready" : "Member"}</span></div>`;
  }
  const anyCard = u => u && u.plan ? memberInner(u) : cardInner(u);
  function renderShowcase() {
    const u = S.me(), set = S.st().settings;
    $("#showcase-card").innerHTML = cardInner(u && !u.plan ? u : null);
    $("#loy-reward").textContent = set.stampsFor + " stamps = " + set.reward.replace(/ of your choice$/, "");
    $("#loy-ref").textContent = $("#loy-ref2").textContent = "Share your code and you'll get " + set.referral + ".";
    $("#loy-cta").textContent = u ? "Open my card" : "Create your free account";
    $("#loy-cta").onclick = () => u ? go("me") : authFlow(() => go("me"), "Your loyalty card starts filling with your very first booking.");
  }

  /* ------------------------------------------------ my card (the signed-in customer's page) */
  function openAccount() { S.me() ? go("me") : authFlow(() => go("me"), "Book classes, collect stamps and manage your passes in one place."); }
  function renderMe() {
    const u = S.me(), box = $("#me");
    if (!u) { box.innerHTML = ""; return; }
    const st = S.stats(u), now = Date.now();
    const upcoming = u.bookings.filter(b => b.status === "booked" && b.start > now).concat((u.guests || []).filter(g => g.status === "booked" && g.start > now).map(g => Object.assign({ guest: true }, g))).sort((a, b) => a.start - b.start);
    const plan = u.plan ? S.price(u.plan.kind) : null;
    box.innerHTML = `<div class="me-head"><div><span class="eyebrow">My card</span><h1 class="page-title">Hi, ${E(u.name.split(" ")[0])}</h1><p class="muted">${E(u.email)}</p></div><button class="btn btn-ghost btn-sm" id="signout" type="button">Sign out</button></div>
      <div class="me-grid">
        <div class="me-col">
          <div class="lcard">${anyCard(u)}</div>
          ${u.rewards > u.rewardsUsed ? `<p class="note" style="background:var(--gold-soft);color:var(--gold-deep)"><b>You've earned ${E(S.st().settings.reward)}!</b> Choose “Use your free class” when you book.</p>` : ""}
          ${plan ? `<p class="note">Members don't collect stamps: your membership already gives you the best price per class, plus a free guest pass every month. Choose “Add a guest” when you book.</p>`
            : u.credits ? `<p class="note">Classes booked with your pass don't earn stamps, because you're already paying £10 instead of £12. Stamps are for classes paid at the full £12.</p>` : ""}
          <div class="kpis"><div class="kpi"><b>${st.total}</b><small>Classes</small></div><div class="kpi"><b>${st.weeks}</b><small>Active weeks</small></div>${plan ? `<div class="kpi"><b>${(u.guests || []).filter(g => g.status !== "cancelled").length}</b><small>Friends brought</small></div>` : `<div class="kpi"><b>${u.cards}</b><small>Cards completed</small></div>`}</div>
          <div><p class="h-sub">Your plan</p>
            <div class="list-item"><div><b>${plan ? E(plan.name) : u.credits ? "Class credits" : "Pay as you go"}</b><small>${plan ? (u.plan.kind === "platinum" ? "Unlimited classes" : (12 - (u.plan.used || 0)) + " of 12 classes left this month") : u.credits ? u.credits + " credit" + (u.credits === 1 ? "" : "s") + " to use" : "£12 a class, or save with a package"}</small></div>
            <a class="btn btn-ghost btn-sm" href="#prices/packages">${plan ? "Change plan" : "See packages"}</a></div></div>
        </div>
        <div class="me-col">
          <div><p class="h-sub">Upcoming classes</p><div style="display:grid;gap:.5rem">${upcoming.length ? upcoming.map(b => { const c = S.cls(b.cls), d = new Date(b.start);
            return `<div class="list-item"><div><b>${b.guest ? "Guest: " + E(b.name) : E(c.name)}</b><small>${b.guest ? E(c.name) + " · " : ""}${fmtDay(d)}, ${S.hm(d)} · ${E(S.coach(b.coach).name.split(" ")[0])}</small></div><button class="btn btn-ghost btn-sm" ${b.guest ? "data-gx" : "data-cx"}="${b.sid}" type="button">Cancel</button></div>`; }).join("")
            : `<div class="list-item"><div><b>Nothing booked yet</b><small>Find a time that suits you</small></div><a class="btn btn-primary btn-sm" href="#book">Book a class</a></div>`}</div></div>
          <div><p class="h-sub">Milestones</p><div class="miles">${st.milestones.map(m => `<div class="mile ${m.got ? "got" : ""}"><div class="mi">${m.got ? "★" : "·"}</div>${E(m.label)}</div>`).join("")}</div></div>
          <div><p class="h-sub">Bring a friend</p><div class="list-item"><div><b style="letter-spacing:.08em">${E(u.code)}</b><small>Share your code and you'll get ${E(S.st().settings.referral)}.</small></div><button class="btn btn-ghost btn-sm" id="copy-code" type="button">Copy</button></div></div>
        </div>
      </div>`;
    $("#signout").onclick = () => { S.signOut(); rerender(); go("home"); toast("Signed out"); };
    $("#copy-code").onclick = () => { try { navigator.clipboard.writeText(u.code); } catch (e) {} toast("Code copied: " + u.code); };
    $$("[data-cx]", box).forEach(b => b.onclick = () => { const r = S.cancel(b.dataset.cx); toast(r.late ? "Cancelled within 12 hours: no credit returned." : "Cancelled. Your credit is back."); rerender(); });
    $$("[data-gx]", box).forEach(b => b.onclick = () => { const r = S.cancelGuest(b.dataset.gx); toast(r.late ? "Guest cancelled within 12 hours: this month's pass is used." : "Guest cancelled. Your guest pass is back."); rerender(); });
  }
  $("#acct-btn").onclick = openAccount;

  /* ------------------------------------------------ class finder */
  const Q = [
    { q: "How do you like to move?", a: [["Strong and sweaty", ["burn", "power", "focus-lower"]], ["Strength with control", ["kb-core", "focus-upper", "flex"]], ["Stretch and unwind", ["flex", "yin", "flow"]], ["Gentle, I'm new or recovering", ["pilates-core", "flex", "yin"]]] },
    { q: "How do you feel about heat?", a: [["Bring it on", ["burn", "flex-ir"]], ["I'd rather keep cool", ["power", "flex", "pilates-core"]], ["Not sure yet", []]] },
    { q: "Anything else?", a: [["I'm a new mum", ["mumma", "mumma-flex"]], ["I'd love to work on balance", ["balance", "flow"]], ["I'm an early riser", ["early"]], ["Nothing in particular", []]] },
  ];
  let qi = 0, score = {};
  function openQuiz() {
    qi = 0; score = {};
    openModal(`<div class="modal-head">${xBtn}<span class="eyebrow">Class finder</span><h3 style="font-size:1.8rem;font-weight:300">Find your class in three taps</h3><p class="muted">Tell us how you like to move and we'll suggest the classes that suit you, with the next times they're on.</p></div>
      <div class="modal-body"><div class="quiz" id="quiz"></div></div>`, true);
    renderQuiz();
  }
  $("#quiz-open").onclick = openQuiz;
  function renderQuiz() {
    const box = $("#quiz");
    if (qi < Q.length) {
      box.innerHTML = `<div class="quiz-steps">${Q.map((_, i) => `<i class="${i <= qi ? "on" : ""}"></i>`).join("")}</div><h3>${E(Q[qi].q)}</h3><div class="quiz-opts">${Q[qi].a.map((a, i) => `<button class="quiz-opt" data-i="${i}" type="button">${E(a[0])}</button>`).join("")}</div>`;
      $$(".quiz-opt", box).forEach(b => b.onclick = () => { Q[qi].a[+b.dataset.i][1].forEach((k, j) => score[k] = (score[k] || 0) + (3 - j)); qi++; renderQuiz(); });
      return;
    }
    const early = score.early; delete score.early;
    const top = Object.entries(score).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);
    if (!top.length) top.push("flex", "pilates-core");
    box.innerHTML = `<div class="quiz-result"><h3>Your perfect classes</h3>${top.map(k => { const c = S.cls(k); const nx = sessions.find(s => s.cls === k && s.start > Date.now() && (!early || s.start.getHours() < 8)) || sessions.find(s => s.cls === k && s.start > Date.now());
      return `<div class="match"><img src="img/mark.webp" alt="" style="width:40px"><div><b>${E(c.name)}</b><br><small>${E(c.tag)}${nx ? " · next: " + DAYS[nx.start.getDay()] + " " + S.hm(nx.start) : ""}</small>${nx ? `<div style="margin-top:.6rem"><button class="btn btn-gold btn-sm" data-s="${nx.id}" type="button">Book this one</button></div>` : ""}</div></div>`; }).join("")}
      <button class="quiz-opt" id="redo" type="button" style="margin-top:.4rem">Start again</button></div>`;
    $$("[data-s]", box).forEach(b => b.onclick = () => openSession(b.dataset.s));
    $("#redo").onclick = () => { qi = 0; score = {}; renderQuiz(); };
  }

  /* ------------------------------------------------ header */
  function renderHeader() {
    const u = S.me();
    $("#acct-av").innerHTML = u ? E(u.name.trim()[0].toUpperCase()) : icon("i-user");
    $("#acct-btn").classList.toggle("member", !!(u && u.plan));
    $("#acct-btn").setAttribute("aria-label", u ? "My card" : "Sign in");
    $("#acct-name").innerHTML = u ? `${E(u.name.split(" ")[0])} <span class="stamp-count">${u.plan ? E(S.price(u.plan.kind).name.replace(/ .*/, "")) : u.stamps + "/" + S.st().settings.stampsFor}</span>` : "Sign in";
  }
  /* ------------------------------------------------ tabs along the bottom: visitors see the shop window,
     signed-in customers get their own card, and members lose the tabs they no longer need */
  const PAGES = ["home", "book", "classes", "prices", "studio", "me"];
  const TABS = { home: ["Home", "i-home"], book: ["Book", "i-cal"], classes: ["Classes", "i-spark"], prices: ["Prices", "i-tag"], me: ["My card", "i-card"], studio: ["Studio", "i-pin"] };
  const tabsFor = u => !u ? ["home", "book", "classes", "prices", "studio"] : u.plan ? ["home", "book", "me", "studio"] : ["home", "book", "me", "prices", "studio"];
  let page = "home";
  function renderTabs() {
    const u = S.me(), list = tabsFor(u);
    document.body.classList.toggle("signed-in", !!u);
    $("#tabbar").className = "tabbar n" + list.length;
    $("#tabbar").innerHTML = list.map(k => `<a href="#${k}" data-tab="${k}" class="${k === page ? "on" : ""}">${icon(TABS[k][1])}<span>${TABS[k][0]}</span></a>`).join("");
  }
  function go(p, sub) { const h = p + (sub ? "/" + sub : ""); if (location.hash.slice(1) === h) route(); else location.hash = h; }
  function route() {
    let [want, sub] = (location.hash.slice(1) || "home").split("/");
    if (want === "rewards") want = "prices";                       // old links
    if (want === "me" && !S.me()) { authFlow(() => go("me"), "Book classes, collect stamps and manage your passes in one place."); want = "home"; }
    const p = PAGES.includes(want) ? want : "home";
    page = p;
    $$(".page").forEach(x => x.classList.toggle("on", x.dataset.page === p));
    $$("#tabbar a").forEach(a => a.classList.toggle("on", a.dataset.tab === p));
    if (p === "studio") showSub(sub || "story");
    if (p === "prices") showRw(sub === "packages" ? "package" : "single");
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!(want === "home" && location.hash.startsWith("#me"))) closeAll();
    if (p === "classes" && sub === "finder" || sub === "quiz") { history.replaceState(null, "", "#classes"); openQuiz(); }
  }
  function showSub(k) {
    $$("#subtabs button").forEach(b => { b.classList.toggle("on", b.dataset.sub === k); if (b.dataset.sub === k) b.scrollIntoView({ inline: "nearest", block: "nearest" }); });
    $$("#page-studio .sub").forEach(x => x.classList.toggle("on", x.dataset.sub === k));
  }
  $$("#subtabs button").forEach(b => b.onclick = () => { history.replaceState(null, "", "#studio/" + b.dataset.sub); showSub(b.dataset.sub); });
  // rewards: single class / package tabs
  function showRw(k) { $$("#rw-tabs button").forEach(b => b.classList.toggle("on", b.dataset.rw === k)); $$("#page-prices .rw").forEach(x => x.classList.toggle("on", x.dataset.rw === k)); }
  $$("#rw-tabs button").forEach(b => b.onclick = () => showRw(b.dataset.rw));
  window.addEventListener("hashchange", route);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  function renderWelcome(u) {
    if (!u) { $("#welcome").innerHTML = ""; return; }
    const now = new Date(), h = now.getHours(), todayK = S.ymd(now), tmrK = S.ymd(new Date(now.getTime() + 864e5));
    const nx = u.bookings.filter(b => b.status === "booked" && b.start > now.getTime()).sort((a, b) => a.start - b.start)[0];
    let next = `<span class="eyebrow">Your next class</span><b>Nothing booked yet</b><span class="muted">Find a time that suits you this week.</span><div class="row"><a class="btn btn-primary btn-sm" href="#book">Book a class</a></div>`;
    if (nx) {
      const d = new Date(nx.start), k = S.ymd(d), c = S.cls(nx.cls), co = S.coach(nx.coach);
      next = `<span class="eyebrow">Your next class</span><b>${E(c.name)}</b>
        <span class="wc-when">${k === todayK ? "Today" : k === tmrK ? "Tomorrow" : fmtDay(d)} at ${S.hm(d)}</span>
        <span class="nc-who">${co.img ? `<img src="${co.img}" alt="">` : ""}with ${E(co.name.split(" ")[0])} · ${c.heated ? "infrared heat, bring a towel" : "60 min"}</span>
        <div class="row"><button class="btn btn-primary btn-sm" data-s="${nx.sid}" type="button">View booking</button><button class="btn btn-ghost btn-sm" id="wc-ics" type="button">${icon("i-cal")}Add to calendar</button></div>`;
    }
    $("#welcome").innerHTML = `<div class="welcome-head"><span class="eyebrow">${LONG[now.getDay()]} ${now.getDate()} ${MON[now.getMonth()]}</span><h1>Good ${h < 12 ? "morning" : h < 18 ? "afternoon" : "evening"}, ${E(u.name.split(" ")[0])}</h1></div>
      <div class="welcome-grid"><div class="wc-next">${next}</div><a class="lcard wc-card" href="#me" aria-label="Open my card">${anyCard(u)}</a></div>`;
    $$("#welcome [data-s]").forEach(b => b.onclick = () => openSession(b.dataset.s));
    const ics = $("#wc-ics"); if (ics) ics.onclick = () => { refresh(); const s = sessions.find(x => x.id === nx.sid); if (s) downloadIcs(s); };
  }
  function renderHome() {
    const u = S.me(), n = S.st().settings.stampsFor, r = D.reviews[2] || D.reviews[0];
    renderWelcome(u);
    const pass = S.guestPass(u, new Date());
    $("#home-card-title").textContent = pass ? "Bring a friend free every month" : "Collect stamps, get a free class";
    $("#home-card-eyebrow").textContent = pass ? "Members' perk" : "Loyalty card";
    $("#home-card-txt").innerHTML = (pass ? (pass === "ready" ? "Guest pass ready " : "Used this month ") : u ? `${u.stamps} of ${n} stamps ` : `${n} stamps = a free class `) + `<svg class="ic"><use href="#i-arrow"/></svg>`;
    $("#home-review").innerHTML = `<div class="score"><b>5.0</b><span class="stars">★★★★★</span><small>${D.studio.reviews} Google reviews</small></div>
      <div><p>“${E(r.text.length > 210 ? r.text.slice(0, 210).replace(/\s\S*$/, "") + "…" : r.text)}”</p><small class="muted">${E(r.name)}, on Google · </small><a href="#studio/reviews">Read more reviews</a></div>`;
  }
  function rerender() { refresh(); renderHeader(); renderTabs(); renderNext(); renderTimetable(); renderShowcase(); renderHome(); renderMe(); }
  window.addEventListener("ss-change", () => { renderHeader(); renderTabs(); renderShowcase(); renderHome(); renderMe(); });
  renderClasses(); renderPricing(); rerender(); route();
  setInterval(() => { refresh(); renderNext(); }, 60000);
  window.__ss = true;      // tells the loader in index.html that everything ran
})();
