'use strict';

/* ============================================================
   Bản đồ đọc code — app xem & ôn sơ đồ sinh ra từ skill doc-code.

   Kiến trúc (đã chốt): sodo.json chỉ chứa CẤU TRÚC (không có trạng thái học).
   TRẠNG THÁI học (chưa/lơ mơ/vững) do CHÍNH APP giữ, lưu trong localStorage,
   gắn theo project + id của từng ô. App tự chấm qua chế độ LẬT THẺ (nhớ trước,
   lật sau, tự đánh giá) — skill không đụng vào trạng thái.
   ============================================================ */

const SVGNS = 'http://www.w3.org/2000/svg';
const DATA_KEY = 'doc-code:sodo';
const PROG_PREFIX = 'doc-code:progress:';
const STATE_LABEL = { chua: 'chưa', lomo: 'lơ mơ', vung: 'vững' };

const $ = (sel) => document.querySelector(sel);
let DATA = null;         // sodo.json (chỉ cấu trúc)
let PROGRESS = {};       // { [id]: 'chua'|'lomo'|'vung' } của dự án hiện tại
let selectedId = null;
let zoom = 1;

/* ---------- Trạng thái học (app tự giữ) ---------- */

function progKey() { return PROG_PREFIX + (DATA && DATA.project ? DATA.project : '_'); }
function loadProgress() {
  try { const s = localStorage.getItem(progKey()); PROGRESS = s ? JSON.parse(s) : {}; }
  catch (_) { PROGRESS = {}; }
}
function saveProgress() {
  try { localStorage.setItem(progKey(), JSON.stringify(PROGRESS)); } catch (_) {}
}
function getState(id) { return PROGRESS[id] || 'chua'; }
function setState(id, st) { PROGRESS[id] = st; saveProgress(); }

// Chuẩn hoá giá trị daHoc cũ (nếu file cũ còn) để nhập một lần rồi thôi.
function normState(v) {
  const s = (v || '').toString().toLowerCase().trim();
  if (s.startsWith('v')) return 'vung';
  if (s.startsWith('l')) return 'lomo';
  return 'chua';
}
// Di cư nhẹ: nếu file cũ còn 'daHoc' và app chưa có trạng thái cho ô đó → nhập vào.
function seedFromLegacy(nodes) {
  let changed = false;
  const walk = (arr) => arr.forEach((n) => {
    if (n && n.daHoc != null && PROGRESS[n.id] == null) { PROGRESS[n.id] = normState(n.daHoc); changed = true; }
    if (Array.isArray(n.con)) walk(n.con);
  });
  walk(nodes);
  if (changed) saveProgress();
}

/* ---------- Nạp / lưu dữ liệu ---------- */

function saveDataCache(data) { try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); } catch (_) {} }
function loadDataCache() { try { const s = localStorage.getItem(DATA_KEY); return s ? JSON.parse(s) : null; } catch (_) { return null; } }

function validate(data) {
  if (!data || typeof data !== 'object') throw new Error('File không phải JSON hợp lệ.');
  if (!Array.isArray(data.nodes)) throw new Error('Thiếu danh sách "nodes".');
  return data;
}

function useData(data, { cache = true } = {}) {
  DATA = validate(data);
  loadProgress();
  seedFromLegacy(DATA.nodes);
  if (cache) saveDataCache(DATA);
  selectedId = null;
  render();
  toast(`Đã nạp: ${DATA.project || 'sơ đồ'}`);
}

function importFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { useData(JSON.parse(reader.result)); }
    catch (err) { toast('Không đọc được file: ' + err.message); }
  };
  reader.onerror = () => toast('Lỗi khi mở file.');
  reader.readAsText(file);
}

/* ---------- Đếm & duyệt ---------- */

function flatten(nodes, parentTen, acc = []) {
  for (const n of nodes) {
    acc.push({ node: n, parentTen });
    if (Array.isArray(n.con) && n.con.length) flatten(n.con, n.ten || n.id, acc);
  }
  return acc;
}
function countStates() {
  const acc = { chua: 0, lomo: 0, vung: 0, total: 0 };
  flatten(DATA.nodes).forEach(({ node }) => { acc.total++; acc[getState(node.id)]++; });
  return acc;
}
function childCount(node, acc = { total: 0, vung: 0 }) {
  if (!Array.isArray(node.con)) return acc;
  for (const c of node.con) {
    acc.total++;
    if (getState(c.id) === 'vung') acc.vung++;
    childCount(c, acc);
  }
  return acc;
}

/* ---------- Vẽ ---------- */

function render() {
  if (!DATA) { showEmpty(true); return; }
  showEmpty(false);

  $('#projectName').textContent = DATA.project || 'Bản đồ đọc code';
  const c = countStates();
  const metaBits = [];
  if (DATA.ngayTao) metaBits.push('cập nhật ' + DATA.ngayTao);
  metaBits.push(`${c.total} phần`);
  $('#projectMeta').textContent = metaBits.join(' · ');

  const pct = c.total ? Math.round((c.vung / c.total) * 100) : 0;
  $('#progressWrap').hidden = false;
  $('#progressFill').style.width = pct + '%';
  $('#progressLabel').textContent = `Đã vững ${c.vung}/${c.total} phần (${pct}%) · lơ mơ ${c.lomo} · chưa ${c.chua}`;

  drawMap();
  drawDetail();
}

function showEmpty(show) {
  $('#emptyState').hidden = !show;
  $('#content').hidden = show;
  $('#progressWrap').hidden = show;
}

function drawMap() {
  const svg = $('#map');
  svg.innerHTML = '';
  const top = DATA.nodes;
  const n = top.length;

  const NW = 172, NH = 96;
  const W = Math.max(560, n * 150);
  const H = Math.max(460, n * 120);
  const cx = W / 2, cy = H / 2;
  const R = Math.max(140, Math.min(W, H) / 2 - NH);

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.style.maxWidth = (W * zoom) + 'px';
  svg.style.minWidth = Math.min(W, 320) + 'px';

  const pos = {};
  top.forEach((node, i) => {
    if (n === 1) { pos[node.id] = { x: cx, y: cy }; return; }
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pos[node.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  const defs = el('defs');
  defs.innerHTML =
    `<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
       <path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker>`;
  svg.appendChild(defs);

  const edges = Array.isArray(DATA.edges) ? DATA.edges : [];
  const gEdges = el('g');
  svg.appendChild(gEdges);

  edges.forEach((e) => {
    const a = pos[e.tu], b = pos[e.den];
    if (!a || !b) return;
    const hot = selectedId && (e.tu === selectedId || e.den === selectedId);
    const path = el('path', { class: 'edge' + (hot ? ' hot' : ''), 'marker-end': 'url(#arrow)' });
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = mx - cx, dy = my - cy, len = Math.hypot(dx, dy) || 1;
    const cxp = mx + (dx / len) * 26, cyp = my + (dy / len) * 26;
    path.setAttribute('d', `M ${a.x} ${a.y} Q ${cxp} ${cyp} ${b.x} ${b.y}`);
    path.style.color = hot ? '' : 'var(--muted)';
    gEdges.appendChild(path);
    if (hot && e.nhan) drawEdgeLabel(gEdges, cxp, cyp, e.nhan);
  });

  top.forEach((node) => {
    const p = pos[node.id];
    const st = getState(node.id);
    const isSel = node.id === selectedId;
    const dim = selectedId && !isSel && !isNeighbor(node.id, edges, selectedId);

    const g = el('g', { class: 'node' + (isSel ? ' sel' : '') + (dim ? ' dim' : '') });
    const fo = el('foreignObject', { x: p.x - NW / 2, y: p.y - NH / 2, width: NW, height: NH, class: 'node__box' });
    const kids = childCount(node);
    const statLine = kids.total ? `${kids.vung}/${kids.total} phần trong đây đã vững` : STATE_LABEL[st];
    fo.innerHTML =
      `<div xmlns="http://www.w3.org/1999/xhtml" class="node__card s-${st}">
         <div class="node__kind">${escapeHtml(loaiLabel(node.loai))}</div>
         <div class="node__title">${escapeHtml(node.ten || node.id)}</div>
         <div class="node__stat">${escapeHtml(statLine)}</div>
       </div>`;
    g.appendChild(fo);
    g.addEventListener('click', (ev) => { ev.stopPropagation(); selectNode(node.id); });
    svg.appendChild(g);
  });

  svg.onclick = () => selectNode(null);
  $('#mapHint').textContent = selectedId
    ? 'Đường xanh là các kết nối của ô đang chọn. Chạm nền để bỏ chọn.'
    : 'Chạm vào một ô để xem nó nối với ai và vì sao.';
}

function drawEdgeLabel(parent, x, y, text) {
  const t = text.length > 42 ? text.slice(0, 41) + '…' : text;
  const w = Math.min(260, t.length * 6.4 + 16), h = 22;
  const g = el('g', { class: 'edge-label' });
  g.appendChild(el('rect', { class: 'edge-label__bg', x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 6 }));
  const txt = el('text', { class: 'edge-label__txt', x: x, y: y + 4, 'text-anchor': 'middle' });
  txt.textContent = t;
  g.appendChild(txt);
  parent.appendChild(g);
}

function isNeighbor(id, edges, sel) {
  return edges.some((e) => (e.tu === sel && e.den === id) || (e.den === sel && e.tu === id));
}

function selectNode(id) {
  selectedId = (id === selectedId) ? null : id;
  drawMap();
  document.querySelectorAll('.area').forEach((a) => {
    a.classList.toggle('hl', !!selectedId && a.dataset.id === selectedId);
  });
  if (selectedId) {
    const card = document.querySelector(`.area[data-id="${cssEsc(selectedId)}"]`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/* Chi tiết: accordion khu vực → file → hàm */
function drawDetail() {
  const wrap = $('#detail');
  wrap.innerHTML = '';
  DATA.nodes.forEach((node) => wrap.appendChild(areaCard(node)));
}

function areaCard(node) {
  const box = hel('div', { class: 'area' });
  box.dataset.id = node.id;
  const hasKids = Array.isArray(node.con) && node.con.length;

  const row = document.createElement('button');
  row.className = 'row';
  row.type = 'button';
  row.setAttribute('aria-expanded', 'false');
  row.innerHTML =
    `<span class="row__badge b-${getState(node.id)}"></span>
     <span class="row__main">
       <span class="row__title">${escapeHtml(node.ten || node.id)}<span class="tag">${escapeHtml(loaiLabel(node.loai))}</span></span>
       <span class="row__desc">${escapeHtml(node.moTa || '')}</span>
     </span>
     ${hasKids ? '<span class="row__chev">▸</span>' : ''}`;
  box.appendChild(row);

  if (hasKids) {
    const kidsWrap = hel('div', { class: 'children' });
    kidsWrap.hidden = true;
    node.con.forEach((k) => kidsWrap.appendChild(leafOrArea(k)));
    box.appendChild(kidsWrap);
    row.addEventListener('click', () => {
      const open = row.getAttribute('aria-expanded') === 'true';
      row.setAttribute('aria-expanded', String(!open));
      kidsWrap.hidden = open;
    });
  } else {
    row.addEventListener('click', () => selectNode(node.id));
  }
  return box;
}

function leafOrArea(node) {
  if (Array.isArray(node.con) && node.con.length) {
    const a = areaCard(node);
    a.classList.add('nested');
    return a;
  }
  const leaf = hel('div', { class: 'leaf' });
  leaf.dataset.id = node.id;
  leaf.innerHTML =
    `<span class="row__badge b-${getState(node.id)}"></span>
     <span class="row__main">
       <span class="row__title">${escapeHtml(node.ten || node.id)}<span class="tag">${escapeHtml(loaiLabel(node.loai))}</span></span>
       <span class="leaf__id">${escapeHtml(node.id)}</span>
       <span class="row__desc">${escapeHtml(node.moTa || '')}</span>
     </span>`;
  return leaf;
}

/* ---------- Ôn tập: LẬT THẺ (nhớ trước, lật sau, tự chấm) ---------- */

let deck = [];        // hàng thẻ cần ôn
let deckPos = 0;

function edgesFor(id) {
  const edges = Array.isArray(DATA.edges) ? DATA.edges : [];
  const byId = {};
  flatten(DATA.nodes).forEach(({ node }) => { byId[node.id] = node; });
  const out = [];
  edges.forEach((e) => {
    if (e.tu === id) out.push(`→ ${(byId[e.den] && byId[e.den].ten) || e.den}: ${e.nhan || ''}`);
    if (e.den === id) out.push(`← ${(byId[e.tu] && byId[e.tu].ten) || e.tu}: ${e.nhan || ''}`);
  });
  return out;
}

function startReview(onlyWeak) {
  let items = flatten(DATA.nodes);
  if (onlyWeak) items = items.filter(({ node }) => getState(node.id) !== 'vung');
  if (!items.length) {
    toast(onlyWeak ? 'Không còn phần nào chưa vững để ôn. 🎉' : 'Chưa có phần nào để ôn.');
    return;
  }
  // xáo trộn
  for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
  deck = items; deckPos = 0;
  $('#reviewOverlay').hidden = false;
  document.body.style.overflow = 'hidden';
  showCard(false);
}

function endReview() {
  $('#reviewOverlay').hidden = true;
  document.body.style.overflow = '';
  render();
}

function showCard(revealed) {
  if (deckPos >= deck.length) { endReview(); toast('Xong một lượt ôn! 🎉'); return; }
  const { node, parentTen } = deck[deckPos];
  const st = getState(node.id);
  const conns = edgesFor(node.id);

  $('#rvCount').textContent = `Thẻ ${deckPos + 1}/${deck.length}`;
  $('#rvKind').textContent = loaiLabel(node.loai) + (parentTen ? ' · thuộc ' + parentTen : '');
  $('#rvTitle').textContent = node.ten || node.id;
  $('#rvCurState').textContent = 'Hiện tại: ' + STATE_LABEL[st];
  $('#rvCurState').className = 'rv__cur s-badge-' + st;

  const ask = $('#rvAsk'), ans = $('#rvAnswer');
  if (!revealed) {
    ask.hidden = false; ans.hidden = true;
    $('#rvReveal').hidden = false; $('#rvGrades').hidden = true;
  } else {
    ask.hidden = true; ans.hidden = false;
    $('#rvMoTa').textContent = node.moTa || '(chưa có mô tả)';
    const cw = $('#rvConns');
    cw.innerHTML = '';
    if (conns.length) {
      conns.forEach((c) => { const li = document.createElement('li'); li.textContent = c; cw.appendChild(li); });
      $('#rvConnsWrap').hidden = false;
    } else { $('#rvConnsWrap').hidden = true; }
    $('#rvReveal').hidden = true; $('#rvGrades').hidden = false;
  }
}

function grade(st) {
  const { node } = deck[deckPos];
  setState(node.id, st);
  deckPos++;
  showCard(false);
}

/* ---------- Tiện ích ---------- */

function loaiLabel(loai) {
  const map = { khuVuc: 'khu vực', file: 'file', ham: 'hàm', ngoai: 'ngoài', thuMuc: 'thư mục' };
  return map[loai] || loai || 'phần';
}
function el(name, attrs) {
  const e = document.createElementNS(SVGNS, name);
  if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function hel(name, attrs) {
  const e = document.createElement(name);
  if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function escapeHtml(s) {
  return (s == null ? '' : String(s)).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function cssEsc(s) { return (window.CSS && CSS.escape) ? CSS.escape(s) : s.replace(/"/g, '\\"'); }

let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

/* ---------- Sự kiện ---------- */

function bind() {
  const fileInput = $('#fileInput');
  const openPicker = () => fileInput.click();
  $('#btnImport').addEventListener('click', openPicker);
  $('#btnImport2').addEventListener('click', openPicker);
  fileInput.addEventListener('change', () => importFromFile(fileInput.files[0]));

  // Mở bảng chọn kiểu ôn
  $('#btnReview').addEventListener('click', () => { $('#reviewStart').hidden = false; });
  $('#rsAll').addEventListener('click', () => { $('#reviewStart').hidden = true; startReview(false); });
  $('#rsWeak').addEventListener('click', () => { $('#reviewStart').hidden = true; startReview(true); });
  $('#rsCancel').addEventListener('click', () => { $('#reviewStart').hidden = true; });

  $('#rvReveal').addEventListener('click', () => showCard(true));
  $('#rvClose').addEventListener('click', endReview);
  $('#rvGradeChua').addEventListener('click', () => grade('chua'));
  $('#rvGradeLomo').addEventListener('click', () => grade('lomo'));
  $('#rvGradeVung').addEventListener('click', () => grade('vung'));

  $('#zoomIn').addEventListener('click', () => { zoom = Math.min(3, zoom + 0.25); drawMap(); });
  $('#zoomOut').addEventListener('click', () => { zoom = Math.max(0.5, zoom - 0.25); drawMap(); });
  $('#zoomReset').addEventListener('click', () => { zoom = 1; drawMap(); });

  const dz = $('#dropZone');
  ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) importFromFile(f); });
}

/* ---------- Khởi động ---------- */

async function boot() {
  bind();
  const cached = loadDataCache();
  if (cached) { useData(cached, { cache: false }); return; }
  try {
    const res = await fetch('sample-sodo.json', { cache: 'no-store' });
    if (res.ok) { useData(await res.json(), { cache: false }); return; }
  } catch (_) {}
  showEmpty(true);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
boot();
