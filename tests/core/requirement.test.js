// Tests for Requirement classes
const { Task, Job, Skill, Item, Requirement, TaskRequirement, CoinRequirement, AgeRequirement, EvilRequirement, context } = require('../setup-classes');
const { TestMocks, TestDataFactory, TestAssertions } = require('../test-helpers');

describe('Requirement Classes', () => {
  let mockElements;

  beforeEach(() => {
    // Use standardized mock setup
    TestMocks.setupStandardMocks();
    
    // Create mock elements using helper
    mockElements = TestMocks.setupMockElements();
  });

  describe('Requirement Base Class', () => {
    let requirement;

    beforeEach(() => {
      requirement = new Requirement(mockElements, []);
    });

    test('should initialize with correct properties', () => {
      TestAssertions.expectRequirementProperties(requirement, mockElements, []);
    });

    test('should return true when completed is true', () => {
      requirement.completed = true;
      const result = requirement.isCompleted();
      expect(result).toBe(true);
    });

    test('should call getCondition for each requirement', () => {
      const mockRequirements = [
        { task: 'Test Task', requirement: 10 },
        { task: 'Another Task', requirement: 5 }
      ];
      
      requirement.requirements = mockRequirements;
      requirement.getCondition = jest.fn().mockReturnValue(true);
      
      const result = requirement.isCompleted();
      
      expect(requirement.getCondition).toHaveBeenCalledTimes(2);
      expect(requirement.getCondition).toHaveBeenCalledWith(mockRequirements[0]);
      expect(requirement.getCondition).toHaveBeenCalledWith(mockRequirements[1]);
      expect(result).toBe(true);
      expect(requirement.completed).toBe(true);
    });

    test('should return false when any requirement fails', () => {
      const mockRequirements = [
        { task: 'Test Task', requirement: 10 },
        { task: 'Another Task', requirement: 5 }
      ];
      
      requirement.requirements = mockRequirements;
      requirement.getCondition = jest.fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      
      const result = requirement.isCompleted();
      
      expect(result).toBe(false);
      expect(requirement.completed).toBe(false);
    });
  });

  describe('TaskRequirement Class', () => {
    let taskRequirement;

    beforeEach(() => {
      taskRequirement = new TaskRequirement(mockElements, []);
    });

    test('should initialize with correct type', () => {
      expect(taskRequirement.type).toBe('task');
      expect(taskRequirement instanceof Requirement).toBe(true);
    });

    test('should return true when task level meets requirement', () => {
      context.gameData.taskData = {
        'Test Task': { level: 15 }
      };
      
      const requirement = { task: 'Test Task', requirement: 10 };
      const result = taskRequirement.getCondition(requirement);
      
      expect(result).toBe(true);
    });

    test('should return false when task level is below requirement', () => {
      context.gameData.taskData = {
        'Test Task': { level: 5 }
      };
      
      const requirement = { task: 'Test Task', requirement: 10 };
      const result = taskRequirement.getCondition(requirement);
      
      expect(result).toBe(false);
    });

    test('should return true when task level equals requirement', () => {
      context.gameData.taskData = {
        'Test Task': { level: 10 }
      };
      
      const requirement = { task: 'Test Task', requirement: 10 };
      const result = taskRequirement.getCondition(requirement);
      
      expect(result).toBe(true);
    });
  });

  describe('CoinRequirement Class', () => {
    let coinRequirement;

    beforeEach(() => {
      coinRequirement = new CoinRequirement(mockElements, []);
    });

    test('should initialize with correct type', () => {
      expect(coinRequirement.type).toBe('coins');
      expect(coinRequirement instanceof Requirement).toBe(true);
    });

    test('should return true when coins meet requirement', () => {
      context.gameData.coins = 150;
      
      const requirement = { requirement: 100 };
      const result = coinRequirement.getCondition(requirement);
      
      expect(result).toBe(true);
    });

    test('should return false when coins are below requirement', () => {
      context.gameData.coins = 50;
      
      const requirement = { requirement: 100 };
      const result = coinRequirement.getCondition(requirement);
      
      expect(result).toBe(false);
    });

    test('should return true when coins equal requirement', () => {
      context.gameData.coins = 100;
      
      const requirement = { requirement: 100 };
      const result = coinRequirement.getCondition(requirement);
      
      expect(result).toBe(true);
    });
  });

  describe('AgeRequirement Class', () => {
    let ageRequirement;

    beforeEach(() => {
      ageRequirement = new AgeRequirement(mockElements, []);
    });

    test('should initialize with correct type', () => {
      expect(ageRequirement.type).toBe('age');
      expect(ageRequirement instanceof Requirement).toBe(true);
    });

    test('should return true when age meets requirement', () => {
      context.gameData.days = 365 * 25; // 25 years
      context.daysToYears.mockReturnValue(25);
      
      const requirement = { requirement: 20 };
      const result = ageRequirement.getCondition(requirement);
      
      expect(result).toBe(true);
      expect(context.daysToYears).toHaveBeenCalledWith(365 * 25);
    });

    test('should return false when age is below requirement', () => {
      context.gameData.days = 365 * 15; // 15 years
      context.daysToYears.mockReturnValue(15);
      
      const requirement = { requirement: 20 };
      const result = ageRequirement.getCondition(requirement);
      
      expect(result).toBe(false);
    });

    test('should return true when age equals requirement', () => {
      context.gameData.days = 365 * 20; // 20 years
      context.daysToYears.mockReturnValue(20);
      
      const requirement = { requirement: 20 };
      const result = ageRequirement.getCondition(requirement);
      
      expect(result).toBe(true);
    });
  });

  describe('EvilRequirement Class', () => {
    let evilRequirement;

    beforeEach(() => {
      evilRequirement = new EvilRequirement(mockElements, []);
    });

    test('should initialize with correct type', () => {
      expect(evilRequirement.type).toBe('evil');
      expect(evilRequirement instanceof Requirement).toBe(true);
    });

    test('should return true when evil meets requirement', () => {
      context.gameData.evil = 15;
      
      const requirement = { requirement: 10 };
      const result = evilRequirement.getCondition(requirement);
      
      expect(result).toBe(true);
    });

    test('should return false when evil is below requirement', () => {
      context.gameData.evil = 5;
      
      const requirement = { requirement: 10 };
      const result = evilRequirement.getCondition(requirement);
      
      expect(result).toBe(false);
    });

    test('should return true when evil equals requirement', () => {
      context.gameData.evil = 10;
      
      const requirement = { requirement: 10 };
      const result = evilRequirement.getCondition(requirement);
      
      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty requirements array', () => {
      const requirement = new Requirement(mockElements, []);
      const result = requirement.isCompleted();
      
      expect(result).toBe(true);
      expect(requirement.completed).toBe(true);
    });

    test('should handle missing task data', () => {
      context.gameData.taskData = {};
      
      const taskRequirement = new TaskRequirement(mockElements, []);
      const requirement = { task: 'Non-existent Task', requirement: 10 };
      
      expect(() => {
        taskRequirement.getCondition(requirement);
      }).toThrow();
    });

    test('should handle zero requirements', () => {
      const coinRequirement = new CoinRequirement(mockElements, []);
      context.gameData.coins = 0;
      
      const requirement = { requirement: 0 };
      const result = coinRequirement.getCondition(requirement);
      
      expect(result).toBe(true);
    });

    test('should handle negative requirements', () => {
      const evilRequirement = new EvilRequirement(mockElements, []);
      context.gameData.evil = 0;
      
      const requirement = { requirement: -5 };
      const result = evilRequirement.getCondition(requirement);
      
      expect(result).toBe(true);
    });
  });
});
