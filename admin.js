let securityInterval;

function startSecurityTimer() {
    if (securityInterval) clearInterval(securityInterval);

    // Require password again every 1 minute (60000ms)
    securityInterval = setInterval(() => {
        sessionStorage.removeItem('isAdminAuthenticated');
        const overlay = document.getElementById('adminLoginOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            document.getElementById('adminPassword').value = '';
            document.getElementById('adminConfirmPassword').value = '';
            document.getElementById('adminError').style.display = 'none';
        }
    }, 60000);
}

function checkAdminEmail() {
    const email = document.getElementById('adminEmail').value.trim().toLowerCase();
    const errorEl = document.getElementById('adminError');
    if (email === "manickam2007723@gmail.com") {
        document.getElementById('adminEmail').style.display = 'none';
        document.getElementById('adminEmailBtn').style.display = 'none';
        document.getElementById('adminPassword').style.display = 'block';
        document.getElementById('adminPassBtn').style.display = 'flex';
        errorEl.style.display = 'none';
        document.getElementById('adminPassword').focus();
    } else {
        errorEl.textContent = "Unauthorized email address. Only the main admin can login.";
        errorEl.style.display = 'block';
    }
}

// REWARDS LOGIC
let customRewards = JSON.parse(localStorage.getItem('ecoMart_customRewards')) || [];

window.loadRewards = () => {
    const list = document.getElementById('rewardsList');
    if (customRewards.length === 0) {
        list.innerHTML = `<p style="color:#666; text-align:center;">No custom rewards mapped. The platform is using default generic rewards.</p>`;
        return;
    }
    
    list.innerHTML = customRewards.map(r => `
        <div style="background:white; border:1px solid var(--border-color); border-radius:8px; padding:1.5rem; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
             <div>
                <h4 style="margin:0; font-size: 1.1rem; color: #2e7d32;">${r.name}</h4>
                <p style="margin:0; font-size:0.85rem; color:var(--text-muted); margin-top: 0.2rem;">Destination: <strong>${r.type === 'SpinWheel' ? 'Mystery Spin Wheel Prize' : r.type === 'HubPlatinum' ? 'Hub Platinum (Score 80+)' : r.type === 'HubGold' ? 'Hub Gold (Score 50+)' : 'Hub Silver (Score 20+)'}</strong></p>
             </div>
             <button onclick="deleteReward('${r.id}')" class="btn" style="background:#e74c3c; width: auto; padding: 0.5rem 1rem;"><i data-feather="trash-2"></i> Delete</button>
        </div>
    `).join('');
    
    if (window.feather) feather.replace();
};

const addRewardForm = document.getElementById('addRewardForm');
if(addRewardForm) {
    addRewardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const rName = document.getElementById('rName').value.trim();
        const rType = document.getElementById('rType').value;

        const newRow = {
            id: 'r_' + Date.now(),
            name: rName,
            type: rType
        };
        customRewards.push(newRow);
        localStorage.setItem('ecoMart_customRewards', JSON.stringify(customRewards));
        alert("Reward deployed! The frontend storefront will now use this reward.");
        addRewardForm.reset();
        loadRewards();
    });
}

window.deleteReward = (id) => {
    if(confirm("Permanently delete this reward from rotation?")) {
        customRewards = customRewards.filter(r => r.id !== id);
        localStorage.setItem('ecoMart_customRewards', JSON.stringify(customRewards));
        loadRewards();
    }
};

window.loadOrders = loadOrders;
window.checkAdminEmail = checkAdminEmail;
window.checkAdminPassword = checkAdminPassword;
window.startSecurityTimer = startSecurityTimer;

function checkAdminPassword() {
    const errorEl = document.getElementById('adminError');
    const pwd = document.getElementById('adminPassword').value;

    if (pwd !== "qscgyjm") {
        errorEl.textContent = "Incorrect password. Try again.";
        errorEl.style.display = 'block';
        return;
    }

    // Success
    document.getElementById('adminLoginOverlay').style.display = 'none';
    sessionStorage.setItem('isAdminAuthenticated', 'true');
    errorEl.style.display = 'none';
    startSecurityTimer();
    loadProducts();
    // Pre-load orders so realtime listener activates
    loadOrders();
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('fromLogin') === 'true' && sessionStorage.getItem('isAdminAuthenticated') === 'true') {
        const overlay = document.getElementById('adminLoginOverlay');
        if (overlay) overlay.style.display = 'none';
        startSecurityTimer();
        window.history.replaceState({}, document.title, "index.html");
        loadProducts();
    } else {
        sessionStorage.removeItem('isAdminAuthenticated');
        const overlay = document.getElementById('adminLoginOverlay');
        if (overlay) overlay.style.display = 'flex';
    }
});

document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Saving...";

    const imageFile = document.getElementById('pImageFile').files[0];
    const imageURL = document.getElementById('pImage').value;

    if (!imageFile && !imageURL) {
        alert("Please either upload a product photo or provide an image URL.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-feather="save"></i> Publish Product to Store`;
        feather.replace();
        return;
    }

    const processProduct = async (finalImageStr) => {
        const newProduct = {
            id: 'prod-' + Date.now(),
            name: document.getElementById('pName').value,
            category: document.getElementById('pCategory').value,
            price: parseFloat(document.getElementById('pPrice').value),
            stock: parseInt(document.getElementById('pStock').value) || 0,
            description: document.getElementById('pDesc').value,
            is_biodegradable: document.getElementById('pBio').value === 'true',
            image: finalImageStr
        };

        if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL.includes('YOUR_SUPABASE') || !supabase) {
            alert("Supabase is not configured! Check your supabaseClient.js file.");
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i data-feather="save"></i> Publish Product to Store`;
            feather.replace();
            return;
        }

        try {
            const { data, error } = await supabase
                .from('products')
                .insert([newProduct]);

            if (error) {
                console.error("Supabase Error Details:", error);
                if (error.code === '42501' || error.message.includes('row-level security')) {
                    alert("🚨 SUPABASE SECURITY SHIELD IS ACTIVE! 🚨\n\nYour code is working perfectly, but Supabase is blocking the upload.\n\nTo fix this:\n1. Open your Supabase Dashboard on the web.\n2. Go to the 'products' table.\n3. Turn OFF 'Row Level Security (RLS)'.\n\nOnce RLS is disabled, your products will instantly add to the home page!");
                } else {
                    alert("Error saving product: " + error.message);
                }
            } else {
                alert("Success! Product has been officially uploaded to your Supabase database and is live on the home page!");
                document.getElementById('addProductForm').reset();
                loadProducts();
            }
        } catch (err) {
            alert("An unexpected error occurred.");
            console.error(err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i data-feather="save"></i> Publish Product to Store`;
            feather.replace();
        }
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 500;
                let width = img.width;
                let height = img.height;

                if (width > height && width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                } else if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

                processProduct(compressedBase64);
            };
            img.onerror = () => {
                alert("Invalid or unsupported image format. Please use JPEG, PNG, or WebP.");
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i data-feather="save"></i> Publish Product to Store`;
                if (window.feather) feather.replace();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(imageFile);
    } else {
        processProduct(imageURL);
    }
});

window.switchTab = function (tab) {
    const productsMenu = document.getElementById('menu-products');
    const ordersMenu = document.getElementById('menu-orders');
    const rewardsMenu = document.getElementById('menu-rewards');
    const addProductSection = document.querySelector('.add-product-section');
    const manageProductsSection = document.querySelector('.manage-products-section');
    const ordersSection = document.getElementById('ordersSection');
    const rewardsSection = document.getElementById('rewardsSection');

    productsMenu.classList.remove('active');
    ordersMenu.classList.remove('active');
    rewardsMenu.classList.remove('active');
    addProductSection.style.display = 'none';
    if(manageProductsSection) manageProductsSection.style.display = 'none';
    ordersSection.style.display = 'none';
    if(rewardsSection) rewardsSection.style.display = 'none';

    if (tab === 'products') {
        productsMenu.classList.add('active');
        addProductSection.style.display = 'block';
        if (manageProductsSection) manageProductsSection.style.display = 'block';
        loadProducts();
    } else if (tab === 'orders') {
        ordersMenu.classList.add('active');
        ordersSection.style.display = 'block';
        loadOrders();
    } else if (tab === 'rewards') {
        rewardsMenu.classList.add('active');
        rewardsSection.style.display = 'block';
        loadRewards();
    }
    feather.replace();
};

window.deleteProduct = async function (id) {
    if (!confirm("Are you sure you want to completely delete this product from the store?")) return;

    // Track deletion of local initial products
    const deletedInitial = JSON.parse(localStorage.getItem('ecoMart_deleted_initial') || '[]');
    if (!deletedInitial.includes(id)) {
        deletedInitial.push(id);
        localStorage.setItem('ecoMart_deleted_initial', JSON.stringify(deletedInitial));
    }

    if (window.supabase && typeof SUPABASE_URL !== 'undefined' && !SUPABASE_URL.includes('YOUR_SUPABASE')) {
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) console.error("Supabase delete returned an error:", error);
        } catch (err) {
            console.error("Error deleting from supabase:", err);
        }
    }

    alert("Product successfully deleted from the store.");
    loadProducts();
};

async function loadProducts() {
    const listEl = document.getElementById('adminProductsList');
    if (!listEl) return;

    let systemProducts = [];

    if (window.supabase && typeof SUPABASE_URL !== 'undefined' && !SUPABASE_URL.includes('YOUR_SUPABASE')) {
        try {
            const { data, error } = await supabase.from('products').select('*');
            if (error) throw error;
            systemProducts = data || [];
            systemProducts.reverse(); // newest supabase products first
        } catch (err) {
            console.error("Failed to fetch admin products from supabase", err);
        }
    }

    const deletedInitial = JSON.parse(localStorage.getItem('ecoMart_deleted_initial') || '[]');
    const validInitial = (window.initialProducts || []).filter(p => !deletedInitial.includes(p.id));
    
    // Merge remote and local products for admin view
    systemProducts = [...systemProducts, ...validInitial];

    if (systemProducts.length === 0) {
        listEl.innerHTML = `<p style="color: var(--text-muted); text-align: center;">No products found in the database. Add one above!</p>`;
        return;
    }

    listEl.innerHTML = systemProducts.map(p => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding: 1rem; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 0.8rem;">
            <div style="display:flex; align-items:center; gap: 1rem;">
                <img src="${p.image}" alt="${p.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                <div>
                    <h4 style="margin: 0; font-size: 1rem; color: var(--text-main);">${p.name}</h4>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">${p.category} • ₹${p.price} • ${p.stock !== undefined ? p.stock + ' left' : ''}</span>
                </div>
            </div>
            <button class="btn btn-secondary" style="color: #ff4757; border-color: #ff4757; width: auto; padding: 0.5rem;" onclick="deleteProduct('${p.id}')">
                <i data-feather="trash-2" style="width: 16px; height: 16px;"></i> Delete
            </button>
        </div>
    `).join('');

    feather.replace();
}

async function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    let allOrders = [];

    if (window.supabase && typeof SUPABASE_URL !== 'undefined' && !SUPABASE_URL.includes('YOUR_SUPABASE')) {
        try {
            const { data, error } = await supabase.from('orders').select('*').order('id', { ascending: false });
            if (error) throw error;
            allOrders = data || [];
        } catch (err) {
            console.error("Failed to fetch admin orders from supabase", err);
        }

        if (!window.isOrderChannelActive) {
            window.isOrderChannelActive = true;
            supabase.channel('admin:orders')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
                    console.log("Order update detected, auto-refreshing...", payload);
                    loadOrders(); // Auto reload the admin orders list!
                })
                .subscribe();
        }
    } else {
        allOrders = JSON.parse(localStorage.getItem('ecoMart_orders')) || [];
    }

    const searchInput = document.getElementById('adminOrderSearch');
    if (searchInput && searchInput.value) {
        const query = searchInput.value.toLowerCase();
        allOrders = allOrders.filter(order => {
            const email = (order.userEmail || '').toLowerCase();
            const id = (order.id || '').toLowerCase();
            const itemsMatch = order.items.some(item => (item.name || '').toLowerCase().includes(query));
            return email.includes(query) || id.includes(query) || itemsMatch;
        });
    }

    if (allOrders.length === 0) {
        ordersList.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No orders have been placed yet.</p>`;
        return;
    }

    let html = '';
    allOrders.forEach(order => {
        const orderEmail = order.userEmail || 'Guest / Unknown Email';
        html += `
            <div style="background: white; border: 1px solid var(--border-color); border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                            Order #${order.id}
                            ${order.status === 'Cancelled' ? `<span style="font-size: 0.75rem; background: #ff4757; color: white; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">Cancelled</span>` : ''}
                            ${order.claimedReward ? `<span style="font-size: 0.75rem; background: #e8f5e9; border: 1px solid #2e7d32; color: #2e7d32; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;"><i data-feather="gift" style="width: 12px; height: 12px; vertical-align: middle;"></i> Reward Claimed</span>` : ''}
                        </h3>
                        ${order.claimedReward ? `<div style="font-size: 0.85rem; color: #2e7d32; margin-top: 0.4rem; padding-bottom: 0.2rem; background: #f1f8e9; padding: 4px; border-radius: 4px; display: inline-block;"><strong>Reward Info:</strong> ${order.claimedReward}</div>` : ''}
                        ${order.status === 'Cancelled' && order.cancelReason ? `<div style="font-size: 0.85rem; color: #ff4757; margin-top: 0.4rem; padding-bottom: 0.2rem;"><strong>Cancel Reason:</strong> ${order.cancelReason}</div>` : ''}
                        <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.4rem;">
                            <i data-feather="mail" style="width: 14px; height: 14px; vertical-align: middle;"></i> 
                            <strong style="color: var(--primary-color);">${orderEmail}</strong>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; color: var(--accent-color); font-size: 1.1rem;">₹${order.total}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${order.date}</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--text-main);">Items Ordered:</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${order.items.map(item => {
                            if (item.category === 'Reward Gift') {
                                return `
                                <li style="display: flex; justify-content: space-between; font-size: 0.9rem; padding: 0.5rem; margin-top: 0.25rem; background: #e8f5e9; border: 1px dashed #2e7d32; border-radius: 4px; color: #2e7d32; font-weight: bold;">
                                    <span><i data-feather="gift" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${item.quantity}x ${item.name}</span>
                                    <span>FREE GIFT</span>
                                </li>`;
                            }
                            return `
                                <li style="display: flex; justify-content: space-between; font-size: 0.9rem; padding: 0.25rem 0;">
                                    <span>${item.quantity}x ${item.name}</span>
                                    <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                                </li>`;
                        }).join('')}
                    </ul>
                </div>

                <div style="background: var(--bg-color); padding: 1rem; border-radius: 6px; font-size: 0.9rem;">
                    <h4 style="margin-top: 0; margin-bottom: 0.5rem; font-size: 0.95rem;">Delivery Details:</h4>
                    <p style="margin: 0 0 0.25rem 0;"><strong>Phone:</strong> ${order.delivery.phone}</p>
                    <p style="margin: 0 0 0.25rem 0;"><strong>Address:</strong> ${order.delivery.address}</p>
                    <p style="margin: 0;"><strong>Payment:</strong> <span style="background: var(--secondary-color); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">${order.payment}</span></p>
                </div>
            </div>
        `;
    });

    ordersList.innerHTML = html;
    feather.replace();
}
