/*
 * Login Page - Askew
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
    const headers = {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`POST request failed: ${response.statusText}`);
    }
    
    return await response.json();
}

async function supabasePatch(table, filters, data) {
    const url = `${SUPABASE_REST_URL}${table}?${filters}`;
    const headers = {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
    
    const response = await fetch(url, {
        method: 'PATCH',
        headers: headers,
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
    document.getElementById('tab-student-login').style.backgroundColor = 'var(--background-colour-1)';
    document.getElementById('tab-student-signup').style.backgroundColor = 'var(--background-colour-1)';
    document.getElementById('tab-teacher-login').style.backgroundColor = 'var(--background-colour-1)';
    document.getElementById('tab-student-login').style.color = 'var(--text-colour-bg-1)';
    document.getElementById('tab-student-signup').style.color = 'var(--text-colour-bg-1)';
    document.getElementById('tab-teacher-login').style.color = 'var(--text-colour-bg-1)';
    
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
        // Check if the input is a student ID (with or without STU prefix)
        const isStudentId = emailOrId.toUpperCase().startsWith('STU') || /^\d{6}$/.test(emailOrId);
        
        if (isStudentId) {
            // Normalize the student ID (add STU prefix if not present)
            const studentId = emailOrId.toUpperCase().startsWith('STU') ? emailOrId : `STU${emailOrId}`;
            
            // Look up student by student ID
            const students = await supabaseGet(
                'students',
                `student_id=eq.${studentId}`
            );
            
            if (students.length === 0) {
                showStatus('Student ID not found. Please sign up first.');
                return;
            }
            
            const student = students[0];
            if (!student.email) {
                showStatus('No email associated with this student ID. Please contact support.');
                return;
            }
            
            // Use the email from the student record
            email = student.email;
        }
        
        // Always use direct REST API for authentication (most reliable)
        console.log('Using direct REST API for login with email:', email);
        const response = await fetch('https://ajzvuilyjuhxcyugjazr.supabase.co/auth/v1/token?grant_type=password', {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
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
        const accessToken = data.access_token || session?.access_token || null;
        
        // Store session in localStorage for supabaseAuth to retrieve
        if (accessToken) {
            localStorage.setItem('supabase-auth-token', accessToken);
            console.log('Stored access token in localStorage');
        } else {
            console.log('No access token found in response:', data);
        }
        
        const authResult = { data: { user: user, session: session }, error: null };
        const { data: authData, error } = authResult;
        
        if (error) {
            showStatus(error.message);
            return;
        }
        
        // Check if email is verified
        if (!authData.user.email_confirmed_at) {
            showStatus('There was an error in logging in. Please check that your password is correct.');
            return;
        }
        
        // Fetch student data using RPC function
        const rpcResponse = await fetch('https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/rpc/get_student_by_user_id', {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ p_user_id: authData.user.id })
        });
        const students = await rpcResponse.json();
        
        if (!Array.isArray(students) || students.length === 0) {
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
                'apikey': SUPABASE_KEY,
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
        
        // For signup, check if a session/access_token is returned
        const session = data.session || null;
        const accessToken = data.access_token || session?.access_token || null;
        
        // Store session in localStorage for supabaseAuth to retrieve
        if (accessToken) {
            localStorage.setItem('supabase-auth-token', accessToken);
        }
        
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
        
        // Create student record using RPC function
        const studentId = generateStudentId();
        const rpcResponse = await fetch('https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/rpc/create_student_record', {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                p_name: name,
                p_user_id: authData.user.id,
                p_student_id: studentId,
                p_email: email,
                p_email_verified: false
            })
        });
        
        if (!rpcResponse.ok) {
            const errorData = await rpcResponse.json();
            throw new Error(errorData.message || 'Failed to create student record');
        }
        
        const newStudent = await rpcResponse.json();
        console.log('Student record created:', newStudent);
        
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
 * Uses RPC function to verify credentials
 * Stores teacher data in localStorage on success
 * Redirects to teacher interface
 */
async function teacherLogin() {
    const name = document.getElementById('teacher-login-name').value.trim();
    let teacherId = document.getElementById('teacher-login-id').value.trim();
    const password = document.getElementById('teacher-login-password').value.trim();
    
    // Validate all fields are filled
    if (!name || !teacherId || !password) {
        showStatus('Please fill in all fields');
        return;
    }
    
    // Normalize teacher ID - if just numbers, add TEA prefix
    if (/^\d{6}$/.test(teacherId)) {
        teacherId = 'TEA' + teacherId;
    }
    
    try {
        // Use RPC function
        console.log('Attempting teacher login for ID:', teacherId);
        const response = await fetch('https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/rpc/get_teacher_by_id', {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ p_teacher_id: teacherId })
        });
        
        const teachers = await response.json();
        console.log('Teacher fetch response:', teachers);
        
        if (!Array.isArray(teachers) || teachers.length === 0) {
            console.error('No teacher found with ID:', teacherId);
            showStatus('Invalid credentials. Please check your teacher ID and password.');
            return;
        }
        
        const teacher = teachers[0];
        console.log('Teacher found:', { name: teacher.name, teacher_id: teacher.teacher_id, has_password_hash: !!teacher.password_hash, approved: teacher.approved });
        
        // Check if teacher is approved
        if (!teacher.approved) {
            console.error('Teacher not approved:', teacherId);
            showStatus('Your account has not been approved by an administrator yet. Please wait for approval.');
            return;
        }
        
        // Verify name matches
        if (teacher.name.toLowerCase() !== name.toLowerCase()) {
            console.error('Name mismatch. Expected:', teacher.name, 'Got:', name);
            showStatus('Name does not match our records.');
            return;
        }
        
        // Verify password
        if (teacher.password_hash) {
            console.log('Verifying hashed password for teacher:', teacherId);
            const verifyResponse = await fetch('https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/rpc/verify_password_hash', {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p_password_hash: teacher.password_hash,
                    p_password: password
                })
            });
            
            if (!verifyResponse.ok) {
                console.error('Verify response error:', verifyResponse.status, verifyResponse.statusText);
                showStatus('Invalid credentials. Please check your teacher ID and password.');
                return;
            }
            
            // Handle the response - Supabase RPC returns scalar as raw value
            let isValid = false;
            try {
                const responseData = await verifyResponse.json();
                console.log('Verify response data:', responseData, 'type:', typeof responseData);
                // Handle different response formats
                if (typeof responseData === 'boolean') {
                    isValid = responseData;
                } else if (Array.isArray(responseData) && responseData.length > 0) {
                    isValid = responseData[0] === true;
                } else if (responseData && responseData.error) {
                    console.error('RPC error:', responseData.error);
                    isValid = false;
                }
            } catch (e) {
                console.error('Error parsing verify response:', e);
                isValid = false;
            }
            
            console.log('Password verification result:', isValid);
            if (!isValid) {
                showStatus('Invalid credentials. Please check your teacher ID and password.');
                return;
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
