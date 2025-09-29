// routes/enrollments.js
const express = require('express');
const { supabase } = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get user's enrollments
router.get('/my-courses', verifyToken, async (req, res) => {
    try {
        const { data: enrollments, error } = await supabase
            .from('enrollments')
            .select(`
        *,
        course:courses(
          id, title, description, category, difficulty_level,
          instructor:users!courses_instructor_id_fkey(full_name)
        )
      `)
            .eq('user_id', req.user.id)
            .order('enrolled_at', { ascending: false });

        if (error) throw error;

        res.json({ enrollments });
    } catch (error) {
        console.error('Get enrollments error:', error);
        res.status(500).json({ error: { message: 'Failed to fetch enrollments' } });
    }
});

// Enroll in a course
router.post('/', verifyToken, async (req, res) => {
    try {
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({
                error: { message: 'Course ID is required' }
            });
        }

        // Check if already enrolled
        const { data: existing } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('course_id', course_id)
            .single();

        if (existing) {
            return res.status(400).json({
                error: { message: 'Already enrolled in this course' }
            });
        }

        // Check if course exists
        const { data: course } = await supabase
            .from('courses')
            .select('id')
            .eq('id', course_id)
            .single();

        if (!course) {
            return res.status(404).json({
                error: { message: 'Course not found' }
            });
        }

        const { data: enrollment, error } = await supabase
            .from('enrollments')
            .insert([{
                user_id: req.user.id,
                course_id
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            message: 'Successfully enrolled in course',
            enrollment
        });
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ error: { message: 'Failed to enroll in course' } });
    }
});

// Unenroll from a course
router.delete('/:course_id', verifyToken, async (req, res) => {
    try {
        const { course_id } = req.params;

        const { error } = await supabase
            .from('enrollments')
            .delete()
            .eq('user_id', req.user.id)
            .eq('course_id', course_id);

        if (error) throw error;

        res.json({ message: 'Successfully unenrolled from course' });
    } catch (error) {
        console.error('Unenroll error:', error);
        res.status(500).json({ error: { message: 'Failed to unenroll from course' } });
    }
});

module.exports = router;