async function loadProduct() {
    const container = document.getElementById('product-content');
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        container.innerHTML = '<p>No product specified.</p>';
        return;
    }

    try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
            container.innerHTML = '<p>Product not found.</p>';
            return;
        }
        const product = await res.json();

        container.innerHTML = `
            <div class="product-detail">
                <img src="${product.imageUrl || 'https://via.placeholder.com/350'}" alt="${product.name}">
                <div class="product-info">
                    <h2>${product.name}</h2>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <p class="stock">${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
                    <p>${product.description}</p>
                    <div class="form-group" style="max-width:120px;">
                        <label for="qty">Quantity</label>
                        <input type="number" id="qty" class="qty-input" value="1" min="1" max="${product.stock}">
                    </div>
                    <button class="btn" id="add-to-cart-btn" ${product.stock === 0 ? 'disabled' : ''}>Add to Cart</button>
                </div>
            </div>
        `;

        document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
            const qty = Math.max(1, parseInt(document.getElementById('qty').value, 10) || 1);
            let cart = getCart();
            const existIndex = cart.findIndex(item => item.product === product._id);

            if (existIndex > -1) {
                cart[existIndex].quantity += qty;
            } else {
                cart.push({ product: product._id, name: product.name, priceAtPurchase: product.price, quantity: qty });
            }

            saveCart(cart);
            alert(`${product.name} added to cart!`);
        });
    } catch (err) {
        container.innerHTML = '<p>Could not load product. Please try again later.</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadProduct);
