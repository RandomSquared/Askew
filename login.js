/*
 * Login Logic - Attendance System
 * 
 * This file handles all authentication functionality:
 * - Tab switching between student login, student signup, and teacher login
 * - Student login verification against students table
 * - Student signup to create new student accounts
 * - Teacher login verification against teachers table
 * - Storing authenticated user data in localStorage
 * - Redirecting to appropriate interface after successful login
 * 
 * Dependencies: shared.js (for API helpers)
 */

// Supabase configuration
const SUPABASE_REST_URL = 'https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/';
const SUPABASE_KEY = 'sb_publishable_ORuEPdmhFETjCeGmj_CS5Q_nKRsgn5N';

// Database helper functions defined locally to avoid scope issues
async function supabaseGet(table, filters = '') {
    const url = `${SUPABASE_REST_URL}${table}?${filters}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`GET request failed: ${response.statusText}`);
    }
    
    return await response.json();
}

async function supabasePost(table, data) {
    const url = `${SUPABASE_REST_URL}${table}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`POST request failed: ${response.statusText}`);
    }
    
    return await response.json();
}

async function supabasePatch(table, filters, data) {
    const url = `${SUPABASE_REST_URL}${table}?${filters}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`PATCH request failed: ${response.statusText}`);
    }
    
    return await response.json();
}

// Global variables to store authentication state
let currentTab = null; // Currently active login tab

// Initialize the page by checking URL parameters and showing the appropriate tab
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    initializeLoginPage();
    initializeSupabaseAuth();
});

/**
 * Initialize the login page
 * Check URL parameters to determine which tab to show by default
 * If no parameter specified, default to student login
 */
function initializeLoginPage() {
    // Get the type parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    // Determine which tab to show based on URL parameter
    if (type === 'student-signup') {
        showTab('student-signup');
    } else if (type === 'teacher-login') {
        showTab('teacher-login');
    } else {
        // Default to student login
        showTab('student-login');
    }
}

/**
 * Show the specified login tab and hide others
 * Updates the visual styling of tab buttons
 * 
 * @param {string} tabName - The tab to show (student-login, student-signup, teacher-login)
 */
function showTab(tabName) {
    currentTab = tabName;
    
    // Hide all login sections
    document.getElementById('student-login-section').style.display = 'none';
    document.getElementById('student-signup-section').style.display = 'none';
    document.getElementById('teacher-login-section').style.display = 'none';
    
    // Reset all tab button styles
    document.getElementById('tab-student-login').style.backgroundColor = 'var(--highlight-colour-3)';
    document.getElementById('tab-student-signup').style.backgroundColor = 'var(--highlight-colour-3)';
    document.getElementById('tab-teacher-login').style.backgroundColor = 'var(--highlight-colour-3)';
    document.getElementById('tab-student-login').style.color = 'var(--text-colour-bg-3)';
    document.getElementById('tab-student-signup').style.color = 'var(--text-colour-bg-3)';
    document.getElementById('tab-teacher-login').style.color = 'var(--text-colour-bg-3)';
    
    // Show the selected section and highlight its button
    if (tabName === 'student-login') {
        document.getElementById('student-login-section').style.display = 'block';
        document.getElementById('tab-student-login').style.backgroundColor = 'var(--highlight-colour-1)';
        document.getElementById('tab-student-login').style.color = 'var(--text-colour-fg-1)';
    } else if (tabName === 'student-signup') {
        document.getElementById('student-signup-section').style.display = 'block';
        document.getElementById('tab-student-signup').style.backgroundColor = 'var(--highlight-colour-1)';
        document.getElementById('tab-student-signup').style.color = 'var(--text-colour-fg-1)';
    } else if (tabName === 'teacher-login') {
        document.getElementById('teacher-login-section').style.display = 'block';
        document.getElementById('tab-teacher-login').style.backgroundColor = 'var(--highlight-colour-1)';
        document.getElementById('tab-teacher-login').style.color = 'var(--text-colour-fg-1)';
    }
    
    // Clear any status messages
    document.getElementById('login-status').textContent = '';
}

/**
 * Handle student login
 * Uses Supabase Auth for authentication
 * Accepts email or student ID as login identifier
 * Verifies email confirmation status
 * Redirects to student interface on success
 */
async function studentLogin() {
    const emailOrId = document.getElementById('student-login-email').value.trim();
    const password = document.getElementById('student-login-password').value.trim();
    
    // Validate required fields
    if (!emailOrId || !password) {
        showStatus('Please fill in your email/student ID and password');
        return;
    }
    
    try {
        // Check if the input is a student ID (starts with STU)
        let email = emailOrId;
        if (emailOrId.toUpperCase().startsWith('STU')) {
            // Look up email by student ID
            const students = await supabaseGet(
                'students',
                `student_id=eq.${emailOrId}`
            );
            
            if (students.length === 0) {
                showStatus('Student ID not found. Please sign up first.');
                return;
            }
            
            // Get the email from auth.users using the user_id
            const student = students[0];
            if (!student.user_id) {
                showStatus('Account not properly set up. Please contact support.');
                return;
            }
            
            // We need to get the email from auth.users, but we can't directly access it
            // For now, we'll ask the user to use their email instead
            showStatus('Please use your email address to login instead of student ID.');
            return;
        }
        
        // Always use direct REST API for authentication (most reliable)
        console.log('Using direct REST API for login');
        const response = await fetch('https://ajzvuilyjuhxcyugjazr.supabase.co/auth/v1/token?grant_type=password', {
            method: 'POST',
            headers: {
                'apikey': 'sb_publishable_ORuEPdmhFETjCeGmj_CS5Q_nKRsgn5N',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, password: password })
        });
        const data = await response.json();
        console.log('REST API response:', data);
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        // Handle different response structures from Supabase REST API
        const user = data.user || data;
        const session = data.session || null;
        
        const authResult = { data: { user: user, session: session }, error: null };
        const { data: authData, error } = authResult;
        
        if (error) {
            showStatus(error.message);
            return;
        }
        
        // Check if email is verified
        if (!authData.user.email_confirmed_at) {
            showStatus('Please verify your email before logging in. Check your inbox for the verification link.');
            return;
        }
        
        // Fetch student data from students table
        const students = await supabaseGet(
            'students',
            `user_id=eq.${authData.user.id}`
        );
        
        if (students.length === 0) {
            showStatus('Student record not found. Please sign up first.');
            return;
        }
        
        const student = students[0];
        
        // Store student data in localStorage
        localStorage.setItem('currentStudent', JSON.stringify({
            id: student.id,
            name: student.name,
            student_id: student.student_id,
            email: authData.user.email,
            user_id: authData.user.id
        }));
        
        showStatus('Login successful! Redirecting...');
        
        // Redirect to student interface after a short delay
        setTimeout(() => {
            window.location.href = 'student.html';
        }, 1000);
        
    } catch (error) {
        console.error('Error during student login:', error);
        showStatus('Error logging in. Please try again.');
    }
}

/**
 * Validate password meets requirements
 * @param {string} password - Password to validate
 * @returns {Object} - { valid: boolean, message: string }
 */
function validatePassword(password) {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    
    if (!/\d/.test(password)) {
        return { valid: false, message: 'Password must contain at least 1 number' };
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { valid: false, message: 'Password must contain at least 1 special character' };
    }
    
    return { valid: true, message: '' };
}

/**
 * Handle student signup
 * Uses Supabase Auth for authentication with email verification
 * Creates student record in students table with auto-generated student ID
 * Sends verification email automatically via Supabase
 * Redirects to student interface after signup
 */
async function studentSignup() {
    const name = document.getElementById('student-signup-name').value.trim();
    const email = document.getElementById('student-signup-email').value.trim();
    const password = document.getElementById('student-signup-password').value.trim();
    const confirmPassword = document.getElementById('student-signup-confirm-password').value.trim();
    
    // Validate required fields
    if (!name || !email || !password || !confirmPassword) {
        showStatus('Please fill in all fields');
        return;
    }
    
    // Validate email format
    if (!email.includes('@') || !email.includes('.')) {
        showStatus('Please enter a valid email address');
        return;
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        showStatus(passwordValidation.message);
        return;
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
        showStatus('Passwords do not match');
        return;
    }
    
    try {
        console.log('Starting student signup for:', email);
        
        // Always use direct REST API for authentication (most reliable)
        console.log('Using direct REST API for authentication');
        const response = await fetch('https://ajzvuilyjuhxcyugjazr.supabase.co/auth/v1/signup', {
            method: 'POST',
            headers: {
                'apikey': 'sb_publishable_ORuEPdmhFETjCeGmj_CS5Q_nKRsgn5N',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: email, 
                password: password,
                options: { data: { name: name } }
            })
        });
        const data = await response.json();
        console.log('REST API response:', data);
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        // Handle different response structures from Supabase REST API
        // REST API returns user data directly, not nested under 'user'
        const user = data.user || data;
        const session = data.session || null;
        
        const authResult = { data: { user: user, session: session }, error: null };
        const { data: authData, error } = authResult;
        
        if (error) {
            console.error('Supabase Auth error:', error);
            if (error.message.includes('already registered')) {
                showStatus('This email is already registered. Please login instead.');
            } else {
                showStatus(error.message);
            }
            return;
        }
        
        console.log('Supabase Auth successful, user ID:', authData.user.id);
        
        // Create student record in students table with auto-generated student ID
        console.log('Creating student record...');
        const newStudent = await supabasePost('students', {
            name: name,
            user_id: authData.user.id,
            student_id: '', // Will be updated by database trigger
            email_verified: false
        });
        
        console.log('Student record created:', newStudent);
        
        // Update the student record with the auto-generated student ID
        const studentId = generateStudentId();
        console.log('Generated student ID:', studentId);
        
        await supabasePatch('students', `id=eq.${newStudent[0].id}`, {
            student_id: studentId
        });
        
        console.log('Student ID updated successfully');
        
        showStatus('Sign up successful! Please check your email for verification link.');
        
        // Redirect to student interface after a longer delay to allow email verification
        setTimeout(() => {
            window.location.href = 'student.html';
        }, 3000);
        
    } catch (error) {
        console.error('Error during student signup:', error);
        showStatus('Error signing up: ' + error.message);
    }
}

/**
 * Generate a student ID (client-side fallback)
 * @returns {string} - Generated student ID
 */
function generateStudentId() {
    return 'STU' + Math.floor(100000 + Math.random() * 900000);
}

/**
 * Handle teacher login
 * Verifies teacher credentials against the teachers table using bcrypt password hashing
 * Stores teacher data in localStorage on success
 * Redirects to teacher interface
 */
async function teacherLogin() {
    const name = document.getElementById('teacher-login-name').value.trim();
    const teacherId = document.getElementById('teacher-login-id').value.trim();
    const password = document.getElementById('teacher-login-password').value.trim();
    
    // Validate all fields are filled
    if (!name || !teacherId || !password) {
        showStatus('Please fill in all fields');
        return;
    }
    
    try {
        // Query the database to get teacher record
        const teachers = await supabaseGet(
            'teachers',
            `teacher_id=eq.${teacherId}`
        );
        
        if (teachers.length === 0) {
            showStatus('Invalid credentials. Please check your teacher ID and password.');
            return;
        }
        
        const teacher = teachers[0];
        
        // Verify name matches
        if (teacher.name.toLowerCase() !== name.toLowerCase()) {
            showStatus('Name does not match our records.');
            return;
        }
        
        // Check if password_hash exists (new system) or use plain text (legacy)
        if (teacher.password_hash) {
            // Use bcrypt to verify password hash via REST API
            const response = await fetch('https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/rpc/verify_password', {
                method: 'POST',
                headers: {
                    'apikey': 'sb_publishable_ORuEPdmhFETjCeGmj_CS5Q_nKRsgn5N',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password_hash: teacher.password_hash,
                    password: password
                })
            });
            const data = await response.json();
            
            if (response.status !== 200 || !data) {
                showStatus('Invalid credentials. Please check your teacher ID and password.');
                return;
            }
        } else if (teacher.password) {
            // Legacy: check plain text password (should be migrated)
            if (teacher.password !== password) {
                showStatus('Invalid credentials. Please check your teacher ID and password.');
                return;
            }
            
            // Migrate to hashed password via REST API
            const hashResponse = await fetch('https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/rpc/hash_password', {
                method: 'POST',
                headers: {
                    'apikey': 'sb_publishable_ORuEPdmhFETjCeGmj_CS5Q_nKRsgn5N',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: password
                })
            });
            const hashData = await hashResponse.json();
            
            if (hashResponse.status === 200 && hashData) {
                // Update the teacher record with hashed password
                await supabasePatch('teachers', `id=eq.${teacher.id}`, {
                    password_hash: hashData
                });
            }
        } else {
            showStatus('Invalid credentials. Please check your teacher ID and password.');
            return;
        }
        
        // Store teacher information in localStorage
        localStorage.setItem('currentTeacher', JSON.stringify({
            id: teacher.id,
            name: teacher.name,
            teacher_id: teacher.teacher_id
        }));
        
        showStatus('Login successful! Redirecting...');
        
        // Redirect to teacher interface after a short delay
        setTimeout(() => {
            window.location.href = 'teacher.html';
        }, 1000);
        
    } catch (error) {
        console.error('Error during teacher login:', error);
        showStatus('Error logging in. Please try again.');
    }
}

/**
 * Display a status message to the user
 * 
 * @param {string} message - The message to display
 */
function showStatus(message) {
    document.getElementById('login-status').textContent = message;
}
