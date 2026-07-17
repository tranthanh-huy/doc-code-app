'use strict';

/* ============================================================
   Bản đồ đọc code — app xem sơ đồ cấu trúc dự án (sinh từ skill doc-code).
   Đọc sodo.json (chỉ CẤU TRÚC), vẽ sơ đồ kết nối tương tác + danh sách chi tiết.
   Giao diện tối giản đen–trắng, hợp cả điện thoại lẫn màn hình E Ink.
   (Chức năng ôn tập/tiến độ tạm gỡ — sẽ dựng lại theo cách người dùng muốn.)
   ============================================================ */

const SVGNS = 'http://www.w3.org/2000/svg';
// Địa chỉ nhà CÔNG KHAI của app (không bí mật). Dùng cho QR/link "Chia sẻ" để máy khác
// luôn với tới được — kể cả khi bản đang mở là file:// hoặc localhost.
const PUBLIC_APP_URL = 'https://tranthanh-huy.github.io/doc-code-app/';
const LIB_KEY = 'doc-code:lib';        // { [tênDựÁn]: sodoData } — tủ nhiều dự án
const CUR_KEY = 'doc-code:current';    // tên dự án đang xem
const SYNC_KEY = 'doc-code:syncurls';  // { [tênDựÁn]: link tải trực tiếp } — đồng bộ tự động
const INDEX_KEY = 'doc-code:indexurl'; // link "mục lục" (một link tổng cho MỌI dự án)
const OLD_DATA_KEY = 'doc-code:sodo';  // cache đơn cũ (để di cư)

const $ = (sel) => document.querySelector(sel);
let DATA = null;
let selectedId = null;
let activeNeighborId = null;  // ô hàng xóm có nhãn nối đang hiện (null = chưa hiện nhãn nào)
let view = { tx: 0, ty: 0, scale: 1, fitted: false };  // pan/zoom tự do bằng transform
let justPanned = false;  // true nếu vừa kéo/chụm → bỏ qua click chọn ô

/* ---------- Tủ nhiều dự án ---------- */

function loadLib() { try { const s = localStorage.getItem(LIB_KEY); return s ? JSON.parse(s) : {}; } catch (_) { return {}; } }
function saveLib(lib) { try { localStorage.setItem(LIB_KEY, JSON.stringify(lib)); } catch (_) {} }
function getCurrent() { try { return localStorage.getItem(CUR_KEY) || ''; } catch (_) { return ''; } }
function setCurrent(name) { try { localStorage.setItem(CUR_KEY, name); } catch (_) {} }
function projName(data) { return (data && data.project) ? data.project : 'sơ đồ không tên'; }

function loadSync() { try { const s = localStorage.getItem(SYNC_KEY); return s ? JSON.parse(s) : {}; } catch (_) { return {}; } }
function saveSync(m) { try { localStorage.setItem(SYNC_KEY, JSON.stringify(m)); } catch (_) {} }
function getSyncUrl(name) { return loadSync()[name] || ''; }
function setSyncUrl(name, url) { const m = loadSync(); if (url) m[name] = url; else delete m[name]; saveSync(m); }

function getIndexUrl() { try { return localStorage.getItem(INDEX_KEY) || ''; } catch (_) { return ''; } }
function setIndexUrl(u) { try { if (u) localStorage.setItem(INDEX_KEY, u); else localStorage.removeItem(INDEX_KEY); } catch (_) {} }

// Dòng trạng thái đồng bộ — CHỮ TĨNH, không hiệu ứng động (hợp E Ink).
// sticky=true: giữ nguyên (đang tải); mặc định tự ẩn sau vài giây (đã xong/lỗi).
let syncClearTimer = null;
function setSync(text, { sticky = false } = {}) {
  const e = document.getElementById('syncStatus');
  if (!e) return;
  clearTimeout(syncClearTimer);
  if (!text) { e.hidden = true; e.textContent = ''; return; }
  e.hidden = false; e.textContent = text;
  if (!sticky) syncClearTimer = setTimeout(() => { e.hidden = true; e.textContent = ''; }, 3200);
}

// Tải JSON thô từ một link trực tiếp (có phá cache để luôn lấy bản mới nhất).
async function fetchJson(url) {
  const u = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
  const res = await fetch(u, { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}
async function fetchSodo(url) { return validate(await fetchJson(url)); }

// Nhập từ MỘT link, tự đoán loại:
//  - có "projects[]"  -> đây là MỤC LỤC (index): nạp mọi dự án bên trong.
//  - có "nodes[]"     -> đây là MỘT dự án lẻ: nạp như cũ.
// Cùng một hàm phục vụ cả nút "Từ link…" lẫn deep-link ?sync=.
async function importAuto(url, { silent = false } = {}) {
  url = (url || '').trim();
  if (!url) return;
  let raw;
  try { raw = await fetchJson(url); }
  catch (e) { if (!silent) toast('Tải link lỗi: ' + e.message + ' — hãy dùng link TẢI TRỰC TIẾP.'); return; }

  if (raw && Array.isArray(raw.projects)) {
    await importIndex(raw, url, { silent });
  } else if (raw && Array.isArray(raw.nodes)) {
    setSyncUrl(projName(raw), url);
    useData(raw, { addToLib: true });
    if (!silent) toast('Đã nhập & gắn link: ' + projName(raw));
  } else if (!silent) {
    toast('Link không phải sơ đồ hợp lệ (thiếu "nodes" hoặc "projects").');
  }
}

// Hiện một dự án đã có sẵn trong tủ, KHÔNG tải lại (dùng khi vừa tải xong từ mục lục).
function showProjectFromLib(name) {
  const lib = loadLib();
  if (!lib[name]) return;
  DATA = lib[name]; setCurrent(name);
  selectedId = null; view.fitted = false;
  render(); refreshPicker();
}

// Nạp một mục lục: ghi nhớ link tổng, rồi tải sodo.json của các dự án bên trong —
// SONG SONG cho nhanh, và hiện dự án đầu tiên tải xong ngay (không chờ hết).
async function importIndex(idx, url, { silent = false } = {}) {
  setIndexUrl(url);
  const projs = (Array.isArray(idx.projects) ? idx.projects : []).filter((p) => p && p.link);
  const total = projs.length;
  if (!total) { setSync(''); if (!silent) toast('Mục lục trống.'); return; }
  let shown = false, done = 0;
  setSync('⟳ Đang tải dữ liệu mới…', { sticky: true });
  const results = await Promise.allSettled(projs.map(async (p) => {
    const data = await fetchSodo(p.link);
    const name = projName(data);
    const lib = loadLib(); lib[name] = data; saveLib(lib);
    setSyncUrl(name, p.link);
    if (!DATA && !shown) {           // hiện ngay dự án đầu tiên có mặt (không tải lại)
      shown = true;
      const cur = getCurrent();
      showProjectFromLib(loadLib()[cur] ? cur : name);
    } else {
      refreshPicker();
    }
    done++;
    if (total > 1) setSync(`⟳ Đã tải ${done}/${total} dự án…`, { sticky: true });
    return name;
  }));
  const ok = results.filter((r) => r.status === 'fulfilled').length;
  // đang xem sẵn một dự án: cập nhật lại chính nó nếu mục lục có bản mới
  if (DATA) { const cur = projName(DATA); if (loadLib()[cur]) { DATA = loadLib()[cur]; render(); } }
  refreshPicker();
  if (ok === total) setSync('✓ Đã cập nhật xong');
  else if (ok === 0) setSync('⚠ Không tải được — sẽ tự thử lại lần mở sau');
  else setSync(`✓ Cập nhật ${ok}/${total} dự án (vài dự án lỗi)`);
  if (!silent) toast(`Đã đồng bộ mục lục: ${ok}/${total} dự án`);
}

// Tải lại dữ liệu mới nhất của một dự án đã gắn link.
async function refreshProject(name, { silent = false } = {}) {
  const url = getSyncUrl(name);
  if (!url) { if (!silent) toast('Dự án này chưa gắn link đồng bộ.'); return; }
  setSync('⟳ Đang tải dữ liệu mới…', { sticky: true });
  try {
    const data = await fetchSodo(url);
    const lib = loadLib();
    lib[projName(data)] = data; saveLib(lib);
    if (projName(data) !== name) { setSyncUrl(projName(data), url); }
    if (DATA && projName(DATA) === name) { DATA = data; render(); refreshPicker(); }
    setSync('✓ Đã cập nhật xong');
    if (!silent) toast('Đã làm mới: ' + name);
  } catch (e) {
    setSync('⚠ Không tải được — kiểm tra mạng rồi thử lại');
    if (!silent) toast('Không làm mới được: ' + e.message);
  }
}

function validate(data) {
  if (!data || typeof data !== 'object') throw new Error('File không phải JSON hợp lệ.');
  if (!Array.isArray(data.nodes)) throw new Error('Thiếu danh sách "nodes".');
  return data;
}

// addToLib=true: nhập/cập nhật vào tủ và đặt làm dự án hiện tại (khi người dùng nhập file).
// addToLib=false: chỉ xem tạm (ví dụ file mẫu), không lưu vào tủ.
function useData(data, { addToLib = true } = {}) {
  DATA = validate(data);
  if (addToLib) {
    const lib = loadLib();
    lib[projName(DATA)] = DATA;
    saveLib(lib);
    setCurrent(projName(DATA));
  }
  selectedId = null;
  view.fitted = false;
  render();
  refreshPicker();
  toast(`Đã nạp: ${projName(DATA)}`);
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

function refreshPicker() {
  const lib = loadLib();
  const names = Object.keys(lib);
  const bar = $('#projbar'), sel = $('#projectPicker');
  if (!names.length) { bar.hidden = true; return; }
  bar.hidden = false;
  sel.innerHTML = '';
  names.forEach((n) => {
    const o = document.createElement('option');
    o.value = n; o.textContent = n;
    if (DATA && n === projName(DATA)) o.selected = true;
    sel.appendChild(o);
  });
}

function switchProject(name) {
  const lib = loadLib();
  if (!lib[name]) return;
  DATA = lib[name];
  setCurrent(name);
  selectedId = null;
  view.fitted = false;
  render();
  refreshPicker();
  if (getSyncUrl(name)) refreshProject(name, { silent: true });  // tự lấy bản mới nhất ngầm
}

function deleteProject(name) {
  const lib = loadLib();
  if (!lib[name]) return;
  delete lib[name];
  saveLib(lib);
  setSyncUrl(name, '');  // xoá luôn link đồng bộ
  const rest = Object.keys(lib);
  if (rest.length) { switchProject(rest[0]); toast(`Đã xoá "${name}" khỏi tủ`); }
  else { DATA = null; setCurrent(''); showEmpty(true); refreshPicker(); toast(`Đã xoá "${name}". Tủ trống.`); }
}

/* ---------- Đếm ---------- */

function childCountTotal(node, acc = { n: 0 }) {
  if (!Array.isArray(node.con)) return acc.n;
  for (const c of node.con) { acc.n++; childCountTotal(c, acc); }
  return acc.n;
}

/* ---------- Vẽ ---------- */

function render() {
  if (!DATA) { showEmpty(true); return; }
  showEmpty(false);
  $('#projectName').textContent = DATA.project || 'Bản đồ đọc code';
  const meta = [];
  if (DATA.ngayTao) meta.push('cập nhật ' + DATA.ngayTao);
  meta.push(`${DATA.nodes.length} phần chính`);
  $('#projectMeta').textContent = meta.join(' · ');
  drawMap();
  drawDetail();
}

function showEmpty(show) {
  $('#emptyState').hidden = !show;
  $('#content').hidden = show;
}

const NW = 188;  // bề ngang ô

// Ước lượng chiều cao ô theo độ dài tên (để chữ không tràn / không đè).
function nodeH(node) {
  const title = node.ten || node.id || '';
  const lines = Math.max(1, Math.ceil(title.length / 17));
  const hasSub = Array.isArray(node.con) && node.con.length;
  return 40 + lines * 19 + (hasSub ? 18 : 0);
}
// Khoảng cách từ tâm ô ra mép theo hướng (ux,uy) — để cắt mũi tên đúng mép.
function borderDist(hw, hh, ux, uy) {
  const tx = ux ? hw / Math.abs(ux) : Infinity;
  const ty = uy ? hh / Math.abs(uy) : Infinity;
  return Math.min(tx, ty);
}

function drawMap() {
  const svg = $('#map');
  svg.innerHTML = '';
  const top = DATA.nodes;
  const n = top.length;

  const heights = {};
  top.forEach((nd) => { heights[nd.id] = nodeH(nd); });
  const maxNH = Math.max(96, ...Object.values(heights));

  const GAP = 150;
  let R = 160;
  if (n > 1) R = Math.max(160, (NW + GAP) / (2 * Math.sin(Math.PI / n)));
  const M = 90;
  const W = Math.round(2 * R + NW + 2 * M);
  const H = Math.round(2 * R + maxNH + 2 * M);
  const cx = W / 2, cy = H / 2;

  const wrap = $('#mapWrap');
  const VW = Math.max(320, wrap.clientWidth || 800);
  const VH = Math.max(280, wrap.clientHeight || 500);
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  if (!view.fitted) {
    const s = Math.min(VW / W, VH / H) * 0.92;
    view.scale = s; view.tx = (VW - W * s) / 2; view.ty = (VH - H * s) / 2; view.fitted = true;
  }

  const defs = el('defs');
  defs.innerHTML =
    `<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
       <path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker>`;
  svg.appendChild(defs);

  const vp = el('g', { id: 'viewport' });
  svg.appendChild(vp);
  applyTransform(vp);

  const pos = {};
  top.forEach((node, i) => {
    if (n === 1) { pos[node.id] = { x: cx, y: cy }; return; }
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pos[node.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  const edges = Array.isArray(DATA.edges) ? DATA.edges : [];
  const gEdges = el('g');
  vp.appendChild(gEdges);

  edges.forEach((e) => {
    const a = pos[e.tu], b = pos[e.den];
    if (!a || !b) return;
    const hot = selectedId && (e.tu === selectedId || e.den === selectedId);
    const neighbor = e.tu === selectedId ? e.den : (e.den === selectedId ? e.tu : null);
    const active = hot && neighbor === activeNeighborId;
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    const da = borderDist(NW / 2, heights[e.tu] / 2, ux, uy) + 2;
    const db = borderDist(NW / 2, heights[e.den] / 2, ux, uy) + 7;
    const ax = a.x + ux * da, ay = a.y + uy * da;
    const bx = b.x - ux * db, by = b.y - uy * db;

    // Chọn kiểu: đang xem = đậm; nóng-nhưng-không-xem (khi đã có nhãn khác) = dịu; còn lại = nóng/mờ.
    let cls = 'edge';
    if (active) cls += ' active';
    else if (hot) cls += activeNeighborId ? ' dim' : ' hot';
    const path = el('path', { class: cls, 'marker-end': 'url(#arrow)' });
    path.setAttribute('d', `M ${ax} ${ay} L ${bx} ${by}`);
    gEdges.appendChild(path);

    // Dải chạm vô hình bề ngang lớn: mũi tên nhìn thì mảnh, nhưng dễ chạm trúng.
    if (e.nhan) {
      const hit = el('path', { class: 'edge-hit', d: `M ${ax} ${ay} L ${bx} ${by}` });
      hit.addEventListener('click', (ev) => { ev.stopPropagation(); if (justPanned) return; setEdgeActive(e); });
      gEdges.appendChild(hit);
    }
  });

  top.forEach((node) => {
    const p = pos[node.id];
    const h = heights[node.id];
    const isSel = node.id === selectedId;
    const dim = selectedId && !isSel && !isNeighbor(node.id, edges, selectedId);

    const g = el('g', { class: 'node' + (isSel ? ' sel' : '') + (dim ? ' dim' : '') });
    const fo = el('foreignObject', { x: p.x - NW / 2, y: p.y - h / 2, width: NW, height: h, class: 'node__box' });
    const kids = childCountTotal(node);
    const sub = kids ? `<div class="node__stat">${kids} mục bên trong</div>` : '';
    fo.innerHTML =
      `<div xmlns="http://www.w3.org/1999/xhtml" class="node__card">
         <div class="node__kind">${escapeHtml(loaiLabel(node.loai))}</div>
         <div class="node__title">${escapeHtml(node.ten || node.id)}</div>
         ${sub}
       </div>`;
    g.appendChild(fo);
    g.addEventListener('click', (ev) => { ev.stopPropagation(); if (justPanned) return; onNodeTap(node.id); });
    vp.appendChild(g);
  });

  // CHỈ MỘT nhãn: nối A–B đang xem, đặt ở CHÍNH GIỮA mũi tên đậm. Chỉ một mũi tên nổi
  // mỗi lúc nên để giữa vẫn rõ nó thuộc nối nào — không còn đẩy-lệch rối như trước.
  if (selectedId && activeNeighborId) {
    const edge = edges.find((e) =>
      (e.tu === selectedId && e.den === activeNeighborId) ||
      (e.den === selectedId && e.tu === activeNeighborId));
    const A = pos[selectedId], B = pos[activeNeighborId];
    if (edge && edge.nhan && A && B) {
      const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const aDist = borderDist(NW / 2, heights[selectedId] / 2, ux, uy);
      const bDist = borderDist(NW / 2, heights[activeNeighborId] / 2, ux, uy);
      const ax = A.x + ux * aDist, ay = A.y + uy * aDist;   // mép ô A
      const bx = B.x - ux * bDist, by = B.y - uy * bDist;   // mép ô B
      const { w, h } = labelSize(edge.nhan);
      drawEdgeLabel(vp, (ax + bx) / 2, (ay + by) / 2, edge.nhan, w, h);  // giữa đoạn thấy được
    }
  }

  svg.onclick = () => { if (!justPanned) selectNode(null); };
  $('#mapHint').textContent = !selectedId
    ? 'Chạm ô để xem kết nối · kéo nền để di chuyển · cuộn/chụm để phóng.'
    : (activeNeighborId
      ? 'Chạm ô đó lần nữa để đi tiếp · chạm ô/mũi tên khác để xem nối khác · chạm nền để bỏ chọn.'
      : 'Chạm ô hàng xóm (hoặc mũi tên) để xem lý do nối · chạm nền để bỏ chọn.');
}

function applyTransform(g) {
  g = g || document.getElementById('viewport');
  if (g) g.setAttribute('transform', `translate(${view.tx} ${view.ty}) scale(${view.scale})`);
}
function zoomAt(f, px, py) {
  const wx = (px - view.tx) / view.scale, wy = (py - view.ty) / view.scale;
  view.scale = Math.min(4, Math.max(0.2, view.scale * f));
  view.tx = px - wx * view.scale;
  view.ty = py - wy * view.scale;
  applyTransform();
}
function zoomBy(f) {
  const wrap = $('#mapWrap');
  zoomAt(f, (wrap.clientWidth || 800) / 2, (wrap.clientHeight || 500) / 2);
}

function labelSize(text) {
  const lines = Math.max(1, Math.ceil(text.length / 26));
  return { w: 190, h: lines * 16 + 16 };
}
function drawEdgeLabel(parent, x, y, text, w, h) {
  const LW = w || 190, LH = h || 60;
  const fo = el('foreignObject', { x: x - LW / 2, y: y - LH / 2, width: LW, height: LH, class: 'edge-fo' });
  fo.innerHTML = `<div xmlns="http://www.w3.org/1999/xhtml" class="edge-label"><span>${escapeHtml(text)}</span></div>`;
  parent.appendChild(fo);
}

function isNeighbor(id, edges, sel) {
  return edges.some((e) => (e.tu === sel && e.den === id) || (e.den === sel && e.tu === id));
}
function highlightDetail() {
  document.querySelectorAll('.area').forEach((a) => {
    a.classList.toggle('hl', !!selectedId && a.dataset.id === selectedId);
  });
}
function selectNode(id) {
  selectedId = (id === selectedId) ? null : id;
  activeNeighborId = null;                 // chọn tâm mới thì xoá nhãn đang hiện
  drawMap();
  highlightDetail();
  if (selectedId) {
    const card = document.querySelector(`.area[data-id="${cssEsc(selectedId)}"]`);
    if (card) card.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }
}

// Máy trạng thái chạm ô (hai chạm để đi tiếp).
function onNodeTap(id) {
  const edges = Array.isArray(DATA.edges) ? DATA.edges : [];
  if (!selectedId || id === selectedId) { selectNode(id); return; }   // chưa chọn / chạm tâm → chọn/bỏ
  if (isNeighbor(id, edges, selectedId)) {
    if (activeNeighborId === id) { selectNode(id); }                  // lần 2 → đi tiếp (chọn B)
    else { activeNeighborId = id; drawMap(); }                        // lần 1 → hiện nhãn A–B
  } else {
    selectNode(id);                                                   // ô ở xa → chọn thẳng
  }
}

// Chạm dải mũi tên: hiện nhãn nối đó (đặt tâm nếu chưa có tâm là một đầu của nối).
function setEdgeActive(e) {
  if (selectedId === e.tu) activeNeighborId = e.den;
  else if (selectedId === e.den) activeNeighborId = e.tu;
  else { selectedId = e.tu; activeNeighborId = e.den; }
  drawMap();
  highlightDetail();
}

/* Chi tiết: danh sách khu vực → file → hàm */
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
    `<span class="row__main">
       <span class="row__title">${escapeHtml(node.ten || node.id)} <span class="tag">${escapeHtml(loaiLabel(node.loai))}</span></span>
       <span class="row__desc">${escapeHtml(node.moTa || '')}</span>
     </span>
     ${hasKids ? '<span class="row__chev">+</span>' : ''}`;
  box.appendChild(row);

  if (hasKids) {
    const kidsWrap = hel('div', { class: 'children' });
    kidsWrap.hidden = true;
    node.con.forEach((k) => kidsWrap.appendChild(leafOrArea(k)));
    box.appendChild(kidsWrap);
    row.addEventListener('click', () => {
      const open = row.getAttribute('aria-expanded') === 'true';
      row.setAttribute('aria-expanded', String(!open));
      row.querySelector('.row__chev').textContent = open ? '+' : '−';
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
    `<span class="row__main">
       <span class="row__title">${escapeHtml(node.ten || node.id)} <span class="tag">${escapeHtml(loaiLabel(node.loai))}</span></span>
       <span class="leaf__id">${escapeHtml(node.id)}</span>
       <span class="row__desc">${escapeHtml(node.moTa || '')}</span>
     </span>`;
  return leaf;
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

/* ---------- Chia sẻ sang máy khác (QR + link) ---------- */
// Vẽ mã QR ra SVG (ô đen trên nền trắng, sắc nét cho E Ink). Có viền trắng "quiet zone".
function qrSvg(text) {
  const qr = QRCode.encode(text, 'M');
  const n = qr.size, quiet = 4, dim = n + quiet * 2;
  let rects = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (qr.get(x, y)) rects += `<rect x="${x + quiet}" y="${y + quiet}" width="1" height="1"/>`;
    }
  }
  return `<svg viewBox="0 0 ${dim} ${dim}" width="100%" height="100%" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">`
    + `<rect width="${dim}" height="${dim}" fill="#ffffff"/><g fill="#000000">${rects}</g></svg>`;
}

// Link nạp-sẵn để máy khác chỉ cần MỞ là tự nuốt (không phải gõ/dán gì).
function shareLink() {
  const idx = getIndexUrl();
  const single = (DATA && getSyncUrl(projName(DATA))) || '';
  const target = idx || single; // ưu tiên mục lục; nếu chưa có thì chia sẻ dự án đang xem
  if (!target) return { url: '', isIndex: false };
  // Nếu đang mở từ github.io (https công khai) thì dùng chính nó; nếu mở từ file://
  // hay localhost thì dùng địa chỉ nhà công khai để máy khác quét được.
  const here = location.origin + location.pathname;
  const isPublic = location.protocol === 'https:' &&
    !/^(localhost|127\.|0\.0\.0\.0|\[?::1)/.test(location.hostname);
  const base = isPublic ? here : PUBLIC_APP_URL;
  return { url: base + '?sync=' + encodeURIComponent(target), isIndex: !!idx };
}

function openShare() {
  const { url, isIndex } = shareLink();
  if (!url) { toast('Chưa có link đồng bộ để chia sẻ. Hãy nạp link mục lục trước (nút "Từ link…").'); return; }
  $('#shareQr').innerHTML = qrSvg(url);
  $('#shareUrl').textContent = url;
  $('#shareNote').textContent = isIndex
    ? 'Máy khác quét QR này (hoặc mở link bên dưới) là có TẤT CẢ dự án — chỉ một lần đời.'
    : 'Chưa có mục lục — QR này chỉ chia sẻ dự án đang xem. Nạp link mục lục để chia sẻ mọi dự án.';
  $('#shareModal').hidden = false;
}
function closeShare() { $('#shareModal').hidden = true; }

/* ---------- Pan + zoom ---------- */

function bindPan() {
  const wrap = $('#mapWrap');
  const pts = new Map();
  let lastX = 0, lastY = 0, moved = false;
  let pinchDist = 0, pinchMx = 0, pinchMy = 0;
  const rel = (cx, cy) => { const r = wrap.getBoundingClientRect(); return { x: cx - r.left, y: cy - r.top }; };

  wrap.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) { moved = false; lastX = e.clientX; lastY = e.clientY; }
    else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      const m = rel((a.x + b.x) / 2, (a.y + b.y) / 2); pinchMx = m.x; pinchMy = m.y; moved = true;
    }
  });
  window.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size >= 2) {
      const [a, b] = [...pts.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const m = rel((a.x + b.x) / 2, (a.y + b.y) / 2);
      if (pinchDist > 0) zoomAt(dist / pinchDist, m.x, m.y);
      view.tx += (m.x - pinchMx); view.ty += (m.y - pinchMy); applyTransform();
      pinchDist = dist; pinchMx = m.x; pinchMy = m.y; moved = true; e.preventDefault();
      return;
    }
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    if (!moved && Math.abs(dx) + Math.abs(dy) > 5) { moved = true; wrap.classList.add('grabbing'); }
    if (moved) { view.tx += dx; view.ty += dy; applyTransform(); e.preventDefault(); }
  });
  const up = (e) => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinchDist = 0;
    if (pts.size === 1) { const p = [...pts.values()][0]; lastX = p.x; lastY = p.y; }
    if (pts.size === 0) {
      if (moved) { justPanned = true; setTimeout(() => { justPanned = false; }, 0); }
      wrap.classList.remove('grabbing');
    }
  };
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);

  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    const m = rel(e.clientX, e.clientY);
    zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, m.x, m.y);
  }, { passive: false });
}

/* ---------- Phóng to sơ đồ ra toàn màn hình ---------- */
// Phủ kín khung trình duyệt bằng class .fs (không dùng Fullscreen API → chạy mọi máy).
// Thoát bằng 3 cách: nút ✕, phím Esc, nút Back (đẩy 1 mục lịch sử khi vào, lùi khi ra).
let fsOn = false;
function refitMap() { if (DATA) { view.fitted = false; drawMap(); } }  // tự canh "Vừa" theo khung mới
function enterFs() {
  if (fsOn) return;
  fsOn = true;
  document.body.classList.add('fs');
  try { history.pushState({ docFs: true }, ''); } catch (_) {}
  refitMap();
}
function closeFs() {                       // gỡ chế độ, KHÔNG đụng lịch sử (gọi khi popstate báo về)
  if (!fsOn) return;
  fsOn = false;
  document.body.classList.remove('fs');
  refitMap();
}
function requestExitFs() {                 // ✕ / Esc: lùi lịch sử → popstate sẽ gọi closeFs()
  if (!fsOn) return;
  try { history.back(); } catch (_) { closeFs(); }
}

/* ---------- Sự kiện ---------- */

function bind() {
  const fileInput = $('#fileInput');
  const openPicker = () => fileInput.click();
  $('#btnImport').addEventListener('click', openPicker);
  $('#btnImport2').addEventListener('click', openPicker);
  fileInput.addEventListener('change', () => importFromFile(fileInput.files[0]));

  $('#btnImportUrl').addEventListener('click', () => {
    const u = prompt('Dán LINK TẢI TRỰC TIẾP (raw của Gist bí mật):\n• link MỤC LỤC → nạp mọi dự án\n• link một sodo.json → nạp một dự án');
    if (u) importAuto(u);
  });
  $('#btnRefresh').addEventListener('click', () => { if (DATA) refreshProject(projName(DATA), { silent: false }); });

  $('#btnShare').addEventListener('click', openShare);
  $('#shareClose').addEventListener('click', closeShare);
  $('#shareModal').addEventListener('click', (e) => { if (e.target.id === 'shareModal') closeShare(); });

  $('#projectPicker').addEventListener('change', (e) => switchProject(e.target.value));
  $('#btnDeleteProject').addEventListener('click', () => {
    if (!DATA) return;
    const name = projName(DATA);
    if (confirm(`Xoá "${name}" khỏi tủ? (Chỉ xoá trong app này, không đụng file gốc.)`)) deleteProject(name);
  });

  $('#zoomIn').addEventListener('click', () => zoomBy(1.25));
  $('#zoomOut').addEventListener('click', () => zoomBy(0.8));
  $('#zoomReset').addEventListener('click', () => { view.fitted = false; drawMap(); });

  // Toàn màn hình: vào / ra + phím Esc + nút Back
  $('#btnFsEnter').addEventListener('click', enterFs);
  $('#btnFsExit').addEventListener('click', requestExitFs);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && fsOn) requestExitFs(); });
  window.addEventListener('popstate', () => { if (fsOn) closeFs(); });

  bindPan();
  let rzT; window.addEventListener('resize', () => {
    clearTimeout(rzT); rzT = setTimeout(() => { if (DATA) { view.fitted = false; drawMap(); } }, 160);
  });

  const dz = $('#dropZone');
  ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) importFromFile(f); });
}

/* ---------- Khởi động ---------- */

async function boot() {
  bind();
  try {
    const lib = loadLib();
    const old = localStorage.getItem(OLD_DATA_KEY);
    if (old && !Object.keys(lib).length) {
      const d = JSON.parse(old);
      lib[projName(d)] = d; saveLib(lib); setCurrent(projName(d));
    }
    localStorage.removeItem(OLD_DATA_KEY);
  } catch (_) {}

  // Deep-link ?sync=<link>: máy mới chỉ cần MỞ link (hoặc quét QR) là tự nuốt.
  const params = new URLSearchParams(location.search);
  const syncParam = params.get('sync');
  if (syncParam) {
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (_) {} // dọn URL cho sạch
    await importAuto(syncParam);
  }

  const lib = loadLib();
  const names = Object.keys(lib);
  if (names.length) {
    const iu = getIndexUrl();
    if (!DATA) {
      const cur = getCurrent();
      const pick = lib[cur] ? cur : names[0];
      // Có mục lục: hiện bản trong tủ NGAY (khỏi tải), để mục lục tự làm mới bên dưới.
      // Không có mục lục: switchProject sẽ tự kéo bản mới của riêng dự án đó.
      if (iu && !syncParam) showProjectFromLib(pick); else switchProject(pick);
    }
    // Đã có mục lục? Lặng lẽ tải lại để DỰ ÁN MỚI (skill vừa thêm) tự hiện, không cần làm gì.
    if (iu && !syncParam) importAuto(iu, { silent: true });
    return;
  }
  try {
    const res = await fetch('sample-sodo.json', { cache: 'no-store' });
    if (res.ok) { useData(await res.json(), { addToLib: false }); return; }
  } catch (_) {}
  showEmpty(true);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
boot();
