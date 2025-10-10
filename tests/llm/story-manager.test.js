const { TestMocks, TestDataFactory } = require('../test-helpers');

// Handle both Node.js and browser environments
let StoryManager;
try {
  StoryManager = require('../../llm/narrative/StoryManager');
} catch (e) {
  StoryManager = global.StoryManager;
}

describe('Story Manager Tests', () => {
  let storyManager;
  let mockCharacterState;

  beforeEach(() => {
    TestMocks.setupStandardMocks();
    
    storyManager = new StoryManager();
    
    mockCharacterState = {
      age: 25,
      days: 365 * 25,
      coins: 5000,
      evil: 10,
      rebirthCount: 0,
      currentJob: 'Knight',
      currentSkill: 'Strength',
      skills: [
        { name: 'Strength', level: 20, description: 'Physical power' },
        { name: 'Magic', level: 5, description: 'Arcane knowledge' }
      ],
      jobs: [
        { name: 'Knight', level: 15, income: 100 }
      ]
    };
  });

  describe('Story Initialization', () => {
    test('should initialize with empty state', () => {
      const context = storyManager.getStoryContext();
      
      expect(context.currentStory).toBeNull();
      expect(context.storyHistory).toEqual([]);
      expect(context.characterTraits).toEqual({});
      expect(context.storyTurns).toBe(0);
      expect(context.lastChoice).toBeNull();
    });

    test('should start new story with character state', () => {
      const storyContext = storyManager.startNewStory(mockCharacterState);
      
      expect(storyContext.genre).toBeDefined();
      expect(storyContext.characterTraits).toBeDefined();
      expect(storyContext.worldState).toBeDefined();
      expect(typeof storyContext.genre).toBe('string');
    });

    test('should determine genre based on character', () => {
      const storyContext = storyManager.startNewStory(mockCharacterState);
      
      expect(['Medieval Fantasy', 'High Fantasy', 'General Fantasy']).toContain(storyContext.genre);
    });

    test('should determine genre for evil characters', () => {
      const evilCharacter = { ...mockCharacterState, evil: 80 };
      const storyContext = storyManager.startNewStory(evilCharacter);
      
      expect(['Dark Fantasy', 'Gothic Horror']).toContain(storyContext.genre);
    });

    test('should determine genre for reborn characters', () => {
      const rebornCharacter = { ...mockCharacterState, rebirthCount: 2 };
      const storyContext = storyManager.startNewStory(rebornCharacter);
      
      expect(['High Fantasy', 'Ancient Fantasy']).toContain(storyContext.genre);
    });
  });

  describe('Character Traits', () => {
    test('should extract character traits correctly', () => {
      const storyContext = storyManager.startNewStory(mockCharacterState);
      
      expect(storyContext.characterTraits.age).toBe(25);
      expect(storyContext.characterTraits.wealth).toBe(5000);
      expect(storyContext.characterTraits.evil).toBe(10);
      expect(storyContext.characterTraits.rebirths).toBe(0);
    });

    test('should determine personality traits', () => {
      const storyContext = storyManager.startNewStory(mockCharacterState);
      
      expect(Array.isArray(storyContext.characterTraits.personality)).toBe(true);
      expect(storyContext.characterTraits.personality.length).toBeGreaterThan(0);
    });

    test('should determine motivations', () => {
      const storyContext = storyManager.startNewStory(mockCharacterState);
      
      expect(Array.isArray(storyContext.characterTraits.motivations)).toBe(true);
      expect(storyContext.characterTraits.motivations.length).toBeGreaterThan(0);
    });

    test('should determine fears', () => {
      const storyContext = storyManager.startNewStory(mockCharacterState);
      
      expect(Array.isArray(storyContext.characterTraits.fears)).toBe(true);
    });

    test('should determine goals', () => {
      const storyContext = storyManager.startNewStory(mockCharacterState);
      
      expect(Array.isArray(storyContext.characterTraits.goals)).toBe(true);
    });

    test('should identify primary skills', () => {
      const storyContext = storyManager.startNewStory(mockCharacterState);
      
      expect(Array.isArray(storyContext.characterTraits.primarySkills)).toBe(true);
      const strengthSkill = storyContext.characterTraits.primarySkills.find(s => s.name === 'Strength');
      expect(strengthSkill).toBeDefined();
      expect(strengthSkill.level).toBe(20);
    });

    test('should identify special abilities', () => {
      const storyContext = storyManager.startNewStory(mockCharacterState);
      
      expect(Array.isArray(storyContext.characterTraits.specialAbilities)).toBe(true);
    });
  });

  describe('Story Continuation', () => {
    beforeEach(() => {
      storyManager.startNewStory(mockCharacterState);
    });

    test('should continue story with choice', () => {
      const choice = 'Attack the dragon head-on';
      const continuation = storyManager.continueStory(choice, mockCharacterState);
      
      expect(continuation.storyTurns).toBe(1);
      expect(continuation.lastChoice).toBe(choice);
      expect(continuation.characterTraits).toBeDefined();
      expect(continuation.storyHistory).toHaveLength(1);
    });

    test('should track multiple turns', () => {
      storyManager.continueStory('First choice', mockCharacterState);
      storyManager.continueStory('Second choice', mockCharacterState);
      
      const context = storyManager.getStoryContext();
      expect(context.storyTurns).toBe(2);
      expect(context.storyHistory).toHaveLength(2);
    });

    test('should update character traits based on choice', () => {
      const aggressiveChoice = 'Fight the enemy';
      storyManager.continueStory(aggressiveChoice, mockCharacterState);
      
      const context = storyManager.getStoryContext();
      expect(context.characterTraits.aggression).toBeGreaterThan(0);
    });

    test('should update world state based on choice', () => {
      const timeChoice = 'Wait until nightfall';
      storyManager.continueStory(timeChoice, mockCharacterState);
      
      const context = storyManager.getStoryContext();
      expect(context.worldState.timeOfDay).toBeDefined();
    });
  });

  describe('World State Management', () => {
    test('should create initial world state', () => {
      const storyContext = storyManager.startNewStory(mockCharacterState);
      
      expect(storyContext.worldState.location).toBeDefined();
      expect(storyContext.worldState.timeOfDay).toBeDefined();
      expect(storyContext.worldState.weather).toBeDefined();
      expect(storyContext.worldState.politicalClimate).toBeDefined();
      expect(storyContext.worldState.magicalLevel).toBeDefined();
      expect(storyContext.worldState.dangerLevel).toBeDefined();
    });

    test('should determine starting location based on job', () => {
      const knightCharacter = { ...mockCharacterState, currentJob: 'Knight' };
      const storyContext = storyManager.startNewStory(knightCharacter);
      
      expect(storyContext.worldState.location).toContain('military');
    });

    test('should determine starting location for beggar', () => {
      const beggarCharacter = { ...mockCharacterState, currentJob: 'Beggar' };
      const storyContext = storyManager.startNewStory(beggarCharacter);
      
      expect(storyContext.worldState.location).toContain('slums');
    });

    test('should determine political climate for evil characters', () => {
      const evilCharacter = { ...mockCharacterState, evil: 80 };
      const storyContext = storyManager.startNewStory(evilCharacter);
      
      expect(storyContext.worldState.politicalClimate).toContain('chaotic');
    });
  });

  describe('Story Summary', () => {
    test('should provide story summary', () => {
      storyManager.startNewStory(mockCharacterState);
      storyManager.continueStory('Test choice', mockCharacterState);
      
      const summary = storyManager.getStorySummary();
      
      expect(summary.turns).toBe(1);
      expect(summary.genre).toBeDefined();
      expect(summary.lastChoice).toBe('Test choice');
      expect(summary.characterTraits).toBeDefined();
      expect(summary.worldState).toBeDefined();
      expect(typeof summary.hasActiveStory).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing character data', () => {
      const incompleteCharacter = {
        age: 25,
        coins: 1000,
        evil: 0,
        rebirthCount: 0
      };
      
      expect(() => storyManager.startNewStory(incompleteCharacter)).not.toThrow();
    });

    test('should handle null character state', () => {
      expect(() => storyManager.startNewStory(null)).not.toThrow();
    });

    test('should handle empty character state', () => {
      expect(() => storyManager.startNewStory({})).not.toThrow();
    });
  });
});




