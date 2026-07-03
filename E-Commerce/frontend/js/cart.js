function renderCart() {
    const container = document.getElementById('cart-content');
    const cart = getCart();

    if (!cart.length) {
        container.innerHTML = '<p>Your cart is empty. <a href="index.html">Browse products</a>.</p>';
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);

    container.innerHTML = `
        <table class="cart-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Subtotal</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${cart.map((item, index) => `
                    <tr>
                        <td>${item.name}</td>
                        <td>$${item.priceAtPurchase.toFixed(2)}</td>
                        <td><input type="number" class="qty-input" data-index="${index}" value="${item.quantity}" min="1"></td>
                        <td>$${(item.priceAtPurchase * item.quantity).toFixed(2)}</td>
                        <td><button class="btn btn-danger remove-btn" data-index="${index}">Remove</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="cart-summary">
            Total: <strong>$${total.toFixed(2)}</strong>
            <button class="btn" id="checkout-btn">Checkout</button>
        </div>
    `;

    container.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.index, 10);
            const cart = getCart();
            const qty = Math.max(1, parseInt(e.target.value, 10) || 1);
            cart[idx].quantity = qty;
            saveCart(cart);
            renderCart();
        });
    });

    container.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index, 10);
            const cart = getCart();
            cart.splice(idx, 1);
            saveCart(cart);
            renderCart();
        });
    });

    document.getElementById('checkout-btn').addEventListener('click', checkout);
}

async function checkout() {
    const alertBox = document.getElementById('checkout-alert');
    alertBox.classList.add('hidden');
    alertBox.classList.remove('alert-success');
    alertBox.classList.add('alert-error');

    const cart = getCart();
    const totalAmount = cart.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);

    const items = cart.map(item => ({
        product: item.product,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase
    }));

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ items, totalAmount })
        });

        if (res.status === 401) {
            alertBox.innerText = 'Please log in to complete your order.';
            alertBox.classList.remove('hidden');
            setTimeout(() => { window.location.href = 'login.html'; }, 1200);
            return;
        }

        const data = await res.json();

        if (!res.ok) {
            alertBox.innerText = data.msg || 'Checkout failed';
            alertBox.classList.remove('hidden');
            return;
        }

        localStorage.removeItem('cart');
        updateCartCount();
        alertBox.classList.remove('alert-error');
        alertBox.classList.add('alert-success');
        alertBox.innerText = 'Order placed successfully! Redirecting to your orders...';
        alertBox.classList.remove('hidden');

        setTimeout(() => { window.location.href = 'orders.html'; }, 1200);
    } catch (err) {
        alertBox.innerText = 'Something went wrong. Please try again.';
        alertBox.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', renderCart);
