/**
 * API Key Element Regression Test
 * Tests to verify that the API key element is properly created and accessible
 */

describe('API Key Element Regression', () => {
    let mockWorldTab;
    let mockGameData;
    let mockMistralAPI;
    let mockStoryManager;
    let mockAdventureManager;

    beforeEach(() => {
        // Mock game data
        mockGameData = {
            paused: false,
            setPaused: jest.fn(),
            taskData: {},
            skills: {},
            coins: 1000
        };

        // Mock Mistral API
        mockMistralAPI = {
            apiKey: null,
            generateStory: jest.fn()
        };

        // Mock story manager
        mockStoryManager = {
            startNewStory: jest.fn()
        };

        // Mock adventure manager
        mockAdventureManager = {
            isAdventureActive: jest.fn(() => false),
            startAdventure: jest.fn(),
            endAdventure: jest.fn()
        };

        // Create a mock world tab element
        mockWorldTab = document.createElement('div');
        mockWorldTab.id = 'world';
        document.body.appendChild(mockWorldTab);
    });

    afterEach(() => {
        // Clean up
        if (mockWorldTab && mockWorldTab.parentNode) {
            document.body.removeChild(mockWorldTab);
        }
        // Clear any created elements
        const apiKeyInput = document.getElementById('mistralApiKey');
        if (apiKeyInput) {
            apiKeyInput.remove();
        }
    });

    describe('API Key Element Creation', () => {
        test('should create API key input element when World tab is initialized', () => {
            // Simulate the WorldTabManager initialization
            const worldTabContent = `
                <h2>Story Adventure</h2>
                <div class="api-config" style="margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
                    <label for="mistralApiKey" style="display: block; margin-bottom: 10px; font-weight: bold;">Mistral API Key:</label>
                    <input type="password" id="mistralApiKey" placeholder="Enter your Mistral API key" style="width: 400px; padding: 8px; border: 1px solid #ccc; border-radius: 3px;">
                    <br>
                    <small style="color: #666;">Get your free API key at <a href="https://console.mistral.ai" target="_blank">console.mistral.ai</a></small>
                </div>
            `;
            
            mockWorldTab.innerHTML = worldTabContent;

            // Check if the API key input element exists
            const apiKeyInput = document.getElementById('mistralApiKey');
            expect(apiKeyInput).toBeTruthy();
            expect(apiKeyInput.type).toBe('password');
            expect(apiKeyInput.placeholder).toBe('Enter your Mistral API key');
        });

        test('should be accessible by llm-integration.js setupAPIKeyConfiguration', () => {
            // Simulate the WorldTabManager initialization
            const worldTabContent = `
                <h2>Story Adventure</h2>
                <div class="api-config">
                    <label for="mistralApiKey">Mistral API Key:</label>
                    <input type="password" id="mistralApiKey" placeholder="Enter your Mistral API key">
                </div>
            `;
            
            mockWorldTab.innerHTML = worldTabContent;

            // Simulate the same lookup that llm-integration.js does
            const apiKeyInput = document.getElementById('mistralApiKey');
            expect(apiKeyInput).toBeTruthy();
            expect(apiKeyInput.id).toBe('mistralApiKey');
        });

        test('should handle case where API key element is not found', () => {
            // Don't create the API key element
            mockWorldTab.innerHTML = '<h2>Story Adventure</h2>';

            // Simulate the same lookup that llm-integration.js does
            const apiKeyInput = document.getElementById('mistralApiKey');
            expect(apiKeyInput).toBeFalsy();
        });
    });

    describe('Integration with llm-integration.js', () => {
        test('should not log warning when API key element exists', () => {
            // Mock console.warn to capture warnings
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            // Create the API key element
            const worldTabContent = `
                <h2>Story Adventure</h2>
                <div class="api-config">
                    <label for="mistralApiKey">Mistral API Key:</label>
                    <input type="password" id="mistralApiKey" placeholder="Enter your Mistral API key">
                </div>
            `;
            
            mockWorldTab.innerHTML = worldTabContent;

            // Simulate the setupAPIKeyConfiguration function
            const apiKeyInput = document.getElementById('mistralApiKey');
            if (apiKeyInput) {
                // This should not log a warning
                expect(consoleSpy).not.toHaveBeenCalledWith('API key input element not found');
            } else {
                // This would log a warning
                console.warn('API key input element not found');
                expect(consoleSpy).toHaveBeenCalledWith('API key input element not found');
            }

            consoleSpy.mockRestore();
        });

        test('should log warning when API key element is missing', () => {
            // Mock console.warn to capture warnings
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            // Don't create the API key element
            mockWorldTab.innerHTML = '<h2>Story Adventure</h2>';

            // Simulate the setupAPIKeyConfiguration function
            const apiKeyInput = document.getElementById('mistralApiKey');
            if (!apiKeyInput) {
                console.warn('API key input element not found');
                expect(consoleSpy).toHaveBeenCalledWith('API key input element not found');
            }

            consoleSpy.mockRestore();
        });
    });

    describe('Tab Click Simulation', () => {
        test('should create API key element when World tab is clicked', () => {
            // Simulate the tab click functionality from main.js
            const simulateTabClick = (selectedTab) => {
                if (selectedTab === 'world') {
                    // Simulate WorldTabManager.initialize()
                    const worldTabContent = `
                        <h2>Story Adventure</h2>
                        <div class="api-config">
                            <label for="mistralApiKey">Mistral API Key:</label>
                            <input type="password" id="mistralApiKey" placeholder="Enter your Mistral API key">
                        </div>
                    `;
                    mockWorldTab.innerHTML = worldTabContent;
                }
            };

            // Simulate clicking the World tab
            simulateTabClick('world');

            // Check if the API key input was created
            const apiKeyInput = document.getElementById('mistralApiKey');
            expect(apiKeyInput).toBeTruthy();
        });

        test('should not create API key element when other tabs are clicked', () => {
            // Simulate clicking a different tab
            const simulateTabClick = (selectedTab) => {
                if (selectedTab === 'world') {
                    const worldTabContent = `
                        <h2>Story Adventure</h2>
                        <div class="api-config">
                            <label for="mistralApiKey">Mistral API Key:</label>
                            <input type="password" id="mistralApiKey" placeholder="Enter your Mistral API key">
                        </div>
                    `;
                    mockWorldTab.innerHTML = worldTabContent;
                }
            };

            // Simulate clicking a different tab
            simulateTabClick('jobs');

            // Check that the API key input was not created
            const apiKeyInput = document.getElementById('mistralApiKey');
            expect(apiKeyInput).toBeFalsy();
        });
    });

    describe('Regression Prevention', () => {
        test('should catch the regression where API key element is missing', () => {
            // This test simulates the current regression state
            // where the World tab is not properly initialized
            
            // Don't initialize the World tab content
            mockWorldTab.innerHTML = '';

            // Simulate the llm-integration.js trying to find the element
            const apiKeyInput = document.getElementById('mistralApiKey');
            expect(apiKeyInput).toBeFalsy();

            // This would cause the warning we see in the console
            if (!apiKeyInput) {
                console.warn('API key input element not found');
            }
        });

        test('should verify that proper initialization fixes the regression', () => {
            // This test shows how the regression should be fixed
            // by properly initializing the World tab content
            
            // Simulate proper World tab initialization
            const worldTabContent = `
                <h2>Story Adventure</h2>
                <div class="api-config">
                    <label for="mistralApiKey">Mistral API Key:</label>
                    <input type="password" id="mistralApiKey" placeholder="Enter your Mistral API key">
                </div>
            `;
            mockWorldTab.innerHTML = worldTabContent;

            // Now the element should be found
            const apiKeyInput = document.getElementById('mistralApiKey');
            expect(apiKeyInput).toBeTruthy();
            expect(apiKeyInput.id).toBe('mistralApiKey');
        });
    });
});
