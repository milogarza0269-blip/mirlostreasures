(function () {
  const GRID_ID = 'productsGrid';
  const JSON_URL = 'products.json';
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
    if (typeof p.photo === 'string' && p.photo.trim()) return p.photo;
    if (Array.isArray(p.images) && p.images.length && p.images[0]) return p.images[0];
    if (typeof p.thumbnail === 'string' && p.thumbnail.trim()) return p.thumbnail;
    return PLACEHOLDER_IMG;
  }

  function normalizeCategory(raw) {
    if (!raw) return '';
    const s = String(raw).toLowerCase().trim();
    const map = {
      'home': 'home',
      'home decor': 'home',
      'home décor': 'home',
      'decor': 'home',
      'holiday': 'holiday',
      'christmas': 'holiday',
      'toys': 'toys',
      'toy': 'toys',
      'collectible': 'collectibles',
      'collectibles': 'collectibles',
      'media': 'media',
      'cassette': 'media',
      'cassettes': 'media',
      'vhs': 'media',
      'clothing': 'clothing',
      'clothes': 'clothing',
      'fashion': 'clothing',
      'purses': 'purses',
      'bags': 'purses',
      'bag': 'purses',
      'beauty': 'beauty',
      'bath & body': 'beauty',
      'bath and body': 'beauty',
      'soap': 'beauty',
      'soaps': 'beauty',
      'apothecary': 'beauty',
      'rare': 'rare',
      'grail': 'rare'
    };
    return map[s] || s;
  }

  function mapProduct(p) {
    const id = String(p.id || slugify(p.title || p.name || 'item'));
    const price = (typeof p.price === 'number' ? p.price : Number(p.price)) || 0;
    const link = p.url || p.link || '#';
    const category = p.category || p.cat || p.type || '';
    const stockInfo = loadStock();
    const currentStock = typeof stockInfo[id] === 'number'
      ? stockInfo[id]
      : (typeof p.stock === 'number' ? p.stock : Number(p.stock) || 0);

    return {
      id,
      title: p.title || p.name || 'Untitled Item',
      description: p.description || p.desc || '',
      price,
      image: productImgSrc(p),
      link,
      category,
      currentStock
    };
  }

  function loadStock() {
    try {
      const raw = localStorage.getItem(STOCK_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      console.warn('Could not load stock from localStorage', e);
      return {};
    }
  }

  function saveStock(stock) {
    try {
      localStorage.setItem(STOCK_KEY, JSON.stringify(stock || {}));
    } catch (e) {
      console.warn('Could not save stock', e);
    }
  }

  let allProducts = [];
  window.__CatalogById = {};

  function render(products) {
    const grid = document.getElementById(GRID_ID);
    if (!grid) return;
    if (!Array.isArray(products) || !products.length) {
      grid.innerHTML = '<p class="muted">No products to show right now. Check back soon!</p>';
      return;
    }

    const cards = products.map((p) => {
      const el = document.createElement('article');
      el.className = 'card';
      el.innerHTML = `
        <div class="card-img-wrap">
          <img src="${PLACEHOLDER_IMG}" alt="${p.title}" />
        </div>
        <div class="card-body">
          <h3 class="card-title">${p.title}</h3>
          <div class="card-meta">
            <span class="price">$${p.price.toFixed(2)}</span>
          </div>
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
      imgEl.onerror = () => { imgEl.src = PLACEHOLDER_IMG; };
      return el.outerHTML;
    });

    grid.innerHTML = cards.join('\n');
  }

  async function fetchProducts() {
    try {
      const res = await fetch(JSON_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('JSON root must be an array');
      return data.map(mapProduct);
    } catch (e) {
      console.error('Failed to load products.json', e);
      const grid = document.getElementById(GRID_ID);
      if (grid) {
        grid.innerHTML = '<p class="error">Could not load products. Please try again later.</p>';
      }
      return [];
    }
  }

  async function loadProducts() {
    const rawProducts = await fetchProducts();
    if (!rawProducts.length) return;

    allProducts = rawProducts.slice().sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    );

    window.__CatalogById = {};
    allProducts.forEach(p => { window.__CatalogById[p.id] = p; });

    render(allProducts);

    const select = document.getElementById('categoryFilter');
    if (select) {
      const cats = Array.from(new Set(allProducts.map(p => normalizeCategory(p.category)).filter(Boolean))).sort();
      const currentVal = select.value;
      select.innerHTML = '<option value="">All Categories</option>' +
        cats.map(c => `<option value="${c}">${c[0].toUpperCase()}${c.slice(1)}</option>`).join('');
      select.value = currentVal || '';
    }
  }

  function normalizeCat(value) {
    return normalizeCategory(value);
  }

  document.addEventListener('change', (e) => {
    const sel = e.target.closest('#categoryFilter');
    if (!sel) return;
    const cat = normalizeCat(sel.value);
    if (!cat) { render(allProducts); return; }
    const filtered = allProducts.filter(p => normalizeCat(p.category) === cat);
    render(filtered);
  });

  document.addEventListener('click', (e) => {
    const tile = e.target.closest('a.tile');
    if (!tile) return;
    const cat = normalizeCat(tile.getAttribute('data-filter'));
    if (!cat || !allProducts.length) return;
    const filtered = allProducts.filter(p => normalizeCat(p.category) === cat);
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
