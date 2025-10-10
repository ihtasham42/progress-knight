const { TestMocks, TestDataFactory } = require('../test-helpers');
// Handle both Node.js and browser environments
let PromptGenerator, ContextualPromptGenerator;
try {
  const promptModule = require('../../llm/narrative/PromptGenerator');
  PromptGenerator = promptModule.PromptGenerator;
  ContextualPromptGenerator = promptModule.ContextualPromptGenerator;
} catch (e) {
  // For browser environment, use global
  PromptGenerator = global.PromptGenerator;
  ContextualPromptGenerator = global.ContextualPromptGenerator;
}

describe('Prompt Generator Tests', () => {
  let mockCharacterState;

  beforeEach(() => {
    TestMocks.setupStandardMocks();
    
    mockCharacterState = {
      age: 25,
      days: 365 * 25,
      coins: 5000,
      evil: 10,
      currentJob: 'Knight',
      currentSkill: 'Strength',
      currentProperty: 'Castle',
      rebirthCount: 1,
      isAlive: true,
      lifespan: 70,
      skills: [
        { name: 'Strength', level: 20, effect: 1.2, description: 'Military pay' },
        { name: 'Meditation', level: 5, effect: 1.05, description: 'Happiness' }
      ],
      jobs: [
        { name: 'Knight', level: 15, income: 100, maxLevel: 0 }
      ],
      properties: [
        { name: 'Castle', expense: 200 }
      ],
      miscItems: [
        { name: 'Sword', expense: 50 },
        { name: 'Shield', expense: 30 }
      ]
    };
  });

  describe('Exploration Prompt Generation', () => {
    test('should generate a valid exploration prompt', () => {
      const prompt = PromptGenerator.generateExplorationPrompt(mockCharacterState);
      
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(100);
    });

    test('should include character age in prompt', () => {
      const prompt = PromptGenerator.generateExplorationPrompt(mockCharacterState);
      
      expect(prompt).toContain('25 years old');
    });

    test('should include current job in prompt', () => {
      const prompt = PromptGenerator.generateExplorationPrompt(mockCharacterState);
      
      expect(prompt).toContain('Knight');
    });

    test('should include current skill in prompt', () => {
      const prompt = PromptGenerator.generateExplorationPrompt(mockCharacterState);
      
      expect(prompt).toContain('Strength');
    });

    test('should include wealth information in prompt', () => {
      const prompt = PromptGenerator.generateExplorationPrompt(mockCharacterState);
      
      expect(prompt).toContain('5.0K');
    });

    test('should include evil level in prompt', () => {
      const prompt = PromptGenerator.generateExplorationPrompt(mockCharacterState);
      
      expect(prompt).toContain('10');
    });

    test('should include rebirth count in prompt', () => {
      const prompt = PromptGenerator.generateExplorationPrompt(mockCharacterState);
      
      expect(prompt).toContain('1');
    });

    test('should include skills and abilities section', () => {
      const prompt = PromptGenerator.generateExplorationPrompt(mockCharacterState);
      
      expect(prompt).toContain('SKILLS & ABILITIES');
      expect(prompt).toContain('Strength (Level 20)');
      expect(prompt).toContain('Military pay');
    });

    test('should include current situation context', () => {
      const prompt = PromptGenerator.generateExplorationPrompt(mockCharacterState);
      
      expect(prompt).toContain('CURRENT SITUATION');
    });
  });

  describe('Context Building', () => {
    test('should build appropriate context for beggar', () => {
      const beggarState = {
        ...mockCharacterState,
        currentJob: 'Beggar'
      };
      
      const context = PromptGenerator.buildContext(beggarState);
      
      expect(context).toContain('destitute beggar');
      expect(context).toContain('struggling to survive');
    });

    test('should build appropriate context for knight', () => {
      const knightState = {
        ...mockCharacterState,
        currentJob: 'Knight'
      };
      
      const context = PromptGenerator.buildContext(knightState);
      
      expect(context).toContain('military professional');
      expect(context).toContain('combat training');
    });

    test('should build appropriate context for mage', () => {
      const mageState = {
        ...mockCharacterState,
        currentJob: 'Mage'
      };
      
      const context = PromptGenerator.buildContext(mageState);
      
      expect(context).toContain('magic practitioner');
      expect(context).toContain('arcane knowledge');
    });

    test('should build default context for unknown job', () => {
      const unknownState = {
        ...mockCharacterState,
        currentJob: 'Unknown Job'
      };
      
      const context = PromptGenerator.buildContext(unknownState);
      
      expect(context).toContain('adventurer exploring');
    });
  });

  describe('Contextual Prompt Generation', () => {
    test('should add evil context for high evil characters', () => {
      const evilState = {
        ...mockCharacterState,
        evil: 75
      };
      
      const prompt = ContextualPromptGenerator.generateExplorationPrompt(evilState);
      
      expect(prompt).toContain('darker');
      expect(prompt).toContain('sinister');
      expect(prompt).toContain('evil nature');
    });

    test('should add rebirth context for reborn characters', () => {
      const rebornState = {
        ...mockCharacterState,
        rebirthCount: 3
      };
      
      const prompt = ContextualPromptGenerator.generateExplorationPrompt(rebornState);
      
      expect(prompt).toContain('previous life');
      expect(prompt).toContain('wisdom');
    });

    test('should generate base prompt for normal characters', () => {
      const normalState = {
        ...mockCharacterState,
        evil: 5,
        rebirthCount: 0
      };
      
      const prompt = ContextualPromptGenerator.generateExplorationPrompt(normalState);
      
      expect(prompt).not.toContain('darker');
      expect(prompt).not.toContain('previous life');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing character state properties', () => {
      const incompleteState = {
        age: 25,
        currentJob: 'Knight'
        // Missing other properties
      };
      
      expect(() => PromptGenerator.generateExplorationPrompt(incompleteState)).not.toThrow();
    });

    test('should handle null/undefined values', () => {
      const nullState = {
        age: null,
        currentJob: null,
        skills: null,
        jobs: null
      };
      
      expect(() => PromptGenerator.generateExplorationPrompt(nullState)).not.toThrow();
    });

    test('should handle empty arrays', () => {
      const emptyState = {
        ...mockCharacterState,
        skills: [],
        jobs: [],
        properties: [],
        miscItems: []
      };
      
      const prompt = PromptGenerator.generateExplorationPrompt(emptyState);
      
      expect(prompt).toContain('SKILLS & ABILITIES');
      expect(prompt).toContain('CURRENT SITUATION');
    });
  });

  describe('Prompt Structure', () => {
    test('should have proper prompt structure', () => {
      const prompt = PromptGenerator.generateExplorationPrompt(mockCharacterState);
      
      expect(prompt).toContain('CHARACTER STATE:');
      expect(prompt).toContain('SKILLS & ABILITIES:');
      expect(prompt).toContain('CURRENT SITUATION:');
      expect(prompt).toContain('Generate a vivid, immersive description');
    });

    test('should be appropriate length for LLM processing', () => {
      const prompt = PromptGenerator.generateExplorationPrompt(mockCharacterState);
      
      expect(prompt.length).toBeGreaterThan(200);
      expect(prompt.length).toBeLessThan(2000); // Reasonable limit for API calls
    });
  });
});
