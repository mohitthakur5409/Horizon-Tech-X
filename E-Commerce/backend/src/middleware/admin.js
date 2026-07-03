// Must run after the `auth` middleware — assumes req.user is already set
module.exports = function (req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ msg: 'Admin access required' });
    }
    next();
};
