(function () {
  const GRID_ID = 'productsGrid';
  const JSON_URL = 'data/products.json';
  const PLACEHOLDER_IMG = 'images/placeholder.png';
  const STOCK_KEY = 'mirlos-stock';

  const slugify = (s) =>
    (String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 64)) || ('item-' + Math.random().toString(36).slice(2, 8));

  function productImgSrc(p) {
    if (typeof p.image === 'string' && p.image.trim()) return p.image;
    if (typeof p.img === 'string' && p.img.trim()) return p.img;
    return PLACEHOLDER_IMG;
  }

  function normalizeProduct(p) {
    const id = p.id || slugify(p.title || '');
    const title = p.title || 'Untitled';
    const price = (typeof p.price === 'number' ? p.price : Number(p.price)) || 0;
    const link = p.link || '#';
    const category = (p.category || '').toLowerCase();
    const images = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
    const image = productImgSrc({ image: images[0] || p.image });
    return { ...p, id, title, price, link, category, image, images };
  }

  function renderCard(p) {
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <a class="card-thumb" href="${p.link}">
        <img alt="${p.title}">
      </a>
      <div class="card-body">
        <h3 class="card-title">${p.title}</h3>
        <div class="card-meta"><span class="price">$${p.price.toFixed(2)}</span></div>
        <div class="muted" style="font-size:13px;margin:6px 0;">
          ${p.currentStock > 5 ? '' :
            p.currentStock > 0 ? `Only ${p.currentStock} left` : `Sold Out`}
        </div>
        <button class="btn btn-secondary add-to-cart" data-id="${p.id}" ${p.currentStock < 1 ? 'disabled' : ''}>
          ${p.currentStock < 1 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    `;
    const imgEl = el.querySelector('img');
    imgEl.loading = 'lazy';
    imgEl.src = p.image || PLACEHOLDER_IMG;
    imgEl.onerror = () => (imgEl.src = PLACEHOLDER_IMG);
    return el;
  }

  function showMessage(msg) {
    const grid = document.getElementById(GRID_ID);
    if (!grid) return;
    const box = document.createElement('div');
    box.style.padding = '24px';
    box.style.textAlign = 'center';
    box.style.border = '1px dashed #ccc';
    box.style.borderRadius = '8px';
    box.textContent = msg;
    grid.innerHTML = '';
    grid.appendChild(box);
  }

  let allProducts = [];

  async function loadProducts() {
    try {
      const res = await fetch(`${JSON_URL}?cache=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      if (!Array.isArray(raw)) throw new Error('JSON is not an array');

      allProducts = raw.map(normalizeProduct);

      // === Inventory (client-side seed/persist) ===
      let stock = {};
      try { stock = JSON.parse(localStorage.getItem(STOCK_KEY)) || {}; } catch {}
      allProducts.forEach(p => {
        const n = Number(p.inventory ?? 0);
        if (Number.isFinite(n) && !(p.id in stock)) stock[p.id] = n;
      });
      localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
      allProducts = allProducts.map(p => ({ ...p, currentStock: stock[p.id] ?? 0 }));

      // Expose for cart.js
      window.__CatalogById = Object.fromEntries(allProducts.map(p => [p.id, p]));

      render(allProducts);
    } catch (err) {
      console.error('[products.js] Failed to load products:', err);
      showMessage('Could not load products (see console).');
    }
  }

  function render(list) {
    const grid = document.getElementById(GRID_ID);
    if (!grid) { console.error(`[products.js] Missing #${GRID_ID} container`); return; }
    grid.innerHTML = '';
    list.forEach(p => grid.appendChild(renderCard(p)));
    if (list.length === 0) showMessage('No items to show yet.');
  }

  function normalizeCat(v) {
    const s = String(v || '').toLowerCase().trim();
    const map = {
      'toys': 'toys & games',
      'toys & games': 'toys & games',
      'home': 'home',
      'home decor': 'home',
      'purses': 'purses',
      'purses & accessories': 'purses',
      'media': 'media',
      'apothecary': 'apothecary',
      'clothing': 'clothing',
      'collectibles': 'collectibles',
      'antiques': 'antiques',
      'electronics': 'electronics',
      'rare': 'rare'
    };
    return map[s] || s;
  }

  
  // Dropdown category filter
  document.addEventListener('change', (e) => {
    const sel = e.target.closest('#categoryFilter');
    if (!sel) return;
    const cat = normalizeCat(sel.value);
    if (!cat) { render(allProducts); return; } // All
    const filtered = allProducts.filter(p => normalizeCat(p.category) === cat);
    render(filtered);
  });
document.addEventListener('click', (e) => {
    const tile = e.target.closest('a.tile');
    if (!tile) return;
    const cat = normalizeCat(tile.getAttribute('data-filter'));
    if (!cat || !allProducts.length) return;
    const filtered = allProducts.filter(p => (p.category || '').toLowerCase() === cat);
    render(filtered);
    const featured = document.getElementById('featured');
    if (featured) featured.scrollIntoView({ behavior: 'smooth', block: 'start' });
    e.preventDefault();
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    const id = btn.dataset.id;
    if (id && window.MirlosCart?.add) window.MirlosCart.add(id, 1);
  });

  document.addEventListener('DOMContentLoaded', loadProducts);
})();
