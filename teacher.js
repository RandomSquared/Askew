/*
 * Teacher Interface Logic - Attendance System
 * 
 * This file handles all teacher-side functionality:
 * - Teacher login with simple password verification
 * - Creating classes with random code generation
 * - Starting marking sessions with teacher location
 * - Monitoring student attendance in real-time
 * - Closing marking and calculating statistics
 * - Privacy protection: teacher location is wiped after marking closes
 * 
 * Dependencies: shared.js (for API helpers and location calculation)
 */

// Global variables to store teacher and session information
let currentTeacher = null; // Stores teacher name and ID
let currentSessionId = null; // ID of the active marking session
let attendancePollInterval = null; // Interval for polling attendance updates

// Check teacher login on page load
window.addEventListener('DOMContentLoaded', checkTeacherLogin);

/**
 * Check if teacher is logged in on page load
 * Redirect to login page if not authenticated
 * Display teacher information and load dashboard if logged in
 */
function checkTeacherLogin() {
    const savedTeacher = localStorage.getItem('currentTeacher');
    
    if (!savedTeacher) {
        // Teacher is not logged in, redirect to login page
        alert('Please login first');
        window.location.href = 'login.html?type=teacher-login';
        return;
    }
    
    // Parse and store teacher information
    currentTeacher = JSON.parse(savedTeacher);
    
    // Display teacher information on the page
    document.getElementById('teacher-info').textContent = 
        `Logged in as: ${currentTeacher.name} (${currentTeacher.teacher_id})`;
    
    // Display welcome message
    document.getElementById('welcome-message').textContent = `Welcome, ${currentTeacher.name}!`;
    
    // Load teacher's classes
    loadClasses();
}

/**
 * Logout the current teacher
 * Clear teacher data from localStorage and redirect to main menu
 */
function logout() {
    // Clear teacher data from localStorage
    localStorage.removeItem('currentTeacher');
    
    // Redirect to main menu
    window.location.href = 'index.html';
}

/**
 * Load all classes belonging to the current teacher
 * Populates the class selection dropdown
 */
async function loadClasses() {
    try {
        // Query for classes belonging to this teacher
        const classes = await supabaseGet(
            'classes',
            `teacher_id=eq.${currentTeacher.teacher_id}`
        );
        
        // Clear existing options
        const classSelect = document.getElementById('class-select');
        classSelect.innerHTML = '<option value="">Select a class</option>';
        
        // Add each class to the dropdown
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = `${cls.class_name} (${cls.class_code})`;
            classSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

/**
 * Load enrolled students for the selected class
 * Displays list of students who have joined the class
 */
async function loadEnrolledStudents() {
    const classId = document.getElementById('class-select').value;
    
    if (!classId) {
        document.getElementById('enrolled-students').style.display = 'none';
        return;
    }
    
    try {
        // Query for enrolled students in this class
        const enrollments = await supabaseGet(
            'enrollments',
            `class_id=eq.${classId}`
        );
        
        // Update UI with enrolled students
        const enrolledList = document.getElementById('enrolled-list');
        enrolledList.innerHTML = '';
        
        if (enrollments.length === 0) {
            enrolledList.innerHTML = '<li>No students enrolled yet</li>';
        } else {
            enrollments.forEach(enrollment => {
                const li = document.createElement('li');
                li.textContent = `${enrollment.student_name} (${enrollment.student_id})`;
                enrolledList.appendChild(li);
            });
        }
        
        document.getElementById('enrolled-students').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading enrolled students:', error);
    }
}

/**
 * Create a new class with a random 6-character code
 * Stores the class in the database and displays the code to the teacher
 */
async function createClass() {
    const className = document.getElementById('class-name').value.trim();
    
    // Validate class name is provided
    if (!className) {
        alert('Please enter a class name');
        return;
    }
    
    try {
        // Generate a random 6-character class code
        const classCode = generateRandomCode();
        
        // Check if the code already exists (unlikely but possible)
        const existingClasses = await supabaseGet('classes', `class_code=eq.${classCode}`);
        if (existingClasses.length > 0) {
            // Regenerate if collision occurs
            return createClass();
        }
        
        // Insert the new class into the database
        const newClass = await supabasePost('classes', {
            class_code: classCode,
            teacher_id: currentTeacher.teacher_id,
            class_name: className,
            is_active: true
        });
        
        // Display the generated class code to the teacher
        document.getElementById('class-code-display').textContent = 
            `Class created! Share this code with students: ${classCode}`;
        
        // Clear the class name input
        document.getElementById('class-name').value = '';
        
        // Reload the class list to include the new class
        loadClasses();
        
    } catch (error) {
        console.error('Error creating class:', error);
        alert('Error creating class. Please try again.');
    }
}

/**
 * Begin a marking session for the selected class
 * 1. Gets teacher's current location
 * 2. Creates a marking session with teacher location
 * 3. Signals students to start marking attendance
 * 4. Starts monitoring for student responses
 */
async function beginMarking() {
    const classId = document.getElementById('class-select').value;
    
    // Validate a class is selected
    if (!classId) {
        alert('Please select a class');
        return;
    }
    
    try {
        // Get teacher's current location
        const teacherLocation = await getCurrentLocation();
        
        // Create a new marking session with teacher location
        const session = await supabasePost('marking_sessions', {
            class_id: classId,
            teacher_lat: teacherLocation.lat,
            teacher_lng: teacherLocation.lng,
            is_active: true
        });
        
        // Store the session ID
        currentSessionId = session[0].id;
        
        // Update UI to show marking is active
        document.getElementById('close-marking-button').style.display = 'block';
        document.getElementById('attendance-stats').style.display = 'block';
        
        // Start monitoring for student attendance
        monitorAttendance();
        
        alert('Marking session started! Students can now mark their attendance.');
        
    } catch (error) {
        console.error('Error beginning marking:', error);
        alert('Error beginning marking. Please try again.');
    }
}

/**
 * Monitor student attendance in real-time
 * Polls the database for new attendance records
 * Updates the UI with present/absent counts
 */
function monitorAttendance() {
    const pollInterval = 2000; // Poll every 2 seconds
    
    const poll = async () => {
        try {
            // Query for attendance records for this session
            const records = await supabaseGet(
                'attendance_records',
                `session_id=eq.${currentSessionId}`
            );
            
            // Calculate present and absent counts
            const presentCount = records.filter(r => r.status === 'present').length;
            const absentCount = records.filter(r => r.status === 'absent').length;
            
            // Update UI with counts
            document.getElementById('present-count').textContent = presentCount;
            document.getElementById('absent-count').textContent = absentCount;
            
            // Update attendance list
            const attendanceList = document.getElementById('attendance-list');
            attendanceList.innerHTML = '';
            
            records.forEach(record => {
                const li = document.createElement('li');
                li.textContent = `${record.student_name} (${record.student_id}): ${record.status}`;
                attendanceList.appendChild(li);
            });
            
        } catch (error) {
            console.error('Error monitoring attendance:', error);
        }
    };
    
    // Start polling
    attendancePollInterval = setInterval(poll, pollInterval);
}

/**
 * Close the current marking session
 * 1. Wipes teacher location from database (privacy protection)
 * 2. Sets marking session as inactive
 * 3. Calculates absentees (enrolled students who didn't mark)
 * 4. Creates absent records for unmarked students
 * 5. Displays final statistics
 */
async function closeMarking() {
    if (!currentSessionId) {
        return;
    }
    
    try {
        // Stop monitoring attendance
        if (attendancePollInterval) {
            clearInterval(attendancePollInterval);
            attendancePollInterval = null;
        }
        
        // Get the class ID for this session
        const sessions = await supabaseGet('marking_sessions', `id=eq.${currentSessionId}`);
        const classId = sessions[0].class_id;
        
        // Get all enrolled students for this class
        const enrollments = await supabaseGet('enrollments', `class_id=eq.${classId}`);
        const enrolledStudentIds = new Set(enrollments.map(e => e.student_id));
        
        // Get all attendance records for this session
        const records = await supabaseGet('attendance_records', `session_id=eq.${currentSessionId}`);
        const markedStudentIds = new Set(records.map(r => r.student_id));
        
        // Find enrolled students who didn't mark attendance (absent)
        const absentStudentIds = [...enrolledStudentIds].filter(id => !markedStudentIds.has(id));
        
        // Create absent records for unmarked students
        for (const studentId of absentStudentIds) {
            const enrollment = enrollments.find(e => e.student_id === studentId);
            await supabasePost('attendance_records', {
                class_id: classId,
                session_id: currentSessionId,
                student_name: enrollment.student_name,
                student_id: enrollment.student_id,
                status: 'absent'
            });
        }
        
        // Get all attendance records again (including newly created absent records)
        const allRecords = await supabaseGet('attendance_records', `session_id=eq.${currentSessionId}`);
        
        // Wipe teacher location for privacy (set to null)
        await supabasePatch('marking_sessions', `id=eq.${currentSessionId}`, {
            teacher_lat: null,
            teacher_lng: null,
            is_active: false
        });
        
        // Update UI
        document.getElementById('close-marking-button').style.display = 'none';
        
        // Display final statistics
        const presentCount = allRecords.filter(r => r.status === 'present').length;
        const absentCount = allRecords.filter(r => r.status === 'absent').length;
        
        alert(`Marking session closed!\n\nFinal Statistics:\nPresent: ${presentCount}\nAbsent: ${absentCount}`);
        
        // Reset session ID
        currentSessionId = null;
        
        // Reload enrolled students to update the list
        loadEnrolledStudents();
        
    } catch (error) {
        console.error('Error closing marking:', error);
        alert('Error closing marking. Please try again.');
    }
}
