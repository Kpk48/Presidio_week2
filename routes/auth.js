// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/supabase');
const { generateToken, verifyToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, role = 'student' } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({
                error: { message: 'Email, password, and full name are required' }
            });
        }

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({
                error: { message: 'User already exists' }
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const { data: user, error } = await supabase
            .from('users')
            .insert([{
                email,
                password_hash: hashedPassword,
                full_name,
                role
            }])
            .select()
            .single();

        if (error) throw error;

        const token = generateToken(user);

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: { message: 'Registration failed' } });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: { message: 'Email and password are required' }
            });
        }

        // Get user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({
                error: { message: 'Invalid credentials' }
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({
                error: { message: 'Invalid credentials' }
            });
        }

        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: { message: 'Login failed' } });
    }
});

// Get current user
router.get('/me', verifyToken, async (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            email: req.user.email,
            full_name: req.user.full_name,
            role: req.user.role
        }
    });
});

module.exports = router;