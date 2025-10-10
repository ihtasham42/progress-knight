/**
 * Unified Career Analysis Tests
 * Consolidates: career-analyzer, career-weights, probability-calculator,
 * and career-based-prompt-generator tests
 */

const { 
    CareerAnalyzer,
    CareerWeights,
    ProbabilityCalculator,
    CareerBasedPromptGenerator,
    StoryTreeManager,
    StoryTreeBuilder
} = require('../setup-llm-classes');

describe('Career Analysis - Unified Tests', () => {
    let mockGameState;
    let careerAnalyzer;
    let storyTreeManager;
    let storyTreeBuilder;
    let promptGenerator;

    beforeEach(() => {
        // Mock localStorage
        global.localStorage = {
            data: {},
            getItem: jest.fn((key) => global.localStorage.data[key] || null),
            setItem: jest.fn((key, value) => { global.localStorage.data[key] = value; }),
            removeItem: jest.fn((key) => { delete global.localStorage.data[key]; }),
            clear: jest.fn(() => { global.localStorage.data = {}; })
        };

        mockGameState = {
            taskData: {
                'Beggar': { level: 10, maxLevel: 10 },
                'Farmer': { level: 5, maxLevel: 5 },
                'Squire': { level: 20, maxLevel: 20 },
                'Footman': { level: 8, maxLevel: 8 }
            },
            currentJob: 'Farmer',
            days: 365 * 25
        };

        careerAnalyzer = new CareerAnalyzer(mockGameState);
        storyTreeManager = new StoryTreeManager();
        storyTreeBuilder = new StoryTreeBuilder(storyTreeManager, careerAnalyzer);
        promptGenerator = new CareerBasedPromptGenerator(careerAnalyzer, storyTreeBuilder);
    });

    describe('CareerWeights', () => {
        test('should categorize jobs correctly', () => {
            expect(CareerWeights.getCategoryForJob('Beggar')).toBe('Common work');
            expect(CareerWeights.getCategoryForJob('Squire')).toBe('Military');
            expect(CareerWeights.getCategoryForJob('Apprentice mage')).toBe('The Arcane');
            expect(CareerWeights.getCategoryForJob('Unknown')).toBe('Common work'); // Default
        });

        test('should calculate category weights', () => {
            const commonWeight = CareerWeights.getCategoryWeight('Common work', 25);
            const militaryWeight = CareerWeights.getCategoryWeight('Military', 25);
            const arcaneWeight = CareerWeights.getCategoryWeight('The Arcane', 25);

            expect(commonWeight).toBeGreaterThan(0);
            expect(militaryWeight).toBeGreaterThan(commonWeight);
            expect(arcaneWeight).toBeGreaterThan(militaryWeight);
        });

        test('should apply age multiplier to weights', () => {
            const youngWeight = CareerWeights.getCategoryWeight('Military', 25);
            const oldWeight = CareerWeights.getCategoryWeight('Military', 100);

            expect(oldWeight).toBeGreaterThan(youngWeight);
        });

        test('should cap age multiplier at 2.0', () => {
            const veryOldWeight = CareerWeights.getCategoryWeight('Military', 500);
            const cappedWeight = 1.2 * 2.0; // base * max multiplier

            expect(veryOldWeight).toBe(cappedWeight);
        });
    });

    describe('ProbabilityCalculator', () => {
        test('should calculate base success probabilities', () => {
            const aggressive = ProbabilityCalculator.calculateSuccessProbability('aggressive', 'Common work', 1);
            const diplomatic = ProbabilityCalculator.calculateSuccessProbability('diplomatic', 'Common work', 1);
            const cautious = ProbabilityCalculator.calculateSuccessProbability('cautious', 'Common work', 1);
            const creative = ProbabilityCalculator.calculateSuccessProbability('creative', 'Common work', 1);

            expect(aggressive).toBeGreaterThan(0);
            expect(diplomatic).toBeGreaterThan(aggressive);
            expect(cautious).toBeGreaterThan(diplomatic);
            expect(creative).toBeGreaterThan(0);
        });

        test('should apply career category bonuses', () => {
            const militaryAggressive = ProbabilityCalculator.calculateSuccessProbability('aggressive', 'Military', 1);
            const commonAggressive = ProbabilityCalculator.calculateSuccessProbability('aggressive', 'Common work', 1);

            // Military gets bonus for aggressive choices
            expect(militaryAggressive).toBeGreaterThan(commonAggressive);
        });

        test('should apply character level bonus', () => {
            const lowLevel = ProbabilityCalculator.calculateSuccessProbability('aggressive', 'Common work', 1);
            const highLevel = ProbabilityCalculator.calculateSuccessProbability('aggressive', 'Common work', 50);

            expect(highLevel).toBeGreaterThan(lowLevel);
        });

        test('should clamp probabilities between 0.1 and 0.9', () => {
            // Test with extreme values
            const veryHigh = ProbabilityCalculator.calculateSuccessProbability('cautious', 'The Arcane', 100);
            const veryLow = ProbabilityCalculator.calculateSuccessProbability('aggressive', 'The Arcane', 1);

            expect(veryHigh).toBeLessThanOrEqual(0.9);
            expect(veryLow).toBeGreaterThanOrEqual(0.1);
        });
    });

    describe('CareerAnalyzer', () => {
        test('should determine current career category', () => {
            const category = careerAnalyzer.getCurrentCareerCategory();
            expect(category).toBe('Common work'); // Farmer is Common work
        });

        test('should calculate career weight', () => {
            const weight = careerAnalyzer.getCareerWeight();
            expect(weight).toBeGreaterThan(0);
        });

        test('should calculate character level', () => {
            const level = careerAnalyzer.getCharacterLevel();
            // Average of (10 + 5 + 20 + 8) / 4 = 10.75 = 10
            expect(level).toBe(10);
        });

        test('should return level 1 when no taskData', () => {
            const emptyAnalyzer = new CareerAnalyzer({ taskData: null });
            expect(emptyAnalyzer.getCharacterLevel()).toBe(1);
        });

        test('should analyze career progression', () => {
            const progression = careerAnalyzer.analyzeCareerProgression();

            expect(progression).toHaveProperty('category');
            expect(progression).toHaveProperty('weight');
            expect(progression).toHaveProperty('level');
            expect(progression).toHaveProperty('age');
            expect(progression.category).toBe('Common work');
            expect(progression.age).toBe(25);
        });
    });

    describe('CareerBasedPromptGenerator', () => {
        test('should generate career-based prompts', () => {
            const prompt = promptGenerator.generateCareerBasedPrompt('age25', 'Common work');

            expect(prompt).toHaveProperty('title');
            expect(prompt).toHaveProperty('story');
            expect(prompt).toHaveProperty('choices');
            expect(Array.isArray(prompt.choices)).toBe(true);
            expect(prompt.choices.length).toBeGreaterThan(0);
        });

        test('should generate different prompts for different career categories', () => {
            const commonPrompt = promptGenerator.generateCareerBasedPrompt('age25', 'Common work');
            const militaryPrompt = promptGenerator.generateCareerBasedPrompt('age25', 'Military');

            // Same age has same title, but different choices for different careers
            expect(commonPrompt.title).toEqual(militaryPrompt.title);
            // Choices should be different for different careers
            expect(Array.isArray(commonPrompt.choices)).toBe(true);
            expect(Array.isArray(militaryPrompt.choices)).toBe(true);
            expect(commonPrompt.choices[0].text).not.toEqual(militaryPrompt.choices[0].text);
        });

        test('should generate different prompts for different amulet stages', () => {
            const age25Prompt = promptGenerator.generateCareerBasedPrompt('age25', 'Common work');
            const age45Prompt = promptGenerator.generateCareerBasedPrompt('age45', 'Common work');

            expect(age25Prompt.title).not.toEqual(age45Prompt.title);
            expect(age25Prompt.story).not.toEqual(age45Prompt.story);
        });

        test('should include career context in prompts', () => {
            const prompt = promptGenerator.generateCareerBasedPrompt('age25', 'Common work');

            expect(prompt.story).toContain('merchant');
        });

        test('should generate choices with all required properties', () => {
            const prompt = promptGenerator.generateCareerBasedPrompt('age25', 'Common work');

            prompt.choices.forEach(choice => {
                expect(choice).toHaveProperty('text');
                expect(choice).toHaveProperty('description');
                expect(choice).toHaveProperty('choiceType');
                expect(choice).toHaveProperty('successProbability');
                expect(choice.successProbability).toBeGreaterThan(0);
                expect(choice.successProbability).toBeLessThanOrEqual(1);
            });
        });

        test('should generate different choice types', () => {
            const prompt = promptGenerator.generateCareerBasedPrompt('age25', 'Military');

            const choiceTypes = prompt.choices.map(choice => choice.choiceType);
            const uniqueTypes = [...new Set(choiceTypes)];

            expect(uniqueTypes.length).toBeGreaterThan(1);
        });

        test('should accept optional player level parameter', () => {
            const prompt = promptGenerator.generateCareerBasedPrompt('age25', 'Common work', null, 50);

            expect(prompt).toHaveProperty('choices');
            expect(prompt.choices.length).toBeGreaterThan(0);
        });

        test('should cache prompts', () => {
            const prompt1 = promptGenerator.generateCareerBasedPrompt('age25', 'Common work');
            const prompt2 = promptGenerator.generateCareerBasedPrompt('age25', 'Common work');

            expect(prompt1).toEqual(prompt2);
        });

        test('should clear cache', () => {
            promptGenerator.generateCareerBasedPrompt('age25', 'Common work');
            promptGenerator.clearCache();

            // Cache should be empty
            expect(promptGenerator.promptCache.size).toBe(0);
        });
    });

    describe('Prompt Validation', () => {
        test('should validate correct prompts', () => {
            const prompt = promptGenerator.generateCareerBasedPrompt('age25', 'Common work');
            const isValid = promptGenerator.validatePrompt(prompt);

            expect(isValid).toBe(true);
        });

        test('should reject invalid prompts', () => {
            const invalidPrompts = [
                null,
                {},
                { title: 'Test' }, // Missing story and choices
                { title: 'Test', story: 'Story' }, // Missing choices
                { title: 'Test', story: 'Story', choices: [] } // Empty choices
            ];

            invalidPrompts.forEach(prompt => {
                expect(promptGenerator.validatePrompt(prompt)).toBe(false);
            });
        });

        test('should validate choices', () => {
            const validChoice = {
                text: 'Test choice',
                choiceType: 'aggressive',
                successProbability: 0.5
            };

            expect(promptGenerator.validateChoice(validChoice)).toBe(true);

            const invalidChoices = [
                null,
                {},
                { text: 'Test' }, // Missing choiceType and probability
                { text: 'Test', choiceType: 'aggressive' }, // Missing probability
                { text: 'Test', choiceType: 'aggressive', successProbability: 1.5 } // Invalid probability
            ];

            invalidChoices.forEach(choice => {
                expect(promptGenerator.validateChoice(choice)).toBe(false);
            });
        });
    });

    describe('Prompt Statistics', () => {
        test('should track prompt generation statistics', () => {
            promptGenerator.generateCareerBasedPrompt('age25', 'Common work');
            promptGenerator.generateCareerBasedPrompt('age25', 'Military');

            const stats = promptGenerator.getPromptStats();

            expect(stats.totalPrompts).toBeGreaterThan(0);
            expect(stats.promptsByCategory).toHaveProperty('Common work');
            expect(stats.promptsByAmulet).toHaveProperty('age25');
        });

        test('should track choice type distribution', () => {
            promptGenerator.generateCareerBasedPrompt('age25', 'Common work');

            const stats = promptGenerator.getPromptStats();

            expect(stats.choiceTypeDistribution).toHaveProperty('aggressive');
            expect(stats.choiceTypeDistribution).toHaveProperty('diplomatic');
            expect(stats.choiceTypeDistribution).toHaveProperty('cautious');
            expect(stats.choiceTypeDistribution).toHaveProperty('creative');
        });
    });
});

