// auth.js
// Middleware for JWT authentication

const jwt = require('jsonwebtoken');

// Secret key (store in environment variable for security)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Token format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });

    // Attach user info to request
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;