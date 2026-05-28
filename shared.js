/*
 * Shared Utilities - Attendance System
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
const SUPABASE_URL = 'https://ajzvuilyjuhxcyugjazr.supabase.co/rest/v1/';
const SUPABASE_KEY = 'sb_publishable_ORuEPdmhFETjCeGmj_CS5Q_nKRsgn5N';

/**
 * Generic function to make GET requests to Supabase
 * @param {string} table - The table name to query
 * @param {string} filters - Optional filters for the query (e.g., 'class_code=eq.ABC123')
 * @returns {Promise<Array>} - Array of results from the query
 */
async function supabaseGet(table, filters = '') {
    const url = `${SUPABASE_URL}${table}?${filters}`;
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

/**
 * Generic function to make POST requests to Supabase
 * @param {string} table - The table name to insert into
 * @param {Object} data - The data to insert
 * @returns {Promise<Object>} - The inserted record
 */
async function supabasePost(table, data) {
    const url = `${SUPABASE_URL}${table}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
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
    const url = `${SUPABASE_URL}${table}?${filters}`;
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
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
