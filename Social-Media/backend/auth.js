const jwt = require('jsonwebtoken');
const { readDB } = require('./db');

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'Access denied. Security Token missing.' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authorization malformed.' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_social_sphere_token_mesh_key_2026');
    req.user = verified;
    
    const db = readDB();
    const userExists = db.users.find(u => u.id === req.user.id);
    if (!userExists) return res.status(404).json({ message: 'Active identity not found.' });
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Identity validation expired or invalid.' });
  }
};