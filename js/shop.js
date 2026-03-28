/* ============================================
   SHOP.JS — Product data, modal, add to cart
   ============================================ */

const products = [
  {
    id: 'fog',
    name: 'The Fog',
    description: 'Mist rolling through ancient pine forests, a quiet morning in the mountains.',
    image: 'https://picsum.photos/900/600?random=13',
    sizes: [
      { label: '30×40cm', price: 80 },
      { label: '50×70cm', price: 140 },
      { label: '70×100cm', price: 200 }
    ]
  },
  {
    id: 'heart',
    name: 'The Heart',
    description: 'A lone barn on a hillside wrapped in morning clouds, still and timeless.',
    image: 'https://picsum.photos/900/600?random=14',
    sizes: [
      { label: '30×40cm', price: 80 },
      { label: '50×70cm', price: 140 },
      { label: '70×100cm', price: 200 }
    ]
  },
  {
    id: 'snow',
    name: 'The Snow',
    description: 'Silence after a heavy snowfall, the world reduced to whites and grays.',
    image: 'https://picsum.photos/900/600?random=15',
    sizes: [
      { label: '30×40cm', price: 80 },
      { label: '50×70cm', price: 140 },
      { label: '70×100cm', price: 200 }
    ]
  },
  {
    id: 'light',
    name: 'The Light',
    description: 'Golden hour cutting through storm clouds over an open, windswept landscape.',
    image: 'https://picsum.photos/900/600?random=16',
    sizes: [
      { label: '30×40cm', price: 80 },
      { label: '50×70cm', price: 140 },
      { label: '70×100cm', price: 200 }
    ]
  }
];

// ===== STATE =====

let activeProduct = null;
let selectedQuantity = 1;

// ===== MODAL OPEN / CLOSE =====

function openModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  activeProduct = product;
  selectedQuantity = 1;

  // Populate modal content
  const modalImg = document.getElementById('modal-img');
  const modalTitle = document.getElementById('modal-title');
  const modalPrice = document.getElementById('modal-price');
  const modalBreadcrumb = document.getElementById('modal-breadcrumb-name');
  const modalQty = document.getElementById('modal-qty');
  const sizeSelect = document.getElementById('modal-size');
  const addBtn = document.getElementById('modal-add-btn');

  if (modalImg) {
    modalImg.src = product.image;
    modalImg.alt = product.name;
  }
  const tName = window.t ? window.t('product.' + product.id + '.name') : product.name;
  if (modalTitle) modalTitle.textContent = tName;
  if (modalPrice) modalPrice.textContent = 'from €80.00';
  if (modalBreadcrumb) modalBreadcrumb.textContent = tName;
  if (modalQty) modalQty.textContent = '1';
  if (addBtn) {
    addBtn.textContent = window.t ? window.t('modal.add') : 'Add To Cart';
    addBtn.classList.remove('added');
  }

  // Populate size options
  if (sizeSelect) {
    sizeSelect.innerHTML = `<option value="">${window.t ? window.t('modal.size.select') : 'Select Size'}</option>` +
      product.sizes.map(s =>
        `<option value="${s.label}" data-price="${s.price}">${s.label} &mdash; €${s.price}.00</option>`
      ).join('');
    sizeSelect.value = '';
    sizeSelect.style.borderColor = '';
  }

  // Show modal
  document.getElementById('product-modal-overlay').classList.add('open');
  document.getElementById('product-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('product-modal-overlay').classList.remove('open');
  document.getElementById('product-modal').classList.remove('open');
  document.body.style.overflow = '';
  activeProduct = null;
}

// ===== QUANTITY =====

function changeQty(delta) {
  selectedQuantity = Math.max(1, selectedQuantity + delta);
  const qtyEl = document.getElementById('modal-qty');
  if (qtyEl) qtyEl.textContent = selectedQuantity;
}

// ===== SIZE CHANGE =====

function onSizeChange() {
  const sizeSelect = document.getElementById('modal-size');
  const priceEl = document.getElementById('modal-price');
  if (!sizeSelect || !priceEl) return;

  const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
  if (selectedOption && selectedOption.dataset.price) {
    priceEl.textContent = `€${selectedOption.dataset.price}.00`;
  } else {
    priceEl.textContent = 'from €80.00';
  }
  sizeSelect.style.borderColor = '';
}

// ===== ADD TO CART =====

function addToCartFromModal() {
  if (!activeProduct) return;

  const sizeSelect = document.getElementById('modal-size');
  if (!sizeSelect || !sizeSelect.value) {
    // Highlight the select if no size chosen
    if (sizeSelect) {
      sizeSelect.style.borderColor = '#111';
      sizeSelect.focus();
    }
    return;
  }

  const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
  const price = parseInt(selectedOption.dataset.price, 10);
  const size = sizeSelect.value;
  // Unique item ID: productId + size slug
  const itemId = `${activeProduct.id}-${size.replace(/[^a-z0-9]/gi, '').toLowerCase()}`;

  addToCart({
    id: itemId,
    name: activeProduct.name,
    size,
    price,
    quantity: selectedQuantity,
    image: activeProduct.image
  });

  // Visual feedback
  const btn = document.getElementById('modal-add-btn');
  if (btn) {
    btn.textContent = window.t ? window.t('modal.added') : 'Added to Cart!';
    btn.classList.add('added');
    setTimeout(() => {
      btn.textContent = window.t ? window.t('modal.add') : 'Add To Cart';
      btn.classList.remove('added');
    }, 2000);
  }
}

// ===== INIT =====

document.addEventListener('DOMContentLoaded', () => {
  // Bind size change
  const sizeSelect = document.getElementById('modal-size');
  if (sizeSelect) sizeSelect.addEventListener('change', onSizeChange);

  // Close modal when clicking overlay
  const overlay = document.getElementById('product-modal-overlay');
  if (overlay) overlay.addEventListener('click', closeModal);

  // Close modal with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Re-render modal if open when language changes
  document.addEventListener('langchange', () => {
    if (activeProduct) openModal(activeProduct.id);
  });
});
