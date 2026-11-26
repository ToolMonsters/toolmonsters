(() => {
  // TMRace: the last ~30 days of a connector and its competitors as a chart that draws itself.
// One line per connector, its logo in a round head at the tip. Inlined into /vs by build_rank.py at /*__RACE__*/.
// Y is the number of places gained or lost in Claude's overall ranking since the first day, so every line starts on the
// same level and the picture shows who climbed and who fell. The scale is a square root (labelled grid lines), because
// one connector moving 200 places would otherwise flatten everyone else.
const TMRace = (root, o) => {
  const H = o.hist, N = H.days.length, last = N - 1, DAY = o.dayMs || 250;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const uid = 'rc' + Math.random().toString(36).slice(2, 7);
  // A brand-new listing debuts far down the ranking for one snapshot, then lands where its score puts it
  // (FullEnrich: #1179 on day one, #397 the next day). That first point is skipped so the jump is not drawn.
  const first = t => { const r = H.r[t.s], i = r.findIndex(v => v > 0); return i >= 0 && r[i + 1] > 0 && Math.abs(r[i] - r[i + 1]) > 150 ? i + 1 : i; };
  const tools = o.tools.filter(t => H.r[t.s] && first(t) >= 0 && first(t) < last);
  const me = tools.find(t => t.s === o.me);
  const gain = (t, d) => H.r[t.s][first(t)] - H.r[t.s][d];
  const order = d => tools.filter(t => d >= first(t) && H.p[t.s][d] > 0).sort((a, b) => H.p[b.s][d] - H.p[a.s][d]);

  // o.big: the homepage hero (larger heads and type). o.controls === false: no buttons, the page drives it.
  const W = Math.max(320, Math.round(root.clientWidth || 620)), narrow = W < 520, HT = narrow ? 380 : o.big ? 460 : 440;
  const m = { l: 46, r: narrow ? 62 : o.big ? 172 : 158, t: 30, b: 30 };
  const T0 = Date.parse(H.iso[0]), T1 = Date.parse(H.iso[last]);
  const X = d => m.l + (Date.parse(H.iso[d]) - T0) / (T1 - T0 || 1) * (W - m.l - m.r);
  // One connector that leaps far beyond everyone else (a relisting, a score reset) would flatten the other lines:
  // its line is then held at the edge of the chart, and its label still gives the real number.
  const peak = t => Math.max(...H.r[t.s].map((_, d) => d >= first(t) ? Math.abs(gain(t, d)) : 0));
  const peaks = tools.map(peak).sort((a, b) => b - a), CAP = peaks.length > 2 && peaks[0] > 150 && peaks[0] > 2.5 * peaks[1] ? Math.round(peaks[1] * 1.4) : Infinity;
  const shown = (t, d) => Math.max(-CAP, Math.min(CAP, gain(t, d)));
  let vmax = 6, vmin = -6;
  tools.forEach(t => { for (let d = first(t); d <= last; d++) { const g = shown(t, d); if (g > vmax) vmax = g; if (g < vmin) vmin = g; } });
  const f = v => Math.sign(v) * Math.sqrt(Math.abs(v)), f0 = f(vmin * 1.08), f1 = f(vmax * 1.08);
  const Y = v => m.t + (f1 - f(v)) / (f1 - f0) * (HT - m.t - m.b);
  const pts = Object.fromEntries(tools.map(t => [t.s, H.r[t.s].map((_, d) => d >= first(t) ? [X(d), Y(shown(t, d))] : null)]));

  if (!document.getElementById('tm-race-css')) document.head.insertAdjacentHTML('beforeend', `<style id="tm-race-css">
.rc { --rc-dim: var(--ink-2, #5F5E59); --rc-soft: var(--ink-3, #7F7D76); --rc-line: var(--line, rgba(29,29,28,.13)); }
.rc-top { display: flex; align-items: center; gap: 14px; padding: 0 2px 6px; }
.rc-date { font: 500 clamp(20px, 2.2vw, 28px)/1 var(--f-mono, monospace); letter-spacing: .02em; text-transform: uppercase; min-width: 4.4em; font-variant-numeric: tabular-nums; }
.rc-prog { flex: 1; height: 3px; background: var(--rc-line); position: relative; }
.rc-prog i { position: absolute; inset: 0 auto 0 0; width: 100%; background: #F2551D; }
.rc-btn { border: 1px solid var(--ink, #1D1D1C); background: none; color: var(--ink, #1D1D1C); padding: 9px 12px; font: 500 11.5px/1 var(--f-mono, monospace); letter-spacing: .06em; text-transform: uppercase; cursor: pointer; white-space: nowrap; }
.rc-btn:hover { background: var(--ink, #1D1D1C); color: var(--paper, #F1F0EE); }
.rc-play { background: #F2551D; }
.rc-svg { display: block; width: 100%; height: auto; overflow: visible; }
.rc-svg text { font: 400 11px/1 var(--f-mono, monospace); fill: var(--rc-soft); letter-spacing: .04em; }
.rc-grid line { stroke: var(--rc-line); stroke-width: 1; }
.rc-grid line.zero { stroke: var(--rc-soft); stroke-dasharray: 3 4; }
.rc-ln { fill: none; stroke: #BDB9B0; stroke-width: 1.8; stroke-linejoin: round; stroke-linecap: round; }
.rc-ln.me { stroke: #F2551D; stroke-width: 3.2; }
.rc-head .ring { fill: none; stroke: #BDB9B0; stroke-width: 1.5; }
.rc-head.me .ring { stroke: #F2551D; stroke-width: 3; }
.rc-head .bg { fill: #fff; }
.rc-head text { font: 600 12px/1 var(--f-mono, monospace); fill: #5F5E59; text-anchor: middle; }
.rc-head { cursor: pointer; }
.rc-lab text { font-size: 12px; }
.rc-lab .d { font-weight: 500; }
.rc-lab .up { fill: #2F9E5A; } .rc-lab .dn { fill: #C8452B; }
.rc-lab .nm { fill: var(--ink, #1D1D1C); font-family: var(--f-display, sans-serif); font-size: 13.5px; letter-spacing: -.01em; font-weight: 500; }
.rc-lab.me .nm { fill: #F2551D; }
.rc-lab line { stroke: var(--rc-line); }
.rc-live { font-size: 12px !important; font-weight: 500 !important; fill: #F2551D !important; }
.rc-legend { display: none; flex-wrap: wrap; gap: 6px 12px; margin-top: 4px; font-size: 13px; }
.rc-legend span { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.rc-legend img, .rc-legend i { width: 16px; height: 16px; border-radius: 50%; background: #fff; object-fit: contain; font-style: normal; }
.rc-legend .me { color: #F2551D; font-weight: 500; }
.rc-ev { margin-top: 10px; min-height: 1.5em; font: 400 11.5px/1.5 var(--f-mono, monospace); letter-spacing: .05em; text-transform: uppercase; color: var(--rc-dim); }
.rc-ev b { color: #F2551D; font-weight: 500; }
.rc-big .rc-lab text { font-size: 13.5px; } .rc-big .rc-lab .nm { font-size: 15.5px; } .rc-big .rc-live { font-size: 14px !important; }
.rc-big .rc-ln { stroke-width: 2; } .rc-big .rc-ln.me { stroke-width: 4; }
@media (max-width: 640px) { .rc-legend { display: flex; } }
</style>`);

  // grid: a few labelled levels that fit the range, never closer than 24px
  const ticks = [0];
  [10, 25, 50, 100, 250, 500, 1000].forEach(v => { if (v <= vmax) ticks.push(v); if (-v >= vmin) ticks.push(-v); });
  const kept = [];
  ticks.sort((a, b) => Math.abs(a) - Math.abs(b)).forEach(v => { if (kept.every(k => Math.abs(Y(k) - Y(v)) > 24)) kept.push(v); });
  const grid = kept.map(v => `<line class="${v ? '' : 'zero'}" x1="${m.l}" x2="${W - m.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text x="${m.l - 8}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${v > 0 ? '▲' + v : v < 0 ? '▼' + -v : '0'}</text>`).join('');
  const mid = Math.round(last / 2);
  const axis = [[0, 'start'], [mid, 'middle'], [last, 'end']].map(([d, a]) => `<text x="${X(d).toFixed(1)}" y="${HT - 8}" text-anchor="${a}">${esc(H.days[d])}</text>`).join('');

  // final label positions: next to each head, pushed apart so they never overlap
  const R = t => (t === me ? 17 : 13) + (o.big && !narrow ? 4 : 0), drawn = [...tools.filter(t => t !== me), ...(me ? [me] : [])];
  const labs = tools.map(t => ({ t, y0: pts[t.s][last][1], y: pts[t.s][last][1] })).sort((a, b) => a.y - b.y);
  const GAP = o.big && !narrow ? 33 : 25;
  for (let k = 0; k < 40; k++) labs.forEach((l, i) => { if (i && l.y - labs[i - 1].y < GAP) { const push = (GAP - (l.y - labs[i - 1].y)) / 2; labs[i - 1].y -= push; l.y += push; } });
  labs.forEach(l => l.y = Math.min(HT - m.b, Math.max(m.t, l.y)));

  root.innerHTML = `<div class="rc${o.big ? ' rc-big' : ''}">
    <div class="rc-top"><span class="rc-date"></span><span class="rc-prog"><i></i></span>${o.controls === false ? '' : '<button class="rc-btn rc-play" type="button"></button>'}${o.onBack ? '<button class="rc-btn rc-back" type="button">table</button>' : ''}</div>
    <svg class="rc-svg" viewBox="0 0 ${W} ${HT}" role="img" aria-label="Places gained or lost in Claude's ranking over the last ${N} days">
      <text x="${m.l}" y="12">${narrow ? 'places gained or lost' : "places gained or lost in claude's ranking"} since ${esc(H.days[0])}</text>
      <g class="rc-grid">${grid}${axis}</g>
      <g>${drawn.map(t => `<path class="rc-ln${t === me ? ' me' : ''}" data-s="${esc(t.s)}"/>`).join('')}</g>
      <g>${drawn.map((t, i) => { const r = R(t); return `<a href="${esc(o.href ? o.href(t.s) : '#')}"><g class="rc-head${t === me ? ' me' : ''}" data-s="${esc(t.s)}"><title>${esc(t.n)}</title>
        <clipPath id="${uid}${i}"><circle r="${r - 1.5}"/></clipPath><circle class="bg" r="${r}"/><text y="4">${esc((t.n || '?')[0])}</text>
        ${t.i ? `<circle class="bg" r="${r - 1.5}"/><image href="${esc(t.i)}" x="${-(r - 1.5)}" y="${-(r - 1.5)}" width="${(r - 1.5) * 2}" height="${(r - 1.5) * 2}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${uid}${i})"/>` : ''}<circle class="ring" r="${r}"/></g></a>`; }).join('')}</g>
      <text class="rc-live" text-anchor="middle"></text>
      <g>${labs.map(l => { const g = gain(l.t, last), x = X(last) + R(l.t) + 8; return `<g class="rc-lab${l.t === me ? ' me' : ''}">
        <text x="${x}" y="${(l.y + 4).toFixed(1)}"><tspan class="d ${g > 0 ? 'up' : g < 0 ? 'dn' : ''}">${g > 0 ? '▲' + g : g < 0 ? '▼' + -g : '='}</tspan>${narrow ? '' : `<tspan class="nm" dx="7">${esc(l.t.n.length > 16 ? l.t.n.slice(0, 15) + '…' : l.t.n)}</tspan>`}</text></g>`; }).join('')}</g>
    </svg>
    <div class="rc-legend">${[...tools].sort((a, b) => gain(b, last) - gain(a, last)).map(t => `<span class="${t === me ? 'me' : ''}">${t.i ? `<img src="${esc(t.i)}" alt="">` : '<i></i>'}${esc(t.n)}</span>`).join('')}</div>
    <div class="rc-ev"></div></div>`;
  const q = s => root.querySelector(s), dateEl = q('.rc-date'), prog = q('.rc-prog i'), btn = q('.rc-play'), ev = q('.rc-ev');
  root.querySelectorAll('image').forEach(im => im.addEventListener('error', () => { const bg = im.previousElementSibling; im.remove(); if (bg) bg.remove(); }));
  const lineOf = {}, headOf = {};
  root.querySelectorAll('.rc-ln').forEach(el => lineOf[el.dataset.s] = el);
  root.querySelectorAll('.rc-head').forEach(el => headOf[el.dataset.s] = el);
  const labEls = [...root.querySelectorAll('.rc-lab')], live = q('.rc-live'), restY = Object.fromEntries(labs.map(l => [l.t.s, l.y]));
  const showLabs = on => labEls.forEach(l => l.style.display = on ? '' : 'none');

  // tau is a position in days, fractional between two real days: the head glides, the line grows behind it
  const draw = (tau, atRest) => {
    const i = Math.min(last, Math.floor(tau)), fr = Math.min(1, tau - i);
    tools.forEach(t => {
      const p = pts[t.s], f0 = first(t), head = headOf[t.s], line = lineOf[t.s];
      if (tau < f0) { head.style.display = 'none'; line.setAttribute('d', ''); return; }
      const a = p[i], b = p[Math.min(last, i + 1)] || a, hx = a[0] + (b[0] - a[0]) * fr, hy = atRest ? restY[t.s] : a[1] + (b[1] - a[1]) * fr;
      line.setAttribute('d', 'M' + p.slice(f0, i + 1).map(v => v[0].toFixed(1) + ' ' + v[1].toFixed(1)).join('L') + `L${hx.toFixed(1)} ${hy.toFixed(1)}`);
      head.style.display = ''; head.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)})`);
    });
    // while it plays, "me" carries its running score: places gained or lost so far
    if (me && !atRest && tau >= first(me)) { const g = gain(me, Math.min(last, Math.round(tau))), h = headOf[me.s].getAttribute('transform').match(/[-\d.]+/g); live.textContent = g > 0 ? '▲' + g : g < 0 ? '▼' + -g : ''; live.setAttribute('x', h[0]); live.setAttribute('y', +h[1] - R(me) - 7); }
    else live.textContent = '';
    if (me && o.onTick) o.onTick(tau >= first(me) ? gain(me, Math.min(last, Math.round(tau))) : 0);
    dateEl.textContent = H.days[Math.min(last, Math.round(tau))];
    prog.style.width = (last ? Math.min(1, tau / last) * 100 : 100) + '%';
  };

  // what happened on a given day, the most telling first: a pass that involves "me", any pass, a newcomer
  const story = d => {
    const a = order(d - 1), b = order(d), both = b.filter(t => a.includes(t)), passes = [];
    both.forEach((t, i) => both.slice(i + 1).forEach(u => { if (a.indexOf(t) > a.indexOf(u)) passes.push([t, u]); }));
    const p = passes.find(x => x[0] === me || x[1] === me) || passes[0], joined = b.find(t => !a.includes(t));
    if (p) return `<b>${esc(H.days[d])}</b> · ${esc(p[0].n)} passes ${esc(p[1].n)} in popularity`;
    if (joined) return `<b>${esc(H.days[d])}</b> · ${esc(joined.n)} joins Claude's directory`;
    return '';
  };
  const summary = () => {
    if (!me) return '';
    const f0 = first(me), g = gain(me, last);
    return `${esc(H.days[f0])} → ${esc(H.days[last])} · ${esc(me.n)} <b>#${H.r[me.s][f0]} → #${H.r[me.s][last]}</b> overall${g ? ` (${g > 0 ? '▲' : '▼'}${Math.abs(g)})` : ''}`;
  };

  let raf = 0, guard = 0, playing = false;
  const rest = () => { playing = false; cancelAnimationFrame(raf); clearTimeout(guard); draw(last, true); showLabs(true); if (btn) btn.textContent = `▶ replay ${N} days`; ev.innerHTML = summary(); };
  const finish = () => { rest(); if (o.onEnd) o.onEnd(); };   // reached the end by itself (a manual stop does not count)
  const play = () => {
    cancelAnimationFrame(raf); clearTimeout(guard);
    playing = true; if (btn) btn.textContent = '■ stop'; ev.innerHTML = ''; showLabs(false);
    const t0 = performance.now() + 350; let seen = 0;
    draw(0);
    const tick = now => {
      if (!playing) return;
      const tau = Math.max(0, (now - t0) / DAY);
      if (tau >= last) { finish(); return; }
      draw(tau);
      for (let d = seen + 1; d <= Math.floor(tau); d++) { const s = story(d); if (s) ev.innerHTML = s; seen = d; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    guard = setTimeout(finish, 350 + last * DAY + 1500);   // a throttled tab still ends on the finished chart
  };
  if (btn) btn.addEventListener('click', () => playing ? rest() : play());
  if (o.onBack) q('.rc-back').addEventListener('click', () => { playing = false; cancelAnimationFrame(raf); clearTimeout(guard); o.onBack(); });
  rest();
  return { play, stop: rest };
};

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const logo = (t, cls = 'lg') => t && t.i ? `<img class="${cls}" src="${esc(t.i)}" alt="" onerror="this.outerHTML='<i class=&quot;${cls}&quot;>${esc((t.n || '?')[0])}</i>'">` : `<i class="${cls}">${esc(((t && t.n) || '?')[0])}</i>`;

  // the voxel monster, same renderer as the site
  const HEAD = ['XX.......XX', 'XXX.....XXX', 'XXXXXXXXXXX', 'XXXXXXXXXXX', 'XXOOXXXOOXX', 'XXOOXXXOOXX', 'XXXXXXXXXXX', 'XXXXXXXXXXX', '.XXXXXXXXX.'];
  const MAT = { X: ['#F2551D', '#FF8B4E', '#B9390B'], O: ['#1D1D1C', '#4E4C48', '#0A0A09'] };
  const voxel = (rows, depth) => {
    const H = rows.length, cubes = new Set(), list = [];
    rows.forEach((row, r) => [...row].forEach((v, x) => { if (v === '.') return; for (let z = 1 - depth; z < 1; z++) { cubes.add(`${x},${H - 1 - r},${z}`); list.push({ x, y: H - 1 - r, z, v }); } }));
    const has = (x, y, z) => cubes.has(`${x},${y},${z}`), P = (x, y, z) => [x * .94 + z * .46, x * .16 - z * .34 - y];
    list.sort((a, b) => b.z - a.z || a.x - b.x || a.y - b.y);
    let out = '', x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    const poly = (pts, f) => { const p = pts.map(q => P(...q)); p.forEach(([a, b]) => { x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); }); out += `<polygon points="${p.map(q => q[0].toFixed(3) + ',' + q[1].toFixed(3)).join(' ')}" fill="${f}" stroke="${f}" stroke-width=".02"/>`; };
    list.forEach(({ x, y, z, v }) => { const [fr, tp, sd] = MAT[v];
      if (!has(x, y + 1, z)) poly([[x, y + 1, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]], tp);
      if (!has(x + 1, y, z)) poly([[x + 1, y, z], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x + 1, y + 1, z]], sd);
      if (!has(x, y, z - 1)) poly([[x, y, z], [x + 1, y, z], [x + 1, y + 1, z], [x, y + 1, z]], fr); });
    return `<svg viewBox="${(x0 - .2).toFixed(2)} ${(y0 - .2).toFixed(2)} ${(x1 - x0 + .4).toFixed(2)} ${(y1 - y0 + .4).toFixed(2)}" width="100%" height="100%" aria-hidden="true">${out}</svg>`;
  };
  document.querySelectorAll('[data-vx]').forEach(el => el.innerHTML = voxel(HEAD, 3));

  // ---------- data: ranks.json (rank, score, 7-day move) + competitors.json (who competes with whom) ----------
  const DATA = window.__RANK_DATA ? Promise.resolve(window.__RANK_DATA)
    : Promise.all(['/ranks.json', '/competitors.json'].map(u => fetch(u).then(r => r.json()))).then(([r, c]) => ({ ranks: r, comp: c })).catch(() => null);
  const AUTO_REPLAY = new URLSearchParams(location.search).has('replay');   // read now: the address is cleaned up once the board shows
  let D = null, bySlug = {};
  const getHist = (() => { let p = null; return () => p || (p = window.__HIST ? Promise.resolve(window.__HIST) : fetch('/history.json').then(r => r.json()).catch(() => null)); })();
  DATA.then(d => {
    if (!d) return;
    D = d; d.ranks.tools.forEach(t => bySlug[t.s] = t);
    $('hdTotal').textContent = fmt(d.ranks.total);
    $('ft').textContent = `data: claude's public connector directory · updated ${d.ranks.updated}`;
    const tries = ['apollo', 'exa', 'granola', 'vanta', 'hubspot'].map(s => bySlug[s] || d.ranks.tools.find(t => t.s.startsWith(s))).filter(Boolean).slice(0, 4);
    $('try').insertAdjacentHTML('beforeend', tries.map(t => `<button type="button" data-s="${esc(t.s)}">${logo(t, '')}${esc(t.n)}</button>`).join(''));
    const s0 = new URLSearchParams(location.search).get('t') || document.documentElement.dataset.slug;
    if (s0 && bySlug[s0]) { $('q').value = bySlug[s0].n; show(bySlug[s0], null, true); return; }
    const up = d.ranks.tools.filter(t => t.w && t.r <= 200 && t.w > t.r).sort((a, b) => (b.w - b.r) - (a.w - a.r)).slice(0, 8);
    $('mvList').innerHTML = up.map(t => `<button type="button" class="mv-row" data-s="${esc(t.s)}"><span class="up">▲${t.w - t.r}</span>${logo(t)}<span class="nm">${esc(t.n)}</span><small>#${t.w} → <b data-from="${t.w}" data-to="${t.r}">#${reduce ? t.r : t.w}</b></small></button>`).join('');
    $('mvUpd').textContent = `top 200 · updated ${d.ranks.updated}`;
    $('movers').hidden = !up.length;
    // each rank ticks from last week's to today's: the board shows the move, not only its result
    if (!reduce) [...$('mvList').querySelectorAll('b[data-to]')].forEach((b, i) => {
      const from = +b.dataset.from, to = +b.dataset.to, t0 = performance.now() + 350 + i * 90, ms = 900;
      const tick = now => { const p = Math.min(1, Math.max(0, (now - t0) / ms)), e = 1 - Math.pow(1 - p, 3); b.textContent = '#' + Math.round(from + (to - from) * e); if (p < 1) requestAnimationFrame(tick); else b.dataset.done = 1; };
      requestAnimationFrame(tick);
      setTimeout(() => b.textContent = '#' + to, 350 + i * 90 + ms + 400);   // same guarantee when the tab is throttled
    });
  });
  $('mvList').addEventListener('click', e => { const b = e.target.closest('button[data-s]'); if (b && bySlug[b.dataset.s]) { $('q').value = bySlug[b.dataset.s].n; pick(bySlug[b.dataset.s]); } });
  $('try').addEventListener('click', e => { const b = e.target.closest('button[data-s]'); if (b && bySlug[b.dataset.s]) { $('q').value = bySlug[b.dataset.s].n; pick(bySlug[b.dataset.s]); } });

  // Direct competitors: the hand-picked list, plus tools in the same space that list this one as theirs, max 8
  const rivals = t => {
    const own = (D.comp[t.s] && D.comp[t.s].c) || [];
    const sp = D.comp[t.s] && D.comp[t.s].s, back = Object.keys(D.comp).filter(s => s !== t.s && D.comp[s].s === sp && (D.comp[s].c || []).includes(t.s));
    return [...new Set([...own, ...back])].map(s => bySlug[s]).filter(Boolean).slice(0, 8);
  };
  // On the live site every connector has its own page (/vs/<slug>/, with its own share preview); elsewhere ?t=
  const PRETTY = /(^|\.)toolmonsters\.com$/.test(location.hostname);
  const urlFor = s => PRETTY ? '/vs/' + encodeURIComponent(s) + '/' : '?t=' + encodeURIComponent(s);
  const spaceOf = t => (D.comp[t.s] && D.comp[t.s].s) || t.c || 'your space';

  // ---------- search ----------
  const q = $('q'), sug = $('sug');
  let hits = [], cur = -1;
  const find = k => {
    k = norm(k); if (!k || !D) return [];
    const a = [], b = [];
    D.ranks.tools.forEach(t => { const n = norm(t.n); if (n.startsWith(k) || t.s.startsWith(k)) a.push(t); else if (n.includes(k) || norm(t.a).startsWith(k)) b.push(t); });
    return a.concat(b).slice(0, 6);
  };
  const drawSug = () => {
    if (!hits.length) { sug.hidden = true; return; }
    sug.innerHTML = hits.map((t, i) => `<button type="button" data-i="${i}" class="${i === cur ? 'on' : ''}">${logo(t)}<span>${esc(t.n)}</span><small>#${t.r}</small></button>`).join('');
    sug.hidden = false;
  };
  q.addEventListener('input', () => { hits = find(q.value); cur = -1; drawSug(); });
  q.addEventListener('keydown', e => {
    if (!hits.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); cur = (cur + (e.key === 'ArrowDown' ? 1 : hits.length - 1)) % hits.length; drawSug(); }
    else if (e.key === 'Escape') { hits = []; drawSug(); }
  });
  q.addEventListener('blur', () => setTimeout(() => { hits = []; drawSug(); }, 120));
  sug.addEventListener('mousedown', e => { const b = e.target.closest('button'); if (b) { e.preventDefault(); q.value = hits[+b.dataset.i].n; pick(hits[+b.dataset.i]); } });
  $('sf').addEventListener('submit', async e => {
    e.preventDefault();
    const v = q.value.trim(); if (!v) { q.focus(); return; }
    if (!D) await DATA;
    if (!D) return;
    const exact = D.ranks.tools.find(t => norm(t.n) === norm(v) || t.s === norm(v));
    pick(cur >= 0 ? hits[cur] : exact || find(v)[0], v);
  });

  // A short "checking" beat: results that show their work read as more credible
  const res = $('res');
  let timer = null;
  const pick = (t, typed) => {
    hits = []; drawSug(); q.blur();
    res.hidden = false; $('movers').hidden = true;
    res.innerHTML = `<div class="checking mono">checking <b>${fmt(D.ranks.total)}</b> connectors · finding your competitors…</div>`;
    res.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    clearTimeout(timer); timer = setTimeout(() => show(t, typed), reduce ? 0 : 750);
  };

  const track = (name, props) => { try { if (window.umami) umami.track(name, props); } catch (e) { /* analytics must never break the page */ } };

  const ctaHTML = (title, cap, btn, tool) => `<div class="cta" id="cta"><h3>${title}</h3><p class="cap">${cap}</p>
    <form id="ctaF"><input type="email" name="email" placeholder="Work email" required autocomplete="email" aria-label="Work email"><input type="hidden" name="tool" value="${esc(tool)}"><button type="submit">${btn} →</button></form><div class="msg" id="ctaM"></div></div>`;
  const wireCta = () => {
    const f = $('ctaF'); if (!f) return;
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const b = f.querySelector('button'); b.disabled = true; $('ctaM').textContent = 'sending…';
      try {
        const r = await fetch('https://formsubmit.co/ajax/hello@toolmonsters.com', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email: f.email.value, tool: f.tool.value, source: 'rank_page', _subject: `Rank page audit: ${f.tool.value}` }) });
        if (!r.ok) throw 0;
        $('cta').classList.add('sent'); $('ctaM').textContent = `Got it. Your audit for ${f.tool.value} lands in your inbox within 48h.`;
        track('rank_page_audit', { tool: f.tool.value });
      } catch (err) { b.disabled = false; $('ctaM').textContent = 'That did not go through. Email hello@toolmonsters.com and we will run it by hand.'; }
    });
  };

  const show = (t, typed, quiet) => {
    res.hidden = false; $('movers').hidden = true;
    if (!t) {
      track('rank_page_search', { tool: typed, found: false });
      res.innerHTML = `<div class="nf"><div><span class="mono" style="font-size:11px;color:var(--orange)">not found</span><h2><b style="font-weight:500">${esc(typed)}</b> isn't in Claude's connector directory.</h2>
        <p>Buyers who ask Claude for a tool like yours get one of the ${fmt(D.ranks.total)} that are listed. We get you listed, verified, and ranked.</p></div>
        <div class="ins">${ctaHTML('Get listed and verified', `Free audit: what it takes to get ${esc(typed)} into Claude, within 48h.`, 'get listed', typed)}</div></div>`;
      res.querySelector('.cta').style.margin = '-24px'; wireCta(); return;
    }
    track('rank_page_search', { tool: t.n, found: true });
    if (PRETTY || !quiet) history.replaceState(null, '', urlFor(t.s));
    if (PRETTY) document.title = `${t.n} in Claude vs its competitors · Tool Monsters`;
    const comp = rivals(t);
    const all = [t, ...comp].sort((a, b) => b.p - a.p);
    const me = all.indexOf(t), space = spaceOf(t), lead = all[0], next = all[me - 1], behind = all[me + 1];
    const moved = t.w ? t.w - t.r : 0;
    const climber = comp.filter(c => c.w && c.w > c.r).sort((a, b) => (b.w - b.r) - (a.w - a.r))[0];
    const total = all.reduce((s, x) => s + x.p, 0), myShare = Math.round(t.p / total * 100);

    // insight lines
    let first, second;
    if (!comp.length) {
      first = `<b>${esc(t.n)}</b> has no direct competitor in Claude's directory yet. <span class="o">The space is yours to own.</span>`;
      second = `Overall you sit at <b>#${t.r}</b> of ${fmt(D.ranks.total)}.`;
    } else if (me === 0) {
      first = `<b>You lead ${esc(space)}.</b> ${behind ? `${esc(behind.n)} is <span class="o">${fmt(t.p - behind.p)} points</span> behind you.` : ''}`;
      second = climber ? `<b>${esc(climber.n)}</b> climbed <span class="o">▲${climber.w - climber.r}</span> this week.` : `No competitor moved up this week.`;
    } else {
      first = `<b>${esc(lead.n)}</b> leads ${esc(space)}, <span class="o">${fmt(lead.p - t.p)} points</span> ahead of you.`;
      second = me === 1 ? (behind ? `<b>${esc(behind.n)}</b> is next behind you, <span class="o">${fmt(t.p - behind.p)} points</span> back.` : `One spot from #1 in ${esc(space)}.`)
        : `Next to pass: <b>${esc(next.n)}</b>, only <span class="o">${fmt(next.p - t.p)} points</span> away.`;
    }
    const third = climber && me !== 0 ? `<div class="sep"></div><div><div class="ins-k mono">moving fastest</div><p><b>${esc(climber.n)}</b> climbed <span class="o">▲${climber.w - climber.r}</span> ${climber.w - climber.r === 1 ? 'spot' : 'spots'} this week.</p></div>` : '';
    const ctaTitle = me === 0 && comp.length ? 'Stay #1 in ' + esc(space) : comp.length ? `Climb past ${esc(next.n)}` : 'Own your space';
    const ctaBtn = me === 0 ? 'stay on top' : 'climb the ranking';

    const lo = Math.min(...all.map(x => x.p)), hi = lead.p, floor = lo - (hi - lo) * .35 - 1;
    res.innerHTML = `
      <div class="r-head">${logo(t)}<h2>${esc(t.n)}</h2><span class="space mono">${esc(space)}</span><button class="share mono" id="shareB" type="button">copy link</button></div>
      <div class="stats">
        <div class="st hl"><b>#${comp.length ? me + 1 : 1}<small> of ${all.length}</small></b><span class="mono">vs your competitors</span></div>
        <div class="st"><b>#${t.r}</b><span class="mono">of ${fmt(D.ranks.total)} in claude</span></div>
        <div class="st"><b class="${moved > 0 ? 'up' : moved < 0 ? 'dn' : ''}">${moved > 0 ? '<span class="tri"></span>' + moved : moved < 0 ? '<span class="tri d"></span>' + -moved : '='}</b><span class="mono">${Math.abs(moved) === 1 ? 'spot this week' : moved ? 'spots this week' : 'no move this week'}</span></div>
      </div>
      <div class="body">
        <div class="board">
          <div class="b-h"><img src="data:image/png;base64,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" alt=""><b>Your competitors in Claude</b>${comp.length ? '<button class="rp mono" id="rpB" type="button">▶ replay 30 days</button>' : '<span class="mono">by popularity</span>'}</div>
          <div id="boardBody">
          <div class="cols mono"><span>rank</span><span></span><span>connector</span><span>popularity</span><span></span><span>7d</span></div>
          <div class="rows" id="rows" style="height:${all.length * 58}px">
            ${all.map((x, i) => { const mv = x.w ? x.w - x.r : 0; return `<div class="row${x === t ? ' me' : ''}" data-i="${i}">
              <span class="n mono">#${i + 1}</span>${logo(x)}<span class="nm">${esc(x.n)}${x === t ? '<span class="you">YOU</span>' : ''}<span class="ov">#${x.r} overall</span></span>
              <span class="bar"><i data-w="${Math.max(3, (x.p - floor) / (hi - floor) * 100).toFixed(1)}"></i></span>
              <span class="sc mono" data-v="${x.p}">0</span><span class="mv mono ${mv > 0 ? 'up' : mv < 0 ? 'dn' : ''}">${mv > 0 ? '▲' + mv : mv < 0 ? '▼' + -mv : '—'}</span></div>`; }).join('')}
          </div></div>
          <div class="b-f mono"><span>popularity = claude's own score · more users, higher score</span><span>updated ${esc(D.ranks.updated)}</span></div>
        </div>
        <div class="ins">
          <div><div class="ins-k mono">${me === 0 && comp.length ? 'you lead' : 'who is ahead'}</div><p>${first}</p></div>
          <div class="sep"></div>
          <div><div class="ins-k mono">${me === 0 ? 'watch' : me === 1 ? 'behind you' : 'within reach'}</div><p>${second}</p></div>
          ${comp.length ? `<div class="sep"></div><div><div class="ins-k mono">your share of ${esc(space)}</div>
            <div class="share-bar">${all.map(x => `<span class="${x === t ? 'me' : ''}" style="flex-grow:${reduce ? x.p : 1}" data-g="${x.p}" title="${esc(x.n)}">${x.p / total > .09 ? logo(x, '') : ''}</span>`).join('')}</div>
            <div class="share-l mono"><span style="color:var(--orange)">you · ${myShare}%</span><span>${all.length - 1} competitors · ${100 - myShare}%</span></div></div>` : ''}
          ${third}
          ${ctaHTML(ctaTitle, `Free audit: what moves ${esc(t.n)} up in Claude, within 48h.`, ctaBtn, t.n)}
        </div>
      </div>`;
    wireCta();
    // replay: the same board, day by day over the last 30 days, from the real history
    const rpB = $('rpB');
    if (rpB) {
      getHist();   // warm it up so the click starts at once
      rpB.addEventListener('click', async () => {
        rpB.disabled = true; rpB.textContent = 'loading…';
        const hist = await getHist();
        if (!hist || !hist.r[t.s]) { rpB.hidden = true; return; }
        rpB.hidden = true; track('rank_page_replay', { tool: t.n });
        // the chart takes the place of the table; "table" in its top bar brings the table back
        const body = $('boardBody'), table = body.innerHTML;
        const back = () => { body.innerHTML = table; rpB.hidden = false; rpB.disabled = false; rpB.textContent = '▶ replay 30 days'; };
        TMRace(body, { tools: all, me: t.s, hist, href: urlFor, onBack: back }).play();
      });
      // a link ending in ?replay=1 opens straight on the replay (for sharing "watch your last 30 days")
      if (AUTO_REPLAY && !window.__replayed) { window.__replayed = 1; setTimeout(() => rpB.click(), 1600); }
    }
    $('shareB').addEventListener('click', () => { const u = new URL(urlFor(t.s), location.href).href; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => $('shareB').textContent = 'link copied', () => prompt('Copy this link', u)); });

    // the wow: rows start in a shuffled stack, bars and scores grow, then everyone slides into the real order
    const rows = [...res.querySelectorAll('.row')], RH = 58;
    const place = order => order.forEach((r, i) => r.style.transform = `translateY(${i * RH}px)`);
    const final = () => { place(rows); rows.forEach(r => { r.querySelector('.bar i').style.width = r.querySelector('.bar i').dataset.w + '%'; }); count(); res.querySelectorAll('.share-bar span').forEach(s => s.style.flexGrow = s.dataset.g); };
    const count = () => {
      const els = [...res.querySelectorAll('.sc')], t0 = performance.now(), ms = reduce ? 0 : 1100;
      const tick = () => { const p = ms ? Math.min(1, (performance.now() - t0) / ms) : 1, e = 1 - Math.pow(1 - p, 3); els.forEach(el => el.textContent = fmt(+el.dataset.v * e)); if (p < 1) requestAnimationFrame(tick); };
      tick();
    };
    if (reduce || all.length < 2) { rows.forEach(r => r.style.transition = 'none'); final(); return; }
    // start: you at the bottom, competitors in a scrambled order
    const start = rows.filter(r => !r.classList.contains('me')).sort((a, b) => ((+a.dataset.i * 7) % 5) - ((+b.dataset.i * 7) % 5));
    start.push(rows.find(r => r.classList.contains('me')));
    rows.forEach(r => { r.style.transition = 'none'; r.style.opacity = '0'; });
    place(start);
    void res.offsetWidth;
    rows.forEach((r, i) => { r.style.transition = ''; setTimeout(() => r.style.opacity = '1', 60 * i); });
    setTimeout(final, 420 + 60 * rows.length);
  };
})();
