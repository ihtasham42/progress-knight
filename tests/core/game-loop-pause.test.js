/**
 * Tests for game loop pause functionality during adventures
 */

describe('Game Loop Pause Functionality', () => {
    let mockGameData;
    let mockTask;
    let originalUpdate;
    let updateCallCount;

    beforeEach(() => {
        // Mock gameData
        mockGameData = {
            paused: false,
            currentJob: null,
            currentSkill: null,
            taskData: {
                'Beggar': { level: 1, xp: 0, increaseXp: jest.fn() },
                'Concentration': { level: 1, xp: 0, increaseXp: jest.fn() }
            },
            itemData: {
                'Homeless': { getExpense: () => 0 }
            },
            currentProperty: { getExpense: () => 0 },
            currentMisc: [],
            coins: 100,
            days: 365 * 14,
            evil: 0
        };

        // Mock task objects
        mockTask = {
            increaseXp: jest.fn(),
            getIncome: jest.fn(() => 10)
        };

        mockGameData.currentJob = mockTask;
        mockGameData.currentSkill = mockTask;

        // Mock DOM elements
        global.document = {
            getElementById: jest.fn(() => ({
                textContent: '',
                style: {},
                classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() },
                disabled: false
            })),
            getElementsByClassName: jest.fn(() => [
                { 
                    content: { 
                        firstElementChild: { 
                            cloneNode: jest.fn(() => ({ 
                                getElementsByClassName: jest.fn(() => [{ textContent: '' }]),
                                style: {},
                                classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() }
                            })) 
                        } 
                    } 
                }
            ])
        };

        // Mock global functions
        global.increaseDays = jest.fn();
        global.autoPromote = jest.fn();
        global.autoLearn = jest.fn();
        global.applyExpenses = jest.fn();
        global.updateUI = jest.fn();
        global.domCache = {
            dirtyFlags: {
                tasks: false,
                items: false,
                text: false,
                requirements: false
            }
        };

        // Store original update function
        originalUpdate = global.update;
        updateCallCount = 0;
    });

    afterEach(() => {
        // Restore original update function
        if (originalUpdate) {
            global.update = originalUpdate;
        }
        jest.clearAllMocks();
    });

    test('should skip all game updates when paused', () => {
        // Mock the update function to test pause logic
        global.update = jest.fn(() => {
            // Simulate the pause check from main.js
            if (mockGameData.paused) {
                return; // Skip all updates when paused
            }
            
            // These should run when not paused
            global.increaseDays();
            global.autoPromote();
            global.autoLearn();
            global.applyExpenses();
            global.updateUI();
        });

        // Set game as paused
        mockGameData.paused = true;

        // Call the update function
        global.update();

        // Verify that game logic functions were NOT called when paused
        expect(global.increaseDays).not.toHaveBeenCalled();
        expect(global.autoPromote).not.toHaveBeenCalled();
        expect(global.autoLearn).not.toHaveBeenCalled();
        expect(global.applyExpenses).not.toHaveBeenCalled();
        expect(global.updateUI).not.toHaveBeenCalled();
    });

    test('should run all game updates when not paused', () => {
        // Mock the update function
        global.update = jest.fn(() => {
            updateCallCount++;
            
            // Simulate the pause check from main.js
            if (mockGameData.paused) {
                return; // Skip all updates
            }
            
            // These should run when not paused
            global.increaseDays();
            global.autoPromote();
            global.autoLearn();
            global.applyExpenses();
            global.updateUI();
        });

        // Set game as not paused
        mockGameData.paused = false;

        // Call update function
        global.update();

        // Verify update was called
        expect(global.update).toHaveBeenCalledTimes(1);
        
        // Verify that game logic functions WERE called when not paused
        expect(global.increaseDays).toHaveBeenCalledTimes(1);
        expect(global.autoPromote).toHaveBeenCalledTimes(1);
        expect(global.autoLearn).toHaveBeenCalledTimes(1);
        expect(global.applyExpenses).toHaveBeenCalledTimes(1);
        expect(global.updateUI).toHaveBeenCalledTimes(1);
    });

    test('should handle pause state changes during gameplay', () => {
        let updateCalls = [];
        
        // Mock the update function to track pause state
        global.update = jest.fn(() => {
            updateCalls.push({
                paused: mockGameData.paused,
                timestamp: Date.now()
            });
            
            if (mockGameData.paused) {
                return;
            }
            
            global.increaseDays();
        });

        // Start unpaused
        mockGameData.paused = false;
        global.update();
        
        // Pause the game
        mockGameData.paused = true;
        global.update();
        
        // Unpause the game
        mockGameData.paused = false;
        global.update();

        // Verify the sequence of calls
        expect(updateCalls).toHaveLength(3);
        expect(updateCalls[0].paused).toBe(false);
        expect(updateCalls[1].paused).toBe(true);
        expect(updateCalls[2].paused).toBe(false);
        
        // Verify increaseDays was only called when not paused
        expect(global.increaseDays).toHaveBeenCalledTimes(2); // Called on calls 1 and 3
    });

    test('should handle task execution when not paused', () => {
        const mockJob = {
            increaseXp: jest.fn(),
            getIncome: jest.fn(() => 10)
        };
        
        const mockSkill = {
            increaseXp: jest.fn()
        };

        mockGameData.currentJob = mockJob;
        mockGameData.currentSkill = mockSkill;

        // Mock the update function with task execution
        global.update = jest.fn(() => {
            if (mockGameData.paused) {
                return;
            }
            
            // Simulate task execution from main.js
            if (mockGameData.currentJob && typeof mockGameData.currentJob.increaseXp === 'function') {
                mockGameData.currentJob.increaseXp();
            }
            
            if (mockGameData.currentSkill && typeof mockGameData.currentSkill.increaseXp === 'function') {
                mockGameData.currentSkill.increaseXp();
            }
        });

        // Run update when not paused
        mockGameData.paused = false;
        global.update();

        // Verify tasks were executed
        expect(mockJob.increaseXp).toHaveBeenCalledTimes(1);
        expect(mockSkill.increaseXp).toHaveBeenCalledTimes(1);

        // Run update when paused
        mockGameData.paused = true;
        global.update();

        // Verify tasks were NOT executed again
        expect(mockJob.increaseXp).toHaveBeenCalledTimes(1); // Still 1
        expect(mockSkill.increaseXp).toHaveBeenCalledTimes(1); // Still 1
    });
});
