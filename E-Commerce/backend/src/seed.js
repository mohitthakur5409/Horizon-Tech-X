// Run with: npm run seed
// Populates the database with a handful of sample products so the store
// isn't empty on first run.
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');

dotenv.config();

const sampleProducts = [
    {
        name: 'Wireless Headphones',
        description: 'Over-ear Bluetooth headphones with noise cancellation and 30-hour battery life.',
        price: 79.99,
        stock: 25,
        imageUrl: 'https://via.placeholder.com/300?text=Headphones'
    },
    {
        name: 'Mechanical Keyboard',
        description: 'RGB backlit mechanical keyboard with hot-swappable switches.',
        price: 59.99,
        stock: 40,
        imageUrl: 'https://via.placeholder.com/300?text=Keyboard'
    },
    {
        name: 'Stainless Steel Water Bottle',
        description: 'Insulated 750ml bottle that keeps drinks cold for 24 hours.',
        price: 19.99,
        stock: 100,
        imageUrl: 'https://via.placeholder.com/300?text=Water+Bottle'
    },
    {
        name: '4K Webcam',
        description: 'Ultra HD webcam with auto-focus, perfect for streaming and video calls.',
        price: 89.99,
        stock: 15,
        imageUrl: 'https://via.placeholder.com/300?text=Webcam'
    },
    {
        name: 'Ergonomic Office Chair',
        description: 'Adjustable mesh-back office chair with lumbar support.',
        price: 149.99,
        stock: 10,
        imageUrl: 'https://via.placeholder.com/300?text=Office+Chair'
    }
];

async function seed() {
    await connectDB();
    try {
        await Product.deleteMany({});
        await Product.insertMany(sampleProducts);
        console.log(`✅ Inserted ${sampleProducts.length} sample products`);
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

seed();
