// products.js
// Mirlos Treasures catalog + renderer

(function () {
  // ---------- CATALOG ----------
  const catalog = [
    {
      id: "mk-satchel",
      title: "👜 MICHAEL KORS Colorblock Pebbled Leather Satchel",
      price: 150,
      category: "purses",
      description:
        "Sophisticated and structured, this MICHAEL KORS satchel features a timeless colorblock design in black and cream.",
      condition: "new",
      image: "images/mkpanda-1.jpg",
      images: [
        "images/mkpanda-1.jpg",
        "images/mkpanda-2.jpg",
        "images/mkpanda-3.jpg",
        "images/mkpanda-4.jpg"
      ],
      featured: true,
      inventory: 1
    },
    {
      id: "sugar-skull-pair",
      title: "💀 Hand-Painted Ceramic Sugar Skull Pair",
      price: 70,
      category: "home",
      description:
        "Vibrant, detailed, and full of character – this pair of hand-painted Day of the Dead sugar skulls makes a bold display.",
      condition: "new",
      image: "images/spsod-1.jpg",
      images: [
        "images/spsod-1.jpg",
        "images/spsod-2.jpg",
        "images/spsod-3.jpg"
      ],
      featured: true,
      inventory: 1
    }
  ];

  // ---------- GLOBAL MAP (for cart.js) ----------
  const byId = {};
  catalog.forEach((p) => {
    p.currentStock =
      typeof p.inventory === "number" && p.inventory > 0 ? p.inventory : 1;
    byId[p.id] = p;
  });

  window.__Catalog = catalog;
  window.__CatalogById = byId;

  // ---------- RENDERING ----------
  const grid = document.getElementById("productsGrid");
  const categoryFilter = document.getElementById("categoryFilter");
  const filterTiles = document.querySelectorAll("[data-filter]");

  function money(v) {
    return "$" + Number(v || 0).toFixed(2);
  }

  function getFilteredProducts(category) {
    let items = catalog.filter((p) => p.featured); // only featured
    if (category) {
      const c = String(category).toLowerCase();
      items = items.filter((p) => String(p.category).toLowerCase() === c);
    }
    return items;
  }

  function renderProducts(category) {
    if (!grid) return;

    const products = getFilteredProducts(category);

    if (!products.length) {
      grid.innerHTML =
        '<p class="muted" style="padding:16px;text-align:center">No products available yet. Check back soon!</p>';
      return;
    }

    grid.innerHTML = products
      .map(
        (p) => `
      <article class="product-card" data-id="${p.id}">
        <div class="product-media">
          <img src="${p.image}" alt="${p.title}">
        </div>
        <div class="product-body">
          <h3 class="product-title">${p.title}</h3>
          <p class="product-price">${money(p.price)}</p>
          ${
            p.description
              ? `<p class="product-desc">${p.description}</p>`
              : ""
          }
          <button class="btn btn-primary add-to-cart" data-id="${p.id}">
            Add to Cart
          </button>
        </div>
      </article>
    `
      )
      .join("");
  }

  // initial render
  renderProducts("");

  // ---------- FILTER HOOKS ----------
  function applyCategory(category) {
    const cat = category || "";
    renderProducts(cat);
    if (categoryFilter) categoryFilter.value = cat;
  }

  categoryFilter?.addEventListener("change", (e) => {
    applyCategory(e.target.value || "");
  });

  filterTiles.forEach((tile) => {
    tile.addEventListener("click", (e) => {
      const cat = tile.getAttribute("data-filter") || "";
      applyCategory(cat);
    });
  });

  // ---------- ADD TO CART HOOK ----------
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    if (window.MirlosCart && typeof window.MirlosCart.add === "function") {
      window.MirlosCart.add(id, 1);
    } else {
      console.warn("[products] MirlosCart not ready, clicked id:", id);
    }
  });
})();
