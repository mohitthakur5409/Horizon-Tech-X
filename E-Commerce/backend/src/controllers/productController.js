const Product = require('../models/Product');

// @route  GET /api/products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route  GET /api/products/:id
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: 'Product not found' });
        res.json(product);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Product not found' });
        res.status(500).send('Server Error');
    }
};

// @route  POST /api/products  (admin only)
exports.createProduct = async (req, res) => {
    const { name, description, price, stock, imageUrl } = req.body;

    if (!name || !description || price === undefined || stock === undefined) {
        return res.status(400).json({ msg: 'Please provide name, description, price and stock' });
    }

    try {
        const product = new Product({ name, description, price, stock, imageUrl });
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route  PUT /api/products/:id  (admin only)
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: 'Product not found' });

        const fields = ['name', 'description', 'price', 'stock', 'imageUrl'];
        fields.forEach((field) => {
            if (req.body[field] !== undefined) product[field] = req.body[field];
        });

        await product.save();
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route  DELETE /api/products/:id  (admin only)
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: 'Product not found' });

        await product.deleteOne();
        res.json({ msg: 'Product removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
