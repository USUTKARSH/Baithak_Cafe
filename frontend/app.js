const seedMenu = [
  { id: 1, name: 'Oat milk latte', description: 'Double espresso, silky oat milk', price: 5.25, category: 'coffee', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=500&q=80' },
  { id: 2, name: 'Berry ricotta toast', description: 'Sourdough, whipped ricotta, fresh berries', price: 8.50, category: 'breakfast', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=500&q=80' },
  { id: 3, name: 'Green garden bowl', description: 'Avocado, greens, grains, lemon tahini', price: 12.75, category: 'lunch', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80' },
  { id: 4, name: 'Cardamom bun', description: 'Warm baked bun, cardamom sugar', price: 4.25, category: 'sweet', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80' },
  { id: 5, name: 'Maple sea salt cold brew', description: 'Slow-steeped, maple, a little sea salt', price: 5.75, category: 'coffee', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=500&q=80' },
  { id: 6, name: 'Sunrise breakfast plate', description: 'Eggs, crispy potatoes, greens, sourdough', price: 13.50, category: 'breakfast', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=500&q=80' },
  { id: 7, name: 'Roasted tomato melt', description: 'Cheddar, tomato jam, grilled sourdough', price: 11.25, category: 'lunch', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80' },
  { id: 8, name: 'Chocolate tahini cookie', description: 'Dark chocolate, sesame, flaky salt', price: 3.75, category: 'sweet', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=500&q=80' },
  { id: 10, name: 'Fresh mint lemonade', description: 'Pressed lemon, mint, sparkling water', price: 4.50, category: 'drinks', image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?auto=format&fit=crop&w=500&q=80' },
  { id: 11, name: 'Mango lassi', description: 'Creamy yogurt, ripe mango, cardamom', price: 5.25, category: 'drinks', image: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=500&q=80' }
];
const menuStorageKey = 'baithak-cafe-menu';
const categoriesStorageKey = 'baithak-cafe-categories';
const defaultCategories = [
  { id: 'coffee', name: 'Coffee' },
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'lunch', name: 'Lunch' },
  { id: 'sweet', name: 'Something sweet' },
  { id: 'drinks', name: 'Drinks' }
];
const storedMenu = JSON.parse(localStorage.getItem(menuStorageKey) || 'null');
let menu = storedMenu ? [...storedMenu, ...seedMenu.filter(seedItem => !storedMenu.some(item => item.id === seedItem.id))] : [...seedMenu];
const storedCategories = JSON.parse(localStorage.getItem(categoriesStorageKey) || 'null');
let categories = storedCategories ? [...storedCategories, ...defaultCategories.filter(category => !storedCategories.some(saved => saved.id === category.id))] : [...defaultCategories];

const cart = new Map();
let activeCategory = 'all';
let activeService = 'pickup';
const ordersStorageKey = 'baithak-cafe-orders';
const storeStatusKey = 'baithak-cafe-store-open';
let storeOpen = JSON.parse(localStorage.getItem(storeStatusKey) ?? 'true');
const deliveryCharge = 10;
const storeLogoKey = 'baithak-cafe-store-logo';
const defaultLogo = 'assets/logo.jpg';
const money = value => `₹${value.toFixed(2)}`;
const $ = selector => document.querySelector(selector);
const apiFetch = (url, options = {}) => fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
function setBrandLogo(url) { document.querySelectorAll('[data-brand-logo]').forEach(image => { const fallback = image.parentElement.querySelector('.brand-fallback'); image.onerror = () => { image.hidden = true; fallback.hidden = false; }; if (url) { image.src = url; image.hidden = false; fallback.hidden = true; } else { image.hidden = true; fallback.hidden = false; } }); }

async function loadCatalog() {
  try {
    const response = await apiFetch('/api/catalog');
    if (!response.ok) return;
    const data = await response.json();
    if (Array.isArray(data.menu) && data.menu.length) menu = data.menu;
    if (Array.isArray(data.categories) && data.categories.length) categories = data.categories;
    if (typeof data.storeOpen === 'boolean') storeOpen = data.storeOpen;
    setBrandLogo(data.logoUrl || localStorage.getItem(storeLogoKey) || defaultLogo);
    renderMenu(); renderCart();
  } catch (error) {
    console.warn('Using local catalog fallback:', error.message);
  }
}

function renderMenu() {
  const query = $('#search-input').value.trim().toLowerCase();
  const visible = menu.filter(item => (activeCategory === 'all' || item.category === activeCategory) && `${item.name} ${item.description}`.toLowerCase().includes(query));
  $('#category-tabs').innerHTML = `<button class="category-tab ${activeCategory === 'all' ? 'active' : ''}" data-category="all">All day</button>${categories.map(category => `<button class="category-tab ${activeCategory === category.id ? 'active' : ''}" data-category="${category.id}">${category.name}</button>`).join('')}`;
  const cardMarkup = item => `
    <article class="menu-card">
      <div class="menu-image" style="background-image:url('${item.image}')"></div>
      <div class="menu-info"><h3>${item.name}</h3><p>${item.description}</p><div class="menu-bottom"><span class="price">${money(item.price)}</span><button class="add-button" data-add="${item.id}" aria-label="Add ${item.name}">+</button></div></div>
    </article>`;
  $('#menu-grid').innerHTML = categories.filter(category => visible.some(item => item.category === category.id)).map(category => `
    <section class="menu-category-section" aria-labelledby="category-${category.id}">
      <div class="menu-category-heading"><h3 id="category-${category.id}">${category.name}</h3><span>${visible.filter(item => item.category === category.id).length} items</span></div>
      <div class="menu-section-grid">${visible.filter(item => item.category === category.id).map(cardMarkup).join('')}</div>
    </section>`).join('');
  $('#empty-state').hidden = visible.length > 0;
}

function renderCart() {
  const entries = [...cart.entries()];
  const itemCount = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
  const subtotal = entries.reduce((sum, [id, quantity]) => sum + menu.find(item => item.id === id).price * quantity, 0);
  $('#cart-count').textContent = itemCount;
  $('#floating-cart-count').textContent = itemCount;
  $('#cart-title').textContent = `${activeService === 'pickup' ? 'Pickup' : 'Delivery'} order`;
  $('#cart-empty').hidden = itemCount > 0;
  $('#cart-items').innerHTML = entries.map(([id, quantity]) => {
    const item = menu.find(menuItem => menuItem.id === id);
    return `<div class="cart-item"><div><h3>${item.name}</h3><span class="cart-item-price">${money(item.price * quantity)}</span></div><div class="quantity-control"><button data-decrease="${id}" aria-label="Remove one ${item.name}">−</button><span>${quantity}</span><button data-increase="${id}" aria-label="Add one ${item.name}">+</button></div></div>`;
  }).join('');
  const orderTotal = subtotal + (activeService === 'delivery' ? deliveryCharge : 0);
  $('#subtotal').textContent = money(subtotal);
  $('#delivery-charge-row').hidden = activeService !== 'delivery';
  $('#delivery-charge').textContent = money(deliveryCharge);
  $('#total').textContent = money(orderTotal);
  $('#modal-total').textContent = money(orderTotal);
  $('#checkout-button').disabled = itemCount === 0 || !storeOpen;
  $('#checkout-button').firstChild.textContent = storeOpen ? 'Continue to checkout ' : 'Ordering is paused ';
}

function addToCart(id) { cart.set(id, (cart.get(id) || 0) + 1); renderCart(); }
function changeQuantity(id, amount) { const next = (cart.get(id) || 0) + amount; next > 0 ? cart.set(id, next) : cart.delete(id); renderCart(); }

document.addEventListener('click', event => {
  const add = event.target.closest('[data-add]');
  if (add) addToCart(Number(add.dataset.add));
  const increase = event.target.closest('[data-increase]');
  if (increase) changeQuantity(Number(increase.dataset.increase), 1);
  const decrease = event.target.closest('[data-decrease]');
  if (decrease) changeQuantity(Number(decrease.dataset.decrease), -1);
  const category = event.target.closest('[data-category]');
  if (category) { activeCategory = category.dataset.category; document.querySelectorAll('.category-tab').forEach(tab => tab.classList.toggle('active', tab === category)); renderMenu(); }
  const service = event.target.closest('[data-service]');
  if (service) { activeService = service.dataset.service; document.querySelectorAll('.service-option').forEach(option => option.classList.toggle('active', option === service)); renderCart(); }
});

$('#search-input').addEventListener('input', renderMenu);
$('#floating-cart').addEventListener('click', () => $('#cart-panel').scrollIntoView({ behavior: 'smooth', block: 'start' }));
$('#checkout-button').addEventListener('click', () => { $('#modal-service').textContent = activeService; $('#checkout-modal').hidden = false; document.body.style.overflow = 'hidden'; });
function closeModal() { $('#checkout-modal').hidden = true; document.body.style.overflow = ''; }
$('#close-modal').addEventListener('click', closeModal);
$('#checkout-modal').addEventListener('click', event => { if (event.target === $('#checkout-modal')) closeModal(); });
$('#checkout-form').addEventListener('submit', async event => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const name = formData.get('name');
  const entries = [...cart.entries()];
  const subtotal = entries.reduce((sum, [id, quantity]) => sum + menu.find(item => item.id === id).price * quantity, 0);
  const order = { id: `DB-${Date.now().toString().slice(-5)}`, customer: name, phone: formData.get('phone'), location: formData.get('location'), service: activeService, time: formData.get('time'), status: 'New', items: entries.map(([id, quantity]) => ({ ...menu.find(item => item.id === id), quantity })), deliveryCharge: activeService === 'delivery' ? deliveryCharge : 0, total: subtotal + (activeService === 'delivery' ? deliveryCharge : 0), createdAt: new Date().toISOString() };
  const orders = JSON.parse(localStorage.getItem(ordersStorageKey) || '[]');
  orders.unshift(order);
  try {
    const response = await apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(order) });
    if (!response.ok) throw new Error('API order request failed');
  } catch (error) {
    const orders = JSON.parse(localStorage.getItem(ordersStorageKey) || '[]');
    orders.unshift(order);
    localStorage.setItem(ordersStorageKey, JSON.stringify(orders));
  }
  $('#checkout-form-view').hidden = true; $('#success-view').hidden = false; $('#success-message').textContent = `Thanks, ${name.split(' ')[0]}. Your ${activeService} order is confirmed and will be ready shortly.`; cart.clear(); renderCart();
});
$('#done-button').addEventListener('click', () => { $('#success-view').hidden = true; $('#checkout-form-view').hidden = false; $('#checkout-form').reset(); closeModal(); });

renderMenu();
renderCart();
setBrandLogo(localStorage.getItem(storeLogoKey) || defaultLogo);
loadCatalog();
