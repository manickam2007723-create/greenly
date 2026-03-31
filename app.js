// State Management
let products = [];
let cart = JSON.parse(localStorage.getItem('ecoMart_cart')) || [];
let orders = JSON.parse(localStorage.getItem('ecoMart_orders')) || [];
let currentUser = JSON.parse(localStorage.getItem('ecoMart_user')) || null;
let currentCheckoutItem = null;

// Save to Local Storage whenever state changes
const saveState = () => {
  localStorage.setItem('ecoMart_products', JSON.stringify(products));
  localStorage.setItem('ecoMart_cart', JSON.stringify(cart));
  localStorage.setItem('ecoMart_orders', JSON.stringify(orders));
  localStorage.setItem('ecoMart_user', JSON.stringify(currentUser));
  updateUIState();
};

const updateUIState = () => {
  // Update Cart Count
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.innerText = cart.reduce((total, item) => total + item.quantity, 0);

  const authLi = document.getElementById('nav-auth');
  const addProdLi = document.getElementById('nav-add-product');
  if (addProdLi) {
    if (currentUser && currentUser.email === 'manickam2007723@gmail.com') {
      addProdLi.style.display = 'block';
    } else {
      addProdLi.style.display = 'none';
    }
  }
  if (authLi) {
    if (currentUser) {
      const initial = currentUser.email ? currentUser.email.charAt(0).toUpperCase() : '?';
      authLi.style.display = 'flex';
      authLi.style.alignItems = 'center';
      authLi.style.position = 'relative';

      authLi.innerHTML = `
        <div onclick="const dp = document.getElementById('logoutDropdown'); dp.style.display = dp.style.display === 'block' ? 'none' : 'block'" 
             style="width: 35px; height: 35px; background: var(--accent-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; cursor: pointer; user-select: none;">
          ${initial}
        </div>
        <div id="logoutDropdown" class="glass" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 10px; padding: 1rem; border-radius: 8px; min-width: 200px; z-index: 1000; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: left;">
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.8rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${currentUser.email}</div>
          <button class="btn btn-secondary" style="width: 100%; padding: 0.5rem; justify-content: center;" onclick="logout(event)"><i data-feather="log-out" style="width: 16px; height: 16px;"></i> Logout</button>
        </div>
      `;

      // Close dropdown if clicking elsewhere
      document.addEventListener('click', function (e) {
        if (!authLi.contains(e.target)) {
          const dp = document.getElementById('logoutDropdown');
          if (dp) dp.style.display = 'none';
        }
      }, { once: false });

      setTimeout(() => feather.replace(), 0);
    } else {
      authLi.style.position = 'relative';
      authLi.style.display = 'flex';
      authLi.style.alignItems = 'center';

      authLi.innerHTML = `
        <div onclick="const dp = document.getElementById('loginDropdown'); dp.style.display = dp.style.display === 'block' ? 'none' : 'block'" 
             style="display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer; user-select: none; color: white;">
          Account <i data-feather="chevron-down" style="width: 16px; height: 16px; margin-left: 4px;"></i>
        </div>
        <div id="loginDropdown" class="glass" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 10px; padding: 1rem; border-radius: 8px; min-width: 150px; z-index: 1000; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: left;">
          <a href="#" data-link="login" onclick="document.getElementById('loginDropdown').style.display='none'" style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-main); font-weight: 500; text-decoration: none;"><i data-feather="log-in" style="width: 16px; height: 16px;"></i> Login</a>
        </div>
      `;
      // Close dropdown if clicking elsewhere
      document.addEventListener('click', function (e) {
        if (!authLi.contains(e.target)) {
          const dp = document.getElementById('loginDropdown');
          if (dp) dp.style.display = 'none';
        }
      }, { once: false });
      setTimeout(() => feather.replace(), 0);
    }
  }
};

// UI Utils
const showToast = (message) => {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = 'toast show';
  toast.innerHTML = `<i data-feather="check-circle"></i> ${message}`;
  document.body.appendChild(toast);
  feather.replace();

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
};

// Action Handlers
window.fetchUserOrders = async () => {
  if (!currentUser || typeof SUPABASE_URL === 'undefined' || SUPABASE_URL.includes('YOUR_SUPABASE') || !supabase) return;
  try {
    const { data, error } = await supabase.from('orders').select('*').eq('userEmail', currentUser.email);
    if (!error && data) {
      data.reverse(); // Show newest first
      orders = data;
      saveState();
      const actives = document.querySelectorAll('.nav-links a.active');
      if (actives.length > 0 && actives[0].dataset.link === 'orders') renderView('orders');
    }
  } catch (err) {
    console.error("Failed to fetch user orders:", err);
  }
};

window.checkEmailPhase = (e) => {
  e.preventDefault();
  const email = document.getElementById('login_email').value.trim().toLowerCase();

  if (email === 'manickam2007723@gmail.com') {
    document.getElementById('login-form-email').style.display = 'none';
    document.getElementById('login-form-password').style.display = 'block';
  } else {
    currentUser = { name: email.split('@')[0], email };
    saveState();
    showToast('Logged in successfully!');
    navigate('home');
    fetchUserOrders();
  }
};

window.loginAdmin = (e) => {
  e.preventDefault();
  const email = document.getElementById('login_email').value.trim().toLowerCase();
  const pass = document.getElementById('login_pass').value;

  if (email === 'manickam2007723@gmail.com' && pass === 'manickam@2007') {
    currentUser = { name: 'Admin', email };
    saveState();
    sessionStorage.setItem('isAdminAuthenticated', 'true');
    showToast('Admin login successful! Redirecting...');
    window.location.href = 'admin.html?fromLogin=true';
  } else {
    showToast('Incorrect password!');
  }
};

window.logout = (e) => {
  e.preventDefault();
  currentUser = null;
  orders = [];
  saveState();
  showToast('Logged out');
  navigate('home');
};

window.addToCart = (id) => {
  const product = products.find(p => p.id == id);
  if (!product) return;

  const existing = cart.find(item => item.id == id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveState();
  showToast(`${product.name} added to cart`);
};

window.buyNow = (id) => {
  const product = products.find(p => p.id == id);
  if (!product) return;
  currentCheckoutItem = { ...product, quantity: 1 };
  navigate('checkout-direct');
};

window.viewProduct = (id) => {
  currentCheckoutItem = products.find(p => p.id == id);
  if (currentCheckoutItem) {
    navigate('product-detail');
  }
};

window.removeFromCart = (id) => {
  cart = cart.filter(item => item.id != id);
  saveState();
  renderView('cart');
};

window.checkout = () => {
  if (cart.length === 0) return;
  currentCheckoutItem = null; // flag that we are checking out full cart
  navigate('checkout-direct');
};

window.handleDirectCheckout = async (e) => {
  e.preventDefault();

  if (!currentUser) {
    showToast('Please login to place your order');
    navigate('login');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.dataset.originalHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = "Processing...";
    submitBtn.disabled = true;
  }

  const address = document.getElementById('chk_address').value;
  const phone = document.getElementById('chk_phone').value;
  const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

  if (paymentMethod === 'UPI' && !document.getElementById('chk_upi').value) {
    showToast('Please enter your UPI ID');
    if (submitBtn) { submitBtn.innerHTML = submitBtn.dataset.originalHtml; submitBtn.disabled = false; }
    return;
  }

  const itemsToOrder = currentCheckoutItem ? [currentCheckoutItem] : [...cart];
  const total = itemsToOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

  const newOrder = {
    id: 'ORD-' + Math.floor(Math.random() * 1000000),
    date: new Date().toLocaleDateString(),
    items: itemsToOrder,
    total,
    delivery: { address, phone },
    payment: paymentMethod,
    userEmail: currentUser ? currentUser.email : 'Guest',
    status: 'Active'
  };



  // 1. Try hitting Supabase
  if (window.supabase && typeof SUPABASE_URL !== 'undefined' && !SUPABASE_URL.includes('YOUR_SUPABASE')) {
    try {
      const { error } = await supabase.from('orders').insert([newOrder]);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase order error:", err);
      showToast('Database error, saving locally temporarily.');
    }
  }

  orders.unshift(newOrder);
  if (!currentCheckoutItem || currentCheckoutItem.quantity) {
    if (!currentCheckoutItem) {
      cart = [];
    }
  }
  saveState();

  if (submitBtn) { submitBtn.innerHTML = submitBtn.dataset.originalHtml; submitBtn.disabled = false; }

  showToast('Order placed successfully via ' + paymentMethod);
  navigate('orders');
};

window.cancelOrder = async (id) => {
  const order = orders.find(o => o.id === id);
  if (order) {
    order.status = 'Cancelled';
    saveState();
    showToast('Order ' + id + ' has been cancelled');
    renderView('orders');

    // Update in Supabase
    if (window.supabase && typeof SUPABASE_URL !== 'undefined' && !SUPABASE_URL.includes('YOUR_SUPABASE')) {
      try {
        await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', id);
      } catch (err) {
        console.error("Failed to cancel in DB:", err);
      }
    }
  }
};

window.togglePaymentMethod = () => {
  const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
  const upiContainer = document.getElementById('upi-container');
  if (paymentMethod === 'UPI') {
    upiContainer.style.display = 'block';
  } else {
    upiContainer.style.display = 'none';
  }
};

// App Views
const views = {
  login: () => {
    return `
      <div class="glass page-section" style="max-width: 400px; margin: 4rem auto;">
        <h2 class="page-title" style="font-size: 2rem;">Welcome</h2>
        <form id="login-form-email" onsubmit="window.checkEmailPhase(event)">
          <div class="form-group">
            <label for="login_email">Email</label>
            <input type="email" id="login_email" class="form-control" required placeholder="eco@mart.com" autocomplete="off">
          </div>
          <button type="submit" class="btn" style="width: 100%; justify-content: center; padding: 1rem;">
             Continue
          </button>
        </form>
        <form id="login-form-password" style="display:none;" onsubmit="window.loginAdmin(event)">
          <div class="form-group">
            <label for="login_pass">Admin Password</label>
            <input type="password" id="login_pass" class="form-control" required placeholder="••••••••">
          </div>
          <button type="submit" class="btn" style="width: 100%; justify-content: center; padding: 1rem;">
            <i data-feather="log-in"></i> Login
          </button>
          <button type="button" class="btn btn-secondary" style="width: 100%; justify-content: center; padding: 1rem; margin-top: 1rem;" onclick="document.getElementById('login-form-password').style.display='none'; document.getElementById('login-form-email').style.display='block';">
            Back
          </button>
        </form>
      </div>
    `;
  },

  home: (query = '') => {
    const filtered = products.filter(p => p.name && p.name.toLowerCase().includes(query) || p.category && p.category.toLowerCase().includes(query));

    let gridHTML = '';
    if (window.supabaseErrorMsg) {
      gridHTML = `
        <div class="empty-state glass page-section" style="border-color: red;">
          <i data-feather="alert-triangle" style="color: red;"></i>
          <h3 style="color: red;">Supabase Error</h3>
          <p><strong>Error: ${window.supabaseErrorMsg}</strong></p>
          <p style="margin-top: 1rem;">If it says "permission denied", you forgot to disable <b>Row Level Security (RLS)</b> on your 'products' table in Supabase!</p>
        </div>
      `;
    }  else if (filtered.length === 0) {
      gridHTML = `
        <div class="empty-state glass page-section">
          <i data-feather="search"></i>
          <h3>No Products Found</h3>
          <p>Your database is currently empty. Go to the Admin Dashboard and publish a product!</p>
        </div>
      `;
    } else {
      gridHTML = `
        <div style="margin-top: 1.5rem; margin-bottom: 1rem; padding: 0 0.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: 500;">Eco-friendly Products</h2>
        </div>
        <div class="product-grid">
      ` + filtered.map(p => `
        <div class="product-card glass">
          <img src="${p.image}" alt="${p.name}" class="product-img" loading="lazy" onclick="viewProduct('${p.id}')" style="cursor:pointer;">
          <div class="product-info">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
              <span class="product-category">${p.category}</span>
              ${p.stock !== undefined ? `<span style="font-size: 0.75rem; font-weight: bold; color: ${p.stock > 0 ? 'var(--accent-color)' : '#ff4757'}; background: ${p.stock > 0 ? '#e8f5e9' : '#ffeaa7'}; padding: 2px 6px; border-radius: 4px;">${p.stock > 0 ? p.stock + ' in stock' : 'Out of Stock'}</span>` : ''}
            </div>
            <h3 class="product-title">${p.name}</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">${p.description.substring(0, 70)}...</p>
            <div class="product-footer" style="flex-wrap: wrap; gap: 0.5rem;">
              <span class="product-price">₹${p.price}</span>
              <div style="display:flex; gap: 0.5rem;">
                <button class="btn btn-secondary" style="padding: 0.5rem 1rem;" onclick="addToCart('${p.id}')">
                  <i data-feather="shopping-cart"></i>
                </button>
                <button class="btn" style="padding: 0.5rem 1rem;" onclick="buyNow('${p.id}')">
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('') + '</div>';
    }

    return gridHTML;
  },

  'product-detail': () => {
    const p = currentCheckoutItem;
    if (!p) return views.home();

    return `
      <div class="glass page-section" style="padding: 2rem;">
        <button class="btn btn-secondary" style="margin-bottom: 2rem; width: auto;" onclick="navigate('home')">
          <i data-feather="arrow-left"></i> Back to Products
        </button>
        <div class="pdp-grid">
          <div style="background: white; border: 1px solid var(--border-color); padding: 2rem; display: flex; align-items: center; justify-content: center; height: 400px;">
            <img src="${p.image}" alt="${p.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="color: var(--text-muted); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; font-weight:bold;">${p.category}</span>
                ${p.stock !== undefined ? `<span style="font-size: 0.85rem; font-weight: bold; color: ${p.stock > 0 ? 'var(--accent-color)' : '#ff4757'}; background: ${p.stock > 0 ? '#e8f5e9' : '#ffeaa7'}; padding: 4px 8px; border-radius: 4px;">${p.stock > 0 ? p.stock + ' pieces available' : 'Out of Stock'}</span>` : ''}
            </div>
            <h1 style="font-size: 2rem; margin: 0 0 1rem; color: var(--text-main);">${p.name}</h1>
            <h2 style="font-size: 2.25rem; color: var(--text-main); margin-bottom: 1.5rem;">₹${p.price}</h2>
            
            <p style="font-size: 1.1rem; line-height: 1.6; color: var(--text-muted); margin-bottom: 2rem;">
              ${p.description}
            </p>
            
            <div style="display: flex; gap: 1rem;">
              <button class="btn" style="flex: 1; padding: 1rem; font-size: 1.1rem; background-color: var(--primary-color);" onclick="buyNow('${p.id}')">
                <i data-feather="zap"></i> Buy Now
              </button>
              <button class="btn btn-secondary" style="flex: 1; padding: 1rem; font-size: 1.1rem;" onclick="addToCart('${p.id}')">
                <i data-feather="shopping-cart"></i> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  'checkout-direct': () => {
    const items = currentCheckoutItem && currentCheckoutItem.quantity ? [currentCheckoutItem] : cart;
    if (items.length === 0) return views['cart']();

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

    return `
      <div class="glass page-section">
        <h2 class="page-title">Secure Checkout</h2>
        <div class="checkout-grid">
          
          <div>
            <h3>Delivery Details</h3>
            <form id="checkout-form" onsubmit="window.handleDirectCheckout(event)">
              <div class="form-group" style="margin-top: 1rem;">
                <label>Phone Number</label>
                <input type="tel" id="chk_phone" class="form-control" required placeholder="e.g. +91 98765 43210">
              </div>
              <div class="form-group">
                <label>Delivery Address</label>
                <textarea id="chk_address" class="form-control" rows="3" required placeholder="Full shipping address..."></textarea>
              </div>
              
              <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Payment Method</h3>
              <div class="form-group" style="display: flex; gap: 1rem; align-items: center;">
                <label style="margin:0; display:flex; align-items:center; gap:0.5rem; font-weight:normal; cursor:pointer;">
                  <input type="radio" name="payment_method" value="COD" onchange="togglePaymentMethod()" checked>
                  Cash on Delivery
                </label>
                <label style="margin:0; display:flex; align-items:center; gap:0.5rem; font-weight:normal; cursor:pointer;">
                  <input type="radio" name="payment_method" value="UPI" onchange="togglePaymentMethod()">
                  UPI
                </label>
              </div>
              
              <div class="form-group" id="upi-container" style="display: none; background: rgba(0,0,0,0.05); padding: 1rem; border-radius: 8px;">
                <label>UPI ID</label>
                <input type="text" id="chk_upi" class="form-control" placeholder="username@upi">
                <small style="color: var(--text-muted); display: block; margin-top: 0.5rem;">You will receive a payment request on your UPI app.</small>
              </div>

              <button type="submit" class="btn" style="width: 100%; justify-content: center; padding: 1rem; margin-top: 2rem;">
                <i data-feather="lock"></i> Place Order - ₹${total}
              </button>
            </form>
          </div>

          <div style="background: rgba(255,255,255,0.5); padding: 1.5rem; border-radius: 12px; height: fit-content;">
            <h3>Order Summary</h3>
            <div style="margin-top: 1.5rem;">
              ${items.map(item => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px dashed var(--border-color); padding-bottom: 0.5rem;">
                  <span>${item.quantity}x ${item.name}</span>
                  <span style="font-weight: bold;">₹${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
              <div style="display: flex; justify-content: space-between; margin-top: 1.5rem; font-size: 1.25rem;">
                <strong>Grand Total</strong>
                <strong style="color: var(--accent-color);">₹${total}</strong>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  orders: () => {
    if (!currentUser) return `
      <div class="empty-state glass page-section">
        <i data-feather="user-x"></i>
        <h3>Please Login</h3>
        <p>Login to view your order history.</p>
        <button class="btn" style="margin: 1.5rem auto 0;" onclick="navigate('login')">Go to Login</button>
      </div>
    `;

    const userOrders = orders.filter(o => o.userEmail === currentUser.email);

    if (userOrders.length === 0) {
      return `
        <div class="empty-state glass page-section">
          <i data-feather="package"></i>
          <h3>No orders yet</h3>
          <p>Your eco-friendly journey awaits! Start shopping to see orders here.</p>
        </div>
      `;
    }

    const orderHTML = userOrders.map(order => `
      <div class="glass page-section" style="margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1rem;">
          <div>
            <h3 style="margin-bottom: 0.25rem;">Order #${order.id}</h3>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Payment: ${order.payment}</span>
          </div>
          <span style="color: var(--text-muted);">${order.date}</span>
        </div>
        <div>
          ${order.items.map(item => `
            <div class="list-item" style="padding: 0.5rem 0; border: none;">
              <span>${item.quantity}x ${item.name}</span>
              <span>₹${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
          <div style="font-size: 1.1rem; font-weight: bold; color: var(--accent-color);">
            Total: ₹${order.total}
          </div>
          <div>
            ${order.status === 'Cancelled' ?
        `<span style="color: #ff4757; font-weight: bold;"><i data-feather="x-circle" style="width: 16px; height: 16px; vertical-align: middle;"></i> Order Cancelled</span>` :
        `<button class="btn btn-secondary" style="color: #ff4757; border-color: #ff4757; padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="cancelOrder('${order.id}')">Cancel Order</button>`
      }
          </div>
        </div>
      </div>
    `).join('');

    return `
      <h2 class="page-title">My Eco Orders</h2>
      ${orderHTML}
    `;
  },

  cart: () => {
    if (cart.length === 0) {
      return `
        <div class="empty-state glass page-section">
          <i data-feather="shopping-cart"></i>
          <h3>Your cart is empty</h3>
          <p>Browse our home page and add some natural goodies!</p>
        </div>
      `;
    }

    const cartHtml = cart.map(item => `
      <div class="list-item glass" style="margin-bottom: 1rem; border-radius: 12px;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
          <div>
            <h4 style="margin: 0;">${item.name}</h4>
            <span style="color: var(--text-muted); font-size: 0.9rem;">₹${item.price} each</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 1.5rem;">
          <span style="font-weight: bold;">Qty: ${item.quantity}</span>
          <span style="font-weight: bold; color: var(--accent-color);">₹${(item.price * item.quantity).toFixed(2)}</span>
          <button class="btn btn-secondary" style="padding: 0.5rem; border-radius: 50%; border-color: #ff4757; color: #ff4757" onclick="removeFromCart('${item.id}')">
            <i data-feather="trash-2"></i>
          </button>
        </div>
      </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

    return `
      <h2 class="page-title">Your Cart</h2>
      <div>${cartHtml}</div>
      <div class="glass page-section" style="text-align: right; margin-top: 2rem; padding: 2rem;">
        <h3 style="font-size: 1.8rem;">Total: <span style="color: var(--accent-color);">₹${total}</span></h3>
        <button class="btn" style="margin-left: auto; margin-top: 1.5rem; padding: 1rem 2rem; font-size: 1.1rem;" onclick="checkout()">
          <i data-feather="credit-card"></i> Proceed to Checkout
        </button>
      </div>
    `;
  }
};

// Router
window.renderView = (view, query = '') => {
  const container = document.getElementById('app-content');
  if (!views[view]) view = 'home';
  container.innerHTML = views[view](query.toLowerCase());
  feather.replace();

  // Update nav active states
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.dataset.link) {
      a.classList.toggle('active', a.dataset.link === view);
    }
  });
};

window.navigate = window.renderView;

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Always dump old localStorage products to instantly see the updated slim catalog
  localStorage.removeItem('ecoMart_products');

  let fetchedProducts = [];
  if (window.supabase && typeof SUPABASE_URL !== 'undefined' && !SUPABASE_URL.includes('YOUR_SUPABASE')) {
    const { data, error } = await supabase.from('products').select('*').limit(10);
    if (error) {
      console.error("Supabase Error:", error);
      window.supabaseErrorMsg = error.message;
    } else {
      fetchedProducts = data || [];
      fetchedProducts.reverse();
    }

    // Add Real-Time Sync: Instantly pull new products added on other devices
    supabase
      .channel('public:products')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, payload => {
        console.log("New product instantly synced!", payload.new);
        fetchedProducts.unshift(payload.new);

        const deletedInitial = JSON.parse(localStorage.getItem('ecoMart_deleted_initial') || '[]');
        const validInitial = (window.initialProducts || []).filter(p => !deletedInitial.includes(p.id));
        products = [...fetchedProducts, ...validInitial].slice(0, 10);
        saveState();

        // Re-render the homepage if they are currently looking at it
        const actives = document.querySelectorAll('.nav-links a.active');
        if (actives.length > 0 && actives[0].dataset.link === 'home') {
          renderView('home');
          showToast('A new eco-friendly product just arrived!');
        }
      })
      .subscribe();
  } else {
    console.warn("Supabase not configured locally.");
  }

  // Set the single source of truth to Supabase and defaults
  const deletedInitial = JSON.parse(localStorage.getItem('ecoMart_deleted_initial') || '[]');
  const validInitial = (window.initialProducts || []).filter(p => !deletedInitial.includes(p.id));
  products = [...fetchedProducts, ...validInitial].slice(0, 10);

  saveState();
  updateUIState();

  // Fetch orders immediately on load if logged in
  if (currentUser) {
    if (typeof window.fetchUserOrders === 'function') {
      window.fetchUserOrders();
    }
  }

  navigate('home');

  // Event Listeners for Navigation
  document.addEventListener('click', (e) => {
    let target = e.target;
    while (target && target !== document) {
      if (target.dataset && target.dataset.link) {
        e.preventDefault();
        navigate(target.dataset.link);
        return;
      }
      target = target.parentNode;
    }
  });

  // Event Listener for Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      navigate('home', query);
    });
  }
});
