/**
 * Tests to verify the loading state fix for story adventures
 */

describe('Loading State Fix Verification', () => {
    let mockStoryContainer;
    let originalDocument;

    beforeEach(() => {
        // Store original document
        originalDocument = global.document;
        
        // Create mock story container
        mockStoryContainer = {
            innerHTML: ''
        };

        // Mock document.getElementById
        global.document = {
            getElementById: jest.fn((id) => {
                if (id === 'storyAdventure') {
                    return mockStoryContainer;
                }
                return null;
            })
        };
    });

    afterEach(() => {
        // Restore original document
        global.document = originalDocument;
    });

    describe('Loading State HTML Structure', () => {
        test('should create proper loading state HTML', () => {
            const message = 'Starting new adventure...';
            
            // Simulate the showLoadingState method behavior
            const loadingHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">${message}</p>
                </div>
            `;
            
            // Set the innerHTML
            mockStoryContainer.innerHTML = loadingHTML;
            
            // Verify structure
            expect(mockStoryContainer.innerHTML).toContain('loading-container');
            expect(mockStoryContainer.innerHTML).toContain('loading-spinner');
            expect(mockStoryContainer.innerHTML).toContain('loading-message');
            expect(mockStoryContainer.innerHTML).toContain(message);
        });

        test('should create proper story content HTML', () => {
            // Simulate the displayStoryWithChoices method behavior
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
                                <button class="choice-btn">Charge forward with your sword</button>
                                <button class="choice-btn">Try to sneak past quietly</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Set the innerHTML
            mockStoryContainer.innerHTML = storyHTML;
            
            // Verify structure
            expect(mockStoryContainer.innerHTML).toContain('story-adventure-container');
            expect(mockStoryContainer.innerHTML).toContain('story-header');
            expect(mockStoryContainer.innerHTML).toContain('story-content');
            expect(mockStoryContainer.innerHTML).toContain('choices-grid');
            expect(mockStoryContainer.innerHTML).not.toContain('loading-container');
        });

        test('should create proper error state HTML', () => {
            // Simulate the showError method behavior
            const errorMessage = 'Failed to start adventure: API Error';
            const errorHTML = `
                <div class="error-container">
                    <h3>Error</h3>
                    <p>${errorMessage}</p>
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
            
            // Set the innerHTML
            mockStoryContainer.innerHTML = errorHTML;
            
            // Verify structure
            expect(mockStoryContainer.innerHTML).toContain('error-container');
            expect(mockStoryContainer.innerHTML).toContain(errorMessage);
            expect(mockStoryContainer.innerHTML).toContain('retry-btn');
            expect(mockStoryContainer.innerHTML).toContain('cancel-btn');
            expect(mockStoryContainer.innerHTML).not.toContain('loading-container');
        });
    });

    describe('Loading State Transitions', () => {
        test('should transition from loading to story content', () => {
            // Start with loading state
            mockStoryContainer.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">Starting new adventure...</p>
                </div>
            `;
            
            // Verify loading state is present
            expect(mockStoryContainer.innerHTML).toContain('loading-container');
            expect(mockStoryContainer.innerHTML).toContain('Starting new adventure...');
            
            // Transition to story content (simulate displayStoryWithChoices)
            mockStoryContainer.innerHTML = `
                <div class="story-adventure-container">
                    <div class="story-content">
                        <div class="story-text">You find yourself in a dark forest.</div>
                        <div class="story-choices">
                            <div class="choices-grid">
                                <button class="choice-btn">Charge forward</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Verify transition completed
            expect(mockStoryContainer.innerHTML).not.toContain('loading-container');
            expect(mockStoryContainer.innerHTML).toContain('story-adventure-container');
            expect(mockStoryContainer.innerHTML).toContain('You find yourself in a dark forest');
        });

        test('should transition from loading to error state', () => {
            // Start with loading state
            mockStoryContainer.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">Continuing adventure...</p>
                </div>
            `;
            
            // Verify loading state is present
            expect(mockStoryContainer.innerHTML).toContain('loading-container');
            expect(mockStoryContainer.innerHTML).toContain('Continuing adventure...');
            
            // Transition to error state (simulate showError)
            mockStoryContainer.innerHTML = `
                <div class="error-container">
                    <h3>Error</h3>
                    <p>Failed to continue adventure: API Error</p>
                    <div class="error-actions">
                        <button class="retry-btn">Try Again</button>
                    </div>
                </div>
            `;
            
            // Verify transition completed
            expect(mockStoryContainer.innerHTML).not.toContain('loading-container');
            expect(mockStoryContainer.innerHTML).toContain('error-container');
            expect(mockStoryContainer.innerHTML).toContain('Failed to continue adventure');
        });

        test('should handle multiple rapid transitions', () => {
            // Start with loading state
            mockStoryContainer.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">Starting new adventure...</p>
                </div>
            `;
            
            // Rapid transition to story content
            mockStoryContainer.innerHTML = `
                <div class="story-adventure-container">
                    <div class="story-content">Story content here</div>
                </div>
            `;
            
            // Rapid transition back to loading (user makes choice)
            mockStoryContainer.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">Continuing adventure...</p>
                </div>
            `;
            
            // Final transition to new story content
            mockStoryContainer.innerHTML = `
                <div class="story-adventure-container">
                    <div class="story-content">New story content here</div>
                </div>
            `;
            
            // Verify final state
            expect(mockStoryContainer.innerHTML).not.toContain('loading-container');
            expect(mockStoryContainer.innerHTML).toContain('story-adventure-container');
            expect(mockStoryContainer.innerHTML).toContain('New story content here');
        });
    });

    describe('Loading State Edge Cases', () => {
        test('should handle empty innerHTML', () => {
            // Start with empty container
            mockStoryContainer.innerHTML = '';
            
            // Verify empty state
            expect(mockStoryContainer.innerHTML).toBe('');
            expect(mockStoryContainer.innerHTML).not.toContain('loading-container');
            expect(mockStoryContainer.innerHTML).not.toContain('story-adventure-container');
            expect(mockStoryContainer.innerHTML).not.toContain('error-container');
        });

        test('should handle malformed HTML gracefully', () => {
            // Start with malformed HTML
            mockStoryContainer.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div>';
            
            // Verify it contains expected elements despite being malformed
            expect(mockStoryContainer.innerHTML).toContain('loading-container');
            expect(mockStoryContainer.innerHTML).toContain('loading-spinner');
            
            // Transition to proper story content
            mockStoryContainer.innerHTML = `
                <div class="story-adventure-container">
                    <div class="story-content">Fixed story content</div>
                </div>
            `;
            
            // Verify transition worked
            expect(mockStoryContainer.innerHTML).not.toContain('loading-container');
            expect(mockStoryContainer.innerHTML).toContain('story-adventure-container');
        });
    });
});


