/*
 * Shared functions - Askew
 * 
 * This file contains shared utility functions used by both student and teacher interfaces.
 * Functions include:
 * - Supabase API helpers for database operations
 * - Location calculation using Haversine formula
 * - Random code generation
 * 
 * Dependencies: None (uses browser APIs and fetch)
 */

// Supabase configuration
const SUPABASE_URL = 'https://ajzvuilyjuhxcyugjazr.supabase.co';
const SUPABASE_REST_URL = 'https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqenZ1aWx5anVoeGN5dWdqYXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTM3NzYsImV4cCI6MjA5NDAyOTc3Nn0.QJJ-re0UGlmCiIH1fOgUSbWXCLi0IkvIbAUNDysEEF8';

// Initialize Supabase Auth client (will be initialized after library loads)
// Use window.supabaseAuth to avoid conflict with CDN global
let supabaseAuth = null;

// Set up REST API fallback immediately (always available)
const restApiAuth = {
    auth: {
        signUp: async ({ email, password, options }) => {
            console.log('Using REST API for signup');
            const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, options: { data: options?.data } })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return { data: { user: data.user, session: data.session }, error: null };
        },
        signInWithPassword: async ({ email, password }) => {
            console.log('Using REST API for login');
            const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return { data: { user: data.user, session: data.session }, error: null };
        },
        signOut: async () => {
            localStorage.removeItem('supabase-auth-token');
            return { error: null };
        },
        getSession: async () => {
            const token = localStorage.getItem('supabase-auth-token');
            if (!token) return { data: { session: null }, error: null };
            
            // Try to get user info from Supabase Auth API using the token
            try {
                const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                    method: 'GET',
                    headers: {
                        'apikey': SUPABASE_KEY,
                            'Content-Type': 'application/json'
                    }
                });
                const user = await response.json();
                if (user.error) {
                    // If token is invalid, clear it and return null session
                    localStorage.removeItem('supabase-auth-token');
                    return { data: { session: null }, error: null };
                }
                return { data: { session: { access_token: token, user: user } }, error: null };
            } catch (error) {
                // Fallback to simple session if API call fails
                return { data: { session: { access_token: token, user: { id: 'fallback' } } }, error: null };
            }
        },
    }
};

function initializeSupabaseAuth() {
    console.log('Attempting to initialize Supabase Auth client...');
    console.log('window.supabase available:', typeof window.supabase);
    
    // Always use REST API fallback for reliability
    supabaseAuth = restApiAuth;
    console.log('Using REST API fallback for authentication');
    
    // Try to use CDN if available, but fallback to REST API
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        try {
            const cdnClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('Supabase CDN client available, but using REST API for reliability');
            // Keep using REST API for now
        } catch (error) {
            console.error('Error creating Supabase client:', error);
        }
    }
    
    console.log('Supabase client final state:', supabaseAuth ? 'available' : 'null');
}

/**
 * Generic function to make GET requests to Supabase
 * @param {string} table - The table name to query
 * @param {string} filters - Optional filters for the query (e.g., 'class_code=eq.ABC123')
 * @returns {Promise<Array>} - Array of results from the query
 */
async function supabaseGet(table, filters = '') {
    const url = `${SUPABASE_REST_URL}${table}?${filters}`;
    const headers = {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, {
        method: 'GET',
        headers: headers
    });
    
    if (!response.ok) {
        throw new Error(`GET request failed: ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * Generic function to make POST requests to Supabase
 * @param {string} table - The table name to insert into
 * @param {Object} data - The data to insert
 * @returns {Promise<Object>} - The inserted record
 */
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

/**
 * Generic function to make PATCH requests to Supabase
 * @param {string} table - The table name to update
 * @param {string} filters - Filters to identify which records to update
 * @param {Object} data - The data to update
 * @returns {Promise<Object>} - The updated record(s)
 */
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

/**
 * Calculate distance between two coordinates using Haversine formula
 * This formula calculates the great-circle distance between two points on a sphere
 * given their longitudes and latitudes.
 * 
 * @param {number} lat1 - Latitude of first point in decimal degrees
 * @param {number} lon1 - Longitude of first point in decimal degrees
 * @param {number} lat2 - Latitude of second point in decimal degrees
 * @param {number} lon2 - Longitude of second point in decimal degrees
 * @returns {number} - Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180; // Convert latitude to radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    // Haversine formula
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in meters
}

/**
 * Generate a random 6-character alphanumeric code
 * Used for generating class codes
 * 
 * @returns {string} - Random 6-character code
 */
function generateRandomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

/**
 * Get current user's location using browser Geolocation API
 * Returns a promise that resolves to the location coordinates
 * 
 * @returns {Promise<Object>} - Object with latitude and longitude
 */
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                reject(new Error(`Geolocation error: ${error.message}`));
            },
            {
                enableHighAccuracy: true, // Request high accuracy for better location data
                timeout: 10000, // 10 second timeout
                maximumAge: 0 // Don't use cached location
            }
        );
    });
}

/**
 * Initialize dark mode from localStorage
 * Call this on page load to apply saved dark mode preference
 */
function initializeDarkMode() {
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedDarkMode === 'true') {
        document.documentElement.classList.add('dark-mode');
    }
}
