// routes/courses.js
const express = require('express');
const { supabase } = require('../config/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all courses (public)
router.get('/', async (req, res) => {
    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select(`
        *,
        instructor:users!courses_instructor_id_fkey(id, full_name, email),
        lessons(id, title, order_index)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ courses });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ error: { message: 'Failed to fetch courses' } });
    }
});

// Get single course
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: course, error } = await supabase
            .from('courses')
            .select(`
        *,
        instructor:users!courses_instructor_id_fkey(id, full_name, email),
        lessons(
          id, title, description, content, duration_minutes, 
          order_index, video_url, created_at
        )
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!course) {
            return res.status(404).json({ error: { message: 'Course not found' } });
        }

        // Sort lessons by order
        if (course.lessons) {
            course.lessons.sort((a, b) => a.order_index - b.order_index);
        }

        res.json({ course });
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ error: { message: 'Failed to fetch course' } });
    }
});

// Create course (instructor only)
router.post('/', verifyToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { title, description, category, difficulty_level, estimated_duration } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                error: { message: 'Title and description are required' }
            });
        }

        const { data: course, error } = await supabase
            .from('courses')
            .insert([{
                title,
                description,
                category,
                difficulty_level,
                estimated_duration,
                instructor_id: req.user.id
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            message: 'Course created successfully',
            course
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ error: { message: 'Failed to create course' } });
    }
});

// Update course
router.put('/:id', verifyToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, difficulty_level, estimated_duration } = req.body;

        // Check if user owns this course or is admin
        const { data: existingCourse } = await supabase
            .from('courses')
            .select('instructor_id')
            .eq('id', id)
            .single();

        if (!existingCourse) {
            return res.status(404).json({ error: { message: 'Course not found' } });
        }

        if (existingCourse.instructor_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: { message: 'Not authorized' } });
        }

        const { data: course, error } = await supabase
            .from('courses')
            .update({ title, description, category, difficulty_level, estimated_duration })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            message: 'Course updated successfully',
            course
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ error: { message: 'Failed to update course' } });
    }
});

// Delete course
router.delete('/:id', verifyToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const { data: existingCourse } = await supabase
            .from('courses')
            .select('instructor_id')
            .eq('id', id)
            .single();

        if (!existingCourse) {
            return res.status(404).json({ error: { message: 'Course not found' } });
        }

        if (existingCourse.instructor_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: { message: 'Not authorized' } });
        }

        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: { message: 'Failed to delete course' } });
    }
});

module.exports = router;