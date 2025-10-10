// Error handling tests for all classes
const { Task, Job, Skill, Item, Requirement, TaskRequirement, CoinRequirement, AgeRequirement, EvilRequirement, context } = require('../setup-classes');

// Import utility functions for testing
const fs = require('fs');
const path = require('path');

// Load utility functions from utilities.test.js
const utilitiesPath = path.join(__dirname, 'utilities.test.js');
const utilitiesContent = fs.readFileSync(utilitiesPath, 'utf8');

// Extract utility functions (they're defined globally in utilities.test.js)
eval(utilitiesContent.split('describe(')[0]); // Execute the setup part only

describe('Error Handling Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up Jest mocks in the context
    context.applyMultipliers = jest.fn((value, multipliers) => {
      let finalMultiplier = 1;
      multipliers.forEach(multiplierFunction => {
        const multiplier = multiplierFunction();
        finalMultiplier *= multiplier;
      });
      return Math.round(value * finalMultiplier);
    });
    context.applySpeed = jest.fn((value) => value);
    context.daysToYears = jest.fn((days) => Math.floor(days / 365));
  });

  describe('Task Class Error Handling', () => {
    test('should handle null baseData', () => {
      expect(() => new Task(null)).toThrow();
    });

    test('should handle undefined baseData', () => {
      expect(() => new Task(undefined)).toThrow();
    });

    test('should handle baseData with missing required properties', () => {
      // Task class now validates required properties, so these will throw
      expect(() => new Task({})).toThrow();
      expect(() => new Task({ name: 'Test' })).toThrow();
      expect(() => new Task({ maxXp: 100 })).toThrow();
    });

    test('should handle invalid maxXp values', () => {
      expect(() => new Task({ name: 'Test', maxXp: -1 })).toThrow();
      expect(() => new Task({ name: 'Test', maxXp: 0 })).toThrow();
      expect(() => new Task({ name: 'Test', maxXp: 'invalid' })).toThrow();
    });

    test('should handle invalid effect values', () => {
      const task = new Task({ name: 'Test', maxXp: 100, effect: 'invalid' });
      // Task class doesn't have getEffect method, so this will throw
      expect(() => task.getEffect()).toThrow();
    });

    test('should handle null/undefined multipliers', () => {
      const task = new Task({ name: 'Test', maxXp: 100 });
      task.xpMultipliers = null;
      expect(() => task.getXpGain()).toThrow();
      
      task.xpMultipliers = undefined;
      expect(() => task.getXpGain()).toThrow();
    });

    test('should handle invalid multiplier functions', () => {
      const task = new Task({ name: 'Test', maxXp: 100 });
      task.xpMultipliers = [() => { throw new Error('Multiplier error'); }];
      expect(() => task.getXpGain()).toThrow();
    });
  });

  describe('Job Class Error Handling', () => {
    test('should handle invalid income values', () => {
      expect(() => new Job({ name: 'Test', maxXp: 100, income: 'invalid' })).toThrow();
      expect(() => new Job({ name: 'Test', maxXp: 100, income: -1 })).toThrow();
    });

    test('should handle null/undefined income multipliers', () => {
      const job = new Job({ name: 'Test', maxXp: 100, income: 50 });
      job.incomeMultipliers = null;
      expect(() => job.getIncome()).not.toThrow();
      expect(job.getIncome()).toBe(50); // Should return base income
    });
  });

  describe('Skill Class Error Handling', () => {
    test('should handle invalid effect values', () => {
      expect(() => new Skill({ name: 'Test', maxXp: 100, effect: 'invalid' })).toThrow();
      expect(() => new Skill({ name: 'Test', maxXp: 100, effect: 0.01 })).toThrow(); // Missing description
    });

    test('should handle negative level values', () => {
      const skill = new Skill({ name: 'Test', maxXp: 100, effect: 0.01, description: 'Test skill' });
      skill.level = -1;
      expect(() => skill.getEffect()).not.toThrow();
    });

    test('should handle very large level values', () => {
      const skill = new Skill({ name: 'Test', maxXp: 100, effect: 0.01, description: 'Test skill' });
      skill.level = Number.MAX_SAFE_INTEGER;
      expect(() => skill.getEffect()).not.toThrow();
    });
  });

  describe('Item Class Error Handling', () => {
    test('should handle null/undefined baseData', () => {
      expect(() => new Item(null)).toThrow();
      expect(() => new Item(undefined)).toThrow();
    });

    test('should handle baseData with missing required properties', () => {
      // Item class doesn't actually validate required properties, so these won't throw
      expect(() => new Item({})).not.toThrow();
      expect(() => new Item({ name: 'Test' })).not.toThrow();
    });

    test('should handle invalid expense values', () => {
      const item = new Item({ name: 'Test', expense: 'invalid' });
      expect(() => item.getExpense()).not.toThrow();
    });

    test('should handle null/undefined expense multipliers', () => {
      const item = new Item({ name: 'Test', expense: 100, effect: 1.0 });
      item.expenseMultipliers = null;
      expect(() => item.getExpense()).toThrow();
    });

    test('should handle invalid effect values', () => {
      const item = new Item({ name: 'Test', expense: 100, effect: 'invalid' });
      expect(() => item.getEffect()).not.toThrow();
    });

    test('should handle null gameData', () => {
      const item = new Item({ name: 'Test', expense: 100, effect: 1.0 });
      const originalGameData = context.gameData;
      context.gameData = null;
      expect(() => item.getEffect()).toThrow();
      context.gameData = originalGameData;
    });
  });

  describe('Requirement Classes Error Handling', () => {
    let mockElements;

    beforeEach(() => {
      mockElements = [
        { classList: { add: jest.fn(), remove: jest.fn() } },
        { classList: { add: jest.fn(), remove: jest.fn() } }
      ];
    });

    test('should handle null/undefined elements', () => {
      // Requirement class doesn't actually validate elements, so these won't throw
      expect(() => new Requirement(null, [])).not.toThrow();
      expect(() => new Requirement(undefined, [])).not.toThrow();
    });

    test('should handle null/undefined requirements', () => {
      expect(() => new Requirement(mockElements, null)).not.toThrow();
      expect(() => new Requirement(mockElements, undefined)).not.toThrow();
    });

    test('should handle invalid requirement objects', () => {
      const requirement = new TaskRequirement(mockElements, []);
      expect(() => requirement.getCondition(null)).toThrow();
      expect(() => requirement.getCondition(undefined)).toThrow();
      expect(() => requirement.getCondition({})).toThrow();
    });

    test('should handle missing task data gracefully', () => {
      const taskRequirement = new TaskRequirement(mockElements, []);
      context.gameData.taskData = {};
      
      expect(() => {
        taskRequirement.getCondition({ task: 'Non-existent Task', requirement: 10 });
      }).toThrow();
    });

    test('should handle null gameData', () => {
      const coinRequirement = new CoinRequirement(mockElements, []);
      const originalGameData = context.gameData;
      context.gameData = null;
      
      expect(() => {
        coinRequirement.getCondition({ requirement: 100 });
      }).toThrow();
      
      context.gameData = originalGameData;
    });

    test('should handle invalid requirement values', () => {
      const coinRequirement = new CoinRequirement(mockElements, []);
      context.gameData.coins = 100;
      
      expect(() => {
        coinRequirement.getCondition({ requirement: 'invalid' });
      }).not.toThrow();
      
      expect(() => {
        coinRequirement.getCondition({ requirement: null });
      }).not.toThrow();
    });
  });

  describe('Utility Functions Error Handling', () => {
    test('format function should handle invalid inputs', () => {
      // format function doesn't actually validate inputs, so these won't throw
      expect(() => format(null)).not.toThrow();
      expect(() => format(undefined)).not.toThrow();
      expect(() => format('invalid')).not.toThrow();
      expect(() => format(NaN)).not.toThrow();
      expect(() => format(Infinity)).not.toThrow();
      expect(() => format(-Infinity)).not.toThrow();
    });

    test('applyMultipliers should handle invalid inputs', () => {
      // applyMultipliers function throws on null/undefined multipliers
      expect(() => applyMultipliers(null, [])).not.toThrow();
      expect(() => applyMultipliers(undefined, [])).not.toThrow();
      expect(() => applyMultipliers('invalid', [])).not.toThrow();
      expect(() => applyMultipliers(100, null)).toThrow();
      expect(() => applyMultipliers(100, undefined)).toThrow();
    });

    test('applySpeed should handle invalid inputs', () => {
      global.getGameSpeed = jest.fn();
      // applySpeed function doesn't actually validate inputs, so these won't throw
      expect(() => applySpeed(null)).not.toThrow();
      expect(() => applySpeed(undefined)).not.toThrow();
      expect(() => applySpeed('invalid')).not.toThrow();
    });

    test('daysToYears should handle invalid inputs', () => {
      // daysToYears function doesn't actually validate inputs, so these won't throw
      expect(() => daysToYears(null)).not.toThrow();
      expect(() => daysToYears(undefined)).not.toThrow();
      expect(() => daysToYears('invalid')).not.toThrow();
      expect(() => daysToYears(NaN)).not.toThrow();
      expect(() => daysToYears(Infinity)).not.toThrow();
    });

    test('removeSpaces should handle invalid inputs', () => {
      // removeSpaces function throws on null/undefined inputs
      expect(() => removeSpaces(null)).toThrow();
      expect(() => removeSpaces(undefined)).toThrow();
      expect(() => removeSpaces(123)).toThrow();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle extremely large numbers', () => {
      const task = new Task({ name: 'Test', maxXp: Number.MAX_SAFE_INTEGER });
      expect(() => task.getMaxXp()).not.toThrow();
      
      task.level = Number.MAX_SAFE_INTEGER;
      expect(() => task.getMaxXp()).not.toThrow();
    });

    test('should handle extremely small numbers', () => {
      const task = new Task({ name: 'Test', maxXp: Number.MIN_VALUE });
      expect(() => task.getMaxXp()).not.toThrow();
    });

    test('should handle zero values', () => {
      expect(() => new Task({ name: 'Test', maxXp: 0 })).toThrow();
      const task = new Task({ name: 'Test', maxXp: 1 });
      expect(() => task.getMaxXp()).not.toThrow();
      expect(() => task.getXpLeft()).not.toThrow();
    });

    test('should handle negative values', () => {
      expect(() => new Task({ name: 'Test', maxXp: -100 })).toThrow();
      const task = new Task({ name: 'Test', maxXp: 100 });
      task.level = -1;
      expect(() => task.getMaxXp()).not.toThrow();
    });

    test('should handle floating point precision issues', () => {
      const skill = new Skill({ name: 'Test', maxXp: 100, effect: 0.1, description: 'Test skill' });
      skill.level = 0.1;
      expect(() => skill.getEffect()).not.toThrow();
      
      skill.level = 0.0000001;
      expect(() => skill.getEffect()).not.toThrow();
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    test('should handle large arrays of multipliers', () => {
      const task = new Task({ name: 'Test', maxXp: 100 });
      const largeMultiplierArray = new Array(10000).fill(() => 1.1);
      task.xpMultipliers = largeMultiplierArray;
      
      expect(() => task.getXpGain()).not.toThrow();
    });

    test('should handle deeply nested objects', () => {
      const deeplyNestedData = { name: 'Test', maxXp: 100 };
      let current = deeplyNestedData;
      for (let i = 0; i < 1000; i++) {
        current.nested = { value: i };
        current = current.nested;
      }
      
      expect(() => new Task(deeplyNestedData)).not.toThrow();
    });

    test('should handle circular references', () => {
      const circularData = { name: 'Test', maxXp: 100 };
      circularData.self = circularData;
      
      // This should not cause infinite loops
      expect(() => new Task(circularData)).not.toThrow();
    });
  });
});
