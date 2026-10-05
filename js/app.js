/* MH Chocolate: واجهة الموقع (شوكولا سائلة، ورشة القطع 3D، سلة، ورسالة واتساب جاهزة). بلا مكتبات سوى three.js الذي يُحمَّل متأخراً. */
import { createLiquid } from './liquid.js';
import { C, CONFIG } from './content.js';

document.documentElement.classList.add('js');
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const coarse = matchMedia('(pointer: coarse)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SHAPES = Object.keys(C.shapes), TYPES = Object.keys(C.types), TOPS = Object.keys(C.tops), FILLS = Object.keys(C.fills);
const SWATCH = { bitter: '#2a130b', sutlu: '#8a5230', beyaz: '#f1e4c8', ruby: '#dc668f' };
const KEY = 'mh-cart-v1', FKEY = 'mh-form-v1';
const waLink = (text) => `https://wa.me/${CONFIG.WA_NUMBER || ''}?text=${encodeURIComponent(text)}`;
const store = (k, v) => { try { v === undefined ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };

/* ---------------------------------------------------------------- نصوص ثابتة */
function copy() {
  document.title = C.title;
  const H = C.hero; $('#hKicker').textContent = H.kicker;
  $('#hH1').innerHTML = H.h1.map((w) => `<span class="line"><span>${esc(w)}</span></span>`).join(' ');
  $('#hSub').textContent = H.sub; $('#hCta1').textContent = H.cta1; $('#hCta2').textContent = H.cta2; $('#hCta2').href = waLink(C.wa.hello);
  $('#hHint span').textContent = H.hint;
  const m = C.marquee.map((s) => `<span>${esc(s)}</span>`).join(''); $('#marq').innerHTML = m + m + m + m;
  const S = C.studio; $('#sKicker').textContent = S.kicker; $('#sH2').textContent = S.h2; $('#sLead').textContent = S.lead; $('#dragHint').textContent = S.drag;
  $('#lShape').textContent = S.shapesLabel; $('#lType').textContent = S.typeLabel; $('#lTop').textContent = S.topLabel; $('#lFill').textContent = S.fillLabel; $('#lQty').textContent = S.qtyLabel;
  $('#sNote').placeholder = S.notePh; $('#sPrice').textContent = S.priceNote; $('#sAdd').textContent = S.add;
  const U = C.custom; $('#cKicker').textContent = U.kicker; $('#cH2').textContent = U.h2; $('#cLead').textContent = U.lead; $('#cuText').placeholder = U.ph; $('#cuAdd').textContent = U.add;
  $('#cuChips').innerHTML = U.chips.map((c) => `<button type="button" class="chip">${esc(c)}</button>`).join('');
  const W = C.how; $('#wKicker').textContent = W.kicker; $('#wH2').textContent = W.h2; $('#wNote').textContent = W.note;
  $('#steps').innerHTML = W.steps.map((s) => `<li class="reveal"><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p></li>`).join('');
  const G = C.gallery; if (G.images.length) { $('#galeri').hidden = false; $('#gKicker').textContent = G.kicker; $('#gH2').textContent = G.h2; $('#gMore').textContent = G.more; $('#gMore').href = 'https://www.instagram.com/' + CONFIG.INSTAGRAM + '/'; $('#gal').innerHTML = G.images.map((src) => `<img src="${esc(src)}" alt="" loading="lazy" decoding="async">`).join(''); }
  const F = C.footer; $('#fLine').textContent = F.line; $('#fRights').textContent = F.rights; $('#fCredit').textContent = F.credit;
  $('#fWa').textContent = F.wa; $('#fWa').href = waLink(C.wa.hello); $('#fIg').textContent = F.ig; $('#fIg').href = 'https://www.instagram.com/' + CONFIG.INSTAGRAM + '/';
  $('#shTitle').textContent = C.cart.title; $('#dT').textContent = C.done.t; $('#dD').textContent = C.done.d; $('#dOk').textContent = C.done.ok; $('#dAgain').textContent = C.done.again; $('#barSend').textContent = C.cart.send;
}
copy();

/* ---------------------------------------------------------------- ظهور + رأس */
const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.reveal').forEach((el) => rio.observe(el));
const hdr = $('#hdr'); let lastY = 0;
addEventListener('scroll', () => {
  const y = scrollY; hdr.classList.toggle('solid', y > 40); hdr.classList.toggle('hide', y > lastY && y > 600 && !document.body.classList.contains('noscroll')); lastY = y;
}, { passive: true });
const goTo = (sel) => { const el = $(sel); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const h = a.getAttribute('href'); if (h.length > 1) { e.preventDefault(); goTo(h); } }));

/* ---------------------------------------------------------------- شوكولا سائلة */
/* دورة حياة العناصر الثقيلة: تُبنى قبل أن تدخل الشاشة وتُفكَّك بالكامل (ذاكرة كرت الشاشة أيضاً) بعد أن تبتعد عنها.
   سياق WebGL المفقود لا يُعاد استعماله، لذلك نستبدل عنصر canvas بنسخة جديدة عند كل إعادة بناء. */
let Pmod = null; const loadP = () => Pmod || (Pmod = import('./pieces.js'));
function swapCanvas(id) { const old = document.getElementById(id), fresh = old.cloneNode(false); fresh.classList.remove('on'); old.replaceWith(fresh); return fresh; }
let openGate; const piecesReady = new Promise((r) => { openGate = r; }); // تُفتح بعد اختفاء شاشة التحميل حتى لا يتزاحم تحميل three.js مع أول رسم
function lifecycle(target, { near, far, make, kill, gate = Promise.resolve() }) {
  let inst = null, busy = false, first = true, inFar = true;
  const ensure = async () => {
    if (inst || busy) return; busy = true;
    try { await gate; const i = await make(first); first = false; if (!inFar) { kill(i); } else inst = i; } catch (e) { console.warn(e); } finally { busy = false; }
  };
  const release = () => { if (!inst) return; const i = inst; inst = null; try { kill(i); } catch (e) { console.warn(e); } };
  new IntersectionObserver((es) => { if (es[0].isIntersecting) ensure(); }, { rootMargin: near }).observe(target);
  new IntersectionObserver((es) => { inFar = es[0].isIntersecting; if (!inFar) release(); }, { rootMargin: far }).observe(target);
  return { get inst() { return inst; } };
}
const liquidLife = lifecycle($('#hero'), {
  near: '0px', far: '260px',
  make: (first) => {
    const el = first ? $('#liq') : swapCanvas('liq'); let lq = null;
    try { lq = createLiquid(el, $('#hero'), { scale: coarse ? 0.42 : 0.6, oct: 3 }); } catch (e) { lq = null; }
    document.documentElement.classList.toggle('no-gl', !lq); return lq;
  },
  kill: (lq) => lq && lq.destroy()
});
/* الماركيه: نوقف حركته خارج الشاشة */
new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('off', !e.isIntersecting))).observe($('.marquee'));

/* ---------------------------------------------------------------- toast */
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2400); }

/* ---------------------------------------------------------------- ورشة القطع */
const state = { shape: 'kalp', type: 'ruby', top: 'yok', fill: 'sade', qty: 1 };
let studio = null;

function chips(id, keys, labelOf, cur, swatch) {
  $(id).innerHTML = keys.map((k) => `<button type="button" class="chip ${k === cur ? 'on' : ''}" data-k="${k}">${swatch ? `<i style="background:${SWATCH[k]}"></i>` : ''}${esc(labelOf(k))}</button>`).join('');
}
function paintOpts() {
  chips('#cShape', SHAPES, (k) => C.shapes[k].n, state.shape);
  chips('#cType', TYPES, (k) => C.types[k], state.type, true);
  chips('#cTop', TOPS, (k) => C.tops[k], state.top);
  chips('#cFill', FILLS, (k) => C.fills[k], state.fill);
  $('#shName').textContent = C.shapes[state.shape].n; $('#shDesc').textContent = C.shapes[state.shape].d; $('#qVal').textContent = state.qty;
}
function applyStage() { if (!studio) return; studio.setShape(state.shape); studio.setType(state.type); studio.setTopping(state.top); }
function setState(patch) { Object.assign(state, patch); paintOpts(); applyStage(); }
$('#cShape').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) setState({ shape: b.dataset.k }); });
$('#cType').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) setState({ type: b.dataset.k }); });
$('#cTop').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) setState({ top: b.dataset.k }); });
$('#cFill').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) setState({ fill: b.dataset.k }); });
const cycle = (d) => setState({ shape: SHAPES[(SHAPES.indexOf(state.shape) + d + SHAPES.length) % SHAPES.length] });
$('#shPrev').onclick = () => cycle(-1); $('#shNext').onclick = () => cycle(1);
$('#qMinus').onclick = () => { state.qty = Math.max(1, state.qty - 1); $('#qVal').textContent = state.qty; };
$('#qPlus').onclick = () => { state.qty = Math.min(99, state.qty + 1); $('#qVal').textContent = state.qty; };
paintOpts();

/* ---------------------------------------------------------------- السلة */
let items = load(KEY, []).filter((i) => i && i.qty > 0).slice(0, 40);
const saveCart = () => store(KEY, items);
const itemKey = (i) => i.k === 'custom' ? 'c|' + i.text : ['p', i.shape, i.type, i.top, i.fill, i.note || ''].join('|');
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
  const thumb = studio ? studio.snapshot(150) : '';
  addItem({ k: 'piece', shape: state.shape, type: state.type, top: state.top, fill: state.fill, qty: state.qty, note: $('#sNote').value.trim(), thumb });
  $('#sNote').value = ''; state.qty = 1; $('#qVal').textContent = 1;
};
$('#cuChips').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; const t = $('#cuText'); t.value = (t.value.trim() ? t.value.trim().replace(/[,.]?$/, ', ') : '') + b.textContent; t.focus(); });
$('#cuAdd').onclick = () => {
  const t = $('#cuText'), v = t.value.trim(); if (!v) { t.focus(); t.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 280 }); return; }
  addItem({ k: 'custom', text: v, qty: 1 }); t.value = '';
};

/* ورقة السلة */
const sheet = $('#sheet'), scrim = $('#scrim');
const detail = (it) => { const p = [C.types[it.type]]; if (it.top !== 'yok') p.push(C.tops[it.top]); if (it.fill !== 'sade') p.push(C.fills[it.fill]); return p.join(' · ') + (it.note ? ' — ' + it.note : ''); };
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
  const row = e.target.closest('.ci'); if (!row) return; const it = items[+row.dataset.i]; if (!it) return;
  if (e.target.closest('[data-rm]')) items.splice(+row.dataset.i, 1);
  else if (e.target.closest('[data-q]')) it.qty = Math.max(0, Math.min(99, it.qty + Number(e.target.closest('[data-q]').dataset.q))), it.qty === 0 && items.splice(+row.dataset.i, 1);
  else return;
  saveCart(); badge(); renderSheet();
});
function openSheet() { renderSheet(); sheet.classList.add('on'); scrim.classList.add('on'); sheet.setAttribute('aria-hidden', 'false'); document.body.classList.add('noscroll'); $('#bar').classList.remove('on'); }
function closeSheet() { sheet.classList.remove('on'); scrim.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true'); document.body.classList.remove('noscroll'); badge(); }
$('#bag').onclick = openSheet; $('#barOpen').onclick = openSheet; $('#shClose').onclick = closeSheet; scrim.onclick = closeSheet;
$('#barSend').onclick = () => { openSheet(); };
addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSheet(); $('#done').classList.remove('on'); } });

/* ---------------------------------------------------------------- رسالة واتساب */
const code = () => CONFIG.CODE_PREFIX + Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
function orderText() {
  const w = C.wa, base = location.origin + location.pathname, L = [w.hello, '', w.orders];
  items.forEach((it, i) => {
    if (it.k === 'custom') { L.push(`${i + 1}) ${w.custom}: ${it.text}`); return; }
    const p = [C.types[it.type]]; if (it.top !== 'yok') p.push(`${w.top}: ${C.tops[it.top]}`); if (it.fill !== 'sade') p.push(`${w.fill}: ${C.fills[it.fill]}`);
    L.push(`${i + 1}) ${C.shapes[it.shape].n} — ${p.join(', ')} — ${it.qty} ${w.qty}`);
    if (it.note) L.push(`   ${w.note}: ${it.note}`);
    L.push(`   ${w.design}: ${base}#p=${[it.shape, it.type, it.top, it.fill].join('.')}`);
  });
  const f = { name: ($('#fName') || {}).value, city: ($('#fCity') || {}).value, when: ($('#fWhen') || {}).value, note: ($('#fNote') || {}).value };
  const extra = []; if (f.name) extra.push(`${w.name}: ${f.name}`); if (f.city) extra.push(`${w.city}: ${f.city}`); if (f.when) extra.push(`${w.when}: ${f.when}`); if (f.note) extra.push(`${w.note}: ${f.note}`);
  if (extra.length) L.push('', ...extra);
  L.push('', w.ask, `${w.code}: ${orderText.code || (orderText.code = code())}`);
  return L.join('\n');
}
let lastUrl = '';
function send() {
  if (!items.length) return;
  lastUrl = waLink(orderText());
  const win = window.open(lastUrl, '_blank', 'noopener'); if (!win) location.href = lastUrl;
  $('#done').classList.add('on'); $('#done').setAttribute('aria-hidden', 'false');
}
$('#dOk').onclick = () => { items = []; saveCart(); orderText.code = null; $('#done').classList.remove('on'); closeSheet(); badge(); };
$('#dAgain').onclick = () => { if (lastUrl) window.open(lastUrl, '_blank', 'noopener'); };

/* ---------------------------------------------------------------- رابط التصميم (#p=shape.type.top.fill) */
function fromHash() {
  const m = /^#p=([a-z]+)\.([a-z]+)\.([a-z]+)\.([a-z]+)$/.exec(location.hash); if (!m) return;
  const [, s, t, o, f] = m; if (!SHAPES.includes(s) || !TYPES.includes(t) || !TOPS.includes(o) || !FILLS.includes(f)) return;
  setState({ shape: s, type: t, top: o, fill: f }); setTimeout(() => { goTo('#atolye'); toast(C.toast.loaded); }, 900);
}

/* ---------------------------------------------------------------- القطع ثلاثية الأبعاد (تُحمَّل بعد ظهور الصفحة) */
const heroSets = [['kalp', 'ruby'], ['kalp', 'bitter'], ['elmas', 'sutlu'], ['dudak', 'ruby'], ['karamel', 'bitter'], ['kalp', 'beyaz']];
const heroLife = lifecycle($('#hero'), {
  near: '0px', far: '260px', gate: piecesReady,
  make: async (first) => {
    const mod = await loadP(), el = first ? $('#heroPiece') : swapCanvas('heroPiece');
    const st = mod.createStage(el, { shape: 'kalp', type: 'ruby', hero: true, dust: coarse ? 36 : 60, need: 1.7 });
    if (!st) return null;
    requestAnimationFrame(() => el.classList.add('on'));
    let hi = 0; const timer = setInterval(() => { hi = (hi + 1) % heroSets.length; st.setShape(heroSets[hi][0]); st.setType(heroSets[hi][1]); }, 5200);
    return { st, timer };
  },
  kill: (h) => { if (!h) return; clearInterval(h.timer); h.st.dispose(); }
});
const studioLife = lifecycle($('#atolye'), {
  near: '650px', far: '1100px', gate: piecesReady,
  make: async (first) => {
    const mod = await loadP(), el = first ? $('#studioPiece') : swapCanvas('studioPiece');
    const st = mod.createStage(el, { shape: state.shape, type: state.type, dust: coarse ? 24 : 40, need: 1.75 });
    if (!st) { $('.stage').classList.add('no-3d'); return null; }
    studio = st; st.setTopping(state.top); requestAnimationFrame(() => el.classList.add('on')); return st;
  },
  kill: (st) => { if (!st) return; if (studio === st) studio = null; st.dispose(); }
});
const initPieces = () => openGate();

/* ---------------------------------------------------------------- إقلاع */
(async function boot() {
  const t0 = performance.now();
  await Promise.race([document.fonts ? document.fonts.ready : 0, new Promise((r) => setTimeout(r, 2200))]);
  const wait = Math.max(0, 900 - (performance.now() - t0)); await new Promise((r) => setTimeout(r, wait));
  $('#pre').classList.add('done'); document.body.classList.remove('is-loading'); $('#hero').classList.add('go');
  badge(); fromHash(); addEventListener('hashchange', fromHash);
  (window.requestIdleCallback || ((f) => setTimeout(f, 250)))(initPieces);
})();
window.__mh = { state, get items() { return items; }, get studio() { return studio; }, get hero() { const h = heroLife.inst; return h && h.st; }, get liquid() { return liquidLife.inst; } };
