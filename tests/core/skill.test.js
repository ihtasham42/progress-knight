// Tests for Skill class
const { Task, Job, Skill, Item, Requirement, TaskRequirement, CoinRequirement, AgeRequirement, EvilRequirement } = require('../setup-classes');
const { TestMocks, TestDataFactory, TestAssertions } = require('../test-helpers');

describe('Skill Class', () => {
  let skill;

  beforeEach(() => {
    // Use standardized mock setup
    TestMocks.setupStandardMocks();
    
    // Create a test skill using factory
    const baseData = TestDataFactory.createSkillData();
    skill = new Skill(baseData);
  });

  describe('Constructor', () => {
    test('should initialize with correct properties', () => {
      const expectedData = TestDataFactory.createSkillData();
      TestAssertions.expectSkillProperties(skill, expectedData);
    });

    test('should inherit from Task class', () => {
      expect(skill instanceof Task).toBe(true);
    });
  });

  describe('getEffect', () => {
    test('should return 1 when level is 0', () => {
      const effect = skill.getEffect();
      expect(effect).toBe(1); // 1 + 0.01 * 0 = 1
    });

    test('should calculate effect correctly for level 10', () => {
      skill.level = 10;
      const effect = skill.getEffect();
      expect(effect).toBe(1.1); // 1 + 0.01 * 10 = 1.1
    });

    test('should calculate effect correctly for level 50', () => {
      skill.level = 50;
      const effect = skill.getEffect();
      expect(effect).toBe(1.5); // 1 + 0.01 * 50 = 1.5
    });

    test('should calculate effect correctly for level 100', () => {
      skill.level = 100;
      const effect = skill.getEffect();
      expect(effect).toBe(2); // 1 + 0.01 * 100 = 2
    });

    test('should work with different effect values', () => {
      skill.baseData.effect = 0.05;
      skill.level = 20;
      const effect = skill.getEffect();
      expect(effect).toBe(2); // 1 + 0.05 * 20 = 2
    });
  });

  describe('getEffectDescription', () => {
    test('should return correct description for level 0', () => {
      const description = skill.getEffectDescription();
      expect(description).toBe('x1.00 Test skill effect');
    });

    test('should return correct description for level 10', () => {
      skill.level = 10;
      const description = skill.getEffectDescription();
      expect(description).toBe('x1.10 Test skill effect');
    });

    test('should return correct description for level 50', () => {
      skill.level = 50;
      const description = skill.getEffectDescription();
      expect(description).toBe('x1.50 Test skill effect');
    });

    test('should format numbers to 2 decimal places', () => {
      skill.baseData.effect = 0.033; // This will give 1.033 at level 1
      skill.level = 1;
      const description = skill.getEffectDescription();
      expect(description).toBe('x1.03 Test skill effect');
    });

    test('should work with different descriptions', () => {
      skill.baseData.description = 'Job xp';
      skill.level = 25;
      const description = skill.getEffectDescription();
      expect(description).toBe('x1.25 Job xp');
    });
  });

  describe('Inheritance from Task', () => {
    test('should have all Task methods', () => {
      expect(typeof skill.getMaxXp).toBe('function');
      expect(typeof skill.getXpLeft).toBe('function');
      expect(typeof skill.getMaxLevelMultiplier).toBe('function');
      expect(typeof skill.getXpGain).toBe('function');
      expect(typeof skill.increaseXp).toBe('function');
    });

    test('should work with Task methods', () => {
      const maxXp = skill.getMaxXp();
      expect(maxXp).toBe(100);
      
      const xpLeft = skill.getXpLeft();
      expect(xpLeft).toBe(100);
      
      const maxLevelMultiplier = skill.getMaxLevelMultiplier();
      expect(maxLevelMultiplier).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle negative effect values', () => {
      skill.baseData.effect = -0.01;
      skill.level = 10;
      const effect = skill.getEffect();
      expect(effect).toBe(0.9); // 1 + (-0.01) * 10 = 0.9
    });

    test('should handle very large level values', () => {
      skill.level = 1000;
      const effect = skill.getEffect();
      expect(effect).toBe(11); // 1 + 0.01 * 1000 = 11
    });

    test('should handle zero effect value', () => {
      skill.baseData.effect = 0;
      skill.level = 50;
      const effect = skill.getEffect();
      expect(effect).toBe(1); // 1 + 0 * 50 = 1
    });
  });
});
