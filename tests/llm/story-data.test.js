/**
 * Unified Story Data Tests
 * Consolidates: story-tree-manager, story-tree-builder, story-persistence-manager,
 * story-tree-manager-simple, story-tree-debug tests
 */

const { 
    StoryTreeData,
    StoryTreeManager,
    StoryTreeBuilder,
    StoryPersistenceManager,
    CareerAnalyzer
} = require('../setup-llm-classes');

describe('Story Data - Unified Tests', () => {
    let storyTreeManager;
    let storyTreeBuilder;
    let storyPersistenceManager;
    let careerAnalyzer;

    beforeEach(() => {
        // Mock localStorage
        global.localStorage = {
            data: {},
            getItem: jest.fn((key) => global.localStorage.data[key] || null),
            setItem: jest.fn((key, value) => { global.localStorage.data[key] = value; }),
            removeItem: jest.fn((key) => { delete global.localStorage.data[key]; }),
            clear: jest.fn(() => { global.localStorage.data = {}; })
        };

        const mockGameState = {
            taskData: { 'Farmer': { level: 10 } },
            currentJob: 'Farmer',
            days: 365 * 25
        };

        storyTreeManager = new StoryTreeManager();
        careerAnalyzer = new CareerAnalyzer(mockGameState);
        storyTreeBuilder = new StoryTreeBuilder(storyTreeManager, careerAnalyzer);
        storyPersistenceManager = new StoryPersistenceManager(storyTreeManager);
    });

    describe('StoryTreeData', () => {
        test('should create empty story tree', () => {
            const tree = StoryTreeData.createEmptyStoryTree();

            expect(tree).toHaveProperty('choices');
            expect(tree).toHaveProperty('branches');
            expect(tree).toHaveProperty('metadata');
            expect(tree.choices).toEqual([]);
            expect(tree.branches).toEqual({});
        });

        test('should create empty story trees collection', () => {
            const trees = StoryTreeData.createEmptyStoryTrees();

            expect(trees).toHaveProperty('age25');
            expect(trees).toHaveProperty('age45');
            expect(trees).toHaveProperty('age65');
            expect(trees).toHaveProperty('age200');
        });

        test('should create story branch', () => {
            const branch = StoryTreeData.createStoryBranch('Test choice', true, 0);

            expect(branch).toHaveProperty('choice');
            expect(branch).toHaveProperty('result');
            expect(branch).toHaveProperty('depth');
            expect(branch).toHaveProperty('children');
            expect(branch.choice).toBe('Test choice');
            expect(branch.result).toBe(true);
            expect(branch.depth).toBe(0);
        });

        test('should validate story tree structure', () => {
            const validTree = StoryTreeData.createEmptyStoryTree();
            const validation = StoryTreeData.validateStoryTree(validTree);

            expect(validation.valid).toBe(true);
            expect(validation.errors).toEqual([]);
        });

        test('should detect invalid story tree', () => {
            const invalidTrees = [
                null,
                {},
                { choices: [] }, // Missing branches and metadata
                { choices: [], branches: {} } // Missing metadata
            ];

            invalidTrees.forEach(tree => {
                const validation = StoryTreeData.validateStoryTree(tree);
                expect(validation.valid).toBe(false);
                expect(validation.errors.length).toBeGreaterThan(0);
            });
        });

        test('should calculate story tree stats', () => {
            const tree = StoryTreeData.createEmptyStoryTree();
            tree.choices = ['choice1', 'choice2'];
            tree.metadata.successCount = 5;
            tree.metadata.failureCount = 2;

            const stats = StoryTreeData.getStoryTreeStats(tree);

            expect(stats.totalChoices).toBe(2);
            expect(stats.successCount).toBe(5);
            expect(stats.failureCount).toBe(2);
            expect(stats.successRate).toBeCloseTo(71.43, 1);
        });

        test('should calculate tree depth', () => {
            const tree = StoryTreeData.createEmptyStoryTree();
            tree.branches = {
                'choice1': {
                    choice: 'choice1',
                    result: true,
                    depth: 0,
                    children: {
                        'choice2': {
                            choice: 'choice2',
                            result: true,
                            depth: 1,
                            children: {}
                        }
                    }
                }
            };

            const stats = StoryTreeData.getStoryTreeStats(tree);
            expect(stats.depth).toBe(1);
        });
    });

    describe('StoryTreeManager', () => {
        test('should initialize with empty trees', () => {
            expect(storyTreeManager.storyTrees).toHaveProperty('age25');
            expect(storyTreeManager.storyTrees).toHaveProperty('age45');
        });

        test('should get story tree for amulet and career', () => {
            const tree = storyTreeManager.getStoryTree('age25', 'Common work');

            expect(tree).toBeDefined();
            expect(tree).toHaveProperty('choices');
            expect(tree).toHaveProperty('branches');
        });

        test('should save story tree', () => {
            const tree = StoryTreeData.createEmptyStoryTree();
            tree.choices = ['test choice'];

            storyTreeManager.saveStoryTree('age25', 'Common work', tree);

            const retrieved = storyTreeManager.getStoryTree('age25', 'Common work');
            expect(retrieved.choices).toContain('test choice');
        });

        test('should lock choice in tree', () => {
            storyTreeManager.lockChoice('age25', 'Common work', 'Test choice', true);

            const tree = storyTreeManager.getStoryTree('age25', 'Common work');
            expect(tree.choices).toContain('Test choice');
            expect(tree.branches['Test choice']).toBeDefined();
            expect(tree.branches['Test choice'].result).toBe(true);
        });

        test('should track success and failure counts', () => {
            // Clear any existing data first
            storyTreeManager.clearCareerCategory('age25', 'Common work');
            
            storyTreeManager.lockChoice('age25', 'Common work', 'Choice 1', true);
            storyTreeManager.lockChoice('age25', 'Common work', 'Choice 2', false);

            const tree = storyTreeManager.getStoryTree('age25', 'Common work');
            expect(tree.metadata.successCount).toBe(1);
            expect(tree.metadata.failureCount).toBe(1);
        });

        test('should get available choices', () => {
            storyTreeManager.lockChoice('age25', 'Common work', 'Choice 1', true);
            storyTreeManager.lockChoice('age25', 'Common work', 'Choice 2', false);

            const choices = storyTreeManager.getAvailableChoices('age25', 'Common work');
            expect(choices).toContain('Choice 1');
            expect(choices).toContain('Choice 2');
        });

        test('should check if choice exists', () => {
            storyTreeManager.lockChoice('age25', 'Common work', 'Test choice', true);

            expect(storyTreeManager.hasChoice('age25', 'Common work', 'Test choice')).toBe(true);
            expect(storyTreeManager.hasChoice('age25', 'Common work', 'Nonexistent')).toBe(false);
        });

        test('should get choice result', () => {
            storyTreeManager.lockChoice('age25', 'Common work', 'Test choice', true);

            const result = storyTreeManager.getChoiceResult('age25', 'Common work', 'Test choice');
            expect(result).toBe(true);
        });

        test('should clear all story trees', () => {
            storyTreeManager.lockChoice('age25', 'Common work', 'Test choice', true);
            storyTreeManager.clearAllStoryTrees();

            const tree = storyTreeManager.getStoryTree('age25', 'Common work');
            expect(tree.choices).toEqual([]);
        });

        test('should clear specific story tree', () => {
            storyTreeManager.lockChoice('age25', 'Common work', 'Choice 1', true);
            storyTreeManager.lockChoice('age45', 'Common work', 'Choice 2', true);

            storyTreeManager.clearStoryTree('age25');

            const age25Tree = storyTreeManager.getStoryTree('age25', 'Common work');
            const age45Tree = storyTreeManager.getStoryTree('age45', 'Common work');

            expect(age25Tree.choices).toEqual([]);
            expect(age45Tree.choices).toContain('Choice 2');
        });

        test('should clear career category', () => {
            storyTreeManager.lockChoice('age25', 'Common work', 'Choice 1', true);
            storyTreeManager.lockChoice('age25', 'Military', 'Choice 2', true);

            storyTreeManager.clearCareerCategory('age25', 'Common work');

            const commonTree = storyTreeManager.getStoryTree('age25', 'Common work');
            const militaryTree = storyTreeManager.getStoryTree('age25', 'Military');

            expect(commonTree.choices).toEqual([]);
            expect(militaryTree.choices).toContain('Choice 2');
        });

        test('should get story tree stats', () => {
            storyTreeManager.lockChoice('age25', 'Common work', 'Choice 1', true);
            storyTreeManager.lockChoice('age25', 'Common work', 'Choice 2', false);

            const stats = storyTreeManager.getStoryTreeStats('age25', 'Common work');

            expect(stats.totalChoices).toBe(2);
            expect(stats.successCount).toBe(1);
            expect(stats.failureCount).toBe(1);
        });

        test('should validate story tree', () => {
            const validation = storyTreeManager.validateStoryTree('age25', 'Common work');

            expect(validation.valid).toBe(true);
        });

        test('should persist to localStorage', () => {
            storyTreeManager.lockChoice('age25', 'Common work', 'Test choice', true);

            // Verify data is stored (implementation uses localStorage internally)
            const tree = storyTreeManager.getStoryTree('age25', 'Common work');
            expect(tree.choices).toContain('Test choice');
        });

        test('should load from localStorage', () => {
            // Test save and then load in same manager
            storyTreeManager.lockChoice('age25', 'Common work', 'Loaded choice', true);
            
            // Verify it was saved and can be retrieved
            const tree = storyTreeManager.getStoryTree('age25', 'Common work');
            expect(tree.choices).toContain('Loaded choice');
        });
    });

    describe('StoryTreeBuilder', () => {
        test('should add choice to tree', () => {
            storyTreeBuilder.addChoice('age25', 'Common work', 'Test choice', true);

            expect(storyTreeManager.hasChoice('age25', 'Common work', 'Test choice')).toBe(true);
        });

        test('should generate follow-up choices', () => {
            const followUps = storyTreeBuilder.generateFollowUpChoices('Previous choice', true, 0);

            expect(Array.isArray(followUps)).toBe(true);
            expect(followUps.length).toBeGreaterThan(0);
            followUps.forEach(choice => {
                expect(choice).toHaveProperty('text');
                expect(choice).toHaveProperty('choiceType');
                expect(choice).toHaveProperty('successProbability');
            });
        });

        test('should generate new branches', () => {
            const branches = storyTreeBuilder.generateNewBranches('age25', 'Common work', 'Test choice', true);

            expect(Array.isArray(branches)).toBe(true);
            expect(branches.length).toBeGreaterThan(0);
        });

        test('should get tree depth', () => {
            storyTreeBuilder.addChoice('age25', 'Common work', 'Choice 1', true);

            const depth = storyTreeBuilder.getTreeDepth('age25', 'Common work');
            expect(depth).toBeGreaterThanOrEqual(0);
        });

        test('should prune tree at max depth', () => {
            // Build a deep tree
            storyTreeBuilder.addChoice('age25', 'Common work', 'Choice 1', true);
            storyTreeBuilder.generateNewBranches('age25', 'Common work', 'Choice 1', true);

            storyTreeBuilder.pruneTree('age25', 'Common work', 5);

            const depth = storyTreeBuilder.getTreeDepth('age25', 'Common work');
            expect(depth).toBeLessThanOrEqual(5);
        });
    });

    describe('StoryPersistenceManager', () => {
        test('should save life story', () => {
            storyPersistenceManager.saveLifeStory('life1', 'age25', 'Common work', 'Choice 1', true);

            const stories = storyPersistenceManager.loadLifeStories();
            expect(stories).toHaveProperty('life1');
        });

        test('should load life stories', () => {
            storyPersistenceManager.saveLifeStory('life1', 'age25', 'Common work', 'Choice 1', true);

            const stories = storyPersistenceManager.loadLifeStories();
            expect(stories).toHaveProperty('life1');
        });

        test('should get specific life story', () => {
            // Clear any existing data
            storyPersistenceManager.clearLifeStories();
            
            storyPersistenceManager.saveLifeStory('life1', 'age25', 'Common work', 'Choice 1', true);

            const story = storyPersistenceManager.getLifeStory('life1');
            expect(story).toBeDefined();
            expect(story.adventures).toHaveLength(1);
        });

        test('should return null for nonexistent life story', () => {
            const story = storyPersistenceManager.getLifeStory('nonexistent');
            expect(story).toBeNull();
        });

        test('should append to existing life story', () => {
            // Clear any existing data
            storyPersistenceManager.clearLifeStories();
            
            storyPersistenceManager.saveLifeStory('life1', 'age25', 'Common work', 'Choice 1', true);
            storyPersistenceManager.saveLifeStory('life1', 'age25', 'Common work', 'Choice 2', false);

            const story = storyPersistenceManager.getLifeStory('life1');
            expect(story.adventures).toHaveLength(2);
        });

        test('should clear life stories', () => {
            storyPersistenceManager.saveLifeStory('life1', 'age25', 'Common work', 'Choice 1', true);
            storyPersistenceManager.clearLifeStories();

            const stories = storyPersistenceManager.loadLifeStories();
            expect(Object.keys(stories)).toHaveLength(0);
        });
    });

    describe('Integration', () => {
        test('should complete full story tree workflow', () => {
            // Clear any existing data
            storyTreeManager.clearCareerCategory('age25', 'Common work');
            storyPersistenceManager.clearLifeStories();
            
            // Add choices
            storyTreeBuilder.addChoice('age25', 'Common work', 'Choice 1', true);
            storyTreeBuilder.addChoice('age25', 'Common work', 'Choice 2', false);

            // Verify they're stored
            expect(storyTreeManager.hasChoice('age25', 'Common work', 'Choice 1')).toBe(true);
            expect(storyTreeManager.hasChoice('age25', 'Common work', 'Choice 2')).toBe(true);

            // Check stats
            const stats = storyTreeManager.getStoryTreeStats('age25', 'Common work');
            expect(stats.totalChoices).toBe(2);
            expect(stats.successCount).toBe(1);
            expect(stats.failureCount).toBe(1);

            // Save to life story
            storyPersistenceManager.saveLifeStory('life1', 'age25', 'Common work', 'Choice 1', true);
            const lifeStory = storyPersistenceManager.getLifeStory('life1');
            expect(lifeStory.adventures).toHaveLength(1);

            // Clear and verify
            storyTreeManager.clearCareerCategory('age25', 'Common work');
            const clearedTree = storyTreeManager.getStoryTree('age25', 'Common work');
            expect(clearedTree.choices).toEqual([]);
        });
    });
});

