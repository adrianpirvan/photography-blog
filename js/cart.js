/* ============================================
   CART.JS — Cart state management & UI
   ============================================ */

const CART_KEY = 'adrianpirvan_cart';

// ===== STATE =====

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
}

// ===== CART ACTIONS =====

function addToCart(item) {
  const cart = getCart();
  const existingIndex = cart.findIndex(i => i.id === item.id);
  if (existingIndex >= 0) {
    cart[existingIndex].quantity += item.quantity || 1;
  } else {
    cart.push({ ...item, quantity: item.quantity || 1 });
  }
  saveCart(cart);
}

function removeFromCart(itemId) {
  const cart = getCart().filter(i => i.id !== itemId);
  saveCart(cart);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

// ===== UI =====

function updateCartUI() {
  const count = getCartCount();
  const countEl = document.getElementById('cart-count');
  if (countEl) {
    countEl.textContent = count;
    countEl.classList.toggle('visible', count > 0);
  }
  renderCartItems();
}

function renderCartItems() {
  const cartItemsEl = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total-amount');
  if (!cartItemsEl) return;

  const cart = getCart();

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<p class="cart-empty">${window.t ? window.t('cart.empty') : 'Your cart is empty'}</p>`;
    if (totalEl) totalEl.textContent = '€0.00';
    return;
  }

  const qtyLabel  = window.t ? window.t('cart.qty')    : 'Qty:';
  const removeLabel = window.t ? window.t('cart.remove') : 'Remove';

  cartItemsEl.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${escapeHtml(item.id)}">
      <img class="cart-item-img" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-size">${escapeHtml(item.size)} &middot; ${qtyLabel} ${item.quantity}</div>
        <div class="cart-item-row">
          <span class="cart-item-price">€${(item.price * item.quantity).toFixed(2)}</span>
          <button class="cart-item-remove" onclick="removeFromCart('${escapeHtml(item.id)}')">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  if (totalEl) {
    totalEl.textContent = `€${getCartTotal().toFixed(2)}`;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== SIDEBAR TOGGLE =====

function toggleCart() {
  const sidebar = document.getElementById('cart-sidebar');
  if (!sidebar) return;
  if (sidebar.classList.contains('open')) {
    closeCart();
  } else {
    openCart();
  }
}

function openCart() {
  const overlay = document.getElementById('cart-overlay');
  const sidebar = document.getElementById('cart-sidebar');
  if (!overlay || !sidebar) return;
  overlay.classList.add('open');
  sidebar.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  const overlay = document.getElementById('cart-overlay');
  const sidebar = document.getElementById('cart-sidebar');
  if (!overlay || !sidebar) return;
  overlay.classList.remove('open');
  sidebar.classList.remove('open');
  document.body.style.overflow = '';
}

// ===== INIT =====

document.addEventListener('DOMContentLoaded', updateCartUI);
document.addEventListener('langchange', renderCartItems);

// Close cart with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCart();
});
