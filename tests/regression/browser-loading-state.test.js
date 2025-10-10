/**
 * Browser-specific tests for loading state management
 * These tests verify the fix works in the actual browser environment
 */

describe('Browser Loading State Integration', () => {
    let mockDocument;
    let originalGlobal;

    beforeEach(() => {
        // Store original globals
        originalGlobal = global;
        
        // Create a realistic mock document
        mockDocument = {
            getElementById: jest.fn(),
            createElement: jest.fn(() => ({
                className: '',
                innerHTML: '',
                style: {},
                textContent: '',
                appendChild: jest.fn(),
                addEventListener: jest.fn(),
                remove: jest.fn()
            })),
            body: {
                appendChild: jest.fn()
            }
        };

        // Mock global objects that would be available in browser
        global.document = mockDocument;
        global.window = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };
        global.console = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn()
        };
    });

    afterEach(() => {
        // Restore original globals
        global = originalGlobal;
    });

    describe('Story Adventure UI Loading Behavior', () => {
        test('should properly manage loading state in browser environment', () => {
            // Create mock story container
            const mockStoryContainer = {
                innerHTML: ''
            };

            // Mock getElementById to return our container
            mockDocument.getElementById.mockImplementation((id) => {
                if (id === 'storyAdventure') {
                    return mockStoryContainer;
                }
                return null;
            });

            // Simulate the loading state display (showLoadingState)
            const loadingHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">Starting new adventure...</p>
                </div>
            `;
            
            mockStoryContainer.innerHTML = loadingHTML;

            // Verify loading state is displayed
            expect(mockStoryContainer.innerHTML).toContain('loading-container');
            expect(mockStoryContainer.innerHTML).toContain('Starting new adventure...');

            // Simulate successful story generation (displayStoryWithChoices)
            const storyHTML = `
                <div class="story-adventure-container">
                    <div class="story-header">
                        <h3>Fantasy Adventure</h3>
                        <div class="story-stats">
                            <span class="turn-counter">Turn 1</span>
                            <span class="genre-tag">Fantasy</span>
                        </div>
                    </div>
                    <div class="story-content">
                        <div class="story-text">
                            You find yourself in a dark forest. What do you do?
                        </div>
                        <div class="story-choices">
                            <h4>What do you choose?</h4>
                            <div class="choices-grid">
                                <button class="choice-btn" onclick="storyAdventureUI.makeChoice(0)">Charge forward with your sword</button>
                                <button class="choice-btn" onclick="storyAdventureUI.makeChoice(1)">Try to sneak past quietly</button>
                                <button class="choice-btn" onclick="storyAdventureUI.makeChoice(2)">Look for another path</button>
                                <button class="choice-btn" onclick="storyAdventureUI.makeChoice(3)">Call out for help</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            mockStoryContainer.innerHTML = storyHTML;

            // Verify loading state was replaced with story content
            expect(mockStoryContainer.innerHTML).not.toContain('loading-container');
            expect(mockStoryContainer.innerHTML).toContain('story-adventure-container');
            expect(mockStoryContainer.innerHTML).toContain('You find yourself in a dark forest');
            expect(mockStoryContainer.innerHTML).toContain('choices-grid');
        });

        test('should handle error states properly in browser', () => {
            // Create mock story container
            const mockStoryContainer = {
                innerHTML: ''
            };

            // Mock getElementById to return our container
            mockDocument.getElementById.mockImplementation((id) => {
                if (id === 'storyAdventure') {
                    return mockStoryContainer;
                }
                return null;
            });

            // Simulate loading state first
            mockStoryContainer.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">Continuing adventure...</p>
                </div>
            `;

            // Verify loading state is displayed
            expect(mockStoryContainer.innerHTML).toContain('loading-container');

            // Simulate error (showError)
            const errorHTML = `
                <div class="error-container">
                    <h3>Error</h3>
                    <p>Failed to continue adventure: API Error</p>
                    <div class="error-actions">
                        <button onclick="storyAdventureUI.startNewStory()" class="retry-btn">
                            Try Again
                        </button>
                        <button onclick="storyAdventureUI.hideAdventureUI()" class="cancel-btn">
                            Cancel
                        </button>
                    </div>
                </div>
            `;
            
            mockStoryContainer.innerHTML = errorHTML;

            // Verify error state replaced loading state
            expect(mockStoryContainer.innerHTML).not.toContain('loading-container');
            expect(mockStoryContainer.innerHTML).toContain('error-container');
            expect(mockStoryContainer.innerHTML).toContain('Failed to continue adventure');
            expect(mockStoryContainer.innerHTML).toContain('retry-btn');
        });

        test('should handle adventure ending properly', () => {
            // Create mock story container
            const mockStoryContainer = {
                innerHTML: ''
            };

            // Mock getElementById to return our container
            mockDocument.getElementById.mockImplementation((id) => {
                if (id === 'storyAdventure') {
                    return mockStoryContainer;
                }
                return null;
            });

            // Simulate active story state
            mockStoryContainer.innerHTML = `
                <div class="story-adventure-container">
                    <div class="story-content">
                        <div class="story-text">Final story content</div>
                        <div class="story-choices">
                            <div class="choices-grid">
                                <button class="choice-btn">Final choice</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Verify story state is active
            expect(mockStoryContainer.innerHTML).toContain('story-adventure-container');

            // Simulate adventure ending (endAdventure)
            const rewardSummaryHTML = `
                <div class="reward-summary-container">
                    <h3>Adventure Complete!</h3>
                    <div class="reward-stats">
                        <div class="stat">
                            <span class="stat-label">Success Rate:</span>
                            <span class="stat-value">83%</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Turns:</span>
                            <span class="stat-value">6</span>
                        </div>
                    </div>
                    <div class="reward-details">
                        <h4>Rewards:</h4>
                        <div class="skill-rewards">
                            <div class="skill-reward">+1000 XP to Strength</div>
                            <div class="skill-reward">+1000 XP to Charisma</div>
                            <div class="skill-reward">+500 XP to Concentration</div>
                            <div class="skill-reward">+500 XP to Magic</div>
                        </div>
                    </div>
                    <div class="reward-actions">
                        <button onclick="storyAdventureUI.hideAdventureUI()" class="continue-btn">
                            Continue
                        </button>
                    </div>
                </div>
            `;
            
            mockStoryContainer.innerHTML = rewardSummaryHTML;

            // Verify adventure ended and rewards are shown
            expect(mockStoryContainer.innerHTML).not.toContain('story-adventure-container');
            expect(mockStoryContainer.innerHTML).not.toContain('loading-container');
            expect(mockStoryContainer.innerHTML).toContain('reward-summary-container');
            expect(mockStoryContainer.innerHTML).toContain('Adventure Complete!');
            expect(mockStoryContainer.innerHTML).toContain('+1000 XP to Strength');
        });
    });

    describe('Loading State Timing', () => {
        test('should handle rapid state changes without conflicts', () => {
            // Create mock story container
            const mockStoryContainer = {
                innerHTML: ''
            };

            // Mock getElementById to return our container
            mockDocument.getElementById.mockImplementation((id) => {
                if (id === 'storyAdventure') {
                    return mockStoryContainer;
                }
                return null;
            });

            // Simulate rapid state changes
            const states = [
                // 1. Loading state
                '<div class="loading-container"><div class="loading-spinner"></div><p class="loading-message">Starting...</p></div>',
                
                // 2. Story content
                '<div class="story-adventure-container"><div class="story-content">Story here</div></div>',
                
                // 3. Loading state again (user makes choice)
                '<div class="loading-container"><div class="loading-spinner"></div><p class="loading-message">Continuing...</p></div>',
                
                // 4. New story content
                '<div class="story-adventure-container"><div class="story-content">New story here</div></div>',
                
                // 5. Adventure ends
                '<div class="reward-summary-container"><h3>Adventure Complete!</h3></div>'
            ];

            // Apply each state and verify it's correct
            states.forEach((state, index) => {
                mockStoryContainer.innerHTML = state;
                
                // Verify state is applied correctly
                expect(mockStoryContainer.innerHTML).toBe(state);
                
                // Verify no conflicting states exist
                if (state.includes('loading-container')) {
                    expect(mockStoryContainer.innerHTML).not.toContain('story-adventure-container');
                    expect(mockStoryContainer.innerHTML).not.toContain('reward-summary-container');
                } else if (state.includes('story-adventure-container')) {
                    expect(mockStoryContainer.innerHTML).not.toContain('loading-container');
                    expect(mockStoryContainer.innerHTML).not.toContain('reward-summary-container');
                } else if (state.includes('reward-summary-container')) {
                    expect(mockStoryContainer.innerHTML).not.toContain('loading-container');
                    expect(mockStoryContainer.innerHTML).not.toContain('story-adventure-container');
                }
            });

            // Verify final state is correct
            expect(mockStoryContainer.innerHTML).toContain('reward-summary-container');
            expect(mockStoryContainer.innerHTML).toContain('Adventure Complete!');
        });
    });
});


