// middleware/auth.js
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: { message: 'No token provided' } });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);

        // Optionally verify user still exists in Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.id)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: { message: 'Invalid token' } });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: { message: 'Invalid or expired token' } });
    }
};

// Role-based authorization
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Not authenticated' } });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: { message: 'Insufficient permissions' } });
        }

        next();
    };
};

module.exports = { generateToken, verifyToken, requireRole };