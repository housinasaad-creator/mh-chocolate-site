/* MH Chocolate: الواجهة (شوكولا سائلة، قطع 3D، ورشة بأربع خطوات، طبقات، ساعة وحرارة، تمبرة، سلة، رسالة واتساب).
   three.js ومشاهده تُحمَّل متأخرة وتُفكَّك بالكامل حين تبتعد عن الشاشة. */
import { createLiquid } from './liquid.js';
import { C, CONFIG } from './content.js';

document.documentElement.classList.add('js');
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const coarse = matchMedia('(pointer: coarse)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SHAPES = Object.keys(C.shapes), TYPES = Object.keys(C.types), TOPS = Object.keys(C.tops), FILLS = Object.keys(C.fills), CRUNCHES = Object.keys(C.crunch);
const SWATCH = { bitter: '#2a130b', sutlu: '#8a5230', beyaz: '#f1e4c8', ruby: '#dc668f' };
const FILLSW = { sade: '#5a3322', karamel: '#d08a2e', frambuaz: '#b01f45', findik: '#a87340', fistik: '#9db55c' };
const CRUNSW = { findik: '#c79559', biskuvi: '#dcb87f' };
const KEY = 'mh-cart-v2', FKEY = 'mh-form-v1';
const waLink = (text) => `https://wa.me/${CONFIG.WA_NUMBER || ''}?text=${encodeURIComponent(text)}`;
const store = (k, v) => { try { v === undefined ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };

/* ---------------------------------------------------------------- نصوص ثابتة */
function copy() {
  document.title = C.title;
  const H = C.hero; $('#hKicker').textContent = H.kicker;
  $('#hH1').innerHTML = H.h1.map((w) => `<span class="line"><span>${esc(w)}</span></span>`).join(' ');
  $('#hSub').textContent = H.sub; $('#hCta1').textContent = H.cta1; $('#hCta2').textContent = H.cta2; $('#hCta2').href = waLink(C.wa.hello); $('#hHint span').textContent = H.hint;
  const S = C.studio; $('#sKicker').textContent = S.kicker; $('#sH2').textContent = S.h2; $('#sLead').textContent = S.lead; $('#labWhole').textContent = S.whole; $('#labCut').textContent = S.cut; $('#dragHint').textContent = S.drag; $('#replayT').textContent = S.replay;
  $('#layH').textContent = S.layersTitle; $('#metH').textContent = S.metersTitle; $('#metN').textContent = S.metersNote; $('#addons').textContent = S.addons;
  $('#lQty').textContent = S.qtyLabel; $('#sNote').placeholder = S.notePh; $('#sPrice').textContent = S.priceNote; $('#sAdd').textContent = S.add;
  const T = C.time; $('#tKicker').textContent = T.kicker; $('#tH2').textContent = T.h2; $('#tLead').textContent = T.lead; $('#tTypeL').textContent = T.typeLabel; $('#tTempL').textContent = T.temp; $('#cUnit').textContent = T.unit; $('#tNote').textContent = T.note;
  const K = C.craft; $('#kKicker').textContent = K.kicker; $('#kH2').textContent = K.h2; $('#kLead').textContent = K.lead; $('#kTypeL').textContent = K.typeLabel; $('#kNote').textContent = K.note;
  const U = C.custom; $('#cKicker').textContent = U.kicker; $('#cH2').textContent = U.h2; $('#cLead').textContent = U.lead; $('#cuText').placeholder = U.ph; $('#cuAdd').textContent = U.add;
  $('#cuChips').innerHTML = U.chips.map((c) => `<button type="button" class="chip">${esc(c)}</button>`).join('');
  const W = C.how; $('#wKicker').textContent = W.kicker; $('#wH2').textContent = W.h2; $('#wNote').textContent = W.note;
  $('#steps').innerHTML = W.steps.map((s) => `<li class="reveal"><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p></li>`).join('');
  const G = C.gallery; if (G.images.length) { $('#galeri').hidden = false; $('#gKicker').textContent = G.kicker; $('#gH2').textContent = G.h2; $('#gMore').textContent = G.more; $('#gMore').href = 'https://www.instagram.com/' + CONFIG.INSTAGRAM + '/'; $('#gal').innerHTML = G.images.map((src) => `<img src="${esc(src)}" alt="" loading="lazy" decoding="async">`).join(''); }
  const F = C.footer; $('#fLine').textContent = F.line; $('#fRights').textContent = F.rights; $('#fCredit').textContent = F.credit; $('#fWa').textContent = F.wa; $('#fWa').href = waLink(C.wa.hello); $('#fIg').textContent = F.ig; $('#fIg').href = 'https://www.instagram.com/' + CONFIG.INSTAGRAM + '/';
  $('#shTitle').textContent = C.cart.title; $('#dT').textContent = C.done.t; $('#dD').textContent = C.done.d; $('#dOk').textContent = C.done.ok; $('#dAgain').textContent = C.done.again; $('#barSend').textContent = C.cart.send;
}
copy();

/* ---------------------------------------------------------------- ظهور + رأس + تمرير */
const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.reveal').forEach((el) => rio.observe(el));
const hdr = $('#hdr'); let lastY = 0;
addEventListener('scroll', () => { const y = scrollY; hdr.classList.toggle('solid', y > 40); hdr.classList.toggle('hide', y > lastY && y > 700 && !document.body.classList.contains('noscroll')); lastY = y; }, { passive: true });
const goTo = (sel) => { const el = $(sel); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const h = a.getAttribute('href'); if (h.length > 1) { e.preventDefault(); goTo(h); } }));
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2400); }

/* ---------------------------------------------------------------- دورة حياة العناصر الثقيلة
   تُبنى قبل أن تدخل الشاشة وتُفكَّك بالكامل (ذاكرة كرت الشاشة أيضاً) بعد أن تبتعد عنها. سياق WebGL المفقود لا يُعاد استعماله،
   لذلك نستبدل عنصر canvas بنسخة جديدة عند كل إعادة بناء. */
let openGate; const piecesReady = new Promise((r) => { openGate = r; });
function swapCanvas(id) { const old = document.getElementById(id), fresh = old.cloneNode(false); fresh.classList.remove('on'); old.replaceWith(fresh); return fresh; }
function lifecycle(target, { near, far, make, kill, gate = Promise.resolve() }) {
  let inst = null, busy = false, first = true, inFar = true;
  const ensure = async () => {
    if (inst || busy) return; busy = true;
    try { await gate; const i = await make(first); first = false; if (!inFar) kill(i); else inst = i; } catch (e) { console.warn(e); } finally { busy = false; }
  };
  const release = () => { if (!inst) return; const i = inst; inst = null; try { kill(i); } catch (e) { console.warn(e); } };
  new IntersectionObserver((es) => { if (es[0].isIntersecting) ensure(); }, { rootMargin: near }).observe(target);
  new IntersectionObserver((es) => { inFar = es[0].isIntersecting; if (!inFar) release(); }, { rootMargin: far }).observe(target);
  return { get inst() { return inst; } };
}
const fadeIn = (el) => requestAnimationFrame(() => el.classList.add('on'));

const liquidLife = lifecycle($('#hero'), {
  near: '0px', far: '260px',
  make: (first) => {
    const el = first ? $('#liq') : swapCanvas('liq'); let lq = null;
    try { lq = createLiquid(el, $('#hero'), { scale: coarse ? 0.42 : 0.6, oct: 3 }); } catch (e) { lq = null; }
    document.documentElement.classList.toggle('no-gl', !lq); return lq;
  },
  kill: (lq) => lq && lq.destroy()
});
const lakeLife = lifecycle($('#hero'), {
  near: '0px', far: '260px', gate: piecesReady,
  make: async (first) => { const m = await import('./lake3d.js'), el = first ? $('#heroPiece') : swapCanvas('heroPiece'), k = m.createLake(el); if (k) fadeIn(el); return k; },
  kill: (k) => k && k.dispose()
});

/* ---------------------------------------------------------------- الورشة */
const state = { shape: 'kalp', type: 'ruby', shell: 1, fill: 'karamel', crunch: 'yok', crunchAmt: 1, top: 'yok', qty: 1 };
let studio = null, lastFill = 'karamel', selLayer = null;
const cfgOf = (s = state) => ({ shape: s.shape, type: s.type, shell: s.shell, fill: s.fill, crunch: s.crunch, crunchAmt: s.crunchAmt, top: s.top });
const chipsHTML = (g, keys, label, cur, sw) => keys.map((k) => `<button type="button" class="chip ${String(k) === String(cur) ? 'on' : ''}" data-g="${g}" data-v="${k}">${sw ? `<i style="background:${sw[k]}"></i>` : ''}${esc(label(k))}</button>`).join('');
function paintShapes() { $('#shapes').innerHTML = chipsHTML('shape', SHAPES, (k) => C.shapes[k].n, state.shape); $('#shName').textContent = C.shapes[state.shape].n; $('#shDesc').textContent = C.shapes[state.shape].d; }
function paintWiz() {
  const T = C.steps, tablet = state.shape === 'tablet', s = state;
  const step = (n, t, val, body) => `<li class="wz"><div class="wz-h"><b>${n}</b><div><h4>${esc(t.t)}</h4><p>${esc(t.d)}</p></div><span class="wz-v">${esc(val)}</span></div><div class="wz-b">${body}</div></li>`;
  const lab = (t) => `<p class="wz-l">${esc(t)}</p>`;
  $('#wiz').innerHTML =
    step(1, T[0], `${C.types[s.type]} · ${C.shells[s.shell]}`, `<div class="chips">${chipsHTML('type', TYPES, (k) => C.types[k], s.type, SWATCH)}</div>${lab(C.shellLabel)}<div class="chips">${chipsHTML('shell', [0, 1, 2], (k) => C.shells[k], s.shell)}</div>`) +
    step(2, T[1], tablet ? '—' : C.fills[s.fill], tablet ? `<p class="wz-n">${esc(C.studio.tabletNote)}</p>` : `<div class="chips">${chipsHTML('fill', FILLS, (k) => C.fills[k], s.fill, FILLSW)}</div>`) +
    step(3, T[2], s.crunch === 'yok' ? C.crunch.yok : `${C.crunch[s.crunch]} · ${C.amounts[s.crunchAmt]}`, `<div class="chips">${chipsHTML('crunch', CRUNCHES, (k) => C.crunch[k], s.crunch, CRUNSW)}</div>${s.crunch !== 'yok' ? lab(C.amountLabel) + `<div class="chips">${chipsHTML('crunchAmt', [0, 1, 2], (k) => C.amounts[k], s.crunchAmt)}</div>` : ''}`) +
    step(4, T[3], C.tops[s.top], `<div class="chips">${chipsHTML('top', TOPS, (k) => C.tops[k], s.top)}</div>`);
}
const layerIds = () => { const s = state, a = []; if (s.shape === 'truf') a.push('dust'); a.push('shell'); if (s.shape !== 'tablet' && s.fill !== 'yok') a.push('fill'); if (s.crunch !== 'yok') a.push('crunch'); if (s.top !== 'yok') a.push('top'); return a; };
function layerSub(id) { const s = state; return id === 'shell' ? `${C.types[s.type]} · ${C.shells[s.shell].toLowerCase()}` : id === 'fill' ? C.fills[s.fill] : id === 'crunch' ? `${C.crunch[s.crunch]} · ${C.amounts[s.crunchAmt].toLowerCase()}` : id === 'top' ? C.tops[s.top] : ''; }
const layerColor = (id) => id === 'shell' ? SWATCH[state.type] : id === 'fill' ? FILLSW[state.fill] : id === 'crunch' ? CRUNSW[state.crunch] : id === 'dust' ? '#4a2c1c' : '#e6bd5e';
function paintLayers() {
  const ids = layerIds(); if (selLayer && !ids.includes(selLayer)) selLayer = null;
  $('#layers').innerHTML = ids.map((id) => { const L = C.layers[id], on = id === selLayer; return `<button type="button" class="ly ${on ? 'on' : ''}" data-id="${id}"><i style="background:${layerColor(id)}"></i><span><b>${esc(L.n)}</b><em>${esc(layerSub(id))}</em></span></button>${on ? `<p class="ly-d">${esc(L.d)}</p>` : ''}`; }).join('');
}
function meters() {
  const s = state, t = { bitter: .88, sutlu: .52, ruby: .45, beyaz: .22 }[s.type], sw = { bitter: .3, sutlu: .6, ruby: .65, beyaz: .85 }[s.type], sh = [-.07, 0, .07][s.shell];
  const hasFill = s.shape !== 'tablet' && s.fill !== 'yok', fw = { sade: .15, karamel: .22, frambuaz: .25, findik: .15, fistik: .15 }[s.fill] || 0, amt = [.7, 1, 1.3][s.crunchAmt];
  const yog = clamp(t + sh, 0, 1), yum = clamp(hasFill ? .32 + [.25, .12, 0][s.shell] + fw : .1 + [.12, .05, 0][s.shell], 0, 1);
  const cit = clamp([.1, .22, .36][s.shell] + (s.crunch === 'yok' ? 0 : (s.crunch === 'findik' ? .34 : .4) * amt) - (hasFill ? .05 : 0), 0, 1), tat = clamp(sw + (hasFill ? { karamel: .2, frambuaz: .15 }[s.fill] || .05 : 0), 0, 1);
  return [['yog', yog], ['yum', yum], ['cit', cit], ['tat', tat]];
}
function paintMeters() { $('#meters').innerHTML = meters().map(([k, v]) => `<div class="mt"><span>${esc(C.meters[k])}</span><div><i style="width:${Math.round(v * 100)}%"></i></div></div>`).join(''); }
function sync(patch) {
  if (patch && patch.shape && patch.shape !== state.shape) { if (state.shape === 'tablet') state.fill = lastFill; if (patch.shape === 'tablet') { lastFill = state.fill === 'yok' ? lastFill : state.fill; patch.fill = 'yok'; } }
  Object.assign(state, patch || {});
  paintShapes(); paintWiz(); paintLayers(); paintMeters(); if (studio) { studio.set(cfgOf()); if (selLayer) studio.highlight(selLayer); }
}
const onChip = (e) => {
  const b = e.target.closest('.chip[data-g]'); if (!b) return; const g = b.dataset.g, v = b.dataset.v;
  const val = ['shell', 'crunchAmt'].includes(g) ? +v : v; if (g === 'crunch' && v === 'yok') { sync({ crunch: 'yok' }); return; }
  sync({ [g]: val });
};
$('#shapes').addEventListener('click', onChip); $('#wiz').addEventListener('click', onChip);
$('#layers').addEventListener('click', (e) => { const b = e.target.closest('.ly'); if (!b) return; selLayer = selLayer === b.dataset.id ? null : b.dataset.id; paintLayers(); if (studio) studio.highlight(selLayer); });
$('#replay').onclick = () => studio && studio.replayCut();
$('#qMinus').onclick = () => { state.qty = Math.max(1, state.qty - 1); $('#qVal').textContent = state.qty; };
$('#qPlus').onclick = () => { state.qty = Math.min(99, state.qty + 1); $('#qVal').textContent = state.qty; };
sync();

const studioLife = lifecycle($('#atolye'), {
  near: '650px', far: '1100px', gate: piecesReady,
  make: async (first) => {
    const m = await import('./studio3d.js'), el = first ? $('#studioPiece') : swapCanvas('studioPiece'), st = m.createStudio(el, cfgOf());
    if (!st) { $('.stage').classList.add('no-3d'); return null; }
    st.onPick = (id) => { selLayer = id; paintLayers(); }; studio = st; if (selLayer) st.highlight(selLayer); fadeIn(el); return st;
  },
  kill: (st) => { if (!st) return; if (studio === st) studio = null; st.dispose(); }
});

/* ---------------------------------------------------------------- السلة */
let items = load(KEY, []).filter((i) => i && i.qty > 0).slice(0, 40);
const saveCart = () => store(KEY, items);
const itemKey = (i) => i.k === 'custom' ? 'c|' + i.text : ['p', i.shape, i.type, i.shell, i.fill, i.crunch, i.crunchAmt, i.top, i.note || ''].join('|');
function addItem(it) {
  const hit = items.find((x) => itemKey(x) === itemKey(it));
  if (hit) { hit.qty = Math.min(99, hit.qty + it.qty); hit.thumb = it.thumb || hit.thumb; } else items.push(it);
  saveCart(); badge(true); toast(C.toast.added); if (sheet.classList.contains('on')) renderSheet();
}
function badge(pop) {
  const n = items.length; $('#bagN').textContent = n; $('#bagN').classList.toggle('on', n > 0);
  $('#bar').classList.toggle('on', n > 0 && !sheet.classList.contains('on'));
  $('#barTxt').textContent = n ? `${C.cart.bar} · ${C.cart.items(n)}` : '';
  if (pop) { const b = $('#bag'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
}
$('#sAdd').onclick = () => {
  const thumb = studio ? studio.snapshot(160) : '';
  addItem({ k: 'piece', ...cfgOf(), qty: state.qty, note: $('#sNote').value.trim(), thumb });
  $('#sNote').value = ''; state.qty = 1; $('#qVal').textContent = 1;
};
$('#cuChips').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; const t = $('#cuText'); t.value = (t.value.trim() ? t.value.trim().replace(/[,.]?$/, ', ') : '') + b.textContent; t.focus(); });
$('#cuAdd').onclick = () => {
  const t = $('#cuText'), v = t.value.trim(); if (!v) { t.focus(); t.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 280 }); return; }
  addItem({ k: 'custom', text: v, qty: 1 }); t.value = '';
};
const sheet = $('#sheet'), scrim = $('#scrim');
function detail(it) {
  const p = [`${C.types[it.type]} · ${C.shells[it.shell].toLowerCase()} kabuk`];
  if (it.shape !== 'tablet' && it.fill !== 'yok') p.push(C.fills[it.fill]);
  if (it.crunch !== 'yok') p.push(`${C.crunch[it.crunch]} (${C.amounts[it.crunchAmt].toLowerCase()})`);
  if (it.top !== 'yok') p.push(C.tops[it.top]);
  return p.join(' · ') + (it.note ? ' — ' + it.note : '');
}
function renderSheet() {
  const body = $('#shBody'), foot = $('#shFoot');
  if (!items.length) { body.innerHTML = `<div class="empty"><h4>${esc(C.cart.empty)}</h4><p>${esc(C.cart.emptySub)}</p></div>`; foot.innerHTML = ''; foot.style.display = 'none'; return; }
  foot.style.display = '';
  body.innerHTML = items.map((it, i) => it.k === 'custom'
    ? `<div class="ci" data-i="${i}"><div class="ci-img">✨</div><div><h4>${esc(C.cart.custom)}</h4><small>${esc(it.text)}</small></div><div class="ci-r"><button type="button" class="ci-rm" data-rm>${esc(C.cart.remove)}</button></div></div>`
    : `<div class="ci" data-i="${i}"><div class="ci-img">${it.thumb ? `<img src="${it.thumb}" alt="">` : '🍫'}</div><div><h4>${esc(C.shapes[it.shape].n)}</h4><small>${esc(detail(it))}</small></div><div class="ci-r"><div class="ci-q"><button type="button" data-q="-1" aria-label="-">−</button><b>${it.qty}</b><button type="button" data-q="1" aria-label="+">+</button></div><button type="button" class="ci-rm" data-rm>${esc(C.cart.remove)}</button></div></div>`).join('');
  const f = load(FKEY, {});
  foot.innerHTML = `<div class="forms"><input class="field" id="fName" placeholder="${esc(C.cart.name)}" autocomplete="name" value="${esc(f.name || '')}"><input class="field" id="fCity" placeholder="${esc(C.cart.city)}" autocomplete="address-level2" value="${esc(f.city || '')}"><input class="field full" id="fWhen" placeholder="${esc(C.cart.when)}" value="${esc(f.when || '')}"><input class="field full" id="fNote" placeholder="${esc(C.cart.note)}" value="${esc(f.note || '')}"></div><button class="btn block" id="shSend" type="button">${esc(C.cart.send)}</button><p class="hint">${esc(C.cart.sendHint)}</p>`;
  $$('input', foot).forEach((inp) => inp.addEventListener('input', () => store(FKEY, { name: $('#fName').value, city: $('#fCity').value, when: $('#fWhen').value, note: $('#fNote').value })));
  $('#shSend').onclick = send;
}
$('#shBody').addEventListener('click', (e) => {
  const row = e.target.closest('.ci'); if (!row) return; const idx = +row.dataset.i, it = items[idx]; if (!it) return;
  if (e.target.closest('[data-rm]')) items.splice(idx, 1);
  else if (e.target.closest('[data-q]')) { it.qty = clamp(it.qty + Number(e.target.closest('[data-q]').dataset.q), 0, 99); if (it.qty === 0) items.splice(idx, 1); }
  else return;
  saveCart(); badge(); renderSheet();
});
function openSheet() { renderSheet(); sheet.classList.add('on'); scrim.classList.add('on'); sheet.setAttribute('aria-hidden', 'false'); document.body.classList.add('noscroll'); $('#bar').classList.remove('on'); }
function closeSheet() { sheet.classList.remove('on'); scrim.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true'); document.body.classList.remove('noscroll'); badge(); }
$('#bag').onclick = openSheet; $('#barOpen').onclick = openSheet; $('#barSend').onclick = openSheet; $('#shClose').onclick = closeSheet; scrim.onclick = closeSheet;
addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSheet(); $('#done').classList.remove('on'); } });

/* رسالة واتساب */
const code = () => CONFIG.CODE_PREFIX + Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
const hashOf = (it) => `#p=${[it.shape, it.type, it.shell, it.fill, it.crunch, it.crunchAmt, it.top].join('.')}`;
function orderText() {
  const w = C.wa, base = location.origin + location.pathname, L = [w.hello, '', w.orders];
  items.forEach((it, i) => {
    if (it.k === 'custom') { L.push(`${i + 1}) ${w.custom}: ${it.text}`); return; }
    const p = [`${C.types[it.type]}, ${C.shells[it.shell].toLowerCase()} ${w.shell}`];
    if (it.shape !== 'tablet' && it.fill !== 'yok') p.push(`${C.fills[it.fill]} ${w.fill}`);
    if (it.crunch !== 'yok') p.push(`${C.crunch[it.crunch]} ${w.crunch} (${C.amounts[it.crunchAmt].toLowerCase()})`);
    if (it.top !== 'yok') p.push(`${w.top}: ${C.tops[it.top]}`);
    L.push(`${i + 1}) ${C.shapes[it.shape].n} — ${p.join(', ')} — ${it.qty} ${w.qty}`);
    if (it.note) L.push(`   ${w.note}: ${it.note}`);
    L.push(`   ${w.design}: ${base}${hashOf(it)}`);
  });
  const f = { name: ($('#fName') || {}).value, city: ($('#fCity') || {}).value, when: ($('#fWhen') || {}).value, note: ($('#fNote') || {}).value };
  const extra = []; if (f.name) extra.push(`${w.name}: ${f.name}`); if (f.city) extra.push(`${w.city}: ${f.city}`); if (f.when) extra.push(`${w.when}: ${f.when}`); if (f.note) extra.push(`${w.note}: ${f.note}`);
  if (extra.length) L.push('', ...extra);
  L.push('', w.ask, `${w.code}: ${orderText.code || (orderText.code = code())}`);
  return L.join('\n');
}
let lastUrl = '';
function send() {
  if (!items.length) return; lastUrl = waLink(orderText());
  const win = window.open(lastUrl, '_blank', 'noopener'); if (!win) location.href = lastUrl;
  $('#done').classList.add('on'); $('#done').setAttribute('aria-hidden', 'false');
}
$('#dOk').onclick = () => { items = []; saveCart(); orderText.code = null; $('#done').classList.remove('on'); closeSheet(); badge(); };
$('#dAgain').onclick = () => { if (lastUrl) window.open(lastUrl, '_blank', 'noopener'); };
function fromHash() {
  const m = /^#p=([a-z]+)\.([a-z]+)\.(\d)\.([a-z]+)\.([a-z]+)\.(\d)\.([a-z]+)$/.exec(location.hash); if (!m) return;
  const [, shape, type, shell, fill, crunch, amt, top] = m;
  if (!SHAPES.includes(shape) || !TYPES.includes(type) || +shell > 2 || (fill !== 'yok' && !FILLS.includes(fill)) || !CRUNCHES.includes(crunch) || +amt > 2 || !TOPS.includes(top)) return;
  sync({ shape, type, shell: +shell, fill, crunch, crunchAmt: +amt, top }); setTimeout(() => { goTo('#atolye'); toast(C.toast.loaded); }, 900);
}

/* ---------------------------------------------------------------- زمن وحرارة */
const tState = { T: 22, type: 'bitter', hours: 0, soft: 0, vis: false };
let melt = null;
function softHours(T, type) {
  const eff = T - (CONFIG.TYPE_OFFSET[type] || 0), tb = CONFIG.SOFT_TABLE; if (eff <= tb[0][0]) return 9999;
  for (let i = 1; i < tb.length; i++) if (eff <= tb[i][0]) { const [t0, h0] = tb[i - 1], [t1, h1] = tb[i], f = (eff - t0) / (t1 - t0); return Math.exp(Math.log(Math.min(h0, 9999)) * (1 - f) + Math.log(h1) * f); }
  return tb[tb.length - 1][1] * .6;
}
const polar = (r, a) => [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
const arcPath = (a0, a1, r) => { const [x0, y0] = polar(r, a0), [x1, y1] = polar(r, a1); return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; };
const ZC = ['#6fb59a', '#e0b04c', '#d4553a'];
function paintClockStatic() {
  const sh = softHours(tState.T, tState.type), a = (h) => -Math.PI / 2 + (clamp(h, 0, 12) / 12) * Math.PI * 2;
  let svg = `<circle cx="100" cy="100" r="92" fill="rgba(255,255,255,.03)" stroke="rgba(247,236,222,.18)"/>`;
  const e1 = Math.min(12, sh * .6), e2 = Math.min(12, sh);
  svg += `<path d="${arcPath(a(0), a(e1) - 0.0001, 80)}" stroke="${ZC[0]}" stroke-width="9" fill="none" stroke-linecap="butt"/>`;
  if (e2 > e1) svg += `<path d="${arcPath(a(e1), a(e2) - 0.0001, 80)}" stroke="${ZC[1]}" stroke-width="9" fill="none"/>`;
  if (sh < 12) svg += `<path d="${arcPath(a(sh), a(12) - 0.0001, 80)}" stroke="${ZC[2]}" stroke-width="9" fill="none"/>`;
  for (let i = 0; i < 12; i++) { const [x0, y0] = polar(68, a(i)), [x1, y1] = polar(i % 3 === 0 ? 58 : 62, a(i)); svg += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="rgba(247,236,222,${i % 3 === 0 ? .7 : .35})" stroke-width="${i % 3 === 0 ? 2 : 1}"/>`; if (i % 3 === 0) { const [tx, ty] = polar(48, a(i)); svg += `<text x="${tx.toFixed(1)}" y="${(ty + 4).toFixed(1)}" text-anchor="middle" font-size="11" fill="rgba(247,236,222,.6)" font-family="Jost,sans-serif">${i}</text>`; } }
  svg += `<g id="needle"><line x1="100" y1="74" x2="100" y2="22" stroke="#f0cf8c" stroke-width="2.6" stroke-linecap="round"/><circle cx="100" cy="22" r="5" fill="#f0cf8c"/></g>`;
  $('#clock').innerHTML = svg;
}
function paintTherm() {
  const y = (T) => 205 - ((clamp(T, 10, 36) - 10) / 26) * 180, zones = [[10, 15, '#6fa8c4'], [15, 20, '#6fb59a'], [20, 26, '#cdbb62'], [26, 31, '#e0904c'], [31, 36, '#d4553a']];
  let s = `<rect x="22" y="14" width="18" height="198" rx="9" fill="rgba(255,255,255,.06)" stroke="rgba(247,236,222,.2)"/>`;
  zones.forEach(([a, b, c]) => { s += `<rect x="26" y="${y(b)}" width="10" height="${y(a) - y(b)}" fill="${c}" opacity=".85"/>`; });
  s += `<circle cx="31" cy="212" r="12" fill="#d4553a" stroke="rgba(247,236,222,.2)"/><rect id="merc" x="29" y="${y(tState.T)}" width="4" height="${212 - y(tState.T)}" fill="#fff" opacity=".92"/><circle id="mark" cx="31" cy="${y(tState.T)}" r="6" fill="#fff" stroke="#1b0e0a" stroke-width="2"/>`;
  [10, 15, 20, 25, 30, 35].forEach((t) => { s += `<text x="46" y="${y(t) + 4}" font-size="10" fill="rgba(247,236,222,.55)" font-family="Jost,sans-serif">${t}°</text>`; });
  $('#therm').innerHTML = s;
}
function zoneName(T) { return C.time.zones[T < 15 ? 0 : T < 20 ? 1 : T < 26 ? 2 : T < 31 ? 3 : 4]; }
function paintTime() {
  const sh = softHours(tState.T, tState.type); paintClockStatic(); paintTherm();
  $('#tVal').textContent = tState.T; $('#tZone').textContent = zoneName(tState.T);
  $('#tStable').textContent = sh > 12 ? C.time.stable : C.time.softAt(C.time.hoursFmt(sh));
  $('#tTypes').innerHTML = chipsHTML('ttype', ['bitter', 'sutlu', 'beyaz'], (k) => C.types[k], tState.type, SWATCH);
  $('#phases').innerHTML = C.time.phases.map((p, i) => `<li data-i="${i}"><i style="background:${ZC[i]}"></i><span><b>${esc(p)}</b><em>${esc(C.time.phaseDesc[i])}</em></span></li>`).join('');
  if (melt) melt.setType(tState.type);
}
$('#tRange').addEventListener('input', (e) => { tState.T = +e.target.value; tState.hours = 0; paintTime(); });
$('#tTypes').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; tState.type = b.dataset.v; tState.hours = 0; paintTime(); });
paintTime();
let tLast = 0;
function timeLoop(now) {
  if (!tState.vis) { tLast = 0; return; } requestAnimationFrame(timeLoop);
  const dt = tLast ? Math.min(.1, (now - tLast) / 1000) : 0; tLast = now; tState.hours += dt * .5; if (tState.hours >= 12) tState.hours = 0;
  const sh = softHours(tState.T, tState.type), r = tState.hours / sh, ph = r < .6 ? 0 : r < 1 ? 1 : 2, h = tState.hours;
  const soft = ph === 0 ? 0 : ph === 1 ? (r - .6) / .4 * .15 : .15 + .85 * clamp((h - sh) / (sh * .8 + .4), 0, 1);
  const n = $('#needle'); if (n) n.setAttribute('transform', `rotate(${(h / 12) * 360} 100 100)`);
  $('#cHour').textContent = h.toFixed(1).replace('.', ','); $('#mState').textContent = C.time.phases[ph]; $('#mDesc').textContent = C.time.phaseDesc[ph];
  $$('#phases li').forEach((li, i) => li.classList.toggle('on', i === ph));
  if (melt) melt.setSoft(soft);
}
new IntersectionObserver((es) => { const v = es[0].isIntersecting; if (v && !tState.vis) { tState.vis = true; requestAnimationFrame(timeLoop); } else if (!v) tState.vis = false; }).observe($('#zaman'));
const meltLife = lifecycle($('#zaman'), {
  near: '500px', far: '1000px', gate: piecesReady,
  make: async (first) => { const m = await import('./melt3d.js'), el = first ? $('#meltCanvas') : swapCanvas('meltCanvas'), mk = m.createMelt(el, { shape: 'kalp', type: tState.type }); if (mk) fadeIn(el); melt = mk; return mk; },
  kill: (mk) => { if (!mk) return; if (melt === mk) melt = null; mk.dispose(); }
});

/* ---------------------------------------------------------------- منحنى التمبرة (يُرسم مع التمرير) */
const kState = { type: 'bitter', p: 0 };
const craftSec = $('#hazirlik'); let curveLen = 0;
const yOf = (T) => 300 - ((T - 15) / 40) * 250;
function curvePoints() {
  const [m, c, w] = CONFIG.TEMPER[kState.type];
  return [[50, yOf(20)], [210, yOf(m)], [400, yOf(c)], [540, yOf(w)], [670, yOf(w)], [770, yOf(18)]];
}
function smoothPath(pts) { let d = `M${pts[0][0]} ${pts[0][1]}`; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2; d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]} ${p2[1]}`; } return d; }
function paintCurve() {
  const pts = curvePoints(), [m, c, w] = CONFIG.TEMPER[kState.type], temps = [m, c, w, null], labels = C.craft.steps.map((s) => s.t);
  let s = ''; [20, 30, 40, 50].forEach((t) => { s += `<line x1="30" x2="800" y1="${yOf(t)}" y2="${yOf(t)}" stroke="rgba(247,236,222,.08)"/><text x="4" y="${yOf(t) + 6}" class="ca" fill="rgba(247,236,222,.4)" font-family="Jost,sans-serif">${t}°</text>`; });
  const d = smoothPath(pts); s += `<path id="curveBg" d="${d}" fill="none" stroke="rgba(247,236,222,.14)" stroke-width="5" stroke-linecap="round"/><path id="curveFg" d="${d}" fill="none" stroke="url(#cg)" stroke-width="7" stroke-linecap="round"/>`;
  [1, 2, 3, 4].forEach((i, k) => { const [x, y] = pts[i]; s += `<g class="cm" data-k="${k}"><circle cx="${x}" cy="${y}" r="9" fill="#1b0e0a" stroke="#f0cf8c" stroke-width="3"/><text class="ct" x="${x}" y="${y - 20}" text-anchor="middle" fill="#f7ecde" font-family="Jost,sans-serif" font-weight="500">${temps[k] ? temps[k] + '°C' : '≈ 18°C'}</text><text class="cn" x="${x}" y="${y + 36}" text-anchor="middle" fill="rgba(247,236,222,.62)" font-family="Jost,sans-serif">${esc(labels[k])}</text></g>`; });
  s += `<circle id="curveDot" r="12" fill="#f0cf8c" stroke="#1b0e0a" stroke-width="4"/><defs><linearGradient id="cg" x1="0" x2="1"><stop offset="0" stop-color="#d4553a"/><stop offset=".5" stop-color="#e0b04c"/><stop offset="1" stop-color="#6fb59a"/></linearGradient></defs>`;
  $('#curve').innerHTML = s; const fg = $('#curveFg'); curveLen = fg.getTotalLength(); fg.style.strokeDasharray = curveLen; updateCurve();
  $('#kTypes').innerHTML = chipsHTML('ktype', TYPES, (k) => C.types[k], kState.type, SWATCH);
  $('#csteps').innerHTML = C.craft.steps.map((st, i) => `<li data-i="${i}"><b>${i + 1}</b><div><h4>${esc(st.t)}</h4><p>${esc(st.d)}</p></div><span>${temps[i] ? '≈ ' + temps[i] + '°C' : '≈ 18°C'}</span></li>`).join('');
}
function updateCurve() {
  const fg = $('#curveFg'); if (!fg) return; const p = kState.p, L = curveLen * p; fg.style.strokeDashoffset = curveLen - L;
  const pt = fg.getPointAtLength(Math.max(.01, L)); const dot = $('#curveDot'); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
  const T = 15 + ((300 - pt.y) / 250) * 40; $('#kDeg').textContent = (Math.round(T * 2) / 2).toString().replace('.', ',');
  const act = Math.min(3, Math.floor(p * 4.2)); $$('#csteps li').forEach((li, i) => li.classList.toggle('on', i <= act && p > .02)); $$('#curve .cm').forEach((g, i) => g.classList.toggle('on', p * 4.2 > i + .4));
}
function craftScroll() { const r = craftSec.getBoundingClientRect(), h = innerHeight; kState.p = clamp((h * .82 - r.top - 120) / (Math.min(r.height, h * 1.1) * .62), 0, 1); updateCurve(); }
let craftTick = false, craftVis = false;
addEventListener('scroll', () => { if (!craftVis || craftTick) return; craftTick = true; requestAnimationFrame(() => { craftTick = false; craftScroll(); }); }, { passive: true });
new IntersectionObserver((es) => { craftVis = es[0].isIntersecting; if (craftVis) craftScroll(); }, { rootMargin: '100px' }).observe(craftSec);
$('#kTypes').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; kState.type = b.dataset.v; paintCurve(); });
paintCurve();

/* ---------------------------------------------------------------- إقلاع */
(async function boot() {
  const t0 = performance.now();
  await Promise.race([document.fonts ? document.fonts.ready : 0, new Promise((r) => setTimeout(r, 2200))]);
  await new Promise((r) => setTimeout(r, Math.max(0, 900 - (performance.now() - t0))));
  $('#pre').classList.add('done'); document.body.classList.remove('is-loading'); $('#hero').classList.add('go');
  badge(); fromHash(); addEventListener('hashchange', fromHash);
  (window.requestIdleCallback || ((f) => setTimeout(f, 250)))(() => openGate());
})();
window.__mh = { state, get items() { return items; }, get studio() { return studio; }, get hero() { return lakeLife.inst; }, get liquid() { return liquidLife.inst; }, get melt() { return melt; }, tState, kState };
