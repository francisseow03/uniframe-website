// Uniframe website: pinned scroll hero (the wall builds itself), quote dialog, mobile menu.
const $ = id => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b, ease = t => t) => ease(clamp((p - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);

/* ---------- image sequence on canvas ---------- */
const COUNT = 120;
const canvas = $('seq'), ctx = canvas.getContext('2d');
const frames = Array.from({ length: COUNT }, (_, i) => { const im = new Image(); im.decoding = 'async'; im.src = `frames/${String(i + 1).padStart(4, '0')}.webp`; return im; });
let current = -1, rect = null;
function size() { const d = Math.min(devicePixelRatio || 1, 2); canvas.width = canvas.clientWidth * d; canvas.height = canvas.clientHeight * d; current = -1; }
function draw(i) {
  if (!Number.isFinite(i)) { console.warn("frame index", i); i = 0; }
  i = Math.min(COUNT - 1, Math.max(0, Math.round(i)));
  let k = i; while (k > 0 && !(frames[k].complete && frames[k].naturalWidth)) k--;
  const im = frames[k]; if (!im.complete || !im.naturalWidth) return rect;
  if (k === current) return rect; current = k;
  const W = canvas.width, H = canvas.height, r = im.naturalWidth / im.naturalHeight;
  let w = W, h = W / r; if (h < H) { h = H; w = H * r; }
  ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
  const s = canvas.clientWidth / W; rect = { x: (W - w) / 2 * s, y: (H - h) / 2 * s, w: w * s, h: h * s };
  return rect;
}
size(); addEventListener('resize', () => { size(); render(); });

/* ---------- scroll-driven hero ---------- */
const WALL = { x0: 151 / 1920, x1: 1691 / 1920, y0: 148 / 1080, y1: 906 / 1080 };
const CAPS = [[0, 'Scroll to build the wall'], [8, 'Floor and ceiling channel'], [30, 'Aluminium posts'], [46, 'Glass panes'], [72, 'Solid wall panel'], [82, 'Frosted band at eye height'], [94, 'Oak veneer door in an aluminium frame'], [113, '']];
const hero = $('hero');
let lastCap = null;
function progress() { const r = hero.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); }
function render() {
  const p = progress();
  const f = seg(p, 0, 0.84) * (COUNT - 1);
  const r = draw(f);
  if (r) {
    const W = innerWidth, H = innerHeight;
    const wx = r.x + WALL.x0 * r.w, ww = (WALL.x1 - WALL.x0) * r.w, wy = r.y + WALL.y0 * r.h, wh = (WALL.y1 - WALL.y0) * r.h;
    const z = Math.max(1, Math.min(W / ww, (H - 120) / wh)), e = seg(f, 40, COUNT - 1);
    let tx = W / 2 - z * (wx + ww / 2), ty = (H + 40) / 2 - z * (wy + wh / 2);
    tx = Math.min(0, Math.max(W - z * W, tx)); ty = Math.min(0, Math.max(H - z * H, ty));
    canvas.style.transform = `translate(${lerp(0, tx, e)}px, ${lerp(0, ty, e)}px) scale(${lerp(1, z, e)})`;
  }
  $('intro').style.opacity = 1 - seg(p, 0.01, 0.06);
  const cap = CAPS.filter(([at]) => f >= at).pop()[1];
  if (cap !== lastCap) { lastCap = cap; if (cap) $('caption').textContent = cap; }
  $('caption').style.opacity = cap ? 1 : 0; $('caption').style.pointerEvents = cap ? 'auto' : 'none';
  const fin = seg(p, 0.86, 0.96, easeOut);
  const fl = $('final'); fl.style.opacity = fin; fl.style.transform = `translateY(${lerp(30, 0, fin)}px)`; fl.style.pointerEvents = fin > .5 ? 'auto' : 'none';
  fl.inert = fin < .5;
}
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; render(); }); } }, { passive: true });
frames.forEach(im => im.addEventListener('load', () => { current = -1; render(); }, { once: true }));
render();
// The caption button moves the build forward one step
$('caption').addEventListener('click', () => scrollBy({ top: innerHeight * 0.9, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));

/* ---------- quote dialog ---------- */
const dlg = $('quote'), form = $('qform');
document.addEventListener('click', e => {
  const q = e.target.closest('[data-quote]');
  if (q) {
    form.reset();
    const want = q.dataset.quote; if (want) form.querySelectorAll('[name=need]').forEach(c => c.checked = c.value === want);
    closeMenu(); dlg.showModal(); form.querySelector('[name=name]').focus();
  }
  if (e.target.closest('[data-privacy]')) $('privacy').showModal();
  if (e.target.closest('.mnav a')) closeMenu();
});
$('qsend').addEventListener('click', e => {
  if (!form.reportValidity()) { e.preventDefault(); return; }
  const d = new FormData(form), needs = d.getAll('need');
  const body = [`Name: ${d.get('name')}`, `Company: ${d.get('company') || '-'}`, `Email: ${d.get('email')}`, `Phone: ${d.get('phone') || '-'}`,
    `Project address: ${d.get('site') || '-'}`, `Needs: ${needs.join(', ') || '-'}`, '', d.get('msg') || ''].join('\n');
  location.href = `mailto:info@uniframe.nl?subject=${encodeURIComponent('Quote request' + (needs.length ? ': ' + needs.join(', ') : ''))}&body=${encodeURIComponent(body)}`;
});

/* ---------- mobile menu ---------- */
const mb = document.querySelector('.menu-btn'), mnav = $('mnav');
function closeMenu() { mnav.hidden = true; mb.setAttribute('aria-expanded', 'false'); }
mb.addEventListener('click', () => { const open = mnav.hidden; mnav.hidden = !open; mb.setAttribute('aria-expanded', String(open)); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
