// Tests for Item class
const { Task, Job, Skill, Item, Requirement, TaskRequirement, CoinRequirement, AgeRequirement, EvilRequirement, context } = require('../setup-classes');
const { TestMocks, TestDataFactory, TestAssertions } = require('../test-helpers');

describe('Item Class', () => {
  let item;

  beforeEach(() => {
    // Use standardized mock setup
    TestMocks.setupStandardMocks();
    
    // Create a test item using factory
    const baseData = TestDataFactory.createItemData();
    item = new Item(baseData);
  });

  describe('Constructor', () => {
    test('should initialize with correct properties', () => {
      const expectedData = TestDataFactory.createItemData();
      TestAssertions.expectItemProperties(item, expectedData);
    });
  });

  describe('getEffect', () => {
    test('should return 1 when item is not active (not current property or in misc)', () => {
      context.gameData.currentProperty = null;
      context.gameData.currentMisc = [];
      
      const effect = item.getEffect();
      expect(effect).toBe(1);
    });

    test('should return base effect when item is current property', () => {
      context.gameData.currentProperty = item;
      context.gameData.currentMisc = [];
      
      const effect = item.getEffect();
      expect(effect).toBe(1.5);
    });

    test('should return base effect when item is in current misc', () => {
      context.gameData.currentProperty = null;
      context.gameData.currentMisc = [item];
      
      const effect = item.getEffect();
      expect(effect).toBe(1.5);
    });

    test('should return base effect when item is both property and in misc', () => {
      context.gameData.currentProperty = item;
      context.gameData.currentMisc = [item];
      
      const effect = item.getEffect();
      expect(effect).toBe(1.5);
    });

    test('should work with different effect values', () => {
      item.baseData.effect = 2.0;
      context.gameData.currentProperty = item;
      
      const effect = item.getEffect();
      expect(effect).toBe(2.0);
    });
  });

  describe('getEffectDescription', () => {
    test('should return correct description for misc item', () => {
      const description = item.getEffectDescription();
      expect(description).toBe('x1.5 Test item effect');
    });

    test('should return "Happiness" for property items', () => {
      item.name = 'House';
      const description = item.getEffectDescription();
      expect(description).toBe('x1.5 Happiness');
    });

    test('should format numbers to 1 decimal place', () => {
      item.baseData.effect = 1.25;
      const description = item.getEffectDescription();
      expect(description).toBe('x1.3 Test item effect');
    });

    test('should work with different descriptions', () => {
      item.baseData.description = 'Job xp';
      const description = item.getEffectDescription();
      expect(description).toBe('x1.5 Job xp');
    });

    test('should handle property items with different names', () => {
      item.name = 'Tent';
      const description = item.getEffectDescription();
      expect(description).toBe('x1.5 Happiness');
    });
  });

  describe('getExpense', () => {
    test('should call applyMultipliers with base expense', () => {
      item.expenseMultipliers = [() => 0.8, () => 0.9];
      item.getExpense();
      
      expect(context.applyMultipliers).toHaveBeenCalledWith(100, item.expenseMultipliers);
    });

    test('should return result from applyMultipliers', () => {
      context.applyMultipliers.mockReturnValue(72);
      const expense = item.getExpense();
      expect(expense).toBe(72);
    });

    test('should work with no multipliers', () => {
      context.applyMultipliers.mockReturnValue(100);
      const expense = item.getExpense();
      expect(expense).toBe(100);
    });

    test('should work with multiple multipliers', () => {
      item.expenseMultipliers = [
        () => 0.8, // 20% discount
        () => 0.9  // 10% discount
      ];
      
      const expense = item.getExpense();
      expect(expense).toBe(72); // 100 * 0.8 * 0.9 = 72
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero expense', () => {
      item.baseData.expense = 0;
      context.applyMultipliers.mockReturnValue(0);
      const expense = item.getExpense();
      expect(expense).toBe(0);
    });

    test('should handle zero effect', () => {
      item.baseData.effect = 0;
      context.gameData.currentProperty = item;
      const effect = item.getEffect();
      expect(effect).toBe(0);
    });

    test('should handle negative effect', () => {
      item.baseData.effect = -0.5;
      context.gameData.currentProperty = item;
      const effect = item.getEffect();
      expect(effect).toBe(-0.5);
    });

    test('should handle very large expense values', () => {
      item.baseData.expense = 1000000;
      context.applyMultipliers.mockReturnValue(1000000);
      const expense = item.getExpense();
      expect(expense).toBe(1000000);
    });
  });

  describe('Property vs Misc Items', () => {
    test('should identify property items correctly', () => {
      const propertyItem = new Item({
        name: 'House',
        expense: 1000,
        effect: 2.0,
        description: 'Happiness'
      });
      
      const description = propertyItem.getEffectDescription();
      expect(description).toBe('x2.0 Happiness');
    });

    test('should identify misc items correctly', () => {
      const miscItem = new Item({
        name: 'Book',
        expense: 50,
        effect: 1.5,
        description: 'Skill xp'
      });
      
      const description = miscItem.getEffectDescription();
      expect(description).toBe('x1.5 Skill xp');
    });
  });
});
