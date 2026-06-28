/*
 * Teacher Dashboard
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
let currentTeacher = null; 
let currentSessionId = null; 
let attendancePollInterval = null; 
// Check teacher login on page load
window.addEventListener('DOMContentLoaded', checkTeacherLogin);

/**
 * Check if teacher is logged in on page load
 * Redirect to login page if not authenticated
 * Display teacher information and load dashboard if logged in
 */
function checkTeacherLogin() {
    console.log('Checking teacher login...');
    
    const savedTeacher = localStorage.getItem('currentTeacher');
    console.log('Saved teacher from localStorage:', savedTeacher);
    
    if (!savedTeacher) {
        // Teacher is not logged in, redirect to login page
        console.error('No teacher found in localStorage');
        alert('Please login first');
        window.location.href = 'login.html?type=teacher-login';
        return;
    }
    
    try {
        // Parse and store teacher information
        currentTeacher = JSON.parse(savedTeacher);
        console.log('Parsed teacher data:', currentTeacher);
        
        // Display teacher information on the page
        const teacherInfo = document.getElementById('teacher-info');
        if (teacherInfo) {
            teacherInfo.textContent = `Logged in as: ${currentTeacher.name} (${currentTeacher.teacher_id})`;
        }
        
        // Display welcome message
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Welcome, ${currentTeacher.name}!`;
        }
        
        // Load teacher's classes
        loadClasses();
    } catch (error) {
        console.error('Error parsing teacher data:', error);
        alert('Error loading teacher data. Please login again.');
        localStorage.removeItem('currentTeacher');
        window.location.href = 'login.html?type=teacher-login';
    }
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
    console.log('Loading classes for teacher:', currentTeacher);
    
    if (!currentTeacher || !currentTeacher.teacher_id) {
        console.error('No teacher or teacher_id found');
        return;
    }
    
    try {
        // Use direct REST API to get teacher's classes
        const url = `https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/classes?teacher_id=eq.${currentTeacher.teacher_id}`;
        console.log('Fetching classes from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const classes = await response.json();
        console.log('Classes loaded:', classes);
        
        // Clear existing options
        const classSelect = document.getElementById('class-select');
        if (!classSelect) {
            console.error('class-select element not found');
            return;
        }
        classSelect.innerHTML = '<option value="">Select a class</option>';
        
        // Add each class to the dropdown
        if (Array.isArray(classes)) {
            if (classes.length === 0) {
                console.log('No classes found for teacher');
                const option = document.createElement('option');
                option.textContent = 'No classes found';
                option.disabled = true;
                classSelect.appendChild(option);
            } else {
                classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.id;
                    option.textContent = `${cls.class_name} (${cls.class_code})`;
                    classSelect.appendChild(option);
                });
            }
        } else {
            console.error('Classes response is not an array:', classes);
        }
        
    } catch (error) {
        console.error('Error loading classes:', error);
        alert('Error loading classes: ' + error.message);
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
        // Use direct REST API to get class enrollments
        const response = await fetch(`https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/enrollments?class_id=eq.${classId}`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        const enrollments = await response.json();
        
        // Update UI with enrolled students
        const enrolledList = document.getElementById('enrolled-list');
        enrolledList.innerHTML = '';
        
        if (!Array.isArray(enrollments) || enrollments.length === 0) {
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
    console.log('createClass() called');
    console.log('Current teacher:', currentTeacher);
    
    const className = document.getElementById('class-name').value.trim();
    console.log('Class name entered:', className);
    
    // Validate class name is provided
    if (!className) {
        alert('Please enter a class name');
        return;
    }
    
    if (!currentTeacher || !currentTeacher.teacher_id) {
        console.error('No teacher or teacher_id found');
        alert('Teacher not logged in properly');
        return;
    }
    
    try {
        // Generate a random 6-character class code
        let classCode = generateRandomCode();
        console.log('Generated class code:', classCode);
        
        let attempts = 0;
        const maxAttempts = 5;
        
        // Check if the code already exists (unlikely but possible)
        while (attempts < maxAttempts) {
            const checkUrl = `https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/classes?class_code=eq.${classCode}`;
            console.log('Checking if code exists:', checkUrl);
            
            const response = await fetch(checkUrl, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                }
            });
            
            const existingClasses = await response.json();
            console.log('Existing classes with this code:', existingClasses);
            
            if (!Array.isArray(existingClasses) || existingClasses.length === 0) {
                // Code doesn't exist, use it
                console.log('Code is available:', classCode);
                break;
            }
            
            // Code exists, generate a new one
            classCode = generateRandomCode();
            attempts++;
        }
        
        // Create the class using direct REST API
        const createUrl = 'https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/classes';
        console.log('Creating class at:', createUrl);
        
        const classData = {
            class_code: classCode,
            teacher_id: currentTeacher.teacher_id,
            class_name: className,
            is_active: true
        };
        console.log('Class data:', classData);
        
        const createResponse = await fetch(createUrl, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(classData)
        });
        
        console.log('Create response status:', createResponse.status);
        
        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error('Create class error:', errorText);
            throw new Error(`Failed to create class: ${errorText}`);
        }
        
        const result = await createResponse.json();
        console.log('Class created successfully:', result);
        
        // Display the generated class code to the teacher
        const displayElement = document.getElementById('class-code-display');
        if (displayElement) {
            displayElement.textContent = `Class created! Share this code with students: ${classCode}`;
        }
        
        // Clear the class name input
        document.getElementById('class-name').value = '';
        
        // Reload the class list to include the new class
        loadClasses();
        
    } catch (error) {
        console.error('Error creating class:', error);
        alert('Error creating class: ' + error.message);
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
    console.log('beginMarking() called');
    
    const classId = document.getElementById('class-select').value;
    console.log('Selected class ID:', classId);
    
    // Validate a class is selected
    if (!classId) {
        alert('Please select a class');
        return;
    }
    
    try {
        // Disable the button to prevent multiple clicks
        const beginButton = document.querySelector('button[onclick="beginMarking()"]');
        if (beginButton) {
            beginButton.disabled = true;
            beginButton.textContent = 'Starting...';
        }
        
        console.log('Getting teacher location...');
        // Get teacher's current location
        const teacherLocation = await getCurrentLocation();
        console.log('Teacher location obtained:', teacherLocation);
        
        // Create a marking session using direct REST API
        const response = await fetch('https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/marking_sessions', {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                class_id: classId,
                teacher_lat: teacherLocation.lat,
                teacher_lng: teacherLocation.lng,
                is_active: true
            })
        });
        
        const sessions = await response.json();
        console.log('Marking session response:', sessions);
        
        if (!Array.isArray(sessions) || sessions.length === 0) {
            throw new Error('Failed to create marking session');
        }
        
        // Store the session ID
        currentSessionId = sessions[0].id;
        console.log('Session ID stored:', currentSessionId);
        
        // Update UI to show marking is active
        document.getElementById('close-marking-button').style.display = 'block';
        document.getElementById('attendance-stats').style.display = 'block';
        
        // Start monitoring for student attendance
        monitorAttendance();
        
        alert('Marking session started! Students can now mark their attendance.');
        
    } catch (error) {
        console.error('Error beginning marking:', error);
        alert('Error beginning marking. Please try again.');
        
        // Re-enable button on error
        const beginButton = document.querySelector('button[onclick="beginMarking()"]');
        if (beginButton) {
            beginButton.disabled = false;
            beginButton.textContent = 'Begin Marking';
        }
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
            // Use direct REST API to get attendance records for this session
            const response = await fetch(`https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/attendance_records?session_id=eq.${currentSessionId}`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                }
            });
            
            const records = await response.json();
            
            if (!Array.isArray(records)) {
                return;
            }
            
            // Calculate present and absent counts
            const presentCount = records.filter(r => r.status === 'present').length;
            
            // Update UI with counts
            document.getElementById('present-count').textContent = presentCount;
            
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
        
        // Get all attendance records for this session using direct REST API
        const attendanceResponse = await fetch(`https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/attendance_records?session_id=eq.${currentSessionId}`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        const records = await attendanceResponse.json();
        const allRecords = Array.isArray(records) ? records : [];
        
        // Get the class ID from the current session (from previous data or stored)
        const classId = document.getElementById('class-select').value;
        
        // Get all enrolled students for this class using direct REST API
        const enrollmentResponse = await fetch(`https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/enrollments?class_id=eq.${classId}`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        const enrollments = await enrollmentResponse.json();
        const enrolledStudentIds = new Set(Array.isArray(enrollments) ? enrollments.map(e => e.student_id) : []);
        
        const markedStudentIds = new Set(allRecords.map(r => r.student_id));
        
        // Find enrolled students who didn't mark attendance (absent)
        const absentStudentIds = [...enrolledStudentIds].filter(id => !markedStudentIds.has(id));
        
        // Create absent records for unmarked students using direct REST API
        for (const studentId of absentStudentIds) {
            const enrollment = enrollments.find(e => e.student_id === studentId);
            if (enrollment) {
                try {
                    await fetch('https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/attendance_records', {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            class_id: classId,
                            session_id: currentSessionId,
                            student_name: enrollment.student_name,
                            student_id: enrollment.student_id,
                            status: 'absent'
                        })
                    });
                } catch (e) {
                    console.warn('Could not create absent record for:', studentId, e);
                }
            }
        }
        
        // Close marking session by wiping teacher location for privacy using direct REST API
        await fetch(`https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/marking_sessions?id=eq.${currentSessionId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                teacher_lat: null,
                teacher_lng: null,
                is_active: false
            })
        });
        
        // Update UI
        document.getElementById('close-marking-button').style.display = 'none';
        
        // Re-enable the Begin Marking button
        const beginButton = document.querySelector('button[onclick="beginMarking()"]');
        if (beginButton) {
            beginButton.disabled = false;
            beginButton.textContent = 'Begin Marking';
        }
        
        // Display final statistics
        const presentCount = allRecords.filter(r => r.status === 'present').length;
        const absentCount = absentStudentIds.length;
        
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
