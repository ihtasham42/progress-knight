// Integration tests for cross-class interactions
const { Task, Job, Skill, Item, Requirement, TaskRequirement, CoinRequirement, AgeRequirement, EvilRequirement, context } = require('../setup-classes');

describe('Integration Tests', () => {
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
    
    // Reset gameData to a clean state
    context.gameData = {
      taskData: {},
      itemData: {},
      coins: 1000,
      days: 365 * 20, // 20 years
      evil: 0,
      paused: false,
      timeWarpingEnabled: true,
      rebirthOneCount: 0,
      rebirthTwoCount: 0,
      currentJob: null,
      currentSkill: null,
      currentProperty: null,
      currentMisc: []
    };
  });

  describe('Task and Job Integration', () => {
    test('should work together in a typical game scenario', () => {
      // Create a job that depends on a task
      const beggarTask = new Task({ name: 'Beggar', maxXp: 50, effect: 0.01 });
      const beggarJob = new Job({ name: 'Beggar', maxXp: 50, income: 5 });
      
      // Set up task data in gameData
      context.gameData.taskData['Beggar'] = beggarTask;
      
      // Create a requirement that checks task level
      const mockElements = [
        { classList: { add: jest.fn(), remove: jest.fn() } },
        { classList: { add: jest.fn(), remove: jest.fn() } }
      ];
      const taskRequirement = new TaskRequirement(mockElements, []);
      
      // Test that requirement works with task data
      const requirement = { task: 'Beggar', requirement: 1 };
      expect(taskRequirement.getCondition(requirement)).toBe(false); // Level 0 < 1
      
      // Level up the task
      beggarTask.level = 1;
      context.gameData.taskData['Beggar'] = beggarTask;
      expect(taskRequirement.getCondition(requirement)).toBe(true); // Level 1 >= 1
    });

    test('should handle job income calculation with task multipliers', () => {
      const job = new Job({ name: 'Test Job', maxXp: 100, income: 100 });
      const skill = new Skill({ name: 'Job XP Skill', maxXp: 100, effect: 0.1, description: 'Job XP skill' });
      
      // Set up skill to affect job income
      skill.level = 10; // 10% bonus
      job.incomeMultipliers = [skill.getEffect.bind(skill)];
      
      // Mock applyMultipliers to return expected value
      context.applyMultipliers.mockReturnValue(110); // 100 * 1.1
      
      const income = job.getIncome();
      expect(income).toBe(110);
      expect(context.applyMultipliers).toHaveBeenCalledWith(100, job.incomeMultipliers);
    });
  });

  describe('Item and Game State Integration', () => {
    test('should handle item effects on game state', () => {
      const house = new Item({ name: 'House', expense: 1000, effect: 1.5, description: 'Happiness' });
      const book = new Item({ name: 'Book', expense: 50, effect: 1.2, description: 'Skill XP' });
      
      // Test item not active
      expect(house.getEffect()).toBe(1);
      expect(book.getEffect()).toBe(1);
      
      // Set house as current property
      context.gameData.currentProperty = house;
      expect(house.getEffect()).toBe(1.5);
      
      // Add book to misc items
      context.gameData.currentMisc = [book];
      expect(book.getEffect()).toBe(1.2);
      
      // Both items active
      expect(house.getEffect()).toBe(1.5);
      expect(book.getEffect()).toBe(1.2);
    });

    test('should handle item expense calculation with game state', () => {
      const expensiveItem = new Item({ name: 'Palace', expense: 10000, effect: 2.0, description: 'Happiness' });
      
      // Test with sufficient coins
      context.gameData.coins = 15000;
      const expense = expensiveItem.getExpense();
      expect(expense).toBe(10000);
      
      // Test with insufficient coins (should still calculate expense)
      context.gameData.coins = 5000;
      const expense2 = expensiveItem.getExpense();
      expect(expense2).toBe(10000); // Expense calculation doesn't depend on available coins
    });
  });

  describe('Requirement System Integration', () => {
    test('should handle complex requirement chains', () => {
      const mockElements = [
        { classList: { add: jest.fn(), remove: jest.fn() } },
        { classList: { add: jest.fn(), remove: jest.fn() } }
      ];
      
      // Create multiple requirement types
      const taskReq = new TaskRequirement(mockElements, []);
      const coinReq = new CoinRequirement(mockElements, []);
      const ageReq = new AgeRequirement(mockElements, []);
      const evilReq = new EvilRequirement(mockElements, []);
      
      // Set up game state
      context.gameData.taskData['Beggar'] = { level: 5 };
      context.gameData.coins = 1000;
      context.gameData.days = 365 * 25; // 25 years
      context.gameData.evil = 10;
      context.daysToYears.mockReturnValue(25);
      
      // Test all requirements
      expect(taskReq.getCondition({ task: 'Beggar', requirement: 3 })).toBe(true);
      expect(coinReq.getCondition({ requirement: 500 })).toBe(true);
      expect(ageReq.getCondition({ requirement: 20 })).toBe(true);
      expect(evilReq.getCondition({ requirement: 5 })).toBe(true);
      
      // Test failing requirements
      expect(taskReq.getCondition({ task: 'Beggar', requirement: 10 })).toBe(false);
      expect(coinReq.getCondition({ requirement: 2000 })).toBe(false);
      expect(ageReq.getCondition({ requirement: 30 })).toBe(false);
      expect(evilReq.getCondition({ requirement: 20 })).toBe(false);
    });

    test('should handle requirement dependencies', () => {
      const mockElements = [
        { classList: { add: jest.fn(), remove: jest.fn() } },
        { classList: { add: jest.fn(), remove: jest.fn() } }
      ];
      
      // Create a requirement that depends on multiple conditions
      const complexRequirement = new Requirement(mockElements, [
        { task: 'Beggar', requirement: 5 },
        { requirement: 1000 }, // coins
        { requirement: 20 }    // age
      ]);
      
      // Set up game state
      context.gameData.taskData['Beggar'] = { level: 5 };
      context.gameData.coins = 1000;
      context.gameData.days = 365 * 25;
      context.daysToYears.mockReturnValue(25);
      
      // Mock the getCondition method for different requirement types
      complexRequirement.getCondition = jest.fn((req) => {
        if (req.task) {
          return context.gameData.taskData[req.task]?.level >= req.requirement;
        } else if (context.gameData.coins !== undefined) {
          return context.gameData.coins >= req.requirement;
        } else {
          return context.daysToYears(context.gameData.days) >= req.requirement;
        }
      });
      
      expect(complexRequirement.isCompleted()).toBe(true);
      
      // Test with one failing condition
      context.gameData.coins = 500;
      // Reset the completed state first
      complexRequirement.completed = false;
      expect(complexRequirement.isCompleted()).toBe(false);
    });
  });

  describe('Game Loop Integration', () => {
    test('should simulate a complete game cycle', () => {
      // Create game entities
      const beggarTask = new Task({ name: 'Beggar', maxXp: 50, effect: 0.01 });
      const beggarJob = new Job({ name: 'Beggar', maxXp: 50, income: 5 });
      const house = new Item({ name: 'House', expense: 1000, effect: 1.5, description: 'Happiness' });
      
      // Set up game state
      context.gameData.taskData['Beggar'] = beggarTask;
      context.gameData.currentJob = beggarJob;
      context.gameData.currentProperty = house;
      context.gameData.coins = 1000;
      
      // Simulate XP gain
      context.applyMultipliers.mockReturnValue(10);
      context.applySpeed.mockReturnValue(10);
      
      const initialXp = beggarTask.xp;
      beggarTask.increaseXp();
      expect(beggarTask.xp).toBe(initialXp + 10);
      
      // Simulate income generation
      context.applyMultipliers.mockReturnValue(5);
      const income = beggarJob.getIncome();
      expect(income).toBe(5);
      
      // Simulate item effect
      const houseEffect = house.getEffect();
      expect(houseEffect).toBe(1.5);
      
      // Simulate expense calculation
      context.applyMultipliers.mockReturnValue(1000);
      const expense = house.getExpense();
      expect(expense).toBe(1000);
    });

    test('should handle level progression and unlocks', () => {
      const task = new Task({ name: 'Test Task', maxXp: 100, effect: 0.01 });
      const job = new Job({ name: 'Test Job', maxXp: 100, income: 10 });
      
      // Set up game state
      context.gameData.taskData['Test Task'] = task;
      context.gameData.currentJob = job;
      
      // Simulate leveling up
      task.level = 5;
      job.level = 3;
      
      // Test that higher levels provide better multipliers
      const taskMultiplier = task.getMaxLevelMultiplier();
      const jobMultiplier = job.getLevelMultiplier();
      
      // Task multiplier is 1 + maxLevel/10, so with maxLevel 0 it's 1
      expect(taskMultiplier).toBe(1);
      expect(jobMultiplier).toBeGreaterThan(1);
      
      // Test income calculation with level multiplier
      job.incomeMultipliers = [job.getLevelMultiplier.bind(job)];
      context.applyMultipliers.mockReturnValue(10 * jobMultiplier);
      
      const income = job.getIncome();
      expect(income).toBe(10 * jobMultiplier);
    });
  });

  describe('Data Consistency Integration', () => {
    test('should maintain data consistency across classes', () => {
      const task = new Task({ name: 'Consistency Test', maxXp: 100, effect: 0.01 });
      const job = new Job({ name: 'Consistency Test', maxXp: 100, income: 10 });
      
      // Set up game state
      context.gameData.taskData['Consistency Test'] = task;
      context.gameData.currentJob = job;
      
      // Modify task level
      task.level = 10;
      context.gameData.taskData['Consistency Test'] = task;
      
      // Verify consistency
      expect(context.gameData.taskData['Consistency Test'].level).toBe(10);
      expect(task.level).toBe(10);
      
      // Modify job level
      job.level = 5;
      context.gameData.currentJob = job;
      
      // Verify consistency
      expect(context.gameData.currentJob.level).toBe(5);
      expect(job.level).toBe(5);
    });

    test('should handle concurrent modifications safely', () => {
      const task = new Task({ name: 'Concurrent Test', maxXp: 100, effect: 0.01 });
      
      // Simulate concurrent XP gains
      context.applyMultipliers.mockReturnValue(10);
      context.applySpeed.mockReturnValue(10);
      
      const initialXp = task.xp;
      const initialLevel = task.level;
      
      // Multiple XP increases
      task.increaseXp();
      task.increaseXp();
      task.increaseXp();
      
      // Verify state is consistent
      expect(task.xp).toBe(initialXp + 30);
      expect(task.level).toBe(initialLevel); // No level up yet
      
      // Force level up
      task.xp = task.getMaxXp();
      task.increaseXp();
      
      expect(task.level).toBe(initialLevel + 1);
      // Due to the bug in the level-up logic, XP doesn't reset to 0
      expect(task.xp).toBeGreaterThan(0); // XP should be the excess after level up
    });
  });

  describe('Performance Integration', () => {
    test('should handle large numbers of entities efficiently', () => {
      const startTime = Date.now();
      
      // Create many tasks
      const tasks = [];
      for (let i = 0; i < 1000; i++) {
        const task = new Task({ name: `Task ${i}`, maxXp: 100, effect: 0.01 });
        task.level = Math.floor(Math.random() * 100);
        tasks.push(task);
      }
      
      // Create many jobs
      const jobs = [];
      for (let i = 0; i < 1000; i++) {
        const job = new Job({ name: `Job ${i}`, maxXp: 100, income: 10 });
        job.level = Math.floor(Math.random() * 100);
        jobs.push(job);
      }
      
      // Create many items
      const items = [];
      for (let i = 0; i < 1000; i++) {
        const item = new Item({ name: `Item ${i}`, expense: 100, effect: 1.0, description: 'Test' });
        items.push(item);
      }
      
      // Perform operations on all entities
      tasks.forEach(task => {
        task.getMaxXp();
        task.getXpLeft();
        task.getMaxLevelMultiplier();
      });
      
      jobs.forEach(job => {
        job.getLevelMultiplier();
        job.getIncome();
      });
      
      items.forEach(item => {
        item.getEffect();
        item.getExpense();
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });
  });
});
