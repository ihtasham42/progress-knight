/**
 * Unified Adventure System Tests
 * Consolidates: adventure-pause-integration, adventure-choice-making, 
 * adventure-integration, story-adventure-manager, story-adventure-rewards,
 * story-adventure-integration, state-reset-fix
 */

const { AdventureSystem } = require('../setup-llm-classes');

describe('AdventureSystem - Unified Tests', () => {
    let adventureSystem;
    let mockGameData;
    let mockMistralAPI;
    let mockStoryManager;

    beforeEach(() => {
        // Mock localStorage
        global.localStorage = {
            data: {},
            getItem: jest.fn((key) => global.localStorage.data[key] || null),
            setItem: jest.fn((key, value) => { global.localStorage.data[key] = value; }),
            removeItem: jest.fn((key) => { delete global.localStorage.data[key]; }),
            clear: jest.fn(() => { global.localStorage.data = {}; })
        };

        // Mock game data
        mockGameData = {
            taskData: {
                'Strength': { level: 10, addXp: jest.fn() },
                'Meditation': { level: 8, addXp: jest.fn() },
                'Concentration': { level: 12, addXp: jest.fn() },
                'Mana control': { level: 6, addXp: jest.fn() },
                'Beggar': { level: 5 },
                'Farmer': { level: 10 }
            },
            currentJob: 'Farmer',
            days: 365 * 25,
            paused: false
        };

        // Mock MistralAPI
        mockMistralAPI = {
            apiKey: 'test-key',
            generateWorldDescription: jest.fn().mockResolvedValue(
                'STORY: Test story continuation\n\nCHOICES:\n1. Choice A (TYPE: aggressive)\n2. Choice B (TYPE: diplomatic)\n3. Choice C (TYPE: cautious)'
            )
        };

        // Mock StoryManager
        mockStoryManager = {
            startNewStory: jest.fn(),
            getCurrentStory: jest.fn(() => null)
        };

        adventureSystem = new AdventureSystem(mockGameData, mockMistralAPI, mockStoryManager);
    });

    describe('Lifecycle Management', () => {
        test('should start adventure and pause game', () => {
            adventureSystem.startAdventure();
            
            expect(adventureSystem.isAdventureActive()).toBe(true);
            expect(mockGameData.paused).toBe(true);
        });

        test('should end adventure and unpause game', () => {
            adventureSystem.startAdventure();
            adventureSystem.endAdventure();
            
            expect(adventureSystem.isAdventureActive()).toBe(false);
            expect(mockGameData.paused).toBe(false);
        });

        test('should prevent starting adventure when one is active', () => {
            adventureSystem.startAdventure();
            
            expect(() => adventureSystem.startAdventure()).toThrow('Adventure already in progress');
        });

        test('should track adventure state correctly', () => {
            expect(adventureSystem.isAdventureActive()).toBe(false);
            expect(adventureSystem.getSuccessCount()).toBe(0);
            expect(adventureSystem.getTurnCount()).toBe(0);

            adventureSystem.startAdventure();
            expect(adventureSystem.isAdventureActive()).toBe(true);

            adventureSystem.trackChoiceResult(true, 'aggressive');
            adventureSystem.trackChoiceResult(false, 'diplomatic');
            
            expect(adventureSystem.getSuccessCount()).toBe(1);
            expect(adventureSystem.getFailureCount()).toBe(1);
            expect(adventureSystem.getTurnCount()).toBe(2);

            adventureSystem.endAdventure();
            expect(adventureSystem.getSuccessCount()).toBe(0);
            expect(adventureSystem.getTurnCount()).toBe(0);
        });
    });

    describe('Pause Control', () => {
        test('should prevent unpause during active adventure', () => {
            adventureSystem.startAdventure();
            
            expect(adventureSystem.canUnpauseGame()).toBe(false);
            expect(mockGameData.paused).toBe(true);
        });

        test('should allow unpause when no adventure is active', () => {
            expect(adventureSystem.isAdventureActive()).toBe(false);
            expect(adventureSystem.canUnpauseGame()).toBe(true);
        });
    });

    describe('State Reset', () => {
        test('should reset adventure state', () => {
            adventureSystem.successCount = 5;
            adventureSystem.failureCount = 2;
            adventureSystem.turnCount = 7;
            adventureSystem.choiceHistory = [{ choice: 'test', success: true }];

            adventureSystem.resetAdventureState();

            expect(adventureSystem.successCount).toBe(0);
            expect(adventureSystem.failureCount).toBe(0);
            expect(adventureSystem.turnCount).toBe(0);
            expect(adventureSystem.choiceHistory).toEqual([]);
        });

        test('should reset stats when starting new adventure', () => {
            adventureSystem.successCount = 5;
            adventureSystem.failureCount = 2;

            adventureSystem.startAdventure();

            expect(adventureSystem.successCount).toBe(0);
            expect(adventureSystem.failureCount).toBe(0);
            expect(adventureSystem.turnCount).toBe(0);
        });
    });

    describe('Reward Calculations', () => {
        test('should calculate base XP from taskData', () => {
            const baseXP = adventureSystem.calculateBaseXP();
            
            // Average level = (10 + 8 + 12 + 6 + 5 + 10) / 6 = 8.5
            // Expected: 500 + Math.floor(8.5 * 15) = 500 + 127 = 627
            expect(baseXP).toBe(627);
        });

        test('should return default XP when no taskData', () => {
            adventureSystem.gameState.taskData = null;
            const baseXP = adventureSystem.calculateBaseXP();
            
            expect(baseXP).toBe(500);
        });

        test('should clamp XP between 500 and 5000', () => {
            adventureSystem.gameState.taskData = {
                'Skill1': { level: 0 },
                'Skill2': { level: 0 }
            };
            
            let baseXP = adventureSystem.calculateBaseXP();
            expect(baseXP).toBe(500); // Minimum

            adventureSystem.gameState.taskData = {
                'Skill1': { level: 1000 },
                'Skill2': { level: 1000 }
            };
            
            baseXP = adventureSystem.calculateBaseXP();
            expect(baseXP).toBe(5000); // Maximum
        });

        test('should calculate rewards based on choice and success', () => {
            const choice = {
                text: 'Test choice',
                choiceType: 'aggressive',
                successProbability: 0.5
            };

            const rewardsSuccess = adventureSystem.calculateRewards(choice, true);
            expect(rewardsSuccess.success).toBe(true);
            expect(rewardsSuccess.xp).toBeGreaterThan(0);

            const rewardsFailure = adventureSystem.calculateRewards(choice, false);
            expect(rewardsFailure.success).toBe(false);
            expect(rewardsFailure.xp).toBeLessThan(rewardsSuccess.xp);
        });

        test('should apply rewards to appropriate skills', () => {
            const rewards = {
                xp: 100,
                choiceType: 'aggressive',
                success: true
            };

            adventureSystem.applyRewards(rewards);

            // 'aggressive' maps to 'Strength'
            expect(mockGameData.taskData['Strength'].addXp).toHaveBeenCalledWith(100);
        });
    });

    describe('Career-Based Adventures', () => {
        test('should have career analyzer and prompt generator', () => {
            expect(adventureSystem.careerAnalyzer).toBeDefined();
            expect(adventureSystem.promptGenerator).toBeDefined();
            expect(adventureSystem.storyTreeManager).toBeDefined();
            expect(adventureSystem.storyTreeBuilder).toBeDefined();
        });

        test('should end career adventure with no active adventure', () => {
            const result = adventureSystem.endCareerBasedAdventure();
            
            expect(result.success).toBe(true);
            expect(result.message).toContain('No active adventure');
        });

        test('should track adventure metadata', () => {
            adventureSystem.currentAdventure = {
                amuletPrompt: 'age25',
                careerCategory: 'Common work',
                startTime: Date.now()
            };

            const result = adventureSystem.endCareerBasedAdventure();
            
            expect(result.success).toBe(true);
            expect(result.summary).toBeDefined();
            expect(result.summary.amuletPrompt).toBe('age25');
            expect(result.summary.careerCategory).toBe('Common work');
        });
    });

    describe('Choice Tracking', () => {
        test('should track choice types', () => {
            adventureSystem.trackChoiceResult(true, 'aggressive');
            adventureSystem.trackChoiceResult(false, 'diplomatic');
            adventureSystem.trackChoiceResult(true, 'cautious');
            
            expect(adventureSystem.choiceTypes.aggressive).toBe(1);
            expect(adventureSystem.choiceTypes.diplomatic).toBe(1);
            expect(adventureSystem.choiceTypes.cautious).toBe(1);
        });

        test('should maintain choice history', () => {
            adventureSystem.trackChoiceResult(true, 'aggressive');
            
            expect(adventureSystem.choiceHistory).toHaveLength(1);
            expect(adventureSystem.choiceHistory[0].success).toBe(true);
        });
    });

    describe('Integration Flow', () => {
        test('should complete basic adventure flow', () => {
            // Start
            expect(adventureSystem.isAdventureActive()).toBe(false);
            adventureSystem.startAdventure();
            expect(adventureSystem.isAdventureActive()).toBe(true);
            expect(mockGameData.paused).toBe(true);

            // Track choices
            adventureSystem.trackChoiceResult(true, 'aggressive');
            expect(adventureSystem.getSuccessCount()).toBe(1);

            // End
            adventureSystem.endAdventure();
            expect(adventureSystem.isAdventureActive()).toBe(false);
            expect(mockGameData.paused).toBe(false);
            expect(adventureSystem.getSuccessCount()).toBe(0);
        });
    });
});

