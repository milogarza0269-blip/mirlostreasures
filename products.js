(function () {
  const GRID_ID = 'productsGrid';
  // Load products.json from the same folder as index.html
  const JSON_URL = 'products.json';
  const PLACEHOLDER_IMG = 'images/placeholder.png';
  const STOCK_KEY = 'mirlos-stock';

  function slugify(s) {
    const out = String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 64);
    if (out) return out;
    return 'item-' + Math.random().toString(36).slice(2, 8);
  }

  function money(v) {
    const n = Number(v || 0);
    if (!isFinite(n)) return '$0.00';
    return '$' + n.toFixed(2);
  }

  function loadStock() {
    try {
      const raw = localStorage.getItem(STOCK_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      console.warn('[products] failed to load stock', e);
      return {};
    }
  }

  function saveStock(stock) {
    try {
      localStorage.setItem(STOCK_KEY, JSON.stringify(stock || {}));
    } catch (e) {
      console.warn('[products] failed to save stock', e);
    }
  }

  // Category normalizer used by both dropdown + tiles
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
      'beauty': 'apothecary',
      'beauty & soaps': 'apothecary',
      'clothing': 'clothing',
      'collectibles': 'collectibles',
      'antiques': 'antiques',
      'electronics': 'electronics',
      'rare': 'rare'
    };
    return map[s] || s;
  }

  function pickImageFrom(p) {
    if (typeof p.image === 'string' && p.image.trim()) return p.image.trim();
    if (Array.isArray(p.images) && p.images.length) {
      const first = p.images.find(x => typeof x === 'string' && x.trim());
      if (first) return first.trim();
    }
    if (typeof p.img === 'string' && p.img.trim()) return p.img.trim();
    return PLACEHOLDER_IMG;
  }

  function normalizeProduct(raw, idx) {
    const p = Object.assign({}, raw || {});
    p.id = p.id || slugify(p.title || ('item-' + (idx + 1)));
    p.title = p.title || 'Untitled Item';
    p.price = Number(p.price || 0);
    if (!isFinite(p.price)) p.price = 0;
    p.category = normalizeCat(p.category || '');
    p.description = p.description || '';
    p.condition = p.condition || p.cond || '';
    if (typeof p.images === 'string') {
      p.images = p.images.split(',').map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(p.images)) {
      p.images = [];
    }
    p.image = pickImageFrom(p);
    p.featured = Boolean(p.featured);

    // inventory / stock
    if (p.inventory == null && p.stock != null) p.inventory = Number(p.stock);
    if (!isFinite(p.inventory)) p.inventory = null;
    return p;
  }

  function buildCard(p) {
    const stockText = (() => {
      if (p.inventory == null) return '';
      if (p.inventory <= 0) return '<div class="stock stock-out">Sold out</div>';
      if (p.inventory <= 2) return `<div class="stock stock-low">Only ${p.inventory} left</div>`;
      return `<div class="stock">In stock: ${p.inventory}</div>`;
    })();

    return `
      <article class="product-card" data-id="${p.id}">
        <div class="product-thumb">
          <img src="${p.image}" alt="${p.title.replace(/"/g, '&quot;')}" loading="lazy">
        </div>
        <div class="product-body">
          <h3 class="product-title">${p.title}</h3>
          ${p.description ? `<p class="product-desc">${p.description}</p>` : ''}
          <div class="product-meta">
            <span class="product-price">${money(p.price)}</span>
            ${p.condition ? `<span class="product-cond">${p.condition}</span>` : ''}
          </div>
          ${stockText}
          <button class="btn btn-primary add-to-cart" data-id="${p.id}" type="button">
            Add to Cart
          </button>
        </div>
      </article>
    `;
  }

  let allProducts = [];
  let stockById = loadStock();

  function render(products) {
    const grid = document.getElementById(GRID_ID);
    if (!grid) return;
    if (!products || !products.length) {
      grid.innerHTML = '<p class="muted" style="padding:16px;text-align:center">No products to show yet.</p>';
      return;
    }
    grid.innerHTML = products.map(buildCard).join('\n');
  }

  async function loadProducts() {
    const grid = document.getElementById(GRID_ID);
    if (!grid) return;

    grid.innerHTML = '<p class="muted" style="padding:16px;text-align:center">Loading products…</p>';

    try {
      const res = await fetch(JSON_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const raw = await res.json();
      if (!Array.isArray(raw)) throw new Error('products.json must be a JSON array');
      allProducts = raw.map(normalizeProduct);

      // Build global catalog map for cart.js
      const byId = {};
      allProducts.forEach(p => {
        byId[p.id] = p;
        if (p.inventory != null && stockById[p.id] == null) {
          stockById[p.id] = Number(p.inventory);
        }
      });
      window.__CatalogById = byId;
      window.MirlosCatalog = allProducts;
      saveStock(stockById);

      render(allProducts);
    } catch (err) {
      console.error('[products] failed to load products.json', err);
      grid.innerHTML = `
        <p class="muted" style="padding:16px;text-align:center">
          Could not load products. Make sure <code>products.json</code> is uploaded next to <code>index.html</code>.
        </p>
      `;
    }
  }

  // === Filters ===

  // Dropdown
  document.addEventListener('change', function (e) {
    const sel = e.target.closest('#categoryFilter');
    if (!sel) return;
    const val = sel.value || '';
    const cat = normalizeCat(val);
    if (!cat) {
      render(allProducts);
      return;
    }
    const filtered = allProducts.filter(p => normalizeCat(p.category) === cat);
    render(filtered);
  });

  // Tiles / footer links using data-filter
  document.addEventListener('click', function (e) {
    const tile = e.target.closest('[data-filter]');
    if (!tile) return;
    const raw = tile.getAttribute('data-filter') || '';
    const cat = normalizeCat(raw);
    if (!cat) return;
    const filtered = allProducts.filter(p => normalizeCat(p.category) === cat);
    if (filtered.length) {
      render(filtered);
      const featured = document.getElementById('featured');
      if (featured) featured.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    e.preventDefault();
  });

  // Add to cart buttons
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    if (!id) return;
    if (window.MirlosCart && typeof window.MirlosCart.add === 'function') {
      window.MirlosCart.add(id, 1);
    } else {
      console.warn('[products] MirlosCart.add not available');
    }
  });

  document.addEventListener('DOMContentLoaded', loadProducts);
})();
