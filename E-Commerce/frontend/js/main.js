// ---------- Shared helpers (used across every page) ----------

function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.innerText = count;
}

function addToCart(id, name, price) {
    let cart = getCart();
    const existIndex = cart.findIndex(item => item.product === id);

    if (existIndex > -1) {
        cart[existIndex].quantity += 1;
    } else {
        cart.push({ product: id, name, priceAtPurchase: price, quantity: 1 });
    }

    saveCart(cart);
    alert(`${name} added to cart!`);
}

// Updates the nav bar to show Login/Register or a Logout link, depending
// on whether the user has a valid session cookie.
async function initAuthNav() {
    const authLinks = document.getElementById('auth-links');
    if (!authLinks) return;

    try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
            const user = await res.json();
            authLinks.innerHTML = `<span>Hi, ${user.username}</span> <a href="#" id="logout-link">Logout</a>`;
            document.getElementById('logout-link').addEventListener('click', async (e) => {
                e.preventDefault();
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                window.location.href = 'index.html';
            });
        } else {
            authLinks.innerHTML = `<a href="login.html">Login</a> <a href="register.html">Register</a>`;
        }
    } catch (err) {
        authLinks.innerHTML = `<a href="login.html">Login</a> <a href="register.html">Register</a>`;
    }
}

// ---------- Homepage product grid ----------

async function fetchProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    try {
        const res = await fetch('/api/products');
        const products = await res.json();

        if (!products.length) {
            grid.innerHTML = '<p>No products available yet.</p>';
            return;
        }

        grid.innerHTML = products.map(product => `
            <div class="card">
                <a href="product.html?id=${product._id}">
                    <img src="${product.imageUrl || 'https://via.placeholder.com/250'}" alt="${product.name}">
                    <h3>${product.name}</h3>
                </a>
                <p>$${product.price.toFixed(2)}</p>
                <button class="btn" onclick="addToCart('${product._id}', '${product.name.replace(/'/g, "\\'")}', ${product.price})">Add to Cart</button>
            </div>
        `).join('');
    } catch (err) {
        grid.innerHTML = '<p>Could not load products. Please try again later.</p>';
    }
}

// ---------- Lifecycle ----------

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartCount();
    initAuthNav();
});
