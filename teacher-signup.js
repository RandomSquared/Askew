/*
 * Teacher Signup Logic - Attendance System
 * 
 * This file handles teacher signup functionality:
 * - Teacher signup with name and password
 * - Auto-generated teacher ID (TEA + 6 digits)
 * - Password hashing using RPC function
 * - Creates teacher record with approved=false
 * - Requires admin approval before login
 * 
 * Dependencies: shared.js (for API helpers)
 */

/**
 * Handle teacher signup
 * Generates teacher ID, hashes password, creates teacher record
 * Requires admin approval before login
 */
async function teacherSignup() {
    const name = document.getElementById('teacher-signup-name').value.trim();
    const password = document.getElementById('teacher-signup-password').value.trim();
    const confirmPassword = document.getElementById('teacher-signup-confirm-password').value.trim();
    
    // Validate required fields
    if (!name || !password || !confirmPassword) {
        showStatus('Please fill in all fields');
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
        console.log('Starting teacher signup for:', name);
        
        // Generate teacher ID
        const teacherId = generateTeacherId();
        console.log('Generated teacher ID:', teacherId);
        
        // Hash password using RPC function
        const hashResponse = await fetch('https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/rpc/hash_password', {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ p_password: password })
        });
        
        if (!hashResponse.ok) {
            throw new Error('Failed to hash password');
        }
        
        const passwordHash = await hashResponse.json();
        console.log('Password hashed successfully');
        
        // Insert teacher record using direct REST API
        const response = await fetch('https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/teachers', {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                name: name,
                teacher_id: teacherId,
                password_hash: passwordHash,
                approved: false
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create teacher record');
        }
        
        const newTeacher = await response.json();
        console.log('Teacher record created:', newTeacher);
        
        showStatus(`Sign up successful! Your Teacher ID is: ${teacherId}. Please wait for an administrator to approve your account before logging in.`);
        
        // Redirect to login page after a delay
        setTimeout(() => {
            window.location.href = 'login.html?type=teacher-login';
        }, 5000);
        
    } catch (error) {
        console.error('Error during teacher signup:', error);
        showStatus('Error signing up: ' + error.message);
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
 * Generate a teacher ID (TEA + 6 digits)
 * @returns {string} - Generated teacher ID
 */
function generateTeacherId() {
    return 'TEA' + Math.floor(100000 + Math.random() * 900000);
}

/**
 * Display a status message to the user
 * 
 * @param {string} message - The message to display
 */
function showStatus(message) {
    document.getElementById('signup-status').textContent = message;
}
