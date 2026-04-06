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
   const userOrders = orders.filter(o => o.userEmail === currentUser.email && o.status !== 'Cancelled');
   userOrders.forEach(o => {
      o.items.forEach(item => {
         score += (augmentProduct(item).isBiodegradable ? 2 : -2) * item.quantity;
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
};window.checkEmailPhase = (e) => {
  e.preventDefault();
  const email = document.getElementById('login_email').value.trim().toLowerCase();

  // Admin bypass
  if (email === 'manickam2007723@gmail.com') {
    document.getElementById('login-form-email').style.display = 'none';
    document.getElementById('login-form-password').style.display = 'block';
  } else {
    currentUser = { name: email.split('@')[0], email: email };
    saveState();
    
    // Simulate an SMS from Greenly visually for feedback
    alert("📱 ACCOUNT VERIFIED\\nWelcome " + currentUser.name + "!\\nIf you entered a valid phone number, a real SMS has been dispatched automatically.");
    
    // ACTUALLY Send a real SMS via JavaScript
    const phone = document.getElementById('login_phone').value.trim();
    if (phone && phone.length >= 10) {
        showToast('Sending real SMS to your phone...');
        fetch('https://textbelt.com/text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: phone,
                message: 'Greenly: ' + currentUser.name + ', your account is verified successfully! Welcome to the circular economy.',
                key: 'textbelt', // Public test key for 1 free SMS per day
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log("Real SMS dispatched successfully!");
            } else {
                console.error("SMS Quota API Error:", data.error);
            }
        })
        .catch(err => console.error("API error:", err));
    }
    
    showToast('Logged in successfully!');
    navigate('home');
    if (typeof window.fetchUserOrders === 'function') window.fetchUserOrders();
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
  const total = itemsToOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

  const newOrder = {
    id: Math.floor(Math.random() * 2000000000), // numeric ID to satisfy bigint
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
            <label for="login_email">Email / Gmail ID</label>
            <input type="email" id="login_email" class="form-control" required placeholder="user@gmail.com" autocomplete="off">
          </div>
          <div class="form-group">
            <label for="login_phone">Phone Number</label>
            <input type="tel" id="login_phone" class="form-control" required placeholder="+91 9876543210" autocomplete="off">
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
    const eligibleForReward = ecoScore > 0;

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
              <div style="margin-top: 2rem; background: ${eligibleForReward ? '#e8f5e9' : '#fff3cd'}; padding: 1.5rem; border-radius: 8px; border: 1px solid ${eligibleForReward ? '#a5d6a7' : '#ffeeba'};">
                <h4 style="margin-top:0; color: ${eligibleForReward ? '#2e7d32' : '#856404'}; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;"><i data-feather="${eligibleForReward ? 'gift' : 'target'}"></i> Final Eco Score: ${ecoScore > 0 ? '+'+ecoScore : ecoScore}</h4>
                ${eligibleForReward 
                  ? `<p style="margin-bottom:0; font-size:0.95rem; color: #2e7d32;">Awesome! You've unlocked a free <strong>Reusable Bamboo Straw Set</strong> with this order for making sustainable choices.</p>`
                  : `<p style="margin-bottom:0; font-size:0.95rem; color: #856404;">You need a positive Eco Score to unlock free gifts. Consider swapping non-biodegradable items for better choices!</p>`
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
         <p style="color: var(--text-muted); margin-bottom: 2rem;">Spend <strong>10 Eco Score points</strong> to spin the wheel and win a guaranteed gift or discount!</p>
         
         <div style="position: relative; width: 280px; height: 280px; margin: 0 auto 2rem auto;">
            <div id="spinWheel" style="width: 100%; height: 100%; border-radius: 50%; background: conic-gradient(#e8f5e9 0 90deg, #c8e6c9 90deg 180deg, #a5d6a7 180deg 270deg, #81c784 270deg 360deg); border: 6px solid #2e7d32; transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99); box-shadow: 0 4px 15px rgba(0,0,0,0.15); box-sizing: border-box;">
               <!-- Text labels oriented correctly -->
               <div style="position:absolute; top: 20%; right: 10%; transform: rotate(45deg); font-weight: bold; font-size: 1rem; color: #1b5e20;">₹50 Cash</div>
               <div style="position:absolute; bottom: 20%; right: 10%; transform: rotate(135deg); font-weight: bold; font-size: 1rem; color: #1b5e20;">20% Off</div>
               <div style="position:absolute; bottom: 20%; left: 10%; transform: rotate(225deg); font-weight: bold; font-size: 1rem; color: #1b5e20;">Free Bag</div>
               <div style="position:absolute; top: 20%; left: 10%; transform: rotate(315deg); font-weight: bold; font-size: 1rem; color: #1b5e20;">Free Ship</div>
               
               <!-- Wheel dividers -->
               <div style="position: absolute; top: 0; left: 50%; width: 2px; height: 100%; background: #2e7d32; transform: translateX(-50%);"></div>
               <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: #2e7d32; transform: translateY(-50%);"></div>
            </div>
            <!-- Pointer -->
            <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 30px solid #ff9f00; z-index: 10; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));"></div>
            
            <button class="btn" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: 50%; width: 70px; height: 70px; padding: 0; z-index: 10; font-size: 1rem; font-weight: bold; background: white; color: #2e7d32; border: 4px solid #2e7d32; cursor: pointer; box-shadow: 0 0 10px rgba(0,0,0,0.2);" onclick="window.spinRewardsWheel(${score})">SPIN</button>
         </div>
      </div>
    `;
  }
};

window.spinRewardsWheel = (currentScore) => {
    if (currentScore < 10) {
       showToast("You need at least 10 Eco Score points to spin!");
       return;
    }
    const wheel = document.getElementById('spinWheel');
    if (wheel.dataset.spinning === 'true') return;
    wheel.dataset.spinning = 'true';
    
    // Subtract 10 points virtually (in a real app we'd save this stat)
    showToast("Spinning the wheel...");

    const deg = Math.floor(Math.random() * 360) + 3600; // spin 10 times + random stop
    wheel.style.transform = `rotate(${deg}deg)`;
    
    setTimeout(() => {
        wheel.dataset.spinning = 'false';
        const rawDeg = deg % 360;
        const targetDeg = 360 - rawDeg; 
        let reward = "";
        
        if (targetDeg >= 0 && targetDeg < 90) reward = "₹50 Cashback on your next order!";
        else if (targetDeg >= 90 && targetDeg < 180) reward = "A VIP 20% Discount Code!";
        else if (targetDeg >= 180 && targetDeg < 270) reward = "A Free Eco Bag!";
        else reward = "Free Shipping Code!";

        alert("🎉 CONGRATULATIONS! 🎉\\n\\nYou won:\\n" + reward + "\\n\\nKeep up the great sustainable work!");
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
