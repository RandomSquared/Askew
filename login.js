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

// Global variables to store authentication state
let currentTab = null; // Currently active login tab

// Initialize the page by checking URL parameters and showing the appropriate tab
window.addEventListener('DOMContentLoaded', initializeLoginPage);

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
    document.getElementById('tab-student-login').style.backgroundColor = 'var(--background-color-1)';
    document.getElementById('tab-student-signup').style.backgroundColor = 'var(--background-color-1)';
    document.getElementById('tab-teacher-login').style.backgroundColor = 'var(--background-color-1)';
    document.getElementById('tab-student-login').style.color = 'var(--text-color-bg-1)';
    document.getElementById('tab-student-signup').style.color = 'var(--text-color-bg-1)';
    document.getElementById('tab-teacher-login').style.color = 'var(--text-color-bg-1)';
    
    // Show the selected section and highlight its button
    if (tabName === 'student-login') {
        document.getElementById('student-login-section').style.display = 'block';
        document.getElementById('tab-student-login').style.backgroundColor = 'var(--highlight-colour-1)';
        document.getElementById('tab-student-login').style.color = 'var(--text-color-fg-1)';
    } else if (tabName === 'student-signup') {
        document.getElementById('student-signup-section').style.display = 'block';
        document.getElementById('tab-student-signup').style.backgroundColor = 'var(--highlight-colour-1)';
        document.getElementById('tab-student-signup').style.color = 'var(--text-color-fg-1)';
    } else if (tabName === 'teacher-login') {
        document.getElementById('teacher-login-section').style.display = 'block';
        document.getElementById('tab-teacher-login').style.backgroundColor = 'var(--highlight-colour-1)';
        document.getElementById('tab-teacher-login').style.color = 'var(--text-color-fg-1)';
    }
    
    // Clear any status messages
    document.getElementById('login-status').textContent = '';
}

/**
 * Handle student login
 * Verifies student credentials against the students table
 * Stores student data in localStorage on success
 * Redirects to student interface
 */
async function studentLogin() {
    const name = document.getElementById('student-login-name').value.trim();
    const studentId = document.getElementById('student-login-id').value.trim();
    const email = document.getElementById('student-login-email').value.trim();
    
    // Validate required fields
    if (!name || !studentId) {
        showStatus('Please fill in your name and student ID');
        return;
    }
    
    try {
        // Query the students table to verify credentials
        const students = await supabaseGet(
            'students',
            `student_id=eq.${studentId}`
        );
        
        if (students.length === 0) {
            showStatus('Student not found. Please sign up first.');
            return;
        }
        
        // Verify the name matches (simple verification for now)
        const student = students[0];
        if (student.name.toLowerCase() !== name.toLowerCase()) {
            showStatus('Name does not match our records.');
            return;
        }
        
        // Store student data in localStorage
        localStorage.setItem('currentStudent', JSON.stringify({
            id: student.id,
            name: student.name,
            student_id: student.student_id,
            email: student.email
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
 * Handle student signup
 * Creates a new student account in the students table
 * Stores student data in localStorage on success
 * Redirects to student interface
 * Note: Email verification is not implemented yet (placeholder for future)
 */
async function studentSignup() {
    const name = document.getElementById('student-signup-name').value.trim();
    const studentId = document.getElementById('student-signup-id').value.trim();
    const email = document.getElementById('student-signup-email').value.trim();
    
    // Validate required fields
    if (!name || !studentId) {
        showStatus('Please fill in your name and student ID');
        return;
    }
    
    try {
        // Check if student ID already exists
        const existingStudents = await supabaseGet(
            'students',
            `student_id=eq.${studentId}`
        );
        
        if (existingStudents.length > 0) {
            showStatus('This student ID is already registered. Please login instead.');
            return;
        }
        
        // Create new student account
        const newStudent = await supabasePost('students', {
            name: name,
            student_id: studentId,
            email: email || null // Email is optional for now
        });
        
        // Store student data in localStorage
        localStorage.setItem('currentStudent', JSON.stringify({
            id: newStudent[0].id,
            name: newStudent[0].name,
            student_id: newStudent[0].student_id,
            email: newStudent[0].email
        }));
        
        showStatus('Sign up successful! Redirecting...');
        
        // Redirect to student interface after a short delay
        setTimeout(() => {
            window.location.href = 'student.html';
        }, 1000);
        
    } catch (error) {
        console.error('Error during student signup:', error);
        showStatus('Error signing up. Please try again.');
    }
}

/**
 * Handle teacher login
 * Verifies teacher credentials against the teachers table
 * Stores teacher data in localStorage on success
 * Redirects to teacher interface
 * Reuses the same logic from teacher.js
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
        // Query the database to verify teacher credentials
        const teachers = await supabaseGet(
            'teachers',
            `teacher_id=eq.${teacherId}&password=eq.${password}`
        );
        
        if (teachers.length === 0) {
            showStatus('Invalid credentials. Please check your teacher ID and password.');
            return;
        }
        
        // Store teacher information in localStorage
        const teacher = teachers[0];
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
