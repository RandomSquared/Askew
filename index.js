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
    // Randomly decide to add or remove velocity
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    // Add a small amount of velocity (between 0.05 and 0.15 degrees per frame)
    const velocityChange = ((Math.random() * 2 - 1) * 0.002 + 0.002) * direction;
    
    tiltVelocity += velocityChange;

    // Clamp velocity to prevent it from getting too fast
    tiltVelocity = Math.max(-0.01, Math.min(0.01, tiltVelocity));

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
