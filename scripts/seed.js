// scripts/seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/supabase');

const mockData = {
    users: [
        {
            email: 'instructor1@example.com',
            password: 'password123',
            full_name: 'Dr. Sarah Johnson',
            role: 'instructor'
        },
        {
            email: 'instructor2@example.com',
            password: 'password123',
            full_name: 'Prof. Michael Chen',
            role: 'instructor'
        },
        {
            email: 'student1@example.com',
            password: 'password123',
            full_name: 'Alice Williams',
            role: 'student'
        },
        {
            email: 'student2@example.com',
            password: 'password123',
            full_name: 'Bob Martinez',
            role: 'student'
        },
        {
            email: 'admin@example.com',
            password: 'password123',
            full_name: 'Admin User',
            role: 'admin'
        }
    ],
    courses: [
        {
            title: 'Introduction to JavaScript',
            description: 'Learn the fundamentals of JavaScript programming from scratch. This comprehensive course covers variables, functions, objects, and modern ES6+ features.',
            category: 'Programming',
            difficulty_level: 'beginner',
            estimated_duration: 480
        },
        {
            title: 'Advanced React Development',
            description: 'Master React.js with hooks, context, performance optimization, and advanced patterns. Build production-ready applications.',
            category: 'Web Development',
            difficulty_level: 'advanced',
            estimated_duration: 720
        },
        {
            title: 'Data Science with Python',
            description: 'Dive into data analysis, visualization, and machine learning using Python, pandas, and scikit-learn.',
            category: 'Data Science',
            difficulty_level: 'intermediate',
            estimated_duration: 600
        },
        {
            title: 'UI/UX Design Fundamentals',
            description: 'Learn the principles of user interface and user experience design. Create beautiful and functional designs.',
            category: 'Design',
            difficulty_level: 'beginner',
            estimated_duration: 360
        }
    ],
    lessons: {
        'Introduction to JavaScript': [
            {
                title: 'Getting Started with JavaScript',
                description: 'Introduction to JavaScript, setting up your environment, and writing your first program.',
                content: 'Welcome to JavaScript! In this lesson, we will cover the basics...',
                duration_minutes: 30,
                order_index: 1,
                video_url: 'https://example.com/video1'
            },
            {
                title: 'Variables and Data Types',
                description: 'Understanding variables, const, let, and different data types in JavaScript.',
                content: 'JavaScript has several data types including strings, numbers, booleans...',
                duration_minutes: 45,
                order_index: 2,
                video_url: 'https://example.com/video2'
            },
            {
                title: 'Functions and Scope',
                description: 'Learn about functions, arrow functions, and scope in JavaScript.',
                content: 'Functions are reusable blocks of code. Let\'s explore how they work...',
                duration_minutes: 50,
                order_index: 3,
                video_url: 'https://example.com/video3'
            }
        ],
        'Advanced React Development': [
            {
                title: 'React Hooks Deep Dive',
                description: 'Master useState, useEffect, useContext, and custom hooks.',
                content: 'Hooks revolutionized React development. Let\'s explore each hook...',
                duration_minutes: 60,
                order_index: 1,
                video_url: 'https://example.com/video4'
            },
            {
                title: 'State Management Patterns',
                description: 'Learn advanced state management with Context API andReducers.',
                content: 'Managing complex state requires proper patterns and architecture...',
                duration_minutes: 55,
                order_index: 2,
                video_url: 'https://example.com/video5'
            }
        ],
        'Data Science with Python': [
            {
                title: 'Python Basics for Data Science',
                description: 'Essential Python concepts for data analysis.',
                content: 'Python is the most popular language for data science...',
                duration_minutes: 40,
                order_index: 1,
                video_url: 'https://example.com/video6'
            },
            {
                title: 'Pandas for Data Manipulation',
                description: 'Master data manipulation with pandas DataFrames.',
                content: 'Pandas provides powerful tools for working with structured data...',
                duration_minutes: 65,
                order_index: 2,
                video_url: 'https://example.com/video7'
            }
        ],
        'UI/UX Design Fundamentals': [
            {
                title: 'Design Principles',
                description: 'Core principles of good design: contrast, alignment, repetition, proximity.',
                content: 'Great design follows fundamental principles that guide our decisions...',
                duration_minutes: 35,
                order_index: 1,
                video_url: 'https://example.com/video8'
            },
            {
                title: 'User Research Methods',
                description: 'Learn how to conduct user research and gather insights.',
                content: 'Understanding your users is crucial for creating effective designs...',
                duration_minutes: 45,
                order_index: 2,
                video_url: 'https://example.com/video9'
            }
        ]
    }
};

async function seed() {
    try {
        console.log('🌱 Starting database seeding...\n');

        // Clear existing data (be careful in production!)
        console.log('Clearing existing data...');
        await supabase.from('lesson_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // Seed users
        console.log('Creating users...');
        const createdUsers = [];
        for (const user of mockData.users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            const { data, error } = await supabase
                .from('users')
                .insert([{
                    email: user.email,
                    password_hash: hashedPassword,
                    full_name: user.full_name,
                    role: user.role
                }])
                .select()
                .single();

            if (error) {
                console.error(`Error creating user ${user.email}:`, error);
            } else {
                createdUsers.push(data);
                console.log(`✓ Created ${user.role}: ${user.email}`);
            }
        }

        const instructors = createdUsers.filter(u => u.role === 'instructor');
        const students = createdUsers.filter(u => u.role === 'student');

        // Seed courses
        console.log('\nCreating courses...');
        const createdCourses = [];
        for (let i = 0; i < mockData.courses.length; i++) {
            const course = mockData.courses[i];
            const instructor = instructors[i % instructors.length];

            const { data, error } = await supabase
                .from('courses')
                .insert([{
                    ...course,
                    instructor_id: instructor.id
                }])
                .select()
                .single();

            if (error) {
                console.error(`Error creating course ${course.title}:`, error);
            } else {
                createdCourses.push(data);
                console.log(`✓ Created course: ${course.title}`);
            }
        }

        // Seed lessons
        console.log('\nCreating lessons...');
        for (const course of createdCourses) {
            const lessons = mockData.lessons[course.title];
            if (lessons) {
                for (const lesson of lessons) {
                    const { error } = await supabase
                        .from('lessons')
                        .insert([{
                            ...lesson,
                            course_id: course.id
                        }]);

                    if (error) {
                        console.error(`Error creating lesson ${lesson.title}:`, error);
                    } else {
                        console.log(`  ✓ Created lesson: ${lesson.title}`);
                    }
                }
            }
        }

        // Create sample enrollments
        console.log('\nCreating sample enrollments...');
        for (const student of students) {
            // Enroll each student in 2 courses
            for (let i = 0; i < 2; i++) {
                const course = createdCourses[i];
                const { data: enrollment, error } = await supabase
                    .from('enrollments')
                    .insert([{
                        user_id: student.id,
                        course_id: course.id
                    }])
                    .select()
                    .single();

                if (error) {
                    console.error(`Error creating enrollment:`, error);
                } else {
                    console.log(`✓ Enrolled ${student.full_name} in ${course.title}`);

                    // Add some progress for the first course
                    if (i === 0) {
                        const { data: lessons } = await supabase
                            .from('lessons')
                            .select('id')
                            .eq('course_id', course.id)
                            .limit(2);

                        if (lessons) {
                            for (const lesson of lessons) {
                                await supabase
                                    .from('lesson_progress')
                                    .insert([{
                                        user_id: student.id,
                                        lesson_id: lesson.id,
                                        enrollment_id: enrollment.id,
                                        completed: true,
                                        time_spent: 30
                                    }]);
                            }
                        }
                    }
                }
            }
        }

        console.log('\n✅ Database seeding completed successfully!');
        console.log('\n📝 Test Credentials:');
        console.log('Instructor: instructor1@example.com / password123');
        console.log('Student: student1@example.com / password123');
        console.log('Admin: admin@example.com / password123');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}

seed();