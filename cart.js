(function () {
  // =========================
  // Cart storage & helpers
  // =========================
  const STORAGE_KEY = "mirlos-cart";
  let cart = loadCart();

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function money(v) {
    return `$${Number(v || 0).toFixed(2)}`;
  }

  function getCartCount() {
    return cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  }

  // =========================
  // Build cart drawer UI
  // =========================
  function createDrawer() {
    let aside = document.getElementById("cartDrawer");
    if (aside) return aside;

    const tpl = document.createElement("div");
    tpl.innerHTML = `
      <aside id="cartDrawer" class="cart-drawer" aria-hidden="true">
        <div class="cart-backdrop"></div>
        <div class="cart-panel">
          <div class="cart-header">
            <strong>Cart</strong>
            <button class="cart-close" aria-label="Close">✕</button>
          </div>
          <div class="cart-items"></div>
          <div class="cart-footer">
            <div class="totals">
              <span>Subtotal</span>
              <strong id="cartSubtotal">$0.00</strong>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end">
              <a class="btn btn-primary" href="checkout.html" id="checkoutBtn">Proceed to Checkout</a>
            </div>
          </div>
        </div>
      </aside>
    `;
    document.body.appendChild(tpl.firstElementChild);
    return document.getElementById("cartDrawer");
  }

  const drawer = createDrawer();
  const itemsEl = drawer.querySelector(".cart-items");
  const subtotalEl = drawer.querySelector("#cartSubtotal");
  const openCartBtn = document.getElementById("openCart");
  const badge = document.getElementById("cartCount") || document.querySelector(".badge");

  function openDrawer() {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  }

  openCartBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openDrawer();
  });
  drawer.querySelector(".cart-backdrop").addEventListener("click", closeDrawer);
  drawer.querySelector(".cart-close").addEventListener("click", closeDrawer);

  // =========================
  // Product catalog mapping
  // =========================
  const catalogArray = Array.isArray(window.products) ? window.products : [];
  const CatalogById = catalogArray.reduce((map, p) => {
    if (p && p.id) map[p.id] = p;
    return map;
  }, {});
  // Expose in case you need it elsewhere
  window.__CatalogById = CatalogById;

  // =========================
  // Cart operations
  // =========================
  function addToCart(id, qty = 1) {
    const base = CatalogById[id];
    if (!base) {
      console.warn("[cart] Unknown product id:", id);
      return;
    }

    const max = base.inventory != null ? Number(base.inventory) : Infinity;
    const existing = cart.find((it) => it.id === id);
    const currentQty = existing ? Number(existing.qty) : 0;
    const desiredQty = currentQty + qty;
    const finalQty = max === Infinity ? desiredQty : Math.min(max, desiredQty);

    if (max === 0) {
      alert("Sorry, this item is sold out.");
      return;
    }

    if (!existing) {
      cart.push({
        id: base.id,
        title: base.title,
        price: Number(base.price),
        image: base.image,
        qty: Math.max(1, Math.min(qty, max || 1)),
      });
    } else {
      existing.qty = finalQty;
    }

    if (finalQty === currentQty) {
      alert("You’ve reached the available stock for this item.");
    }

    commit();
    openDrawer();
  }

  function removeFromCart(id) {
    cart = cart.filter((it) => it.id !== id);
    commit();
  }

  function setQty(id, qty) {
    const item = cart.find((x) => x.id === id);
    if (!item) return;

    const base = CatalogById[id];
    const max = base && base.inventory != null ? Number(base.inventory) : Infinity;
    const next = Math.max(1, qty | 0);
    item.qty = max === Infinity ? next : Math.min(max, next);
    commit();
  }

  function commit() {
    saveCart();
    renderCart();
    updateBadge();
  }

  function renderCart() {
    if (!itemsEl) return;

    if (!cart.length) {
      itemsEl.innerHTML =
        '<p class="muted" style="padding:16px;text-align:center">Your cart is empty.</p>';
    } else {
      itemsEl.innerHTML = cart
        .map((it) => {
          const lineTotal = Number(it.price) * Number(it.qty);
          return `
            <div class="cart-item" data-id="${it.id}">
              <img src="${it.image || "images/placeholder.png"}" alt="">
              <div>
                <h4>${it.title || it.id}</h4>
                <div class="cart-qty">
                  <button aria-label="Decrease">–</button>
                  <input class="qty-input" type="number" min="1" value="${it.qty}"/>
                  <button aria-label="Increase">+</button>
                </div>
              </div>
              <div>
                ${money(lineTotal)}
                <div><button class="btn cart-remove" style="margin-top:6px">Remove</button></div>
              </div>
            </div>
          `;
        })
        .join("");
    }

    const subtotal = cart.reduce((sum, it) => {
      return sum + Number(it.price) * Number(it.qty);
    }, 0);
    subtotalEl.textContent = money(subtotal);
  }

  function updateBadge() {
    if (!badge) return;
    badge.textContent = getCartCount();
  }

  // Cart drawer interaction handlers
  itemsEl.addEventListener("click", (e) => {
    const root = e.target.closest(".cart-item");
    if (!root) return;
    const id = root.getAttribute("data-id");

    if (e.target.classList.contains("cart-remove")) {
      removeFromCart(id);
    }

    if (e.target.getAttribute("aria-label") === "Increase") {
      const it = cart.find((x) => x.id === id);
      setQty(id, (it?.qty || 1) + 1);
    }

    if (e.target.getAttribute("aria-label") === "Decrease") {
      const it = cart.find((x) => x.id === id);
      setQty(id, Math.max(1, (it?.qty || 1) - 1));
    }
  });

  itemsEl.addEventListener("change", (e) => {
    if (!e.target.classList.contains("qty-input")) return;
    const root = e.target.closest(".cart-item");
    if (!root) return;
    const id = root.getAttribute("data-id");
    setQty(id, Number(e.target.value) || 1);
  });

  // =========================
  // Product grid rendering
  // =========================
  const grid = document.getElementById("productsGrid");
  const categoryFilter = document.getElementById("categoryFilter");
  const heroTiles = document.querySelectorAll(".hero-tiles [data-filter], .categories [data-filter]");

  function renderProducts(list) {
    if (!grid) return;
    if (!Array.isArray(list) || !list.length) {
      grid.innerHTML =
        '<p class="muted" style="padding:16px;text-align:center">No products available.</p>';
      return;
    }

    grid.innerHTML = list
      .map((p) => {
        return `
          <article class="product-card" data-id="${p.id}" data-category="${p.category || ""}">
            <img src="${p.image || "images/placeholder.png"}" alt="${p.title || ""}">
            <div class="product-body">
              <h3>${p.title}</h3>
              <p class="price">${money(p.price)}</p>
              <button class="btn btn-primary add-to-cart" data-id="${p.id}">
                Add to Cart
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function applyFilter(category) {
    let list = catalogArray;
    if (category) {
      list = list.filter((p) => (p.category || "").toLowerCase() === category.toLowerCase());
    }
    // If you want only featured on homepage:
    list = list.filter((p) => p.featured !== false);
    renderProducts(list);
  }

  // Filter dropdown
  categoryFilter?.addEventListener("change", (e) => {
    const val = e.target.value.trim();
    applyFilter(val || "");
  });

  // Hero / category tiles
  heroTiles.forEach((tile) => {
    tile.addEventListener("click", (e) => {
      const category = tile.getAttribute("data-filter") || "";
      if (categoryFilter) {
        categoryFilter.value = category;
      }
      applyFilter(category);
    });
  });

  // Add-to-cart buttons in product grid
  grid?.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    addToCart(id, 1);
  });

  // =========================
  // Public API + initial render
  // =========================
  window.MirlosCart = {
    add: addToCart,
    remove: removeFromCart,
    setQty,
    load: loadCart,
    get: () => [...cart],
  };

  // Initial render
  renderCart();
  updateBadge();
  applyFilter(""); // show featured/all on load
})();
