// routes/progress.js
const express = require('express');
const { supabase } = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get progress for a course
router.get('/course/:course_id', verifyToken, async (req, res) => {
    try {
        const { course_id } = req.params;

        // Check enrollment
        const { data: enrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('course_id', course_id)
            .single();

        if (!enrollment) {
            return res.status(403).json({
                error: { message: 'Not enrolled in this course' }
            });
        }

        const { data: progress, error } = await supabase
            .from('lesson_progress')
            .select(`
        *,
        lesson:lessons(id, title, order_index, duration_minutes)
      `)
            .eq('user_id', req.user.id)
            .eq('enrollment_id', enrollment.id);

        if (error) throw error;

        // Get total lessons in course
        const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('course_id', course_id);

        const completedLessons = progress.filter(p => p.completed).length;
        const totalLessons = lessons?.length || 0;
        const completionPercentage = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        res.json({
            progress,
            stats: {
                completed_lessons: completedLessons,
                total_lessons: totalLessons,
                completion_percentage: completionPercentage
            }
        });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: { message: 'Failed to fetch progress' } });
    }
});

// Update lesson progress
router.post('/lesson/:lesson_id', verifyToken, async (req, res) => {
    try {
        const { lesson_id } = req.params;
        const { completed, time_spent } = req.body;

        // Get lesson and course info
        const { data: lesson } = await supabase
            .from('lessons')
            .select('course_id')
            .eq('id', lesson_id)
            .single();

        if (!lesson) {
            return res.status(404).json({
                error: { message: 'Lesson not found' }
            });
        }

        // Get enrollment
        const { data: enrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('course_id', lesson.course_id)
            .single();

        if (!enrollment) {
            return res.status(403).json({
                error: { message: 'Not enrolled in this course' }
            });
        }

        // Check if progress exists
        const { data: existingProgress } = await supabase
            .from('lesson_progress')
            .select('id, time_spent')
            .eq('user_id', req.user.id)
            .eq('lesson_id', lesson_id)
            .eq('enrollment_id', enrollment.id)
            .single();

        let progress;
        if (existingProgress) {
            // Update existing
            const newTimeSpent = (existingProgress.time_spent || 0) + (time_spent || 0);
            const { data, error } = await supabase
                .from('lesson_progress')
                .update({
                    completed: completed ?? existingProgress.completed,
                    time_spent: newTimeSpent,
                    last_accessed: new Date().toISOString()
                })
                .eq('id', existingProgress.id)
                .select()
                .single();

            if (error) throw error;
            progress = data;
        } else {
            // Create new
            const { data, error } = await supabase
                .from('lesson_progress')
                .insert([{
                    user_id: req.user.id,
                    lesson_id,
                    enrollment_id: enrollment.id,
                    completed: completed || false,
                    time_spent: time_spent || 0
                }])
                .select()
                .single();

            if (error) throw error;
            progress = data;
        }

        res.json({
            message: 'Progress updated successfully',
            progress
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: { message: 'Failed to update progress' } });
    }
});

// Get user's overall stats
router.get('/stats', verifyToken, async (req, res) => {
    try {
        // Get enrollments count
        const { data: enrollments, error: enrollError } = await supabase
            .from('enrollments')
            .select('id, course_id')
            .eq('user_id', req.user.id);

        if (enrollError) throw enrollError;

        // Get completed lessons
        const { data: completedLessons, error: progressError } = await supabase
            .from('lesson_progress')
            .select('id, time_spent')
            .eq('user_id', req.user.id)
            .eq('completed', true);

        if (progressError) throw progressError;

        const totalTimeSpent = completedLessons?.reduce(
            (sum, lesson) => sum + (lesson.time_spent || 0),
            0
        ) || 0;

        res.json({
            stats: {
                enrolled_courses: enrollments?.length || 0,
                completed_lessons: completedLessons?.length || 0,
                total_time_spent_minutes: totalTimeSpent
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: { message: 'Failed to fetch stats' } });
    }
});

module.exports = router;