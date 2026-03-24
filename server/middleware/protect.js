const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Route handlers only require user id for ownership checks.
        req.user = { _id: decoded.id };
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalid or expired' });
    }
};

module.exports = protect;
