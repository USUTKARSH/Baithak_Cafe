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
const menuKey = 'baithak-cafe-menu';
const categoriesKey = 'baithak-cafe-categories';
const ordersKey = 'baithak-cafe-orders';
const storeStatusKey = 'baithak-cafe-store-open';
const defaultCategories = [
  { id: 'coffee', name: 'Coffee' },
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'lunch', name: 'Lunch' },
  { id: 'sweet', name: 'Something sweet' },
  { id: 'drinks', name: 'Drinks' }
];
/*const storedMenu = JSON.parse(localStorage.getItem(menuKey) || 'null');
let menu = storedMenu ? [...storedMenu, ...seedMenu.filter(seedItem => !storedMenu.some(item => item.id === seedItem.id))] : [...seedMenu];*/
let menu = JSON.parse(localStorage.getItem(menuKey) || '[]');
const storedCategories = JSON.parse(localStorage.getItem(categoriesKey) || 'null');
let categories = storedCategories ? [...storedCategories, ...defaultCategories.filter(category => !storedCategories.some(saved => saved.id === category.id))] : [...defaultCategories];
let orders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
let storeOpen = JSON.parse(localStorage.getItem(storeStatusKey) ?? 'true');
const storePhoneKey = 'baithak-cafe-store-phone';
const storeLogoKey = 'baithak-cafe-store-logo';
const defaultLogo = 'assets/logo.jpg';
let orderFilter = 'all';
const $ = selector => document.querySelector(selector);
const money = value => `₹${Number(value).toFixed(2)}`;
const saveMenu = () => localStorage.setItem(menuKey, JSON.stringify(menu));
const saveCategories = () => localStorage.setItem(categoriesKey, JSON.stringify(categories));
const saveOrders = () => localStorage.setItem(ordersKey, JSON.stringify(orders));
const dateTime = value => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
const redirectToLogin = () => { window.location.href = `/admin-login.html?next=${encodeURIComponent('/admin.html')}`; };
const apiFetch = (url, options = {}) => fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
let apiAvailable = false;
function setBrandLogo(url) { document.querySelectorAll('[data-brand-logo]').forEach(image => { const fallback = image.parentElement.querySelector('.brand-fallback'); image.onerror = () => { image.hidden = true; fallback.hidden = false; }; if (url) { image.src = url; image.hidden = false; fallback.hidden = true; } else { image.hidden = true; fallback.hidden = false; } }); }

async function loadAdminData() {
  try {
    const catalogResponse = await apiFetch('/api/catalog');
    let ordersResponse = await apiFetch('/api/orders');
    if (ordersResponse.status === 401) { redirectToLogin(); return; }
    if (!catalogResponse.ok) return;
    const catalog = await catalogResponse.json();
    const catalogWasEmpty = !catalog.menu?.length && !catalog.categories?.length;
    if (Array.isArray(catalog.menu) && catalog.menu.length) menu = catalog.menu;
    if (Array.isArray(catalog.categories) && catalog.categories.length) categories = catalog.categories;
    if (typeof catalog.phone === 'string' && $('#store-phone')) $('#store-phone').value = catalog.phone || localStorage.getItem(storePhoneKey) || '';
    if ($('#store-logo')) { $('#store-logo').value = catalog.logoUrl || localStorage.getItem(storeLogoKey) || defaultLogo; setBrandLogo($('#store-logo').value); }
    if (ordersResponse.ok) orders = await ordersResponse.json();
    apiAvailable = true;
    if (catalogWasEmpty) {
      await Promise.all(categories.map(category => syncAdmin('/api/admin/categories', { method: 'POST', body: JSON.stringify(category) })));
      await Promise.all(menu.map(item => syncAdmin('/api/admin/menu', { method: 'POST', body: JSON.stringify(item) })));
    }
    renderCategoryOptions(); refresh();
  } catch (error) {
    console.warn('Using local admin fallback:', error.message);
  }
}

async function syncAdmin(url, options) {
  if (!apiAvailable) return;
  try {
    let response = await apiFetch(url, options);
    if (response.status === 401) { redirectToLogin(); return; }
    if (!response.ok) console.warn('Admin API sync failed:', response.status);
  } catch (error) { console.warn('Admin API sync failed:', error.message); }
}

function statusClass(status) { return status.toLowerCase().replace(' ', '-'); }
function orderMarkup(order) { return `<article class="order-row"><div class="order-number"><strong>${order.id}</strong><small>${dateTime(order.createdAt)}</small></div><div class="order-customer"><strong>${order.customer}</strong><small>${order.location || 'No table or address provided'}</small><small>${order.items.map(item => `${item.quantity}× ${item.name}`).join(', ')}</small></div><span class="service-tag">${order.service}</span><strong class="order-total">${money(order.total)}</strong><select class="status-select status-${statusClass(order.status)}" data-order-status="${order.id}" aria-label="Update status for ${order.id}"><option ${order.status === 'New' ? 'selected' : ''}>New</option><option ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option><option ${order.status === 'Ready' ? 'selected' : ''}>Ready</option><option ${order.status === 'Completed' ? 'selected' : ''}>Completed</option></select></article>`; }
function renderOrders() { const visible = orderFilter === 'all' ? orders : orders.filter(order => order.status === orderFilter); $('#all-orders').innerHTML = visible.length ? visible.map(orderMarkup).join('') : '<div class="admin-empty"><span>◷</span><strong>No orders in this view</strong><p>New customer orders will appear here.</p></div>'; $('#overview-orders').innerHTML = orders.slice(0, 4).length ? orders.slice(0, 4).map(orderMarkup).join('') : '<div class="admin-empty compact"><strong>Your queue is clear</strong><p>New orders will appear here.</p></div>'; $('#nav-order-count').textContent = orders.filter(order => order.status === 'New').length; }
function renderMetrics() { const total = orders.reduce((sum, order) => sum + Number(order.total), 0); const completed = orders.filter(order => order.status === 'Completed').length; const itemCounts = orders.flatMap(order => order.items).reduce((counts, item) => { counts[item.name] = (counts[item.name] || 0) + item.quantity; return counts; }, {}); const top = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]; $('#metric-sales').textContent = money(total); $('#metric-orders').textContent = orders.length; $('#metric-average').textContent = orders.length ? money(total / orders.length) : '₹0.00'; $('#metric-sales-note').textContent = completed ? `${completed} completed order${completed === 1 ? '' : 's'}` : 'No orders yet'; $('#metric-top').textContent = top ? top[0] : '—'; $('#metric-top-count').textContent = top ? `${top[1]} sold today` : 'Waiting for orders'; }
function renderMenu() {
  $('#overview-menu').innerHTML = menu.slice(0, 5).map(item => `<div class="mini-menu-row"><span class="mini-menu-image" style="background-image:url('${item.image}')"></span><span><strong>${item.name}</strong><small>${item.category}</small></span><b>${money(item.price)}</b></div>`).join('');
  $('#category-admin-list').innerHTML = categories.map((category, index) => `<div class="category-admin-row"><strong>${category.name}</strong><span>${menu.filter(item => item.category === category.id).length} dishes</span><div class="row-actions"><button data-edit-category="${category.id}">Edit</button><button data-delete-category="${category.id}">Delete</button><button data-move-category="${category.id}" data-direction="up" aria-label="Move ${category.name} up">↑</button><button data-move-category="${category.id}" data-direction="down" aria-label="Move ${category.name} down">↓</button></div></div>`).join('');
  $('#menu-admin-list').innerHTML = menu.map(item => `<div class="menu-admin-row"><div class="menu-admin-item"><span class="mini-menu-image" style="background-image:url('${item.image}')"></span><span><strong>${item.name}</strong><small>${item.description}</small></span></div><span class="category-text">${categories.find(category => category.id === item.category)?.name || item.category}</span><strong>${money(item.price)}</strong><span class="availability"><span></span> Available</span><div class="row-actions"><button data-edit-item="${item.id}" aria-label="Edit ${item.name}">Edit</button><button data-delete-item="${item.id}" aria-label="Delete ${item.name}">Delete</button><button data-move-item="${item.id}" data-direction="up" aria-label="Move ${item.name} up">↑</button><button data-move-item="${item.id}" data-direction="down" aria-label="Move ${item.name} down">↓</button></div></div>`).join('');
}
function renderCategoryOptions() { $('#item-form').elements.category.innerHTML = categories.map(category => `<option value="${category.id}">${category.name}</option>`).join(''); }
function refresh() { renderOrders(); renderMetrics(); renderMenu(); }
function renderStoreStatus() { $('#store-status-label').textContent = storeOpen ? 'Store is open' : 'Store is closed'; $('.store-status small').textContent = storeOpen ? 'Taking orders now' : 'Orders are paused'; $('.status-light').classList.toggle('closed', !storeOpen); }
function showView(view) { document.querySelectorAll('.admin-view').forEach(element => element.classList.toggle('active', element.id === `view-${view}`)); document.querySelectorAll('.admin-nav-item').forEach(element => element.classList.toggle('active', element.dataset.view === view)); }
function openItem(item) { renderCategoryOptions(); $('#item-modal-title').textContent = item ? 'Edit menu item' : 'Add menu item'; $('#item-form').reset(); if (item) Object.entries(item).forEach(([key, value]) => { const field = $('#item-form').elements[key]; if (field) field.value = value; }); $('#item-modal').hidden = false; }
function openCategory(category) { $('#category-modal-title').textContent = category ? 'Edit category' : 'Add a category'; $('#category-form').reset(); if (category) { $('#category-form').elements.id.value = category.id; $('#category-form').elements.name.value = category.name; } $('#category-modal').hidden = false; }
function moveItem(id, direction) { const index = menu.findIndex(item => item.id === id); const item = menu[index]; const sameCategory = menu.map((entry, position) => entry.category === item.category ? position : -1).filter(position => position >= 0); const categoryIndex = sameCategory.indexOf(index); const nextIndex = sameCategory[categoryIndex + (direction === 'up' ? -1 : 1)]; if (nextIndex === undefined) return; [menu[index], menu[nextIndex]] = [menu[nextIndex], menu[index]]; saveMenu(); renderMenu(); syncAdmin('/api/admin/menu/reorder', { method: 'PATCH', body: JSON.stringify({ items: menu.map((entry, position) => ({ id: entry.id, category: entry.category, position })) }) }); }
function moveCategory(id, direction) { const index = categories.findIndex(category => category.id === id); const nextIndex = index + (direction === 'up' ? -1 : 1); if (nextIndex < 0 || nextIndex >= categories.length) return; [categories[index], categories[nextIndex]] = [categories[nextIndex], categories[index]]; saveCategories(); renderMenu(); syncAdmin('/api/admin/categories/reorder', { method: 'PATCH', body: JSON.stringify({ ids: categories.map(category => category.id) }) }); }
function deleteCategory(id) { const category = categories.find(entry => entry.id === id); const dishCount = menu.filter(item => item.category === id).length; if (dishCount) { alert(`Move or delete the ${dishCount} dish${dishCount === 1 ? '' : 'es'} in ${category.name} before deleting this category.`); return; } if (!confirm(`Delete the ${category.name} category?`)) return; categories = categories.filter(entry => entry.id !== id); saveCategories(); renderCategoryOptions(); renderMenu(); syncAdmin(`/api/admin/categories/${id}`, { method: 'DELETE' }); }

document.addEventListener('click', event => { const nav = event.target.closest('[data-view], [data-view-link]'); if (nav) showView(nav.dataset.view || nav.dataset.viewLink); const filter = event.target.closest('[data-order-filter]'); if (filter) { orderFilter = filter.dataset.orderFilter; document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.toggle('active', pill === filter)); renderOrders(); } const edit = event.target.closest('[data-edit-item]'); if (edit) openItem(menu.find(item => item.id === Number(edit.dataset.editItem))); const editCategory = event.target.closest('[data-edit-category]'); if (editCategory) openCategory(categories.find(category => category.id === editCategory.dataset.editCategory)); const moveItemButton = event.target.closest('[data-move-item]'); if (moveItemButton) moveItem(Number(moveItemButton.dataset.moveItem), moveItemButton.dataset.direction); const moveCategoryButton = event.target.closest('[data-move-category]'); if (moveCategoryButton) moveCategory(moveCategoryButton.dataset.moveCategory, moveCategoryButton.dataset.direction); const removeCategory = event.target.closest('[data-delete-category]'); if (removeCategory) deleteCategory(removeCategory.dataset.deleteCategory); 
const remove = event.target.closest('[data-delete-item]'); if (remove && confirm('Remove this item from the menu?')) { const itemId = Number(remove.dataset.deleteItem); menu = menu.filter(item => item.id !== itemId); saveMenu(); renderMenu(); syncAdmin(`/api/admin/menu/${itemId}`, { method: 'DELETE' }); } });
$('#new-item-button').addEventListener('click', () => openItem());
$('#new-category-button').addEventListener('click', () => openCategory());
$('#category-form').addEventListener('submit', async event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); const name = data.name.trim(); const id = data.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); if (!id || categories.some(category => category.id === id && category.id !== data.id)) return; const existing = categories.findIndex(category => category.id === data.id); existing >= 0 ? categories.splice(existing, 1, { id, name }) : categories.push({ id, name }); saveCategories(); renderCategoryOptions(); renderMenu(); await syncAdmin(existing >= 0 ? `/api/admin/categories/${id}` : '/api/admin/categories', { method: existing >= 0 ? 'PATCH' : 'POST', body: JSON.stringify({ id, name }) }); $('#category-modal').hidden = true; });
$('#item-form').addEventListener('submit', async event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); const item = { id: data.id ? Number(data.id) : Date.now(), name: data.name, description: data.description, price: Number(data.price), category: data.category, image: data.image || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=500&q=80' }; const existing = menu.findIndex(menuItem => menuItem.id === item.id); if(existing >= 0) { menu.splice(existing, 1, item);} else{ menu.push(item);} saveMenu(); renderMenu(); await syncAdmin(existing >= 0 ? `/api/admin/menu/${item.id}` : '/api/admin/menu', { method: existing >= 0 ? 'PATCH' : 'POST', body: JSON.stringify(item) }); $('#item-modal').hidden = true; });
$('#close-item-modal').addEventListener('click', () => { $('#item-modal').hidden = true; });
$('#close-category-modal').addEventListener('click', () => { $('#category-modal').hidden = true; });
$('#item-modal').addEventListener('click', event => { if (event.target === $('#item-modal')) $('#item-modal').hidden = true; });
$('#category-modal').addEventListener('click', event => { if (event.target === $('#category-modal')) $('#category-modal').hidden = true; });
document.addEventListener('change', event => { const select = event.target.closest('[data-order-status]'); if (select) { const order = orders.find(item => item.id === select.dataset.orderStatus); order.status = select.value; saveOrders(); refresh(); syncAdmin(`/api/orders/${order.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: order.status }) }); } });
$('#toggle-store').addEventListener('click', () => { storeOpen = !storeOpen; localStorage.setItem(storeStatusKey, JSON.stringify(storeOpen)); renderStoreStatus(); syncAdmin('/api/admin/settings/store', { method: 'PATCH', body: JSON.stringify({ storeOpen }) }); });
$('#save-settings').addEventListener('click', async event => { const phone = $('#store-phone').value.trim(); const logoUrl = $('#store-logo').value.trim(); localStorage.setItem(storePhoneKey, phone); localStorage.setItem(storeLogoKey, logoUrl); setBrandLogo(logoUrl); await syncAdmin('/api/admin/settings/store', { method: 'PATCH', body: JSON.stringify({ storeOpen, phone, logoUrl }) }); event.target.textContent = 'Saved ✓'; setTimeout(() => { event.target.textContent = 'Save changes'; }, 1600); });
renderStoreStatus();
renderCategoryOptions();
setBrandLogo(localStorage.getItem(storeLogoKey) || defaultLogo);
refresh();
loadAdminData();
