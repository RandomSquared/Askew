/*
 * Main Menu
 * 
 * This file handles functionality for the main menu page (index.html)
 * Implements automatic drifting tilt effect that changes direction periodically
 * 
 * Dependencies: None
 */

// Initialize the main menu page
window.addEventListener('DOMContentLoaded', initializeMainMenu);

// Global variables for tilt effect
let tiltContent = null;
let currentTilt = 0; // Current tilt angle in degrees
let tiltVelocity = 0; // Rate of tilt change per frame
let maxTiltAngle = 30; // Maximum tilt in degrees
let velocityChangeInterval = null;
let animationFrameId = null;

/**
 * Initialize the main menu page
 */
function initializeMainMenu() {
    console.log('Main menu initialized');

    // Check for existing login sessions and auto-redirect
    checkForExistingSession();

    // Initialize dark mode
    initializeDarkMode();

    tiltContent = document.getElementById('tiltable-content');

    if (!tiltContent) {
        console.error('Tiltable content element not found');
        return;
    }

    // Start the tilt effect
    startTiltEffect();
}

/**
 * Check for existing login sessions in localStorage and auto-redirect
 */
function checkForExistingSession() {
    const savedStudent = localStorage.getItem('currentStudent');
    const savedTeacher = localStorage.getItem('currentTeacher');
    
    // Priority: student first, then teacher
    if (savedStudent) {
        console.log('Found existing student session, redirecting to student dashboard');
        window.location.href = 'student.html';
        return;
    }
    
    if (savedTeacher) {
        console.log('Found existing teacher session, redirecting to teacher dashboard');
        window.location.href = 'teacher.html';
        return;
    }
    
    console.log('No existing session found, staying on main menu');
}

/**
 * Start the automatic drifting tilt effect
 */
function startTiltEffect() {
    // Change velocity every 5 seconds
    velocityChangeInterval = setInterval(changeTiltVelocity, 1000);

    // Start the animation loop
    animateTilt();
}

/**
 * Change the tilt velocity randomly
 * Adds or removes a small amount of velocity to change direction
 */
function changeTiltVelocity() {
    
    // Add a small amount of velocity
    const velocityChange = ((Math.random() * 2 - 1) * 0.0015 + 0.0015);
    
    tiltVelocity += velocityChange;

    // Clamp velocity to prevent it from getting too fast
    tiltVelocity = Math.max(-0.07, Math.min(0.07, tiltVelocity));

    console.log('Tilt velocity changed:', tiltVelocity);
}

/**
 * Animation loop for smooth tilting
 */
function animateTilt() {
    // Update current tilt based on velocity
    currentTilt += tiltVelocity;

    // Clamp tilt to maximum angle
    currentTilt = Math.max(-maxTiltAngle, Math.min(maxTiltAngle, currentTilt));

    // Apply tilt to the content
    tiltContent.style.transform = `rotate(${currentTilt}deg)`;

    // Continue animation loop
    animationFrameId = requestAnimationFrame(animateTilt);
}

/**
 * Initialize dark mode from localStorage
 */
function initializeDarkMode() {
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedDarkMode === 'true') {
        document.documentElement.classList.add('dark-mode');
        updateDarkModeIcon(true);
    } else {
        updateDarkModeIcon(false);
    }
}

/**
 * Toggle dark mode on/off
 */
function toggleDarkMode() {
    const isDarkMode = document.documentElement.classList.toggle('dark-mode');
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode);
    
    // Update icon
    updateDarkModeIcon(isDarkMode);
}

/**
 * Update the dark mode icon (moon/sun)
 */
function updateDarkModeIcon(isDarkMode) {
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    
    if (moonIcon && sunIcon) {
        if (isDarkMode) {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        }
    }
}
