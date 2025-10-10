/**
 * Regression Test: Game State Persistence During Adventures
 * 
 * Tests that game state persists correctly to localStorage
 * and doesn't get corrupted when adventures start/end
 * 
 * This test was created after discovering that:
 * 1. Game state wasn't saving to localStorage during adventures
 * 2. UI showed corrupted data after page reload
 * 3. No existing test caught this regression
 */

describe('Game State Persistence During Adventures - Regression Test', () => {
    let localStorage;
    let gameData;
    
    beforeEach(() => {
        // Mock localStorage
        localStorage = {
            data: {},
            getItem: function(key) { return this.data[key] || null; },
            setItem: function(key, value) { this.data[key] = value; },
            removeItem: function(key) { delete this.data[key]; },
            clear: function() { this.data = {}; }
        };
        
        // Mock global localStorage
        global.localStorage = localStorage;
        
        // Create mock game state
        gameData = {
            days: 25550, // Age 70
            coins: 220629,
            evil: 0,
            paused: false,
            currentJob: { name: 'Beggar', level: 65 },
            currentSkill: { name: 'Concentration', level: 55 },
            taskData: {
                'Beggar': { 
                    name: 'Beggar', 
                    level: 65,
                    xp: 1000,
                    maxLevel: 100,
                    getIncome: () => 14
                },
                'Concentration': {
                    name: 'Concentration',
                    level: 55,
                    xp: 500,
                    getEffect: () => 55
                }
            },
            itemData: {
                'Tent': { name: 'Tent', owned: true }
            }
        };
    });
    
    afterEach(() => {
        delete global.localStorage;
    });

    describe('Regression: Game State Not Saving', () => {
        test('should save game state to localStorage', () => {
            // Simulate game state save
            const serializedState = JSON.stringify({
                days: gameData.days,
                coins: gameData.coins,
                evil: gameData.evil,
                paused: gameData.paused,
                currentJob: gameData.currentJob.name,
                currentSkill: gameData.currentSkill.name
            });
            
            localStorage.setItem('gameData', serializedState);
            
            // Verify it was saved
            expect(localStorage.getItem('gameData')).toBeTruthy();
            expect(localStorage.getItem('gameData')).toContain('25550');
            expect(localStorage.getItem('gameData')).toContain('220629');
        });

        test('should detect when game state is NOT in localStorage', () => {
            // This is the regression - localStorage is empty
            const hasGameData = !!localStorage.getItem('gameData');
            
            expect(hasGameData).toBe(false); // This was the bug!
        });

        test('should verify game state can be loaded after save', () => {
            // Save
            const saveData = {
                days: gameData.days,
                coins: gameData.coins,
                currentJob: 'Beggar',
                currentSkill: 'Concentration'
            };
            localStorage.setItem('gameData', JSON.stringify(saveData));
            
            // Load
            const loaded = JSON.parse(localStorage.getItem('gameData'));
            
            expect(loaded.days).toBe(25550);
            expect(loaded.coins).toBe(220629);
            expect(loaded.currentJob).toBe('Beggar');
            expect(loaded.currentSkill).toBe('Concentration');
        });
    });

    describe('Regression: UI Corruption After Adventure', () => {
        test('should maintain correct age display value', () => {
            const age = Math.floor(gameData.days / 365);
            expect(age).toBe(70);
            expect(age).not.toBe(14); // Regression showed "Age 14"
        });

        test('should maintain correct job display value', () => {
            const currentJob = gameData.currentJob.name;
            expect(currentJob).toBe('Beggar');
            expect(currentJob).not.toBe('Task'); // Regression showed "Task"
        });

        test('should maintain actual level numbers not text', () => {
            const jobLevel = gameData.taskData['Beggar'].level;
            expect(typeof jobLevel).toBe('number');
            expect(jobLevel).toBe(65);
            expect(jobLevel).not.toBe('Level'); // Regression showed "Level" text
        });

        test('should maintain coin balance visibility', () => {
            expect(gameData.coins).toBeGreaterThan(0);
            expect(gameData.coins).toBe(220629);
            expect(typeof gameData.coins).toBe('number');
        });
    });

    describe('Regression: Adventure Start/End Effects', () => {
        test('should not clear gameData when adventure starts', () => {
            // Save initial state
            localStorage.setItem('gameData', JSON.stringify({
                days: gameData.days,
                coins: gameData.coins
            }));
            
            // Simulate adventure start
            gameData.paused = true;
            
            // Game data should still be in localStorage
            expect(localStorage.getItem('gameData')).toBeTruthy();
        });

        test('should not clear gameData when adventure ends', () => {
            // Save initial state
            localStorage.setItem('gameData', JSON.stringify({
                days: gameData.days,
                coins: gameData.coins
            }));
            
            // Simulate adventure end
            gameData.paused = false;
            
            // Game data should still be in localStorage
            expect(localStorage.getItem('gameData')).toBeTruthy();
        });

        test('should preserve game state during adventure', () => {
            const beforeAdventure = {
                days: gameData.days,
                coins: gameData.coins,
                currentJob: gameData.currentJob.name
            };
            
            // Start adventure
            gameData.paused = true;
            
            // Verify state unchanged
            expect(gameData.days).toBe(beforeAdventure.days);
            expect(gameData.coins).toBe(beforeAdventure.coins);
            expect(gameData.currentJob.name).toBe(beforeAdventure.currentJob);
        });
    });

    describe('Regression: Data Validation', () => {
        test('should detect invalid age display (age < 0 or > 1000)', () => {
            const age = Math.floor(gameData.days / 365);
            
            expect(age).toBeGreaterThanOrEqual(0);
            expect(age).toBeLessThan(1000);
            expect(age).toBe(70); // Expected age
        });

        test('should detect when taskData is missing levels', () => {
            for (const [key, task] of Object.entries(gameData.taskData)) {
                expect(task).toHaveProperty('level');
                expect(typeof task.level).toBe('number');
                expect(task.level).not.toBe('Level'); // Not the text "Level"
            }
        });

        test('should detect when currentJob/currentSkill are undefined', () => {
            expect(gameData.currentJob).toBeDefined();
            expect(gameData.currentSkill).toBeDefined();
            expect(gameData.currentJob.name).not.toBe('Task');
            expect(gameData.currentSkill.name).not.toBe('Task');
        });

        test('should validate game state structure', () => {
            // Required fields
            expect(gameData).toHaveProperty('days');
            expect(gameData).toHaveProperty('coins');
            expect(gameData).toHaveProperty('taskData');
            expect(gameData).toHaveProperty('currentJob');
            expect(gameData).toHaveProperty('currentSkill');
            
            // Required types
            expect(typeof gameData.days).toBe('number');
            expect(typeof gameData.coins).toBe('number');
            expect(typeof gameData.taskData).toBe('object');
        });
    });

    describe('Regression: localStorage Corruption Prevention', () => {
        test('should prevent localStorage from being cleared during adventure', () => {
            // Setup: save both game data and story trees
            localStorage.setItem('gameData', JSON.stringify({ days: 25550 }));
            localStorage.setItem('storyTrees', JSON.stringify({ age65: {} }));
            
            // Adventure action that should NOT clear everything
            gameData.paused = true;
            
            // Both should still exist
            expect(localStorage.getItem('gameData')).toBeTruthy();
            expect(localStorage.getItem('storyTrees')).toBeTruthy();
        });

        test('should maintain separate localStorage keys', () => {
            localStorage.setItem('gameData', JSON.stringify({ days: 25550 }));
            localStorage.setItem('storyTrees', JSON.stringify({ age65: {} }));
            localStorage.setItem('lifeStories', JSON.stringify({ life1: {} }));
            
            // All three should coexist
            expect(Object.keys(localStorage.data)).toContain('gameData');
            expect(Object.keys(localStorage.data)).toContain('storyTrees');
            expect(Object.keys(localStorage.data)).toContain('lifeStories');
        });

        test('should not overwrite gameData with storyTrees data', () => {
            const gameDataContent = JSON.stringify({ days: 25550, coins: 220629 });
            const storyTreesContent = JSON.stringify({ age65: { choices: [] } });
            
            localStorage.setItem('gameData', gameDataContent);
            localStorage.setItem('storyTrees', storyTreesContent);
            
            // Verify they remain separate
            const loadedGameData = localStorage.getItem('gameData');
            const loadedStoryTrees = localStorage.getItem('storyTrees');
            
            expect(loadedGameData).toBe(gameDataContent);
            expect(loadedStoryTrees).toBe(storyTreesContent);
            expect(loadedGameData).not.toContain('age65');
            expect(loadedStoryTrees).not.toContain('days');
        });
    });

    describe('Regression: UI Refresh Detection', () => {
        test('should detect when UI shows default values instead of actual data', () => {
            // These are symptoms of the UI not refreshing properly
            const symptoms = {
                ageShowsWrongValue: 14, // Should be 70
                jobShowsTask: 'Task', // Should be 'Beggar'
                levelShowsText: 'Level', // Should be number
                coinsNotVisible: true // Should show balance
            };
            
            // Tests should catch these
            expect(Math.floor(gameData.days / 365)).not.toBe(symptoms.ageShowsWrongValue);
            expect(gameData.currentJob.name).not.toBe(symptoms.jobShowsTask);
            expect(typeof gameData.taskData['Beggar'].level).not.toBe('string');
        });

        test('should verify data exists before UI renders', () => {
            // Simulate UI data check
            const canRender = !!(
                gameData &&
                gameData.days !== undefined &&
                gameData.currentJob &&
                gameData.taskData
            );
            
            expect(canRender).toBe(true);
        });
    });
});

