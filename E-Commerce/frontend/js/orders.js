async function loadOrders() {
    const container = document.getElementById('orders-content');

    try {
        const res = await fetch('/api/orders', { credentials: 'include' });

        if (res.status === 401) {
            container.innerHTML = '<p>Please <a href="login.html">log in</a> to view your orders.</p>';
            return;
        }

        const orders = await res.json();

        if (!orders.length) {
            container.innerHTML = '<p>You have no orders yet. <a href="index.html">Start shopping</a>.</p>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <span>Order #${order._id.slice(-6).toUpperCase()}</span>
                    <span>${new Date(order.createdAt).toLocaleString()}</span>
                    <span class="status-badge status-${order.status}">${order.status}</span>
                </div>
                <ul>
                    ${order.items.map(item => `
                        <li>${item.quantity} x ${item.product?.name || 'Product removed'} — $${item.priceAtPurchase.toFixed(2)} each</li>
                    `).join('')}
                </ul>
                <p style="margin-top:0.5rem;"><strong>Total: $${order.totalAmount.toFixed(2)}</strong></p>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<p>Could not load orders. Please try again later.</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadOrders);
