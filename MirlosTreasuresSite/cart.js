(function(){
  const STORAGE_KEY = 'mirlos-cart';
  let cart = loadCart();

  const drawer = createDrawer();
  const itemsEl = drawer.querySelector('.cart-items');
  const subtotalEl = drawer.querySelector('#cartSubtotal');
  const openCartBtn = document.getElementById('openCart');
  const badge = document.getElementById('cartCount') || document.querySelector('.badge');

  function createDrawer(){
    let aside = document.getElementById('cartDrawer');
    if (aside) return aside;
    const tpl = document.createElement('div');
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
            <div class="totals"><span>Subtotal</span> <strong id="cartSubtotal">$0.00</strong></div>
            <div style="display:flex;gap:10px;justify-content:flex-end">
              <a class="btn btn-primary" href="checkout.html" id="checkoutBtn">Proceed to Checkout</a>
            </div>
          </div>
        </div>
      </aside>`;
    document.body.appendChild(tpl.firstElementChild);
    return document.getElementById('cartDrawer');
  }

  function openDrawer(){ drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); }
  function closeDrawer(){ drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); }

  openCartBtn?.addEventListener('click', (e)=>{ e.preventDefault(); openDrawer(); });
  drawer.querySelector('.cart-backdrop').addEventListener('click', closeDrawer);
  drawer.querySelector('.cart-close').addEventListener('click', closeDrawer);

  function loadCart(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
  function saveCart(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }
  function money(v){ return `$${Number(v||0).toFixed(2)}`; }

  // === Stock-aware add ===
  function addToCart(id, qty=1){
    const base = (window.__CatalogById && window.__CatalogById[id]) || null; /* consumes catalog map built in products.js :contentReference[oaicite:4]{index=4} */
    if (!base) { console.warn('[cart] unknown product id', id); return; }

    const max = Number(base.currentStock ?? 0);
    if (max <= 0) { alert('Sorry, this item is sold out.'); return; }

    const found = cart.find(it => it.id === id);
    const currentQty = found ? Number(found.qty) : 0;
    const nextQty = Math.min(max, currentQty + qty);

    if (!found) {
      cart.push({ id: base.id, title: base.title, price: Number(base.price), image: base.image, qty: Math.min(qty, max) });
    } else {
      found.qty = nextQty;
    }

    if (currentQty === nextQty) { alert('You’ve reached the available stock for this item.'); }
    commit();
    openDrawer();
  }

  function removeFromCart(id){ cart = cart.filter(it => it.id !== id); commit(); }
  function setQty(id, qty){ const it = cart.find(x => x.id === id); if (!it) return; it.qty = Math.max(1, qty|0); commit(); }

  function commit(){ saveCart(); renderCart(); updateBadge(); }

  function renderCart(){
    if (!itemsEl) return;
    if (cart.length === 0){
      itemsEl.innerHTML = '<p class="muted" style="padding:16px;text-align:center">Your cart is empty.</p>';
    } else {
      itemsEl.innerHTML = cart.map(it => `
        <div class="cart-item" data-id="${it.id}">
          <img src="${it.image || 'images/placeholder.png'}" alt="">
          <div>
            <h4>${it.title || it.id}</h4>
            <div class="cart-qty">
              <button aria-label="Decrease">–</button>
              <input class="qty-input" type="number" min="1" value="${it.qty}"/>
              <button aria-label="Increase">+</button>
            </div>
          </div>
          <div>${money(Number(it.price) * Number(it.qty))}
            <div><button class="btn cart-remove" style="margin-top:6px">Remove</button></div>
          </div>
        </div>`).join('');
    }
    const subtotal = cart.reduce((s,i)=> s + Number(i.price)*Number(i.qty), 0);
    subtotalEl.textContent = money(subtotal);
  }

  itemsEl.addEventListener('click', (e)=>{
    const root = e.target.closest('.cart-item'); if (!root) return;
    const id = root.getAttribute('data-id');
    if (e.target.classList.contains('cart-remove')) removeFromCart(id);
    if (e.target.getAttribute('aria-label') === 'Increase'){ const it = cart.find(x=>x.id===id); setQty(id,(it?.qty||1)+1); }
    if (e.target.getAttribute('aria-label') === 'Decrease'){ const it = cart.find(x=>x.id===id); setQty(id,Math.max(1,(it?.qty||1)-1)); }
  });
  itemsEl.addEventListener('change', (e)=>{
    if (!e.target.classList.contains('qty-input')) return;
    const root = e.target.closest('.cart-item'); const id = root.getAttribute('data-id');
    setQty(id, Number(e.target.value)||1);
  });

  function updateBadge(){
    const count = cart.reduce((s,i)=> s + Number(i.qty||0), 0);
    if (badge) badge.textContent = count;
  }

  window.MirlosCart = { add: addToCart, remove: removeFromCart, setQty, load: loadCart };
  window.getCart = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } };
  window.setCart = (next) => { if (Array.isArray(next)) { cart = next; commit(); } return cart; };

  renderCart(); updateBadge();
  document.getElementById('checkoutBtn')?.addEventListener('click', (e)=>{});
})();
