// ValgACE Dashboard Configuration
// Moonraker API and WebSocket address configuration

const ACE_DASHBOARD_CONFIG = {
    // Moonraker API address
    // Default is the current host, but you can specify explicitly
    // Examples:
    // apiBase: 'http://localhost:7125',
    // apiBase: 'http://10.11.88.30:7125',
    // apiBase: 'https://moonraker.example.com',
    apiBase: window.location.origin,
    
    // WebSocket address
    // By default, it is automatically determined based on apiBase
    // Examples:
    // wsBase: 'ws://localhost:7125',
    // wsBase: 'wss://moonraker.example.com',
    wsBase: null, // null = automatic detection
    
    // Automatic status refresh interval (in milliseconds)
    // Default: 5000 (5 seconds)
    autoRefreshInterval: 5000,
    
    // WebSocket reconnection timeout (in milliseconds)
    // Default: 3000 (3 seconds)
    wsReconnectTimeout: 3000,
    
    // Enable debug messages in the console
    // Set to true to debug status loading issues
    debug: false,
    
    // Default settings for commands
    defaults: {
        feedLength: 50,      // Default feed length (mm)
        feedSpeed: 25,       // Default feed speed (mm/s)
        retractLength: 50,   // Default retract length (mm)
        retractSpeed: 25,    // Default retract speed (mm/s)
        dryingTemp: 50,      // Default drying temperature (°C)
        dryingDuration: 240  // Default drying duration (minutes)
    }
};

// Function to get the WebSocket address
function getWebSocketUrl() {
    if (ACE_DASHBOARD_CONFIG.wsBase) {
        return ACE_DASHBOARD_CONFIG.wsBase;
    }
    
    // Automatic detection based on apiBase
    const apiBase = ACE_DASHBOARD_CONFIG.apiBase;
    if (apiBase.startsWith('https://')) {
        return apiBase.replace('https://', 'wss://') + '/websocket';
    } else if (apiBase.startsWith('http://')) {
        return apiBase.replace('http://', 'ws://') + '/websocket';
    } else {
        // Fallback to current host
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/websocket`;
    }
}

// Export configuration (for use in other files)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ACE_DASHBOARD_CONFIG, getWebSocketUrl };
}