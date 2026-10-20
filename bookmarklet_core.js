/* Shopee Wishlist bookmarklet v3 — sort + filter + nama toko + cache. Dijalankan di origin shopee.co.id.
   Aman: fetch same-origin pakai session sendiri, cookie gak dikirim ke mana pun. */
(async () => {
  const EXIST = document.getElementById('swl-root');
  if (EXIST) { EXIST.remove(); return; }

  const IMG = 'https://down-id.img.susercontent.com/file/';
  const rp = v => Math.round((v || 0) / 100000);
  const fmt = n => (n || 0).toLocaleString('id-ID');
  const rupiah = n => 'Rp' + fmt(n);
  const zzz = ms => new Promise(r => setTimeout(r, ms));
  const CACHE_KEY = 'swl_cache_v2';

  const root = document.createElement('div');
  root.id = 'swl-root';
  root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#0f1115;color:#e7eaee;font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;display:flex;flex-direction:column';
  document.body.appendChild(root);

  // style: spinner + disabled biar keliatan lagi kerja
  const stl = document.createElement('style');
  stl.textContent = '@keyframes swl-spin{to{transform:rotate(360deg)}}'
    + '#swl-refresh.loading #swl-ico{display:inline-block;animation:swl-spin .9s linear infinite}'
    + '#swl-refresh:disabled{opacity:.5;cursor:default}';
  document.head.appendChild(stl);

  const sel = 'padding:7px 10px;background:#0f1115;border:1px solid #2a3140;border-radius:8px;color:#e7eaee;outline:none;font-size:13px';
  const inp = 'padding:7px 10px;background:#0f1115;border:1px solid #2a3140;border-radius:8px;color:#e7eaee;outline:none;font-size:13px;width:88px';
  const lbl = 'display:flex;align-items:center;gap:5px;color:#c3c9d4;font-size:13px;white-space:nowrap';
  const btn = 'padding:8px 12px;background:#2a3140;border:0;border-radius:8px;color:#e7eaee;cursor:pointer;font-size:13px';

  root.innerHTML = `
    <div style="padding:12px 20px;background:#171a21;border-bottom:1px solid #262b36;display:flex;flex-direction:column;gap:10px;position:sticky;top:0;z-index:2">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="font-size:17px;font-weight:700;white-space:nowrap">&#10084; Wishlist Shopee</div>
        <div id="swl-count" style="color:#8b93a1;white-space:nowrap">memuat&hellip;</div>
        <span id="swl-info" style="color:#5a6270;font-size:12px;white-space:nowrap"></span>
        <button id="swl-refresh" title="Segarkan dari Shopee" aria-label="Segarkan" style="${btn};padding:8px 11px"><span id="swl-ico">&#8635;</span></button>
        <input id="swl-search" placeholder="cari item&hellip;" style="flex:1;min-width:120px;padding:8px 12px;background:#0f1115;border:1px solid #2a3140;border-radius:8px;color:#e7eaee;outline:none">
        <button id="swl-json" style="${btn}">JSON</button>
        <button id="swl-csv" style="${btn}">CSV</button>
        <button id="swl-close" style="padding:8px 14px;background:#ee4d2d;border:0;border-radius:8px;color:#fff;cursor:pointer;font-weight:600">Tutup</button>
      </div>
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <label style="${lbl}">Urutkan
            <select id="swl-sort" style="${sel}">
              <option value="recent">Terbaru favorit</option>
              <option value="price_asc">Harga termurah</option>
              <option value="price_desc">Harga termahal</option>
              <option value="sold">Terjual terbanyak</option>
              <option value="liked">Paling disukai</option>
              <option value="rating">Rating tertinggi</option>
              <option value="name">Nama A-Z</option>
            </select>
          </label>
          <label style="${lbl}">Harga
            <input id="swl-pmin" type="number" min="0" placeholder="min" style="${inp}">
            <span style="color:#5a6270">&ndash;</span>
            <input id="swl-pmax" type="number" min="0" placeholder="max" style="${inp}">
          </label>
          <label style="${lbl}">Rating min
            <select id="swl-minr" style="${sel}">
              <option value="0">semua</option><option value="3">3.0+</option>
              <option value="4">4.0+</option><option value="4.5">4.5+</option><option value="4.8">4.8+</option>
            </select>
          </label>
          <label style="${lbl}"><input id="swl-official" type="checkbox"> Official</label>
          <label style="${lbl}"><input id="swl-instock" type="checkbox"> Stok ada</label>
          <button id="swl-reset" style="padding:6px 12px;background:#2a3140;border:0;border-radius:8px;color:#c3c9d4;cursor:pointer;font-size:13px">Reset</button>
        </div>
        <div id="swl-pg" style="display:none;align-items:center;gap:8px;white-space:nowrap">
          <button id="swl-prev" style="width:30px;height:28px;background:#2a3140;border:0;border-radius:8px;color:#e7eaee;cursor:pointer;font-size:15px;line-height:1">&#8249;</button>
          <span id="swl-pageinfo" style="color:#c3c9d4;font-size:13px;min-width:86px;text-align:center"></span>
          <button id="swl-next" style="width:30px;height:28px;background:#2a3140;border:0;border-radius:8px;color:#e7eaee;cursor:pointer;font-size:15px;line-height:1">&#8250;</button>
        </div>
      </div>
    </div>
    <div id="swl-status" style="padding:40px;text-align:center;color:#8b93a1">Mengambil wishlist&hellip;</div>
    <div id="swl-grid" style="display:none;padding:18px 20px;overflow:auto;flex:1"></div>`;

  const $ = id => root.querySelector('#' + id);
  $('swl-close').onclick = () => root.remove();

  const toSlim = all => all.map((i, k) => ({
    idx: k, // posisi asli dari API = urutan paling baru di-favorit
    itemid: i.itemid, shopid: i.shopid, name: i.name || '',
    shop: i.shop_name || '', loc: i.shop_location || '',
    price: rp(i.price), currency: i.currency, stock: i.stock || 0,
    sold: i.sold || 0, historical_sold: i.historical_sold || 0,
    liked_count: i.liked_count || 0,
    rating: (i.item_rating && i.item_rating.rating_star) || 0,
    official: !!i.is_official_shop, ctime: i.ctime || 0,
    image: i.image ? IMG + i.image : null,
    url: 'https://shopee.co.id/product/' + i.shopid + '/' + i.itemid,
  }));

  async function fetchAll(onProgress) {
    let cursor = 0, all = [], pages = 0;
    while (pages < 200) {
      if (onProgress) onProgress(all.length, pages + 1);
      const r = await fetch('/api/v4/pages/get_liked_items?limit=100&cursor=' + cursor, { credentials: 'include' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      if (j.error && !j.data) throw new Error(j.error_msg || ('error ' + j.error));
      const d = j.data || {};
      all = all.concat(d.items || []);
      pages++;
      const p = d.paging || {};
      if (p.nomore || !p.cursor || p.cursor === cursor || !d.items || !d.items.length) break;
      cursor = p.cursor;
      await zzz(333); // jeda ~3 req/detik biar gak kena anti-bot
    }
    return toSlim(all);
  }

  const loadCache = () => { try { const o = JSON.parse(localStorage.getItem(CACHE_KEY)); return (o && Array.isArray(o.items) && o.items.length) ? o : null; } catch (e) { return null; } };
  const saveCache = items => { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items })); } catch (e) { /* kuota penuh: skip cache */ } };
  let _ageTs = null, _ageOn = false;
  const setInfo = (ts, extra) => {
    if (!ts && !extra) { $('swl-info').textContent = ''; _ageOn = false; return; }
    let t = extra || '';
    if (ts) {
      _ageTs = ts; _ageOn = true;
      const m = Math.floor((Date.now() - ts) / 60000);
      t = (t ? t + ' \u00b7 ' : '') + (m < 1 ? 'baru saja' : m + ' mnt lalu');
    } else { _ageOn = false; } // state busy/error: jangan ditimpa timer
    $('swl-info').textContent = t;
  };
  // timeago realtime: refresh umur cache tiap 10s tanpa perlu reload (berhenti sendiri kalau overlay ditutup)
  let _infoTick = setInterval(() => {
    if (!document.body.contains(root)) { clearInterval(_infoTick); return; }
    if (_ageOn) setInfo(_ageTs);
  }, 10000);

  let slim = [];
  const grid = $('swl-grid'), countEl = $('swl-count');
  const state = { q: '', sort: 'recent', pmin: null, pmax: null, minr: 0, official: false, instock: false };

  const card = it => `
    <a href="${it.url}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;background:#171a21;border:1px solid #262b36;border-radius:12px;overflow:hidden;display:flex;flex-direction:column">
      <div style="aspect-ratio:1;background:#0f1115;display:flex;align-items:center;justify-content:center">
        ${it.image ? `<img src="${it.image}" loading="lazy" style="width:100%;height:100%;object-fit:cover">` : '<span style="color:#3a4150">no img</span>'}
      </div>
      <div style="padding:10px 12px;display:flex;flex-direction:column;gap:4px">
        <div style="font-size:13px;line-height:1.35;height:36px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${it.name}</div>
        <div style="color:#ee4d2d;font-weight:700;font-size:15px">${rupiah(it.price)}${it.stock === 0 ? ' <span style="color:#8b93a1;font-weight:400;font-size:12px">\u00b7 habis</span>' : ''}</div>
        <div style="color:#8b93a1;font-size:12px">&#9733; ${it.rating.toFixed(1)} &middot; ${fmt(it.sold)} terjual &middot; ${fmt(it.liked_count)} suka${it.official ? ' &middot; <span style="color:#ee4d2d">Official</span>' : ''}</div>
        ${it.shop ? `<div style="color:#6b7280;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${it.shop}${it.loc ? ' &middot; ' + it.loc : ''}</div>` : ''}
      </div>
    </a>`;

  const draw = list => {
    if (!list.length) { grid.innerHTML = '<div style="padding:40px;text-align:center;color:#8b93a1">Tidak ada item yang cocok.</div>'; return; }
    grid.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px">' + list.map(card).join('') + '</div>';
  };

  let page = 1;
  const PER = 49;

  function apply(resetPage) {
    if (resetPage !== false) page = 1;
    let list = slim.slice();
    if (state.q) list = list.filter(i => i.name.toLowerCase().includes(state.q) || (i.shop && i.shop.toLowerCase().includes(state.q)));
    if (state.official) list = list.filter(i => i.official);
    if (state.instock) list = list.filter(i => i.stock > 0);
    if (state.minr) list = list.filter(i => i.rating >= state.minr);
    if (state.pmin != null && !isNaN(state.pmin)) list = list.filter(i => i.price >= state.pmin);
    if (state.pmax != null && !isNaN(state.pmax)) list = list.filter(i => i.price <= state.pmax);
    list.sort((a, b) => {
      switch (state.sort) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'sold': return b.sold - a.sold;
        case 'liked': return b.liked_count - a.liked_count;
        case 'rating': return b.rating - a.rating;
        case 'name': return a.name.localeCompare(b.name);
        default: return a.idx - b.idx; // 'recent': urutan asli API (paling baru di-favorit di atas)
      }
    });
    root._filtered = list;
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / PER));
    if (page > pages) page = pages;
    countEl.textContent = fmt(total) + ' / ' + fmt(slim.length) + ' item';
    grid.style.display = 'block';
    $('swl-status').style.display = 'none';
    draw(list.slice((page - 1) * PER, page * PER));
    // pager
    const pg = $('swl-pg');
    if (pages <= 1) { pg.style.display = 'none'; }
    else {
      pg.style.display = 'flex';
      $('swl-prev').disabled = page <= 1;
      $('swl-next').disabled = page >= pages;
      $('swl-pageinfo').textContent = 'Hal ' + page + ' / ' + pages;
    }
  }

  function goPage(p) { page = p; apply(false); grid.scrollTop = 0; }
  $('swl-prev').onclick = () => goPage(Math.max(1, page - 1));
  $('swl-next').onclick = () => goPage(page + 1);

  $('swl-search').oninput = e => { state.q = e.target.value.trim().toLowerCase(); apply(); };
  $('swl-sort').onchange = e => { state.sort = e.target.value; apply(); };
  $('swl-minr').onchange = e => { state.minr = parseFloat(e.target.value) || 0; apply(); };
  $('swl-official').onchange = e => { state.official = e.target.checked; apply(); };
  $('swl-instock').onchange = e => { state.instock = e.target.checked; apply(); };
  $('swl-pmin').oninput = e => { state.pmin = e.target.value === '' ? null : Number(e.target.value); apply(); };
  $('swl-pmax').oninput = e => { state.pmax = e.target.value === '' ? null : Number(e.target.value); apply(); };
  $('swl-reset').onclick = () => {
    state.q = ''; state.sort = 'recent'; state.pmin = null; state.pmax = null; state.minr = 0; state.official = false; state.instock = false;
    $('swl-search').value = ''; $('swl-sort').value = 'recent'; $('swl-minr').value = '0';
    $('swl-official').checked = false; $('swl-instock').checked = false; $('swl-pmin').value = ''; $('swl-pmax').value = '';
    apply();
  };

  const refresh = async () => {
    const b = $('swl-refresh');
    b.disabled = true; b.classList.add('loading');
    setInfo(null, 'menyegarkan\u2026');
    try {
      slim = await fetchAll(n => setInfo(null, 'menyegarkan\u2026 ' + fmt(n) + ' item'));
      saveCache(slim); apply(); setInfo(Date.now());
    } catch (e) { setInfo(null, 'gagal: ' + e.message); }
    b.disabled = false; b.classList.remove('loading');
  };
  $('swl-refresh').onclick = refresh;

  const dl = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
  $('swl-json').onclick = () => dl('shopee_wishlist.json', JSON.stringify(root._filtered || slim, null, 2), 'application/json');
  $('swl-csv').onclick = () => {
    const rows = (root._filtered || slim);
    const head = ['name', 'price_idr', 'sold', 'liked_count', 'rating', 'official', 'stock', 'shop', 'shop_location', 'shopid', 'itemid', 'url'];
    const esc = v => '"' + String(v).split('"').join('""') + '"';
    const line = i => [i.name, i.price, i.sold, i.liked_count, i.rating.toFixed(2), i.official, i.stock, i.shop, i.loc, i.shopid, i.itemid, i.url].map(esc).join(',');
    dl('shopee_wishlist.csv', [head.join(','), ...rows.map(line)].join('\n'), 'text/csv');
  };

  // --- load: kalau ada cache, tampil instan TANPA fetch. Fetch hanya saat gak ada cache atau klik Segarkan ---
  const cache = loadCache();
  if (cache) {
    // idx = posisi dalam cache (= urutan API), buat cache lama yang belum punya idx
    slim = cache.items.map((it, k) => { it.idx = k; return it; });
    apply(); setInfo(cache.ts);
  } else {
    $('swl-status').style.display = 'block'; $('swl-grid').style.display = 'none';
    try {
      slim = await fetchAll((n, p) => { $('swl-status').textContent = 'Memuat\u2026 ' + fmt(n) + ' item (halaman ' + p + ')'; });
      saveCache(slim); apply(); setInfo(Date.now());
    } catch (e) { $('swl-status').innerHTML = '<b style="color:#ff6b6b">Gagal:</b> ' + e.message + '<br><span style="color:#8b93a1">Pastikan sudah login shopee.co.id di tab ini.</span>'; }
  }
})();
