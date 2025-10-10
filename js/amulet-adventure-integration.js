/**
 * Amulet Adventure Integration - Simplified
 * Uses the unified AdventureSystem
 */

// Global adventure system instance
let adventureSystem = null;

// Track which adventures have been used in the current life
// Resets on rebirth, prevents using same adventure twice per life
let currentLifeAdventures = {
    age25: false,
    age45: false,
    age65: false,
    age200: false
};

// Reset adventure tracking (call on rebirth)
function resetAdventureTracking() {
    currentLifeAdventures = {
        age25: false,
        age45: false,
        age65: false,
        age200: false
    };
    updateAmuletAdventureAvailability();
}

// Initialize when page loads
function initializeAmuletAdventureIntegration() {
    console.log('🌟 Initializing amulet adventures...');
    
    // Wait for required classes
    if (typeof AdventureSystem === 'undefined') {
        console.log('⏳ Waiting for AdventureSystem...');
        setTimeout(initializeAmuletAdventureIntegration, 100);
        return;
    }
    
    if (typeof gameData === 'undefined') {
        console.log('⏳ Waiting for gameData...');
        setTimeout(initializeAmuletAdventureIntegration, 100);
        return;
    }
    
    // Wait for LLM integration to initialize mistralAPI and storyManager
    if (typeof window.mistralAPI === 'undefined' || typeof window.storyManager === 'undefined') {
        console.log('⏳ Waiting for LLM integration (mistralAPI and storyManager)...');
        setTimeout(initializeAmuletAdventureIntegration, 100);
        return;
    }
    
    try {
        // Create the unified adventure system WITH LLM integration
        adventureSystem = new AdventureSystem(gameData, window.mistralAPI, window.storyManager);
        window.adventureSystem = adventureSystem;
        
        console.log('✅ Amulet adventures initialized with LLM support!');
        updateAmuletAdventureAvailability();
    } catch (error) {
        console.error('❌ Failed to initialize:', error);
    }
}

// Check if API key is configured
function hasAPIKey() {
    return window.mistralAPI && window.mistralAPI.apiKey && window.mistralAPI.apiKey.trim().length > 0;
}

// Start amulet adventure
async function startAmuletAdventure(amuletPrompt) {
    console.log(`🌟 Starting amulet adventure: ${amuletPrompt}`);
    
    if (!adventureSystem) {
        console.error('Adventure system not initialized');
        return;
    }
    
    if (!hasAPIKey()) {
        alert('Please enter your Mistral API key in the configuration section below before starting an adventure.');
        return;
    }
    
    // Check if already used this life
    if (currentLifeAdventures[amuletPrompt]) {
        alert(`You've already experienced the ${amuletPrompt} adventure in this life. You must be reborn to experience it again.`);
        return;
    }
    
    try {
        const result = await adventureSystem.startCareerBasedAdventure(amuletPrompt);
        
        if (result.success) {
            console.log('Adventure started successfully!');
            // Mark this adventure as used for this life
            currentLifeAdventures[amuletPrompt] = true;
            hideAdventureButtons();
        } else {
            console.error('Failed to start adventure:', result.error);
        }
    } catch (error) {
        console.error('Error starting adventure:', error);
    }
}

// Hide adventure buttons
function hideAdventureButtons() {
    const buttons = ['adventureButton25', 'adventureButton45', 'adventureButton65', 'adventureButton200'];
    buttons.forEach(id => {
        const button = document.getElementById(id);
        if (button) button.style.display = 'none';
    });
}

// Update adventure availability
function updateAmuletAdventureAvailability() {
    const currentAge = Math.floor(gameData.days / 365);
    const apiKeyAvailable = hasAPIKey();
    
    const buttons = [
        { id: 'adventureButton25', prompt: 'age25', minAge: 25 },
        { id: 'adventureButton45', prompt: 'age45', minAge: 45 },
        { id: 'adventureButton65', prompt: 'age65', minAge: 65 },
        { id: 'adventureButton200', prompt: 'age200', minAge: 200 }
    ];
    
    buttons.forEach(({ id, prompt, minAge }) => {
        const container = document.getElementById(id);
        if (container) {
            const ageRequirementMet = currentAge >= minAge;
            const alreadyUsed = currentLifeAdventures[prompt];
            
            // Show container if age requirement met
            container.style.display = ageRequirementMet ? 'block' : 'none';
            
            // Disable button if no API key OR already used this life
            const button = container.querySelector('button');
            if (button) {
                const shouldDisable = !apiKeyAvailable || alreadyUsed;
                button.disabled = shouldDisable;
                button.style.opacity = shouldDisable ? '0.5' : '1';
                button.style.cursor = shouldDisable ? 'not-allowed' : 'pointer';
                
                // Set appropriate tooltip
                if (alreadyUsed) {
                    button.title = 'Already completed this adventure in this life. Rebirth to experience it again.';
                } else if (!apiKeyAvailable) {
                    button.title = 'Please configure Mistral API key first';
                } else {
                    button.title = '';
                }
            }
        }
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeAmuletAdventureIntegration, 500);
    
    // Listen for API key changes to update button availability
    setTimeout(() => {
        const apiKeyInput = document.getElementById('mistralApiKey');
        if (apiKeyInput) {
            apiKeyInput.addEventListener('input', () => {
                setTimeout(updateAmuletAdventureAvailability, 100);
            });
        }
    }, 1000);
    
    // REMOVED: Periodic check anti-pattern (was: setInterval(updateAmuletAdventureAvailability, 5000))
    // Now using event-driven updates instead:
    // - After adventure ends (in AdventureSystem.endAdventure)
    // - After adventure ends manually (in endCareerBasedAdventure)
    // - On tab switch (below)
    // - On API key change (above)
    
    // Listen for tab switches to Amulet tab (proper selector, no jQuery)
    setTimeout(() => {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            if (tab.textContent && tab.textContent.trim() === 'Amulet') {
                tab.addEventListener('click', () => {
                    setTimeout(updateAmuletAdventureAvailability, 100);
                });
            }
        });
    }, 1000);
});

// Expose adventure tracking reset for rebirth
window.resetAdventureTracking = resetAdventureTracking;

// Debug helpers
window.clearAdventureData = function() {
    localStorage.removeItem('storyTrees');
    localStorage.removeItem('usedAdventures');
    console.log('✅ Adventure data cleared');
    resetAdventureTracking();
};

window.forceCloseAdventure = function() {
    if (adventureSystem) {
        adventureSystem.endAdventure();
    }
    const container = document.getElementById('adventureContainer');
    if (container) container.innerHTML = '';
    console.log('✅ Adventure closed');
};
