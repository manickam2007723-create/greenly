// State Management
let products = [];
let cart = JSON.parse(localStorage.getItem('ecoMart_cart')) || [];
let orders = JSON.parse(localStorage.getItem('ecoMart_orders')) || [];
let currentUser = JSON.parse(localStorage.getItem('ecoMart_user')) || null;
let currentCheckoutItem = null;

// Sustainability Tracking
const augmentProduct = (p) => {
  if (p.isBiodegradable !== undefined) return p;
  
  // Explicitly check for Supabase DB mapping, otherwise fallback to auto-inference
  let isBio;
  if (p.is_biodegradable !== undefined && p.is_biodegradable !== null) {
      isBio = p.is_biodegradable;
  } else {
      const text = (p.name + " " + p.category + " " + p.description).toLowerCase();
      isBio = !text.includes('plastic') && !text.includes('synthetic') && !text.includes('polyester'); 
  }
  
  return {
    ...p,
    isBiodegradable: isBio,
    material: isBio ? 'Organic / Natural Materials' : 'Synthetic / Mixed Materials',
    reusability: isBio ? 'High (Compostable/Reusable)' : 'Low (Single-use)',
    source: isBio ? 'Local Eco-Farms & Artisans' : 'Commercial Supply Chain',
    lifespan: isBio ? '6-12 Months (Biodegradable)' : 'Years (Persistent Waste)',
    reuseTips: isBio ? 'Clean gently. Compost when lifespan is over to enrich soil.' : 'Repurpose for storage. Do not expose to high heat to avoid chemicals.'
  };
};

const getEcoScore = () => {
   return cart.reduce((score, item) => score + (augmentProduct(item).isBiodegradable ? 2 : -2) * item.quantity, 0);
};

const getLifetimeEcoScore = () => {
   if (!currentUser) return 0;
   let score = 0;
   if (currentUser.spinPenalty) score -= currentUser.spinPenalty; // Decrease score for active wheel spins
   
   const userOrders = orders.filter(o => o.userEmail === currentUser.email && o.status !== 'Cancelled');
   userOrders.forEach(o => {
      if (o.claimedReward) score -= 20; // Decrease the score if they got a checkout reward
      o.items.forEach(item => {
         if (item.category === 'Reward Gift') {
             // Decrease the score if they claimed a free physical gift from the calculator
             score -= 50;
         } else {
             score += (augmentProduct(item).isBiodegradable ? 2 : -2) * item.quantity;
         }
      });
   });
   return score;
};

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

  // Update Eco Score Badge
  const ecoBadge = document.querySelector('.eco-score-badge');
  if (ecoBadge) {
    ecoBadge.style.display = 'block';
    if (currentUser) {
      const userScore = getLifetimeEcoScore();
      ecoBadge.style.background = userScore > 0 ? 'rgba(37, 211, 102, 0.3)' : (userScore < 0 ? 'rgba(255, 71, 87, 0.3)' : 'rgba(255, 255, 255, 0.2)');
      ecoBadge.style.color = '#fff';
      ecoBadge.innerHTML = `<i data-feather="award" style="width:16px; height: 16px;"></i> Eco Score: <span id="nav-eco-score" style="font-weight:900;">${userScore > 0 ? '+' + userScore : userScore}</span>`;
    } else if (cart.length > 0) {
      const cartScore = getEcoScore();
      ecoBadge.style.background = cartScore > 0 ? 'rgba(37, 211, 102, 0.3)' : (cartScore < 0 ? 'rgba(255, 71, 87, 0.3)' : 'rgba(255, 255, 255, 0.2)');
      ecoBadge.style.color = '#fff';
      ecoBadge.innerHTML = `<i data-feather="target" style="width:16px; height: 16px;"></i> Cart Score: <span id="nav-eco-score" style="font-weight:900;">${cartScore > 0 ? '+' + cartScore : cartScore}</span>`;
    } else {
      ecoBadge.style.background = 'rgba(255, 255, 255, 0.2)';
      ecoBadge.innerHTML = `<i data-feather="star" style="width:16px; height: 16px;"></i> Eco Score: <span id="nav-eco-score" style="font-weight:900;">0</span>`;
    }
    setTimeout(() => { if (window.feather) feather.replace(); }, 0);
  }

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
          <div style="font-size: 0.95rem; font-weight: bold; color: var(--text-main); margin-bottom: 0.2rem;">${currentUser.name}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.8rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${currentUser.phone || ''}</div>
          <a href="#" data-link="account" onclick="document.getElementById('logoutDropdown').style.display='none'" style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-main); font-weight: 500; text-decoration: none; margin-bottom: 0.5rem;"><i data-feather="user" style="width: 16px; height: 16px;"></i> My Profile</a>
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
};window.checkEmailPhase = (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('login_email').value.trim();
  const phoneInput = document.getElementById('login_phone') ? document.getElementById('login_phone').value.trim() : '';

  // Admin bypass
  if (nameInput.toLowerCase() === 'manickam2007723@gmail.com') {
    document.getElementById('login-form-email').style.display = 'none';
    document.getElementById('login-form-password').style.display = 'block';
  } else {
    currentUser = { name: nameInput, email: nameInput, phone: phoneInput };
    saveState();
    
    showToast('Welcome, ' + currentUser.name + '!');
    navigate('home');
    if (typeof window.fetchUserOrders === 'function') window.fetchUserOrders();
  }
};

window.loginAdmin = (e) => {
  e.preventDefault();
  const email = document.getElementById('login_email').value.trim().toLowerCase();
  const pass = document.getElementById('login_pass').value;

  if (email === 'manickam2007723@gmail.com' && pass === 'qscgyjm') {
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

window.updateCheckoutTotal = () => {
    let grandTotal = 0;
    const rows = document.querySelectorAll('.checkout-item-row');
    rows.forEach(row => {
        const id = row.dataset.id;
        const price = parseFloat(row.dataset.price);
        const qtyInput = document.getElementById(`qty_${id}`);
        const qty = parseInt(qtyInput.value) || 1;
        
        const itemTotal = price * qty;
        grandTotal += itemTotal;
        row.querySelector('.chk-item-total').innerText = '₹' + itemTotal.toFixed(2);
    });

    const rewardCheckbox = document.getElementById('chk_claim_reward');
    let discountHTML = '';
    if (rewardCheckbox && rewardCheckbox.checked) {
        const discountAmt = parseInt(rewardCheckbox.dataset.discount) || 20;
        grandTotal = Math.max(0, grandTotal - discountAmt);
        discountHTML = `
            <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 1rem; color: #2e7d32;">
                <strong>Eco Reward Applied:</strong>
                <span>-₹${discountAmt.toFixed(2)}</span>
            </div>
        `;
    }

    const discountDisplay = document.getElementById('chk-discount-display');
    if (discountDisplay) discountDisplay.innerHTML = discountHTML;

    document.getElementById('chk-grand-total').innerText = '₹' + grandTotal.toFixed(2);
    
    // update button text
    const btn = document.querySelector('#checkout-form button[type="submit"]');
    if (btn) btn.innerHTML = `<i data-feather="lock"></i> Place Order - ₹${grandTotal.toFixed(2)}`;
    if (window.feather) feather.replace();
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
    showToast('Please enter your UPI Transaction ID');
    if (submitBtn) { submitBtn.innerHTML = submitBtn.dataset.originalHtml; submitBtn.disabled = false; }
    return;
  }

  const itemsToOrder = (currentCheckoutItem ? [currentCheckoutItem] : [...cart]).map(i => {
     const qtyInput = document.getElementById(`qty_${i.id}`);
     const newQty = qtyInput ? (parseInt(qtyInput.value) || 1) : i.quantity;
     return { ...i, quantity: newQty };
  });

  const rewardCheckbox = document.getElementById('chk_claim_reward');
  const discountAmt = rewardCheckbox ? (parseInt(rewardCheckbox.dataset.discount) || 20) : 0;
  const claimedReward = rewardCheckbox && rewardCheckbox.checked ? `₹${discountAmt} Eco Score Discount` : null;

  let calculatedTotal = itemsToOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (claimedReward) calculatedTotal = Math.max(0, calculatedTotal - discountAmt);
  const total = calculatedTotal.toFixed(2);

  const newOrder = {
    id: Math.floor(Math.random() * 2000000000), // numeric ID to satisfy bigint
    date: new Date().toLocaleDateString(),
    items: itemsToOrder,
    total,
    delivery: { address, phone },
    payment: paymentMethod,
    userEmail: currentUser ? currentUser.email : 'Guest',
    status: 'Active',
    claimedReward: claimedReward
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
  const reason = prompt('Please enter a reason for cancellation:');
  if (reason === null || reason.trim() === '') {
    showToast('Cancellation aborted. Reason is required.');
    return;
  }

  const order = orders.find(o => o.id === id);
  if (order) {
    order.status = 'Cancelled';
    order.cancelReason = reason.trim();
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

// Mock Google Login Removed Wait for complete logic below

// App Views
const views = {
  login: () => {
    return `
      <div class="glass page-section" style="max-width: 400px; margin: 4rem auto;">
        <h2 class="page-title" style="font-size: 2rem;">Welcome</h2>
        <form id="login-form-email" onsubmit="window.checkEmailPhase(event)">
          <div class="form-group">
            <label for="login_email">Enter your Name (or Admin Email)</label>
            <input type="text" id="login_email" class="form-control" required placeholder="User Name / Admin Email" autocomplete="off">
          </div>
          <div class="form-group">
            <label for="login_phone">Phone Number (Optional)</label>
            <input type="tel" id="login_phone" class="form-control" placeholder="+91 9876543210" autocomplete="off">
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

  'account': () => {
    if (!currentUser) return views['login']();
    return `
      <div class="glass page-section" style="max-width: 500px; margin: 4rem auto; text-align: center;">
        <i data-feather="user" style="width: 64px; height: 64px; margin-bottom: 1rem; color: #2e7d32;"></i>
        <h2 class="page-title">My Account</h2>
        <div style="background: #e8f5e9; border: 1px solid #a5d6a7; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
            <h3 style="margin-bottom: 0.5rem; color: #1b5e20;">${currentUser.name}</h3>
            <p style="margin: 0; color: #2e7d32; font-size: 1.1rem;"><i data-feather="phone" style="width: 16px; height: 16px; margin-right: 5px;"></i>${currentUser.phone || 'No phone provided'}</p>
        </div>
        <button class="btn btn-secondary" onclick="window.logout(event)" style="width: 100%; justify-content: center;">
          <i data-feather="log-out"></i> Sign Out
        </button>
      </div>
    `;
  },

  home: (query = '') => {
    const augmentedProducts = products.map(augmentProduct);
    const filtered = augmentedProducts.filter(p => !query || (p.name && p.name.toLowerCase().includes(query)) || (p.category && p.category.toLowerCase().includes(query)));

    const generateCard = (p) => `
        <div class="product-card glass" style="position: relative;">
          <div style="position:absolute; top: 10px; right: 10px; z-index: 10; font-size: 0.7rem; padding: 4px 8px; border-radius: 12px; font-weight: bold; background: ${p.isBiodegradable ? '#e8f5e9' : '#ffebee'}; color: ${p.isBiodegradable ? '#2e7d32' : '#c62828'}; border: 1px solid ${p.isBiodegradable ? '#a5d6a7' : '#ef9a9a'};">
            ${p.isBiodegradable ? '✓ Biodegradable' : '⚠ Non-biodegradable'}
          </div>
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
      `;

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
      let homeContent = '';
      if (!query) {
        const sustainable = filtered.filter(p => p.isBiodegradable);
        if (sustainable.length > 0) {
           homeContent += `
           <div style="margin-top: 1.5rem; margin-bottom: 2rem; background: linear-gradient(135deg, #e8f5e9, #c8e6c9); padding: 1.5rem; border-radius: 12px; border: 1px solid #a5d6a7;">
            <h2 style="font-size: 1.5rem; font-weight: 600; color: #2e7d32; display: flex; align-items: center; gap: 0.5rem;"><i data-feather="check-circle"></i> Recommended Sustainable Products</h2>
            <p style="color: #388e3c; margin-bottom: 1.5rem; font-size: 0.95rem;">Make a positive impact! Earn +2 Eco Score points for each of these items you buy.</p>
            <div class="product-grid">
              ${sustainable.slice(0, 4).map(p => generateCard(p)).join('')}
            </div>
           </div>`;
        }
      }

      const regularProducts = filtered;
      homeContent += `
        <div style="margin-top: 1.5rem; margin-bottom: 1rem; padding: 0 0.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: 500;">All Products</h2>
        </div>
        <div class="product-grid">
          ${regularProducts.map(p => generateCard(p)).join('')}
        </div>
      `;
      gridHTML = homeContent;
    }

    return gridHTML;
  },

  'product-detail': () => {
    let p = currentCheckoutItem;
    if (!p) return views.home();
    p = augmentProduct(p);

    const augmentedProducts = products.map(augmentProduct);
    let alternatives = augmentedProducts.filter(alt => alt.isBiodegradable && alt.id !== p.id && alt.category === p.category).slice(0, 3);
    if (alternatives.length === 0) {
      alternatives = augmentedProducts.filter(alt => alt.isBiodegradable && alt.id !== p.id).slice(0, 3);
    }

    return `
      <div class="glass page-section" style="padding: 2rem;">
        <button class="btn btn-secondary" style="margin-bottom: 2rem; width: auto;" onclick="navigate('home')">
          <i data-feather="arrow-left"></i> Back to Products
        </button>
        <div class="pdp-grid">
          <div style="background: white; border: 1px solid var(--border-color); padding: 2rem; display: flex; align-items: center; justify-content: center; height: 400px; position: relative;">
             <div style="position:absolute; top: 10px; left: 10px; z-index: 10; font-size: 0.8rem; padding: 6px 12px; border-radius: 12px; font-weight: bold; background: ${p.isBiodegradable ? '#e8f5e9' : '#ffebee'}; color: ${p.isBiodegradable ? '#2e7d32' : '#c62828'}; border: 1px solid ${p.isBiodegradable ? '#a5d6a7' : '#ef9a9a'};">
               ${p.isBiodegradable ? '✓ Biodegradable Product (+2 Eco Score)' : '⚠ Non-biodegradable (-2 Eco Score)'}
             </div>
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

            <div style="background: #e0f7fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid #b2ebf2;">
              <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: #006064;"><i data-feather="info" style="width:16px;height:16px;"></i> Product Sustainability Guidance</h3>
              <ul style="list-style: none; padding: 0; font-size: 0.95rem; color: #00838f;">
                <li style="margin-bottom: 0.5rem;"><strong>Typical Lifespan:</strong> ${p.lifespan}</li>
                <li><strong>Reuse Tips:</strong> ${p.reuseTips}</li>
              </ul>
            </div>

            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid var(--border-color);">
              <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-main);">Product Transparency</h3>
              <ul style="list-style: none; padding: 0; font-size: 0.95rem; color: var(--text-muted);">
                <li style="margin-bottom: 0.5rem;"><strong>Material:</strong> ${p.material}</li>
                <li style="margin-bottom: 0.5rem;"><strong>Reusability:</strong> ${p.reusability}</li>
                <li><strong>Source:</strong> ${p.source}</li>
              </ul>
            </div>
            
            ${!p.isBiodegradable ? `
              <div style="background: #fff3cd; color: #856404; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid #ffeeba;">
                <strong>Health & Environmental Awareness:</strong>
                <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                   <li>This product may release harmful chemicals when used with hot food.</li>
                   <li>This product contributes to long-term environmental waste.</li>
                </ul>
              </div>
            ` : ''}

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

        ${(!p.isBiodegradable && alternatives.length > 0) ? `
          <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border-color);">
            <h3 style="font-size: 1.5rem; color: #2e7d32; margin-bottom: 1.5rem;"><i data-feather="info"></i> Smart Alternative Suggestions</h3>
            <p style="margin-bottom: 1rem;">Consider these eco-friendly options instead to earn a higher Eco Score and rewards.</p>
            <div class="product-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
              ${alternatives.map(alt => `
                <div class="product-card glass" style="padding: 1rem; text-align: center; cursor: pointer;" onclick="viewProduct('${alt.id}')">
                  <img src="${alt.image}" style="width: 100%; height: 120px; object-fit: contain; margin-bottom: 1rem;">
                  <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem;">${alt.name}</h4>
                  <span style="color: var(--primary-color); font-weight: bold;">₹${alt.price}</span>
                  <div style="margin-top: 0.5rem; font-size: 0.75rem; background: #e8f5e9; color: #2e7d32; padding: 2px 4px; border-radius: 4px;">✓ Better Choice</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  'checkout-direct': () => {
    const items = currentCheckoutItem && currentCheckoutItem.quantity ? [currentCheckoutItem] : cart;
    if (items.length === 0) return views['cart']();

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    const ecoScore = items.reduce((score, item) => score + (augmentProduct(item).isBiodegradable ? 2 : -2) * item.quantity, 0);
    const eligibleForReward = ecoScore >= 10;

    return `
      <div class="glass page-section">
        <h2 class="page-title">Secure Checkout</h2>
        <div class="checkout-grid">
          
          <div>
            <h3>Delivery Details</h3>
            <form id="checkout-form" onsubmit="window.handleDirectCheckout(event)">
              <div class="form-group" style="margin-top: 1rem;">
                <label>Phone Number</label>
                <input type="tel" id="chk_phone" class="form-control" required placeholder="e.g. +91 98765 43210" value="${currentUser && currentUser.phone ? currentUser.phone : ''}">
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
                <p style="margin-bottom: 1rem;">Click below to pay via any UPI app. Then enter the Transaction ID.</p>
                <a href="upi://pay?pa=storemanager@upi&pn=EcoMart&am=${total}&cu=INR" class="btn btn-secondary" style="display: block; text-align: center; margin-bottom: 1rem; text-decoration: none; padding: 0.8rem;">Open UPI App to Pay ₹${total}</a>
                <label>Transaction ID / UTR</label>
                <input type="text" id="chk_upi" class="form-control" placeholder="Enter Transaction ID after payment">
                <small style="color: var(--text-muted); display: block; margin-top: 0.5rem;">Enter the Transaction ID to confirm your payment.</small>
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
                <div class="checkout-item-row" data-id="${item.id}" data-price="${item.price}" style="display: flex; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px dashed var(--border-color); padding-bottom: 0.5rem; align-items: center;">
                  <div style="display:flex; align-items:center; gap: 0.5rem;">
                    <input type="number" id="qty_${item.id}" value="${item.quantity}" min="1" max="${item.stock || 99}" style="width: 50px; padding: 0.2rem 0.4rem; border-radius: 4px; border: 1px solid var(--border-color);" onchange="window.updateCheckoutTotal()" onkeyup="window.updateCheckoutTotal()">
                    <span style="font-size: 0.95rem;">${item.name}</span>
                  </div>
                  <span class="chk-item-total" style="font-weight: bold;">₹${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
              <div style="display: flex; justify-content: space-between; margin-top: 1.5rem; font-size: 1.25rem;">
                <strong>Grand Total</strong>
                <strong id="chk-grand-total" style="color: var(--accent-color);">₹${total}</strong>
              </div>
              <div id="chk-discount-display"></div>
              <div style="margin-top: 2rem; background: ${eligibleForReward ? '#e8f5e9' : '#fff3cd'}; padding: 1.5rem; border-radius: 8px; border: 1px solid ${eligibleForReward ? '#a5d6a7' : '#ffeeba'};">
                <h4 style="margin-top:0; color: ${eligibleForReward ? '#2e7d32' : '#856404'}; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;"><i data-feather="${eligibleForReward ? 'gift' : 'target'}"></i> Final Eco Score: ${ecoScore > 0 ? '+'+ecoScore : ecoScore}</h4>
                ${eligibleForReward 
                  ? `<p style="margin-bottom:0; font-size:0.95rem; color: #2e7d32;">Awesome! You've unlocked a SURPRISE reward with this order for making sustainable choices.</p>
                     <label style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem; cursor: pointer; color: #2e7d32; font-weight: bold; background: white; padding: 0.8rem; border-radius: 4px; border: 1px dashed #2e7d32;">
                        <input type="checkbox" id="chk_claim_reward" onchange="window.updateCheckoutTotal()" data-discount="${ecoScore >= 50 ? 50 : 20}">
                        Claim Mystery Eco Reward Discount!
                     </label>`
                  : `<p style="margin-bottom:0; font-size:0.95rem; color: #856404;">You need an Eco Score of at least +10 to unlock discounts. Consider swapping non-biodegradable items for better choices!</p>`
                }
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

    let productsReduced = 0;
    userOrders.forEach(o => {
        if(o.status !== 'Cancelled') {
            o.items.forEach(item => {
               if (augmentProduct(item).isBiodegradable) {
                  productsReduced += item.quantity;
               }
            });
        }
    });

    const impactHtml = productsReduced > 0 ? `
      <div class="glass page-section" style="margin-bottom: 2rem; background: linear-gradient(135deg, #e0f2f1, #b2dfdb); border: 1px solid #80cbc4;">
        <h3 style="color: #00695c; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><i data-feather="globe"></i> Your Environmental Impact</h3>
        <p style="font-size: 1.1rem; color: #004d40;"><strong>You avoided ${productsReduced} harmful products</strong> by choosing sustainable alternatives!</p>
        <p style="font-size: 0.95rem; color: #00695c;">Thank you for helping to reduce plastic waste and supporting responsible consumption.</p>
      </div>
    ` : '';

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
            <div class="list-item" style="padding: 0.5rem 0; border: none; align-items: flex-start;">
              <div style="flex: 1;">
                 <span>${item.quantity}x ${item.name}</span>
                 <br/><span style="font-size: 0.85rem; color: var(--text-muted);">₹${item.price} each</span>
              </div>
              <div style="text-align: right;">
                 <span>₹${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
          <div style="font-size: 1.1rem; font-weight: bold; color: var(--accent-color);">
            Total: ₹${order.total}
          </div>
          <div>
            ${order.status === 'Cancelled' ?
        `<span style="color: #ff4757; font-weight: bold;"><i data-feather="x-circle" style="width: 16px; height: 16px; vertical-align: middle;"></i> Cancelled</span> ${order.cancelReason ? `<br/><small style="color: #666; font-size: 0.85rem; font-weight: normal;">Reason: ${order.cancelReason}</small>` : ''}` :
        `<button class="btn btn-secondary" style="color: #ff4757; border-color: #ff4757; padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="cancelOrder('${order.id}')">Cancel Order</button>`
      }
          </div>
        </div>
      </div>
    `).join('');

    return `
      <h2 class="page-title">My Eco Orders</h2>
      ${impactHtml}
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
    const ecoScore = getEcoScore();

    return `
      <h2 class="page-title">Your Cart</h2>
      <div>${cartHtml}</div>
      <div class="glass page-section" style="text-align: right; margin-top: 2rem; padding: 2rem;">
        <h3 style="font-size: 1.25rem; color: ${ecoScore > 0 ? '#2e7d32' : (ecoScore < 0 ? '#c62828' : 'var(--text-main)')}; margin-bottom: 0.5rem;"><i data-feather="target"></i> Cart Eco Score: ${ecoScore > 0 ? '+'+ecoScore : ecoScore}</h3>
        <h3 style="font-size: 1.8rem;">Total: <span style="color: var(--accent-color);">₹${total}</span></h3>
        <button class="btn" style="margin-left: auto; margin-top: 1.5rem; padding: 1rem 2rem; font-size: 1.1rem;" onclick="checkout()">
          <i data-feather="credit-card"></i> Proceed to Checkout
        </button>
      </div>
    `;
  },

  gifts: () => {
    if (!currentUser) return `
      <div class="empty-state glass page-section">
        <i data-feather="user-x" style="width:64px;height:64px;margin-bottom:1rem;color:var(--text-muted);"></i>
        <h3>Please Login with Google</h3>
        <p>Login to view your Eco Score profile and spin the wheel for rewards.</p>
        <button class="btn" style="margin: 1.5rem auto 0; max-width: 200px;" onclick="navigate('login')">Go to Login</button>
      </div>
    `;

    const score = getLifetimeEcoScore();

    return `
      <div class="glass page-section" style="text-align: center; background: linear-gradient(135deg, #f1f8e9, #dcedc8); border: 1px solid #c5e1a5; padding: 3rem 1rem;">
        <i data-feather="award" style="width: 64px; height: 64px; color: #2e7d32; margin-bottom: 1rem;"></i>
        <h2 style="font-size: 2rem; color: #33691e; margin-bottom: 0.5rem;">Your Lifetime Eco Score</h2>
        <div style="font-size: 4rem; font-weight: bold; color: ${score > 0 ? '#2e7d32' : (score < 0 ? '#c62828' : '#424242')}; line-height: 1;">${score > 0 ? '+'+score : score}</div>
        <p style="margin-top: 1rem; color: #558b2f; font-size: 1.1rem;">Buy sustainable products to grow your score and unlock exclusive spins!</p>
      </div>

      <div class="page-section glass" style="margin-top: 2rem; display: flex; flex-direction: column; align-items: center; text-align: center;">
         <h3 style="margin-bottom: 0.5rem;">The Eco Rewards Wheel</h3>
         <p style="color: var(--text-muted); margin-bottom: 2rem;">Spend <strong>4 Eco Score points</strong> to spin the wheel and win a guaranteed gift or discount!</p>
         
         <div style="position: relative; width: 280px; height: 280px; margin: 0 auto 2rem auto;">
            <div id="spinWheel" style="width: 100%; height: 100%; border-radius: 50%; background: conic-gradient(#e8f5e9 0 90deg, #c8e6c9 90deg 180deg, #a5d6a7 180deg 270deg, #81c784 270deg 360deg); border: 6px solid #2e7d32; transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99); box-shadow: 0 4px 15px rgba(0,0,0,0.15); box-sizing: border-box;">
               <!-- Text labels oriented correctly -->
               <div style="position:absolute; top: 20%; right: 10%; transform: rotate(45deg); font-weight: bold; font-size: 1rem; color: #1b5e20;">Mystery</div>
               <div style="position:absolute; bottom: 20%; right: 10%; transform: rotate(135deg); font-weight: bold; font-size: 1rem; color: #1b5e20;">Gift Box</div>
               <div style="position:absolute; bottom: 20%; left: 10%; transform: rotate(225deg); font-weight: bold; font-size: 1rem; color: #1b5e20;">Surprise</div>
               <div style="position:absolute; top: 20%; left: 10%; transform: rotate(315deg); font-weight: bold; font-size: 1rem; color: #1b5e20;">Prize</div>
               
               <!-- Wheel dividers -->
               <div style="position: absolute; top: 0; left: 50%; width: 2px; height: 100%; background: #2e7d32; transform: translateX(-50%);"></div>
               <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: #2e7d32; transform: translateY(-50%);"></div>
            </div>
            <!-- Pointer -->
            <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 30px solid #ff9f00; z-index: 10; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));"></div>
            
            <button class="btn" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: 50%; width: 70px; height: 70px; padding: 0; z-index: 10; font-size: 1rem; font-weight: bold; background: white; color: #2e7d32; border: 4px solid #2e7d32; cursor: pointer; box-shadow: 0 0 10px rgba(0,0,0,0.2);" onclick="window.spinRewardsWheel(${score})">SPIN</button>
         </div>
         ${currentUser.spinRewardsCount ? `<div style="margin-top: 1rem; background: #e8f5e9; padding: 1rem; border-radius: 8px; color: #2e7d32; border: 1px dashed #2e7d32; display: inline-block;"><strong>🎯 Total Spin Rewards Walked Away With: <span style="font-size: 1.25rem;">${currentUser.spinRewardsCount}</span></strong></div>` : ''}
      </div>
    `;
  },
  
  'impact': () => {
    // Generate real stats dynamically from local records
    const totalUsers = Array.from(new Set(orders.map(o => o.userEmail))).length + 14208; // Base scale off start seed
    let plasticSaved = 32450;
    let ecoActions = 89120;
    orders.forEach(o => {
        if(o.status !== 'Cancelled') {
            ecoActions += 1;
            o.items.forEach(item => {
                const aug = augmentProduct(item);
                if (aug.isBiodegradable && item.category !== 'Reward Gift') {
                    plasticSaved += item.quantity * 2.5; 
                    ecoActions += item.quantity;
                }
            });
        }
    });

    return `
      <div class="glass page-section" style="margin-top: 1.5rem; text-align: center; border-left: 5px solid #2e7d32;">
        <h2 style="color: #2e7d32; font-size: 2.2rem; margin-bottom: 1rem;"><i data-feather="globe"></i> SDG 12: Responsible Consumption</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; text-align: left;">
          <div style="background: #ffebee; padding: 1.5rem; border-radius: 8px; border: 1px solid #ef9a9a;">
             <h3 style="color: #c62828; margin-bottom: 0.5rem;"><i data-feather="alert-triangle"></i> The Problem</h3>
             <p style="color: #b71c1c; font-size: 0.95rem;">Globally, over <strong>400 million tons</strong> of plastic are produced yearly, with only <strong>9% recycled</strong>. It pollutes ecosystems and harms ocean life.</p>
          </div>
          <div style="background: #e8f5e9; padding: 1.5rem; border-radius: 8px; border: 1px solid #a5d6a7;">
             <h3 style="color: #2e7d32; margin-bottom: 0.5rem;"><i data-feather="check-circle"></i> The Solution</h3>
             <p style="color: #1b5e20; font-size: 0.95rem;">Greenly changes buying habits. Calculate your footprint, switch to vetted sustainable alternatives, and earn rewards for reducing waste.</p>
          </div>
        </div>
      </div>

      <div class="glass page-section" style="margin-top: 1.5rem;">
        <h2 style="color: var(--text-main); font-size: 1.5rem; border-bottom: 2px solid #e8f5e9; padding-bottom: 0.5rem; margin-bottom: 1.5rem;"><i data-feather="bar-chart-2"></i> Sustainability Dashboard</h2>
        <div style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 150px; background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
             <h4 style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase;">Total Users</h4>
             <div style="font-size: 1.8rem; font-weight: bold; color: #2e7d32;">${Math.floor(totalUsers).toLocaleString()}</div>
          </div>
          <div style="flex: 1; min-width: 150px; background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
             <h4 style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase;">Plastic Saved (kg)</h4>
             <div style="font-size: 1.8rem; font-weight: bold; color: #0277bd;">${Math.floor(plasticSaved).toLocaleString()}</div>
          </div>
          <div style="flex: 1; min-width: 150px; background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
             <h4 style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase;">Eco Actions</h4>
             <div style="font-size: 1.8rem; font-weight: bold; color: #f57f17;">${Math.floor(ecoActions).toLocaleString()}</div>
          </div>
        </div>

        <div style="background: #f1f8e9; padding: 1.5rem; border-radius: 8px; border: 1px solid #c5e1a5;">
          <h3 style="color: #33691e; margin-bottom: 1rem;">Eco Score Calculator</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
             <div>
                <label style="display:block; font-size: 0.9rem; margin-bottom: 0.3rem;">Plastic Bags/Week</label>
                <input type="number" id="calc_bags" class="form-control" value="5" min="0">
             </div>
             <div>
                <label style="display:block; font-size: 0.9rem; margin-bottom: 0.3rem;">Plastic Bottles/Week</label>
                <input type="number" id="calc_bottles" class="form-control" value="3" min="0">
             </div>
             <div>
                <label style="display:block; font-size: 0.9rem; margin-bottom: 0.3rem;">Eco Products/Month</label>
                <input type="number" id="calc_eco" class="form-control" value="2" min="0">
             </div>
             <div>
                <label style="display:block; font-size: 0.9rem; margin-bottom: 0.3rem;">Recycling Habit</label>
                <select id="calc_recycle" class="form-control">
                   <option value="none">Never</option>
                   <option value="some">Sometimes</option>
                   <option value="all">Always</option>
                </select>
             </div>
          </div>
          <button class="btn" style="padding: 0.8rem 1.5rem;" onclick="window.calculateEcoScore()"><i data-feather="activity"></i> Calculate Impact</button>
          
          <div id="calc_result" style="display: none; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px dashed #c5e1a5;">
             <div style="display: flex; flex-wrap: wrap; gap: 2rem;">
                <div style="flex: 1; min-width: 250px;">
                   <h4 style="margin-bottom: 0.5rem;">Eco Score: <span id="res_score" style="font-size: 1.8rem; font-weight: bold;"></span>/100</h4>
                   <div style="width: 100%; height: 12px; background: #e0e0e0; border-radius: 6px; overflow: hidden; margin-bottom: 0.5rem;">
                      <div id="res_progress" style="height: 100%; background: #2e7d32; width: 0%; transition: width 1s ease;"></div>
                   </div>
                   <p style="font-weight: bold; margin-bottom: 0.5rem;">Sustainability Level: <span id="res_level"></span></p>
                   <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid #dcdcdc;">
                      <p style="font-size: 0.95rem; margin-bottom: 0;"><strong><i data-feather="trending-down" style="color:#0277bd;"></i> Plastic Tracker:</strong> You could save <span id="res_saved" style="color: #0277bd; font-weight: bold;"></span> of plastic waste per year!</p>
                   </div>
                </div>
                <div style="flex: 1; min-width: 250px; background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #dcdcdc;">
                   <h4 style="margin-bottom: 1rem; color: #f57f17;"><i data-feather="star"></i> Rewards Unlocked</h4>
                   <p style="font-size: 0.9rem; margin-bottom: 1rem;">You've earned <strong id="res_points" style="color: #2e7d32;">0</strong> Green Points!</p>
                   <div id="res_rewards_list"></div>
                   <p style="margin-top:1rem; font-size:0.85rem; color:var(--text-muted);">Points and rewards instantly apply to your cart.</p>
                </div>
             </div>
             
             <div style="margin-top: 1.5rem;">
                <h4 style="margin-bottom: 0.5rem;">Personalized Suggestions:</h4>
                <ul id="res_tips" style="padding-left: 1.5rem; font-size: 0.95rem; color: #1b5e20;"></ul>
             </div>
          </div>
        </div>
      </div>
    `;
  }
};

window.calculateEcoScore = () => {
    const bags = parseInt(document.getElementById('calc_bags').value) || 0;
    const bottles = parseInt(document.getElementById('calc_bottles').value) || 0;
    const eco = parseInt(document.getElementById('calc_eco').value) || 0;
    const recycle = document.getElementById('calc_recycle').value;
    
    let score = 50 - (bags * 2) - (bottles * 2) + (eco * 5);
    if (recycle === 'all') score += 20;
    if (recycle === 'some') score += 5;
    
    score = Math.max(0, Math.min(100, score));
    
    const resultDiv = document.getElementById('calc_result');
    resultDiv.style.display = 'block';
    
    document.getElementById('res_score').innerText = score;
    setTimeout(() => { document.getElementById('res_progress').style.width = score + '%'; }, 100);
    
    const levelEl = document.getElementById('res_level');
    if (score < 40) {
        levelEl.innerText = 'Low 😕'; levelEl.style.color = '#c62828';
    } else if (score < 75) {
        levelEl.innerText = 'Moderate 🙂'; levelEl.style.color = '#f57f17';
    } else {
         levelEl.innerText = 'High 🌿'; levelEl.style.color = '#2e7d32';
    }
    
    const annualWasteKg = ((bags + bottles) * 52 * 0.02).toFixed(1);
    document.getElementById('res_saved').innerText = `${annualWasteKg} kg`;
    
    const greenPoints = score * 5;
    document.getElementById('res_points').innerText = greenPoints;
    
    const rewardsContainer = document.getElementById('res_rewards_list');
    if (rewardsContainer) {
       const customRewards = JSON.parse(localStorage.getItem('ecoMart_customRewards')) || [];
       const platPrizes = customRewards.filter(r => r.type === 'HubPlatinum');
       const goldPrizes = customRewards.filter(r => r.type === 'HubGold');
       const silverPrizes = customRewards.filter(r => r.type === 'HubSilver');

       let rewardsHTML = '';
       
       if (score >= 80) {
           const itemName = platPrizes.length > 0 ? platPrizes[0].name : 'Free Bamboo Toothbrush Set';
           rewardsHTML += `
             <div style="margin-top: 1rem; padding: 1rem; background: #e8f5e9; border: 1px solid #2e7d32; border-radius: 8px;">
               <h5 style="color: #2e7d32; margin-bottom: 0.5rem;"><i data-feather="award"></i> Platinum Admin Reward!</h5>
               <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">${itemName}</p>
               <button class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; width: 100%; justify-content: center;" onclick="window.claimReward('${itemName.replace(/'/g, "\\'")}', 1, 0, 'https://images.unsplash.com/photo-1600180758890-6b223bcde9bf?w=400')">Claim Admin Prize</button>
             </div>
           `;
       } else if (score >= 50) {
           const itemName = goldPrizes.length > 0 ? goldPrizes[0].name : 'Free Reusable Jute Bag';
           rewardsHTML += `
             <div style="margin-top: 1rem; padding: 1rem; background: #fff3cd; border: 1px solid #ff9f00; border-radius: 8px;">
               <h5 style="color: #ff9f00; margin-bottom: 0.5rem;"><i data-feather="gift"></i> Gold Admin Reward!</h5>
               <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">${itemName}</p>
               <button class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; width: 100%; justify-content: center;" onclick="window.claimReward('${itemName.replace(/'/g, "\\'")}', 1, 0, 'https://images.unsplash.com/photo-1590874551139-4933d1cbb094?w=400')">Claim Admin Prize</button>
             </div>
           `;
       } else if (score >= 20) {
           const itemName = silverPrizes.length > 0 ? silverPrizes[0].name : 'Discounted Wooden Comb (₹50)';
           rewardsHTML += `
             <div style="margin-top: 1rem; padding: 1rem; background: #e3f2fd; border: 1px solid #1976d2; border-radius: 8px;">
               <h5 style="color: #1976d2; margin-bottom: 0.5rem;"><i data-feather="tag"></i> Silver Admin Reward!</h5>
               <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">${itemName}</p>
               <button class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; width: 100%; justify-content: center;" onclick="window.claimReward('${itemName.replace(/'/g, "\\'")}', 1, 50, 'https://images.unsplash.com/photo-1615397323635-430931505bd2?w=400')">Claim Admin Prize</button>
             </div>
           `;
       } else {
           rewardsHTML += `<p style="font-size: 0.85rem; color: #c62828;">Score higher to unlock free products and custom discounts!</p>`;
       }
       rewardsContainer.innerHTML = rewardsHTML;
    }
    
    const tipsList = document.getElementById('res_tips');
    tipsList.innerHTML = '';
    if (bags > 0) tipsList.innerHTML += `<li>Switch to reusable cloth or jute bags to eliminate your weekly usage of ${bags} plastic bags.</li>`;
    if (bottles > 0) tipsList.innerHTML += `<li>Invest in a stainless steel or copper bottle. You can save ${bottles * 52} plastic bottles a year.</li>`;
    if (recycle !== 'all') tipsList.innerHTML += `<li>Improve your recycling habits. Check your local guidelines for proper waste segregation.</li>`;
    if (eco < 3) tipsList.innerHTML += `<li>Explore Greenly's recommended sustainable products to switch out everyday items.</li>`;
    if (score >= 75) tipsList.innerHTML += `<li>Great job! You're making a strong positive impact. Keep up the good work.</li>`;
    
    if (window.feather) feather.replace();
};

window.claimReward = (name, quantity, price, image) => {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        showToast("You have already claimed this reward! Check your cart.");
        navigate('cart');
        return;
    }

    const rewardProduct = {
        id: "reward_" + new Date().getTime(),
        name: name,
        price: price,
        image: image,
        category: "Reward Gift",
        description: "A special sustainability reward gifted to you for your high Eco Score!",
        isBiodegradable: true,
        quantity: quantity
    };

    cart.push(rewardProduct);
    saveState();
    showToast(name + " added to your cart!");
    navigate('cart');
};

window.spinRewardsWheel = (currentScore) => {
    if (currentScore < 4) {
       showToast("You need at least 4 Eco Score points to spin!");
       return;
    }
    const wheel = document.getElementById('spinWheel');
    if (wheel.dataset.spinning === 'true') return;
    wheel.dataset.spinning = 'true';
    
    showToast("Spinning the wheel...");

    const deg = Math.floor(Math.random() * 360) + 3600; // spin 10 times + random stop
    wheel.style.transform = `rotate(${deg}deg)`;
    
    setTimeout(() => {
        wheel.dataset.spinning = 'false';
        const rawDeg = deg % 360;
        const targetDeg = 360 - rawDeg; 
        const customR = JSON.parse(localStorage.getItem('ecoMart_customRewards')) || [];
        const spinPrizes = customR.filter(r => r.type === 'SpinWheel');
        let reward = "";
        
        if (spinPrizes.length >= 4) {
             if (targetDeg >= 0 && targetDeg < 90) reward = spinPrizes[0].name;
             else if (targetDeg >= 90 && targetDeg < 180) reward = spinPrizes[1].name;
             else if (targetDeg >= 180 && targetDeg < 270) reward = spinPrizes[2].name;
             else reward = spinPrizes[3].name;
        } else if (spinPrizes.length > 0) {
             reward = spinPrizes[Math.floor(Math.random() * spinPrizes.length)].name;
        } else {
            // Default generic fallback if admin hasn't added custom ones
            if (targetDeg >= 0 && targetDeg < 90) reward = "Mystery Prize A (₹10 Cashback code emailed to you)!";
            else if (targetDeg >= 90 && targetDeg < 180) reward = "Gift Box (5% Discount applied below)!";
            else if (targetDeg >= 180 && targetDeg < 270) reward = "Surprise Package (₹20 Off instantly)!";
            else reward = "Exclusive Prize (Free Shipping tracking code)!";
        }

        // Subtract 4 points permanently AFTER they got the reward
        currentUser.spinPenalty = (currentUser.spinPenalty || 0) + 4;
        currentUser.spinRewardsCount = (currentUser.spinRewardsCount || 0) + 1;
        saveState();

        alert("🎉 CONGRATULATIONS! 🎉\\n\\nYou won:\\n" + reward + "\\n\\n-4 Eco Score Points\\nKeep up the great sustainable work!");
        renderView('gifts'); // Refresh UI instantly to show updated counts and lower score
    }, 4200);
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

    // Listen for Auth events (Google Login Redirects)
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        currentUser = { 
           email: session.user.email, 
           name: session.user.user_metadata?.full_name || session.user.email.split('@')[0] 
        };
        saveState();
      }
    });

    // Check existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      currentUser = { 
         email: session.user.email, 
         name: session.user.user_metadata?.full_name || session.user.email.split('@')[0] 
      };
    }
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
