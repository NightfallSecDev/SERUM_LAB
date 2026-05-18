// Main Application Logic for SERUM LAB (Cosmetics, Wellness & Beauty)

// Helper: Get correct relative path based on current page location
function getBasePath() {
    const p = window.location.pathname;
    if (p.includes('/storefront/') || p.includes('/admin/') || p.includes('/legal/')) {
        return '../';
    }
    return './';
}

function getImagePath(imgName) {
    return getBasePath() + 'images/' + imgName;
}

// Cart Management
let cart = JSON.parse(localStorage.getItem('serum_lab_cart')) || [];

function saveCart() {
    localStorage.setItem('serum_lab_cart', JSON.stringify(cart));
    updateCartCount();
    renderCartDrawer();
}

function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) return;

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity });
    }

    saveCart();
    openCartDrawer();
    showToast(`Added ${product.name} to cart!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== parseInt(productId));
    saveCart();
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === parseInt(productId));
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
        }
    }
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count-badge').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
}

// Drawer Toggle
function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (drawer && overlay) {
        drawer.classList.add('open');
        overlay.classList.add('open');
        renderCartDrawer();
    }
}

function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (drawer && overlay) {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
    }
}

function renderCartDrawer() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-subtotal');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-cart"><p>Your skincare cart is empty.</p><a href="${getBasePath()}storefront/shop.html" class="btn btn-primary" onclick="closeCartDrawer()">Explore Catalog</a></div>`;
        if (totalEl) totalEl.textContent = '₹0';
        return;
    }

    let html = '';
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        html += `
            <div class="cart-item">
                <img src="${getImagePath(item.image)}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <p class="cart-item-price">₹${item.price}</p>
                    <div class="cart-quantity-selector">
                        <button onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">&times;</button>
            </div>
        `;
    });

    container.innerHTML = html;
    if (totalEl) totalEl.textContent = `₹${subtotal.toLocaleString()}`;
}

// Toast Notification
function showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    const cartOpenBtns = document.querySelectorAll('.open-cart-btn');
    cartOpenBtns.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        openCartDrawer();
    }));

    const overlay = document.getElementById('drawer-overlay');
    if (overlay) overlay.addEventListener('click', closeCartDrawer);

    // Initialize Page Specific Logic
    initShopPage();
    initProductPage();
    initCheckoutPage();
    initAdminPages();
});

// ==========================================
// SHOP / CATALOG & LIVE QUIZ FILTER ENGINE
// ==========================================
function initShopPage() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    let currentCategory = 'ALL';
    let selectedSkinType = 'ALL';
    let selectedConcern = 'ALL';
    let searchQuery = '';
    let currentSort = 'default';

    const categoryTabs = document.querySelectorAll('.category-tab');
    const skinTypeBtns = document.querySelectorAll('.quiz-skintype-btn');
    const concernBtns = document.querySelectorAll('.quiz-concern-btn');
    const searchInput = document.getElementById('catalog-search');
    const sortSelect = document.getElementById('catalog-sort');
    const resetQuizBtn = document.getElementById('reset-quiz-btn');

    function filterAndRender() {
        let filtered = products.filter(p => {
            const matchCategory = currentCategory === 'ALL' || p.category === currentCategory;
            const matchSkin = selectedSkinType === 'ALL' || p.skinTypes.includes(selectedSkinType);
            const matchConcern = selectedConcern === 'ALL' || p.targetConcerns.some(c => c.toLowerCase().includes(selectedConcern.toLowerCase()));
            const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                p.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCategory && matchSkin && matchConcern && matchSearch;
        });

        // Sorting
        if (currentSort === 'price-low') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (currentSort === 'price-high') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (currentSort === 'rating') {
            filtered.sort((a, b) => b.rating - a.rating);
        }

        renderGrid(filtered);
    }

    function renderGrid(items) {
        if (items.length === 0) {
            grid.innerHTML = `<div class="no-results">
                <h3>No clinical matches found</h3>
                <p>Try adjusting your diagnostic filter criteria.</p>
                <button class="btn btn-secondary mt-4" onclick="document.getElementById('reset-quiz-btn').click()">Reset Diagnostic Quiz</button>
            </div>`;
            return;
        }

        grid.innerHTML = items.map(p => `
            <div class="product-card fade-up">
                <div class="product-card-image-wrap">
                    <span class="product-badge">${p.badge}</span>
                    <a href="${getBasePath()}storefront/product.html?id=${p.id}">
                        <img src="${getImagePath(p.image)}" alt="${p.name}" class="product-image">
                    </a>
                    <button class="quick-add-btn" onclick="addToCart(${p.id})">Quick Add &plus;</button>
                </div>
                <div class="product-card-info">
                    <span class="product-category-label">${p.categoryLabel}</span>
                    <h3 class="product-title"><a href="${getBasePath()}storefront/product.html?id=${p.id}">${p.name}</a></h3>
                    <div class="product-meta">
                        <span class="product-rating">&starf; ${p.rating} (${p.reviewsCount})</span>
                        <span class="product-price">₹${p.price.toLocaleString()}</span>
                    </div>
                    <p class="product-description">${p.description}</p>
                    <div class="product-tags">
                        ${p.skinTypes.map(st => `<span class="tag-skin">${st}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Event Listeners
    categoryTabs.forEach(tab => tab.addEventListener('click', (e) => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category;
        filterAndRender();
    }));

    skinTypeBtns.forEach(btn => btn.addEventListener('click', (e) => {
        skinTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSkinType = btn.dataset.skintype;
        filterAndRender();
    }));

    concernBtns.forEach(btn => btn.addEventListener('click', (e) => {
        concernBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedConcern = btn.dataset.concern;
        filterAndRender();
    }));

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            filterAndRender();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            filterAndRender();
        });
    }

    if (resetQuizBtn) {
        resetQuizBtn.addEventListener('click', () => {
            skinTypeBtns.forEach(b => b.classList.remove('active'));
            concernBtns.forEach(b => b.classList.remove('active'));
            categoryTabs.forEach(t => t.classList.remove('active'));
            document.querySelector('.category-tab[data-category="ALL"]').classList.add('active');

            currentCategory = 'ALL';
            selectedSkinType = 'ALL';
            selectedConcern = 'ALL';
            searchQuery = '';
            currentSort = 'default';
            if (searchInput) searchInput.value = '';
            if (sortSelect) sortSelect.value = 'default';

            filterAndRender();
        });
    }

    // Initial render
    filterAndRender();
}

// ==========================================
// PRODUCT DETAIL PAGE (PDP)
// ==========================================
function initProductPage() {
    const pdpContainer = document.getElementById('pdp-main-container');
    if (!pdpContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id')) || 1;
    const product = products.find(p => p.id === productId);

    if (!product) {
        pdpContainer.innerHTML = `<div class="pdp-not-found"><h2>Product Not Found</h2><a href="${getBasePath()}storefront/shop.html" class="btn btn-primary">Back to Catalog</a></div>`;
        return;
    }

    // Set Page Title
    document.title = `${product.name} | SERUM LAB Clinical Cosmetics`;

    // Populate Efficacy HTML with modern card styling
    let efficacyHtml = '';
    for (const [key, val] of Object.entries(product.efficacy)) {
        efficacyHtml += `
            <div class="efficacy-stat-modern">
                <span class="stat-percentage-modern">${val}</span>
                <span class="stat-label-modern">${key.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
            </div>
        `;
    }

    // Calculate simulated 24h recent sales
    const recentSales = 14 + (product.id * 7) % 25;

    // Generate Recommended Products HTML
    const recommendedProducts = products.filter(p => p.id !== product.id).slice(0, 3);
    let recommendedHtml = '';
    recommendedProducts.forEach(prod => {
        recommendedHtml += `
            <div class="product-card">
                <div class="product-badge">${prod.badge}</div>
                <div class="product-img-box">
                    <img src="${getImagePath(prod.image)}" alt="${prod.name}">
                </div>
                <div class="product-info">
                    <div class="product-category">${prod.categoryLabel}</div>
                    <h3 class="product-title">${prod.name}</h3>
                    <div class="product-rating">
                        <span class="stars">&starf;&starf;&starf;&starf;&starf;</span>
                        <span>${prod.rating} (${prod.reviewsCount})</span>
                    </div>
                    <div class="product-price">₹${prod.price.toLocaleString()}</div>
                    <div class="product-actions">
                        <a href="${getBasePath()}storefront/product.html?id=${prod.id}" class="btn btn-secondary btn-sm">View Protocol</a>
                        <button class="btn btn-primary btn-sm" onclick="addToCart(${prod.id}, 1)">Add &plus;</button>
                    </div>
                </div>
            </div>
        `;
    });

    // Generate 4 Gallery Images
    const galleryImages = [
        product.image,
        product.category === 'SERUM_LAB' ? 'serum_bottle.png' : product.category === 'TARGET_REPAIR' ? 'acne_corrector.png' : 'cream_jar.png',
        'serum_bottle.png',
        'cream_jar.png'
    ];

    pdpContainer.innerHTML = `
        <div class="pdp-grid-modern">
            <!-- Gallery Showcase -->
            <div class="pdp-gallery-modern">
                <div class="pdp-main-image-card-modern">
                    <div class="pdp-bg-glow"></div>
                    <span class="pdp-badge-modern">${product.badge}</span>
                    <div class="pdp-floating-stat stat-top-right">
                        <span style="color: var(--accent-cyan);">&check;</span> ISO Certified Vessel
                    </div>
                    <div class="pdp-floating-stat stat-bottom-left">
                        <span style="color: var(--accent-gold);">&starf;</span> UV Shielded Glass
                    </div>
                    <img src="${getImagePath(product.image)}" alt="${product.name}" class="pdp-image-modern" id="pdp-main-img">
                </div>
                <div class="pdp-thumbnails-modern">
                    ${galleryImages.map((img, idx) => `
                        <div class="pdp-thumb-card ${idx === 0 ? 'active' : ''}" onclick="updateMainImage(this, '${getImagePath(img)}')">
                            <img src="${getImagePath(img)}" alt="${product.name} angle ${idx + 1}">
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Details Panel -->
            <div class="pdp-details-modern">
                <div class="pdp-category-pill-modern">
                    <span class="pdp-live-dot"></span>
                    <span>${product.categoryLabel} // CLINICAL PROTOCOL</span>
                </div>
                <h1 class="pdp-title-modern">${product.name}</h1>
                <div class="pdp-meta-row-modern">
                    <div class="pdp-rating-modern">
                        <span class="stars">&starf;&starf;&starf;&starf;&starf;</span>
                        <span>${product.rating} (${product.reviewsCount} verified reviews)</span>
                    </div>
                    <div class="pdp-stock-status-modern">
                        <span class="stock-dot"></span>
                        <span>In Stock &bull; Ready to Ship</span>
                    </div>
                </div>
                <div class="pdp-price-modern">₹${product.price.toLocaleString()}</div>

                <div class="pdp-sales-alert-modern">
                    <span class="sales-icon">⚡</span>
                    <span><strong>${recentSales} units</strong> allocated and dispatched in the last 24 hours.</span>
                </div>
                <div class="pdp-timer-box-modern">
                    <div class="timer-header">
                        <span class="timer-dot"></span>
                        <span>BATCH ALLOCATION WINDOW CLOSES IN:</span>
                    </div>
                    <div class="timer-countdown" id="pdp-timer-display">04h 28m 15s</div>
                </div>

                <p class="pdp-long-desc-modern">${product.longDescription}</p>

                <div class="pdp-compatibility-card-modern">
                    <div class="compat-header">
                        <span class="compat-icon">&boxbox;</span>
                        <h3>Diagnostic Match Efficacy</h3>
                    </div>
                    <div class="compatibility-tags mt-2">
                        <span class="compat-label">Skin Types:</span>
                        ${product.skinTypes.map(s => `<span class="tag-skin-modern">${s}</span>`).join('')}
                    </div>
                    <div class="compatibility-tags mt-3">
                        <span class="compat-label">Target Concerns:</span>
                        ${product.targetConcerns.map(c => `<span class="tag-concern-modern">${c}</span>`).join('')}
                    </div>
                </div>

                <div class="pdp-actions-modern">
                    <div class="pdp-quantity-selector-modern">
                        <button onclick="let input = document.getElementById('pdp-qty'); input.value = Math.max(1, parseInt(input.value) - 1)">-</button>
                        <input type="number" id="pdp-qty" value="1" min="1" max="10" readonly>
                        <button onclick="let input = document.getElementById('pdp-qty'); input.value = Math.min(10, parseInt(input.value) + 1)">+</button>
                    </div>
                    <button class="btn btn-primary btn-lg pdp-add-to-cart-modern" onclick="addToCart(${product.id}, parseInt(document.getElementById('pdp-qty').value))">
                        Add to Clinical Cart &plus;
                    </button>
                </div>

                <div class="pdp-efficacy-section-modern">
                    <h3 class="section-title-modern">Clinical Efficacy Protocol</h3>
                    <div class="efficacy-grid-modern">
                        ${efficacyHtml}
                    </div>
                </div>

                <div class="pdp-accordion-section-modern">
                    <div class="accordion-item-modern active">
                        <h4 class="accordion-header-modern" onclick="this.parentElement.classList.toggle('active')">Key Active Ingredients</h4>
                        <div class="accordion-body-modern">
                            <ul class="actives-list-modern">
                                ${product.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    <div class="accordion-item-modern active">
                        <h4 class="accordion-header-modern" onclick="this.parentElement.classList.toggle('active')">Application & Protocol</h4>
                        <div class="accordion-body-modern">
                            <p class="protocol-text-modern">${product.usage}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Extended Clinical Specifications & Telemetry -->
        <div class="pdp-extended-spec-modern">
            <div class="spec-grid-modern">
                <!-- Left Column: Description & Benefits -->
                <div style="display: flex; flex-direction: column; gap: 4rem;">
                    <div class="spec-card-modern">
                        <h3>Product Description & Synthesis</h3>
                        <p style="color: var(--text-muted); font-size: 1.15rem; line-height: 1.8;">
                            ${product.longDescription}
                        </p>
                        <p style="color: var(--text-muted); font-size: 1.15rem; line-height: 1.8; margin-top: 1.5rem;">
                            Synthesized in ISO-certified cleanrooms under strict atmospheric controls, this formulation balances high-potency actives with lipid-rich botanical buffers to guarantee maximum dermal penetration without compromising the epidermal barrier.
                        </p>
                    </div>

                    <div class="spec-card-modern">
                        <h3>Clinical Benefits & Efficacy Outcomes</h3>
                        <ul class="benefits-list-modern">
                            <li>
                                <div>
                                    <strong style="color: var(--text-main); display: block; font-size: 1.25rem; margin-bottom: 0.25rem;">Targeted Action Matrix</strong>
                                    Formulated specifically to resolve ${product.targetConcerns.join(', ')} through continuous molecular release.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong style="color: var(--text-main); display: block; font-size: 1.25rem; margin-bottom: 0.25rem;">Micro-Encapsulated Delivery</strong>
                                    Active compounds bypass surface receptors to deploy directly within sub-dermal target layers, eliminating surface erythema.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong style="color: var(--text-main); display: block; font-size: 1.25rem; margin-bottom: 0.25rem;">Physiological Lipid Buffering</strong>
                                    Enriched with biocompatible squalane and bisabolol to maintain a pristine 3:1:1 golden ceramide ratio.
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Right Column: How to Use & Additional Info -->
                <div style="display: flex; flex-direction: column; gap: 4rem;">
                    <div class="spec-card-modern">
                        <h3>Application Protocol (How to Use)</h3>
                        <div class="protocol-step">
                            <span class="step-num">01</span>
                            <div class="step-text">
                                <strong>Cleanse & Purify</strong>
                                Thoroughly wash face with a gentle, pH-balanced cleanser to remove excess sebum and atmospheric debris. Pat dry.
                            </div>
                        </div>
                        <div class="protocol-step">
                            <span class="step-num">02</span>
                            <div class="step-text">
                                <strong>Active Dispensation</strong>
                                ${product.usage} Gently press into the skin until fully absorbed.
                            </div>
                        </div>
                        <div class="protocol-step">
                            <span class="step-num">03</span>
                            <div class="step-text">
                                <strong>Layer & Shield</strong>
                                Allow 60 seconds for complete dermal uptake before applying barrier lipid creams or broad-spectrum daily SPF 50+.
                            </div>
                        </div>
                    </div>

                    <div class="spec-card-modern">
                        <h3>Additional Technical Information</h3>
                        <table class="tech-info-table">
                            <tr>
                                <td>Primary Active</td>
                                <td>${product.ingredients[0]}</td>
                            </tr>
                            <tr>
                                <td>pH Level</td>
                                <td>4.5 &ndash; 5.2 (Physiological Dermal Balance)</td>
                            </tr>
                            <tr>
                                <td>Vessel Architecture</td>
                                <td>UV-Shielded Amber Glass / Airless Vacuum Pump</td>
                            </tr>
                            <tr>
                                <td>Thermal Stability</td>
                                <td>Tested stable across 30-day thermal stress cycles</td>
                            </tr>
                            <tr>
                                <td>Storage Protocol</td>
                                <td>Store in a cool, dark environment below 25&deg;C</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>

            <!-- FAQ Section -->
            <div class="spec-card-modern">
                <h3>Frequently Asked Questions</h3>
                <div class="faq-container-modern">
                    <div class="faq-item-modern">
                        <h5 class="faq-q" onclick="this.parentElement.classList.toggle('active')">
                            <span>Q. Can this formulation be layered with other active acids or retinoids?</span>
                            <span class="faq-arrow">&darr;</span>
                        </h5>
                        <div class="faq-a">
                            <p>We recommend alternating high-potency actives between AM and PM routines. For instance, apply Vitamin C in the morning and Retinol or Exfoliating Acids in the evening to prevent compromising the epidermal lipid barrier.</p>
                        </div>
                    </div>
                    <div class="faq-item-modern">
                        <h5 class="faq-q" onclick="this.parentElement.classList.toggle('active')">
                            <span>Q. Is this formulation safe for sensitive or rosacea-prone skin?</span>
                            <span class="faq-arrow">&darr;</span>
                        </h5>
                        <div class="faq-a">
                            <p>Yes. All SERUM LAB formulations are synthesized with specialized botanical soothing buffers (Centella Asiatica, Bisabolol) to mitigate standard irritation and support compromised skin barriers.</p>
                        </div>
                    </div>
                    <div class="faq-item-modern">
                        <h5 class="faq-q" onclick="this.parentElement.classList.toggle('active')">
                            <span>Q. How long before I observe noticeable clinical efficacy?</span>
                            <span class="faq-arrow">&darr;</span>
                        </h5>
                        <div class="faq-a">
                            <p>Initial surface hydration and plumping are observable within 24-48 hours. Deep cellular transformation, fine line reduction, and hyperpigmentation fading typically manifest after 28-30 days of consistent protocol adherence.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recommended Products Section -->
            <div class="recommended-section-modern">
                <h3 class="section-title-modern" style="justify-content: center; margin-bottom: 3rem;">Recommended Formulation Matches</h3>
                <div class="products-grid">
                    ${recommendedHtml}
                </div>
            </div>
        </div>
    `;

    // Start Timer Countdown
    const timerDisplay = document.getElementById('pdp-timer-display');
    if (timerDisplay) {
        let totalSeconds = 4 * 3600 + 28 * 60 + 15; // 4 hours, 28 mins, 15 secs
        const timerInterval = setInterval(() => {
            if (totalSeconds <= 0) {
                clearInterval(timerInterval);
                timerDisplay.textContent = "ALLOCATION CLOSED";
                return;
            }
            totalSeconds--;
            const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
            const s = (totalSeconds % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `${h}h ${m}m ${s}s`;
        }, 1000);
    }
}

function updateMainImage(thumbEl, imgUrl) {
    const mainImg = document.getElementById('pdp-main-img');
    if (mainImg) {
        mainImg.src = imgUrl;
        document.querySelectorAll('.pdp-thumb-card').forEach(el => el.classList.remove('active'));
        thumbEl.classList.add('active');
    }
}

// ==========================================
// CHECKOUT PAGE
// ==========================================
function initCheckoutPage() {
    const summaryContainer = document.getElementById('checkout-items-summary');
    if (!summaryContainer) return;

    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const discountEl = document.getElementById('checkout-discount');
    const totalEl = document.getElementById('checkout-total');
    const promoInput = document.getElementById('promo-code-input');
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    const form = document.getElementById('checkout-form');

    let discountAmount = 0;

    function renderSummary() {
        if (cart.length === 0) {
            summaryContainer.innerHTML = `<p class="empty-notice">Your cart is empty. <a href="${getBasePath()}storefront/shop.html">Return to Shop</a></p>`;
            if (subtotalEl) subtotalEl.textContent = '₹0';
            if (totalEl) totalEl.textContent = '₹0';
            return;
        }

        let html = '';
        let subtotal = 0;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            html += `
                <div class="checkout-summary-item">
                    <img src="${getImagePath(item.image)}" alt="${item.name}">
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p>Qty: ${item.quantity}</p>
                    </div>
                    <div class="item-price">₹${itemTotal.toLocaleString()}</div>
                </div>
            `;
        });

        summaryContainer.innerHTML = html;

        const shipping = subtotal > 1500 ? 0 : 150;
        const total = subtotal + shipping - discountAmount;

        subtotalEl.textContent = `₹${subtotal.toLocaleString()}`;
        shippingEl.textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
        discountEl.textContent = `-₹${discountAmount.toLocaleString()}`;
        totalEl.textContent = `₹${total.toLocaleString()}`;
    }

    if (applyPromoBtn && promoInput) {
        applyPromoBtn.addEventListener('click', () => {
            const code = promoInput.value.trim().toUpperCase();
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            if (code === 'GLOW20' || code === 'SERUM20') {
                discountAmount = subtotal * 0.20;
                showToast('20% Clinical Discount Applied!');
                renderSummary();
            } else if (code === 'WELCOME10') {
                discountAmount = subtotal * 0.10;
                showToast('10% Welcome Discount Applied!');
                renderSummary();
            } else {
                showToast('Invalid promo code');
            }
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (cart.length === 0) {
                showToast('Your cart is empty!');
                return;
            }
            // Clear cart and redirect to success
            localStorage.setItem('serum_lab_last_order', JSON.stringify({
                items: cart,
                total: totalEl.textContent,
                orderId: 'SL-' + Math.floor(100000 + Math.random() * 900000),
                date: new Date().toLocaleDateString()
            }));
            localStorage.removeItem('serum_lab_cart');
            window.location.href = `${getBasePath()}storefront/success.html`;
        });
    }

    renderSummary();
}

// ==========================================
// ADMIN DASHBOARD & MANAGEMENT
// ==========================================
function initAdminPages() {
    // Admin Products Management
    const adminProductsTable = document.getElementById('admin-products-tbody');
    if (adminProductsTable) {
        adminProductsTable.innerHTML = products.map(p => `
            <tr>
                <td><strong>${p.id}</strong></td>
                <td><img src="${getImagePath(p.image)}" class="admin-tbl-img" alt="${p.name}"> ${p.name}</td>
                <td><span class="badge-cat">${p.category}</span></td>
                <td>₹${p.price.toLocaleString()}</td>
                <td><span class="status-pill active">In Stock (85)</span></td>
                <td>
                    <button class="btn-sm btn-secondary" onclick="showToast('Edit modal opened for ${p.name}')">Edit</button>
                    <button class="btn-sm btn-danger" onclick="showToast('Product ${p.name} deactivated')">Disable</button>
                </td>
            </tr>
        `).join('');
    }

    // Admin Orders Management
    const adminOrdersTable = document.getElementById('admin-orders-tbody');
    if (adminOrdersTable) {
        const dummyOrders = [
            { id: "SL-948201", customer: "Aanya Sharma", items: "RETINOL_SYNAPSE 0.5% (x1)", total: "₹1,799", status: "Processing", date: "Today, 14:32" },
            { id: "SL-948190", customer: "Rohan Verma", items: "VITAMIN_C_RADIANCE_15% (x2)", total: "₹3,198", status: "Shipped", date: "Today, 11:15" },
            { id: "SL-948185", customer: "Priya Patel", items: "CERAMIDE_BARRIER_LOCK_2X (x1)", total: "₹1,650", status: "Delivered", date: "Yesterday" },
            { id: "SL-948172", customer: "Vikram Malhotra", items: "SALICYLIC_MATRIX 2% (x1)", total: "₹1,499", status: "Delivered", date: "May 16" },
            { id: "SL-948160", customer: "Meera Nair", items: "HYALURONIC_CELL_INFUSION (x2)", total: "₹2,598", status: "Delivered", date: "May 15" }
        ];

        adminOrdersTable.innerHTML = dummyOrders.map(o => `
            <tr>
                <td><strong>${o.id}</strong></td>
                <td>${o.customer}</td>
                <td>${o.items}</td>
                <td>${o.total}</td>
                <td><span class="status-pill ${o.status.toLowerCase()}">${o.status}</span></td>
                <td>${o.date}</td>
                <td>
                    <button class="btn-sm btn-secondary" onclick="showToast('Order ${o.id} details')">View</button>
                    <button class="btn-sm btn-primary" onclick="showToast('Order ${o.id} status updated')">Update</button>
                </td>
            </tr>
        `).join('');
    }
}
