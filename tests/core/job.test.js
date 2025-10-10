// Tests for Job class
const { Task, Job, Skill, Item, Requirement, TaskRequirement, CoinRequirement, AgeRequirement, EvilRequirement, context } = require('../setup-classes');
const { TestMocks, TestDataFactory, TestAssertions } = require('../test-helpers');

describe('Job Class', () => {
  let job;

  beforeEach(() => {
    // Use standardized mock setup
    TestMocks.setupStandardMocks();
    
    // Create a test job using factory
    const baseData = TestDataFactory.createJobData();
    job = new Job(baseData);
  });

  describe('Constructor', () => {
    test('should initialize with correct properties', () => {
      const expectedData = TestDataFactory.createJobData();
      TestAssertions.expectJobProperties(job, expectedData);
    });

    test('should inherit from Task class', () => {
      expect(job instanceof Task).toBe(true);
    });
  });

  describe('getLevelMultiplier', () => {
    test('should return 1 when level is 0', () => {
      const multiplier = job.getLevelMultiplier();
      expect(multiplier).toBe(1); // 1 + Math.log10(0 + 1) = 1 + 0 = 1
    });

    test('should calculate multiplier correctly for level 9', () => {
      job.level = 9;
      const multiplier = job.getLevelMultiplier();
      expect(multiplier).toBe(2); // 1 + Math.log10(9 + 1) = 1 + 1 = 2
    });

    test('should calculate multiplier correctly for level 99', () => {
      job.level = 99;
      const multiplier = job.getLevelMultiplier();
      expect(multiplier).toBe(3); // 1 + Math.log10(99 + 1) = 1 + 2 = 3
    });

    test('should calculate multiplier correctly for level 999', () => {
      job.level = 999;
      const multiplier = job.getLevelMultiplier();
      expect(multiplier).toBe(4); // 1 + Math.log10(999 + 1) = 1 + 3 = 4
    });
  });

  describe('getIncome', () => {
    test('should call applyMultipliers with base income', () => {
      job.incomeMultipliers = [() => 1.5, () => 2.0];
      job.getIncome();
      
      expect(context.applyMultipliers).toHaveBeenCalledWith(50, job.incomeMultipliers);
    });

    test('should return result from applyMultipliers', () => {
      context.applyMultipliers.mockReturnValue(150);
      const income = job.getIncome();
      expect(income).toBe(150);
    });

    test('should work with level multiplier', () => {
      job.level = 9; // Should give 2x multiplier
      job.incomeMultipliers = [job.getLevelMultiplier.bind(job)];
      
      const income = job.getIncome();
      expect(income).toBe(100); // 50 * 2 = 100
    });

    test('should work with multiple multipliers', () => {
      job.level = 9; // 2x multiplier
      job.incomeMultipliers = [
        job.getLevelMultiplier.bind(job),
        () => 1.5,
        () => 2.0
      ];
      
      const income = job.getIncome();
      expect(income).toBe(300); // 50 * 2 * 1.5 * 2 = 300
    });
  });

  describe('Inheritance from Task', () => {
    test('should have all Task methods', () => {
      expect(typeof job.getMaxXp).toBe('function');
      expect(typeof job.getXpLeft).toBe('function');
      expect(typeof job.getMaxLevelMultiplier).toBe('function');
      expect(typeof job.getXpGain).toBe('function');
      expect(typeof job.increaseXp).toBe('function');
    });

    test('should work with Task methods', () => {
      const maxXp = job.getMaxXp();
      expect(maxXp).toBe(100);
      
      const xpLeft = job.getXpLeft();
      expect(xpLeft).toBe(100);
      
      const maxLevelMultiplier = job.getMaxLevelMultiplier();
      expect(maxLevelMultiplier).toBe(1);
    });
  });
});
