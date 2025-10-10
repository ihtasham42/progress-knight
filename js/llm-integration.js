/**
 * LLM Integration Setup - Add this to your main game
 */

// Set up logging
var logger;
if (typeof log !== 'undefined' && log.noConflict) {
    logger = log.noConflict();
} else if (typeof log !== 'undefined') {
    logger = log;
} else {
    // Fallback to console if loglevel is not available
    logger = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
        setLevel: function() {}
    };
}
logger.setLevel('warn'); // Only show warnings and errors in production

// Global variables for LLM integration
let mistralAPI;
let storyManager;
let storyAdventureUI;
let storyAdventureManager;

// Initialize LLM integration
function initializeLLMIntegration() {
    // Wait for classes to be loaded
    if (typeof MistralAPI === 'undefined' || typeof CharacterEncoder === 'undefined' || 
        typeof StoryManager === 'undefined' || typeof AdventureSystem === 'undefined') {
        logger.debug('LLM classes not loaded yet, retrying...');
        setTimeout(initializeLLMIntegration, 100);
        return;
    }
    
    // Create API instance
    mistralAPI = new MistralAPI();
    
    // Load saved API key
    const savedApiKey = localStorage.getItem('mistralApiKey');
    if (savedApiKey) {
        mistralAPI.apiKey = savedApiKey;
        const apiKeyInput = document.getElementById('mistralApiKey');
        if (apiKeyInput) {
            apiKeyInput.value = savedApiKey;
        }
    }
    
    // Create story manager
    storyManager = new StoryManager();
    
    // Note: AdventureSystem is now initialized in amulet-adventure-integration.js
    // This keeps the old system compatible while the new system handles adventures
    
    // Make them globally available
    window.storyManager = storyManager;
    window.mistralAPI = mistralAPI;
    
    logger.info('LLM integration initialized successfully');
}

// API Key configuration
function setupAPIKeyConfiguration() {
    const apiKeyInput = document.getElementById('mistralApiKey');
    if (apiKeyInput) {
        // Remove any existing listeners
        const newInput = apiKeyInput.cloneNode(true);
        apiKeyInput.parentNode.replaceChild(newInput, apiKeyInput);
        
        // Add both input and change event listeners
        newInput.addEventListener('input', (e) => {
            const apiKey = e.target.value.trim();
            if (apiKey && typeof mistralAPI !== 'undefined') {
                mistralAPI.apiKey = apiKey;
                localStorage.setItem('mistralApiKey', apiKey);
                logger.info('Mistral API key saved via input event');
            }
        });
        
        newInput.addEventListener('change', (e) => {
            const apiKey = e.target.value.trim();
            if (apiKey && typeof mistralAPI !== 'undefined') {
                mistralAPI.apiKey = apiKey;
                localStorage.setItem('mistralApiKey', apiKey);
                logger.info('Mistral API key saved via change event');
            }
        });
        
        // Also set up a periodic check for the API key
        const checkAPIKey = () => {
            if (newInput.value.trim() && typeof mistralAPI !== 'undefined' && !mistralAPI.apiKey) {
                const apiKey = newInput.value.trim();
                mistralAPI.apiKey = apiKey;
                localStorage.setItem('mistralApiKey', apiKey);
                logger.info('Mistral API key saved via periodic check');
            }
        };
        
        // Check every 500ms for the first 10 seconds
        let checkCount = 0;
        const checkInterval = setInterval(() => {
            checkAPIKey();
            checkCount++;
            if (checkCount >= 20) { // 10 seconds
                clearInterval(checkInterval);
            }
        }, 500);
        
        logger.info('API key configuration set up with enhanced event handling');
    } else {
        logger.warn('API key input element not found');
    }
}

// Tab functionality is now handled in HTML

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for game to be initialized
    setTimeout(() => {
        initializeLLMIntegration();
        // Set up API key configuration after LLM integration is ready
        setTimeout(() => {
            setupAPIKeyConfiguration();
        }, 500);
    }, 1000);
});
