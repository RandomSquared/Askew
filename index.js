/*
 * Main Menu Logic - Attendance System
 * 
 * This file handles functionality for the main menu page (index.html)
 * Currently serves as a placeholder for future main menu features
 * 
 * Dependencies: None (can be extended as needed)
 */

// Initialize the main menu page
window.addEventListener('DOMContentLoaded', initializeMainMenu);

/**
 * Initialize the main menu page
 * Can be extended to add functionality such as:
 * - Checking for existing sessions
 * - Displaying welcome messages
 * - Loading user preferences
 */
function initializeMainMenu() {
    // Future initialization logic can be added here
    console.log('Main menu initialized');

    // Set button colors for main menu buttons
    document.getElementById('btn-student-login').style.backgroundColor = 'var(--background-color-1)';
    document.getElementById('btn-student-signup').style.backgroundColor = 'var(--background-color-1)';
    document.getElementById('btn-teacher-login').style.backgroundColor = 'var(--background-color-1)';
    document.getElementById('btn-student-login').style.color = 'var(--text-color-bg-1)';
    document.getElementById('btn-student-signup').style.color = 'var(--text-color-bg-1)';
    document.getElementById('btn-teacher-login').style.color = 'var(--text-color-bg-1)';
}
