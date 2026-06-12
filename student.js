/*
 * Student Interface Logic - Attendance System
 * 
 * This file handles all student-side functionality:
 * - Joining a class using a class code
 * - Waiting for teacher to start marking via Realtime subscription
 * - Marking attendance with location verification
 * - Privacy protection: student location is never stored in database
 * 
 * Dependencies: shared.js (for API helpers and location calculation)
 */

// Global variables to store student and class information
let currentClass = null; // Stores the class the student has joined
let currentStudent = null; // Stores student name and ID
let markingSessionId = null; // ID of the active marking session
let realtimeSubscription = null; // Realtime subscription for marking signals

// Load saved classes from localStorage on page load
window.addEventListener('DOMContentLoaded', loadSavedClasses);

/**
 * Check if student is logged in on page load
 * Redirect to login page if not authenticated
 * Display student information if logged in
 */
function checkStudentLogin() {
    const savedStudent = localStorage.getItem('currentStudent');
    
    if (!savedStudent) {
        // Student is not logged in, redirect to login page
        alert('Please login first');
        window.location.href = 'login.html?type=student-login';
        return false;
    }
    
    // Parse and store student information
    currentStudent = JSON.parse(savedStudent);
    
    // Display student information on the page
    document.getElementById('student-info').textContent = 
        `Logged in as: ${currentStudent.name} (${currentStudent.student_id})`;
    
    return true;
}

/**
 * Logout the current student
 * Clear student data from localStorage and redirect to main menu
 */
function logout() {
    // Clear student data from localStorage
    localStorage.removeItem('currentStudent');
    
    // Redirect to main menu
    window.location.href = 'index.html';
}

// Override the loadSavedClasses to include login check
const originalLoadSavedClasses = loadSavedClasses;
loadSavedClasses = function() {
    // Check login first
    if (!checkStudentLogin()) {
        return;
    }
    
    // Call the original function if logged in
    originalLoadSavedClasses();
};

/**
 * Load saved classes from localStorage
 * Displays list of previously joined classes
 * Note: Student info is now loaded from login, not from this function
 */
function loadSavedClasses() {
    const savedClasses = JSON.parse(localStorage.getItem('savedClasses') || '[]');
    
    // Display saved classes if any exist
    if (savedClasses.length > 0) {
        const savedClassesDiv = document.createElement('div');
        savedClassesDiv.id = 'saved-classes';
        savedClassesDiv.innerHTML = '<h3>Your Classes:</h3>';
        
        savedClasses.forEach(cls => {
            const classDiv = document.createElement('div');
            classDiv.style.margin = '10px 0';
            classDiv.innerHTML = `
                <strong>${cls.class_name}</strong> (Code: ${cls.class_code})
                <button onclick="selectSavedClass('${cls.id}', '${cls.class_code}', '${cls.class_name}')">Select</button>
                <button onclick="removeSavedClass('${cls.id}')">Remove</button>
            `;
            savedClassesDiv.appendChild(classDiv);
        });
        
        document.getElementById('join-section').appendChild(savedClassesDiv);
    }
}

/**
 * Select a previously saved class
 * @param {string} classId - The class ID
 * @param {string} classCode - The class code
 * @param {string} className - The class name
 */
async function selectSavedClass(classId, classCode, className) {
    // Student info is already loaded from login, no need to get from inputs
    
    try {
        // Query the database to verify the class still exists
        const classes = await supabaseGet('classes', `id=eq.${classId}`);
        
        if (classes.length === 0) {
            alert('This class no longer exists. Please remove it from your saved classes.');
            return;
        }
        
        // Store class information (student info is already in currentStudent)
        currentClass = classes[0];
        
        // Update UI to show marking section
        document.getElementById('join-section').style.display = 'none';
        document.getElementById('marking-section').style.display = 'block';
        document.getElementById('class-info').textContent = `Joined: ${currentClass.class_name} (Code: ${classCode})`;
        
        // Start listening for marking signals from teacher
        listenForMarkingSignal();
        
    } catch (error) {
        console.error('Error selecting class:', error);
        alert('Error selecting class. Please try again.');
    }
}

/**
 * Remove a class from saved classes
 * @param {string} classId - The class ID to remove
 */
function removeSavedClass(classId) {
    let savedClasses = JSON.parse(localStorage.getItem('savedClasses') || '[]');
    savedClasses = savedClasses.filter(cls => cls.id !== classId);
    localStorage.setItem('savedClasses', JSON.stringify(savedClasses));
    
    // Reload the page to update the UI
    location.reload();
}

/**
 * Join a class using the provided class code
 * Validates the class code exists and stores student information
 * Saves the class to localStorage for future use
 * Note: Student info is already loaded from login
 */
async function joinClass() {
    const classCode = document.getElementById('class-code').value.trim();
    
    // Validate class code is filled
    if (!classCode) {
        alert('Please enter a class code');
        return;
    }
    
    try {
        // Query the database to check if the class code exists
        const classes = await supabaseGet('classes', `class_code=eq.${classCode}`);
        
        if (classes.length === 0) {
            alert('Invalid class code. Please check and try again.');
            return;
        }
        
        // Store class information (student info is already in currentStudent)
        currentClass = classes[0];
        
        // Save class to localStorage if not already saved
        let savedClasses = JSON.parse(localStorage.getItem('savedClasses') || '[]');
        const classExists = savedClasses.some(cls => cls.id === currentClass.id);
        if (!classExists) {
            savedClasses.push({
                id: currentClass.id,
                class_code: currentClass.class_code,
                class_name: currentClass.class_name
            });
            localStorage.setItem('savedClasses', JSON.stringify(savedClasses));
        }
        
        // Update UI to show marking section
        document.getElementById('join-section').style.display = 'none';
        document.getElementById('marking-section').style.display = 'block';
        document.getElementById('class-info').textContent = `Joined: ${currentClass.class_name} (Code: ${classCode})`;
        
        // Start listening for marking signals from teacher
        listenForMarkingSignal();
        
    } catch (error) {
        console.error('Error joining class:', error);
        alert('Error joining class. Please try again.');
    }
}

/**
 * Listen for marking signals using Supabase Realtime
 * Subscribes to changes in the marking_sessions table for the current class
 * When teacher starts marking, the "Mark Me Here" button appears
 */
function listenForMarkingSignal() {
    // Use Supabase Realtime to subscribe to marking_sessions for this class
    // Note: This is a simplified implementation using polling for MVP
    // In production, use Supabase Realtime WebSocket subscriptions
    
    // Start polling for active marking sessions
    pollForMarkingSession();
}

/**
 * Poll the database to check if a marking session has started
 * This is a simplified approach for MVP - in production, use Realtime subscriptions
 */
async function pollForMarkingSession() {
    const pollInterval = 2000; // Poll every 2 seconds
    
    const poll = async () => {
        try {
            // Query for active marking sessions for this class
            const sessions = await supabaseGet(
                'marking_sessions', 
                `class_id=eq.${currentClass.id}&is_active=eq.true`
            );
            
            if (sessions.length > 0) {
                // Active marking session found
                const session = sessions[0];
                markingSessionId = session.id;
                
                // Show the "Mark Me Here" button
                document.getElementById('mark-button').style.display = 'block';
                document.getElementById('status-message').textContent = 'Teacher has started marking! Click the button to mark your attendance.';
                
                // Stop polling once marking session is found
                return;
            }
            
            // Continue polling if no active session
            setTimeout(poll, pollInterval);
            
        } catch (error) {
            console.error('Error polling for marking session:', error);
            setTimeout(poll, pollInterval);
        }
    };
    
    // Start polling
    poll();
}

/**
 * Mark attendance for the student
 * 1. Gets teacher's location from database
 * 2. Gets student's current location
 * 3. Calculates distance between them
 * 4. If within 100m, marks as present, otherwise, error
 */
async function markAttendance() {
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = 'Verifying location...';
    
    try {
        // Get teacher's location from the active marking session
        const sessions = await supabaseGet(
            'marking_sessions',
            `id=eq.${markingSessionId}`
        );
        
        if (sessions.length === 0) {
            statusMessage.textContent = 'Error: Marking session not found. Please wait for teacher to start marking.';
            return;
        }
        
        const session = sessions[0];
        
        // Check if teacher location is available
        if (session.teacher_lat === null || session.teacher_lng === null) {
            statusMessage.textContent = 'Error: Teacher location not available. Please try again.';
            return;
        }
        
        // Get student's current location (not stored)
        const studentLocation = await getCurrentLocation();
        
        // Calculate distance between student and teacher
        const distance = calculateDistance(
            studentLocation.lat,
            studentLocation.lng,
            session.teacher_lat,
            session.teacher_lng
        );
        
        // Check if student is within 100 meters of teacher
        const MAX_DISTANCE = 100; // 100 meters
        
        if (distance <= MAX_DISTANCE) {
            // Student is within range - mark as present
            await recordAttendance('present');
            statusMessage.textContent = '✓ Attendance marked successfully! You are present.';
            document.getElementById('mark-button').style.display = 'none';
        } else {
            // Student is outside range - show error and allow retry
            statusMessage.textContent = `✗ You are ${Math.round(distance)}m away from the classroom. Please move closer and try again.`;
        }
        
    } catch (error) {
        console.error('Error marking attendance:', error);
        statusMessage.textContent = `Error: ${error.message}. Please try again.`;
    }
}

/**
 * Record attendance status in the database
 * Only stores the status (present/absent), not the location
 * Also records the student as enrolled in the class
 * 
 * @param {string} status - Either 'present' or 'absent'
 */
async function recordAttendance(status) {
    try {
        // Insert attendance record into database
        await supabasePost('attendance_records', {
            class_id: currentClass.id,
            session_id: markingSessionId,
            student_name: currentStudent.name,
            student_id: currentStudent.id,
            status: status
        });
        
        // Record student enrollment in the class (if not already enrolled)
        const existingEnrollments = await supabaseGet(
            'enrollments',
            `class_id=eq.${currentClass.id}&student_id=eq.${currentStudent.id}`
        );
        
        if (existingEnrollments.length === 0) {
            await supabasePost('enrollments', {
                class_id: currentClass.id,
                student_name: currentStudent.name,
                student_id: currentStudent.id
            });
        }
        
        console.log(`Attendance recorded: ${status}`);
        
    } catch (error) {
        console.error('Error recording attendance:', error);
        throw error;
    }
}
