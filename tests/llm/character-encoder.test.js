const { TestMocks, TestDataFactory } = require('../test-helpers');
// Handle both Node.js and browser environments
let CharacterEncoder;
try {
  CharacterEncoder = require('../../llm/utils/CharacterEncoder');
} catch (e) {
  // For browser environment, use global
  CharacterEncoder = global.CharacterEncoder;
}

describe('Character Encoder Tests', () => {
  let mockGameData;

  beforeEach(() => {
    TestMocks.setupStandardMocks();
    
    // Create mock game data that represents a typical game state
    mockGameData = {
      days: 365 * 25, // 25 years old
      coins: 5000,
      evil: 10,
      currentJob: { name: 'Knight', level: 15, getIncome: () => 100 },
      currentSkill: { name: 'Strength', level: 20, getEffect: () => 1.2 },
      currentProperty: { name: 'Castle', getExpense: () => 200 },
      currentMisc: [
        { name: 'Sword', getExpense: () => 50 },
        { name: 'Shield', getExpense: () => 30 }
      ],
      rebirthOneCount: 1,
      rebirthTwoCount: 0,
      taskData: {
        'Knight': { name: 'Knight', level: 15, getIncome: () => 100 },
        'Strength': { name: 'Strength', level: 20, getEffect: () => 1.2 },
        'Meditation': { name: 'Meditation', level: 5, getEffect: () => 1.05 }
      },
      itemData: {
        'Castle': { name: 'Castle', getExpense: () => 200 },
        'Sword': { name: 'Sword', getExpense: () => 50 },
        'Shield': { name: 'Shield', getExpense: () => 30 }
      }
    };
  });

  describe('Character State Encoding', () => {
    test('should encode basic character stats correctly', () => {
      const encoded = CharacterEncoder.encodeCharacterState(mockGameData);
      
      expect(encoded.age).toBe(25);
      expect(encoded.days).toBe(365 * 25);
      expect(encoded.coins).toBe(5000);
      expect(encoded.evil).toBe(10);
    });

    test('should encode current activities', () => {
      const encoded = CharacterEncoder.encodeCharacterState(mockGameData);
      
      expect(encoded.currentJob).toBe('Knight');
      expect(encoded.currentSkill).toBe('Strength');
      expect(encoded.currentProperty).toBe('Castle');
    });

    test('should handle missing current activities gracefully', () => {
      const incompleteGameData = {
        ...mockGameData,
        currentJob: null,
        currentSkill: null,
        currentProperty: null
      };
      
      const encoded = CharacterEncoder.encodeCharacterState(incompleteGameData);
      
      expect(encoded.currentJob).toBe('Unemployed');
      expect(encoded.currentSkill).toBe('None');
      expect(encoded.currentProperty).toBe('Homeless');
    });

    test('should encode rebirth count correctly', () => {
      const encoded = CharacterEncoder.encodeCharacterState(mockGameData);
      
      expect(encoded.rebirthCount).toBe(1);
    });

    test('should determine if character is alive', () => {
      const encoded = CharacterEncoder.encodeCharacterState(mockGameData);
      
      expect(typeof encoded.isAlive).toBe('boolean');
    });
  });

  describe('Skills Encoding', () => {
    test('should encode skills with correct structure', () => {
      const encoded = CharacterEncoder.encodeCharacterState(mockGameData);
      
      expect(Array.isArray(encoded.skills)).toBe(true);
      expect(encoded.skills.length).toBeGreaterThan(0);
      
      const strengthSkill = encoded.skills.find(skill => skill.name === 'Strength');
      expect(strengthSkill).toBeDefined();
      expect(strengthSkill.level).toBe(20);
      expect(strengthSkill.effect).toBe(1.2);
      expect(typeof strengthSkill.description).toBe('string');
    });

    test('should filter out jobs from skills', () => {
      const encoded = CharacterEncoder.encodeCharacterState(mockGameData);
      
      const knightInSkills = encoded.skills.find(skill => skill.name === 'Knight');
      expect(knightInSkills).toBeUndefined();
    });
  });

  describe('Jobs Encoding', () => {
    test('should encode jobs with correct structure', () => {
      const encoded = CharacterEncoder.encodeCharacterState(mockGameData);
      
      expect(Array.isArray(encoded.jobs)).toBe(true);
      
      const knightJob = encoded.jobs.find(job => job.name === 'Knight');
      expect(knightJob).toBeDefined();
      expect(knightJob.level).toBe(15);
      expect(knightJob.income).toBe(100);
    });

    test('should filter out skills from jobs', () => {
      const encoded = CharacterEncoder.encodeCharacterState(mockGameData);
      
      const strengthInJobs = encoded.jobs.find(job => job.name === 'Strength');
      expect(strengthInJobs).toBeUndefined();
    });
  });

  describe('Items Encoding', () => {
    test('should encode properties correctly', () => {
      const encoded = CharacterEncoder.encodeCharacterState(mockGameData);
      
      expect(Array.isArray(encoded.properties)).toBe(true);
      
      const castle = encoded.properties.find(prop => prop.name === 'Castle');
      expect(castle).toBeDefined();
      expect(castle.expense).toBe(200);
    });

    test('should encode misc items correctly', () => {
      const encoded = CharacterEncoder.encodeCharacterState(mockGameData);
      
      expect(Array.isArray(encoded.miscItems)).toBe(true);
      
      const sword = encoded.miscItems.find(item => item.name === 'Sword');
      expect(sword).toBeDefined();
      expect(sword.expense).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty task data', () => {
      const emptyGameData = {
        ...mockGameData,
        taskData: {},
        itemData: {}
      };
      
      const encoded = CharacterEncoder.encodeCharacterState(emptyGameData);
      
      expect(encoded.skills).toEqual([]);
      expect(encoded.jobs).toEqual([]);
      expect(encoded.properties).toEqual([]);
      expect(encoded.miscItems).toEqual([]);
    });

    test('should handle null/undefined values gracefully', () => {
      const nullGameData = {
        days: null,
        coins: undefined,
        evil: null,
        taskData: null,
        itemData: null
      };
      
      expect(() => CharacterEncoder.encodeCharacterState(nullGameData)).not.toThrow();
    });
  });
});
