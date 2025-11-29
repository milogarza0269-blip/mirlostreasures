// products.js
// Mirlos Treasures – in-file catalog + renderer

(function () {
  // ==== DOM HOOKS ============================================================
  const grid = document.getElementById("productsGrid");
  if (!grid) {
    console.warn("[products] #productsGrid not found");
    return;
  }

  const categoryFilter = document.getElementById("categoryFilter");

  // ==== CATALOG ==============================================================

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
        "Vibrant, detailed, and full of character – this Day of the Dead sugar skull pair makes a perfect statement piece.",
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

  // Map for the cart (cart.js expects this)
  const catalogById = {};
  catalog.forEach((p) => {
    catalogById[p.id] = {
      ...p,
      currentStock: p.inventory ?? 0
    };
  });
  window.__CatalogById = catalogById;

  // ==== HELPERS ==============================================================

  function money(v) {
    return "$" + Number(v || 0).toFixed(2);
  }

  function createCard(p) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.category = p.category || "";

    card.innerHTML = `
      <div class="product-media">
        <img src="${p.image}" alt="${p.title}">
      </div>
      <div class="product-body">
        <h3 class="product-title">${p.title}</h3>
        <p class="product-price">${money(p.price)}</p>
        <button type="button"
                class="btn btn-primary add-to-cart"
                data-id="${p.id}">
          Add to Cart
        </button>
      </div>
    `;
    return card;
  }

  function renderProducts(filterCategory) {
    const items = catalog
      .filter((p) => p.featured !== false)
      .filter((p) => !filterCategory || p.category === filterCategory);

    grid.innerHTML = "";

    if (!items.length) {
      grid.innerHTML =
        '<p class="muted" style="padding:16px;text-align:center">No products available yet. Check back soon!</p>';
      return;
    }

    items.forEach((p) => grid.appendChild(createCard(p)));
  }

  // ==== FILTERS & SHORTCUTS ==================================================

  if (categoryFilter) {
    categoryFilter.addEventListener("change", (e) => {
      const cat = e.target.value || "";
      renderProducts(cat);
    });
  }

  // Hero tiles & footer links with data-filter
  document.querySelectorAll("[data-filter]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const cat = el.getAttribute("data-filter") || "";
      if (categoryFilter) categoryFilter.value = cat;
      renderProducts(cat);
    });
  });

  // ==== ADD TO CART HANDLER ==================================================

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    if (window.MirlosCart && typeof window.MirlosCart.add === "function") {
      window.MirlosCart.add(id, 1);
    } else {
      console.warn("[products] MirlosCart.add not available");
    }
  });

  // Initial render – no category filter
  renderProducts("");
})();
