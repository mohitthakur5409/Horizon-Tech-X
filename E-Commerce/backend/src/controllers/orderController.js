const Order = require('../models/Order');
const Product = require('../models/Product');

// @route  POST /api/orders
exports.placeOrder = async (req, res) => {
    const { items, totalAmount } = req.body;

    if (!items || !items.length) {
        return res.status(400).json({ msg: 'Order must contain at least one item' });
    }

    try {
        // Stock check & deduction loop
        for (let item of items) {
            const product = await Product.findById(item.product);
            if (!product || product.stock < item.quantity) {
                return res.status(400).json({
                    msg: `Product out of stock or missing: ${product ? product.name : item.product}`
                });
            }
            product.stock -= item.quantity;
            await product.save();
        }

        const newOrder = new Order({
            user: req.user.id,
            items,
            totalAmount
        });

        const order = await newOrder.save();
        res.status(201).json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route  GET /api/orders
// @desc   Get logged-in user's orders
exports.getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('items.product', 'name imageUrl')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route  GET /api/orders/:id
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product', 'name imageUrl');
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        // Only the owner (or an admin) can view the order
        if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ msg: 'Not authorized to view this order' });
        }

        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route  PUT /api/orders/:id/status  (admin only)
exports.updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ msg: `Status must be one of: ${allowedStatuses.join(', ')}` });
    }

    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        order.status = status;
        await order.save();
        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
