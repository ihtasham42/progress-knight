// Performance tests for large datasets and complex operations
const { Task, Job, Skill, Item, Requirement, TaskRequirement, CoinRequirement, AgeRequirement, EvilRequirement, context } = require('../setup-classes');
const { TestMocks, TestDataFactory, PerformanceTestUtils } = require('../test-helpers');

describe('Performance Tests', () => {
  beforeEach(() => {
    TestMocks.setupStandardMocks();
  });

  describe('Large Dataset Performance', () => {
    test('should handle creating 1000 tasks efficiently', () => {
      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        const tasks = PerformanceTestUtils.createLargeDataset(1000, (i) => {
          return new Task(TestDataFactory.createTaskData({ name: `Task ${i}` }));
        });
        expect(tasks).toHaveLength(1000);
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 100); // 100ms
    });

    test('should handle creating 1000 jobs efficiently', () => {
      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        const jobs = PerformanceTestUtils.createLargeDataset(1000, (i) => {
          return new Job(TestDataFactory.createJobData({ name: `Job ${i}` }));
        });
        expect(jobs).toHaveLength(1000);
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 100); // 100ms
    });

    test('should handle creating 1000 skills efficiently', () => {
      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        const skills = PerformanceTestUtils.createLargeDataset(1000, (i) => {
          return new Skill(TestDataFactory.createSkillData({ name: `Skill ${i}` }));
        });
        expect(skills).toHaveLength(1000);
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 100); // 100ms
    });

    test('should handle creating 1000 items efficiently', () => {
      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        const items = PerformanceTestUtils.createLargeDataset(1000, (i) => {
          return new Item(TestDataFactory.createItemData({ name: `Item ${i}` }));
        });
        expect(items).toHaveLength(1000);
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 100); // 100ms
    });
  });

  describe('Complex Calculation Performance', () => {
    test('should handle getMaxXp calculations on large datasets', () => {
      const tasks = PerformanceTestUtils.createLargeDataset(1000, (i) => {
        const task = new Task(TestDataFactory.createTaskData({ name: `Task ${i}` }));
        task.level = Math.floor(Math.random() * 1000);
        return task;
      });

      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        tasks.forEach(task => {
          task.getMaxXp();
        });
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 200); // 200ms
    });

    test('should handle getEffect calculations on large datasets', () => {
      const skills = PerformanceTestUtils.createLargeDataset(1000, (i) => {
        const skill = new Skill(TestDataFactory.createSkillData({ name: `Skill ${i}` }));
        skill.level = Math.floor(Math.random() * 1000);
        return skill;
      });

      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        skills.forEach(skill => {
          skill.getEffect();
        });
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 200); // 200ms
    });

    test('should handle getIncome calculations on large datasets', () => {
      const jobs = PerformanceTestUtils.createLargeDataset(1000, (i) => {
        const job = new Job(TestDataFactory.createJobData({ name: `Job ${i}` }));
        job.level = Math.floor(Math.random() * 1000);
        job.incomeMultipliers = [() => 1.5, () => 2.0, () => 0.8];
        return job;
      });

      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        jobs.forEach(job => {
          job.getIncome();
        });
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 300); // 300ms
    });

    test('should handle getExpense calculations on large datasets', () => {
      const items = PerformanceTestUtils.createLargeDataset(1000, (i) => {
        const item = new Item(TestDataFactory.createItemData({ name: `Item ${i}` }));
        item.expenseMultipliers = [() => 0.8, () => 0.9, () => 1.1];
        return item;
      });

      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        items.forEach(item => {
          item.getExpense();
        });
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 300); // 300ms
    });
  });

  describe('Memory Performance', () => {
    test('should handle large multiplier arrays efficiently', () => {
      const task = new Task(TestDataFactory.createTaskData());
      
      // Create a large array of multiplier functions
      const largeMultiplierArray = new Array(10000).fill(null).map((_, i) => () => 1 + (i * 0.001));
      task.xpMultipliers = largeMultiplierArray;

      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        task.getXpGain();
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 500); // 500ms
    });

    test('should handle deep object nesting efficiently', () => {
      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        // Create deeply nested test data
        let current = TestDataFactory.createTaskData();
        for (let i = 0; i < 1000; i++) {
          current.nested = { ...TestDataFactory.createTaskData(), level: i };
          current = current.nested;
        }
        
        // Create task with deeply nested data
        const task = new Task(current);
        expect(task).toBeDefined();
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 100); // 100ms
    });

    test('should handle large gameData objects efficiently', () => {
      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        // Create large taskData object
        const largeTaskData = {};
        for (let i = 0; i < 10000; i++) {
          largeTaskData[`Task${i}`] = { level: Math.floor(Math.random() * 100) };
        }
        
        context.gameData.taskData = largeTaskData;
        
        // Create requirement and test it
        const mockElements = TestMocks.setupMockElements();
        const taskRequirement = new TaskRequirement(mockElements, []);
        
        // Test multiple lookups
        for (let i = 0; i < 1000; i++) {
          const randomTask = `Task${Math.floor(Math.random() * 10000)}`;
          taskRequirement.getCondition({ task: randomTask, requirement: 50 });
        }
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 1000); // 1000ms
    });
  });

  describe('Game Loop Performance', () => {
    test('should handle complete game cycle efficiently', () => {
      const tasks = PerformanceTestUtils.createLargeDataset(100, (i) => {
        const task = new Task(TestDataFactory.createTaskData({ name: `Task ${i}` }));
        task.level = Math.floor(Math.random() * 100);
        return task;
      });

      const jobs = PerformanceTestUtils.createLargeDataset(100, (i) => {
        const job = new Job(TestDataFactory.createJobData({ name: `Job ${i}` }));
        job.level = Math.floor(Math.random() * 100);
        return job;
      });

      const items = PerformanceTestUtils.createLargeDataset(100, (i) => {
        return new Item(TestDataFactory.createItemData({ name: `Item ${i}` }));
      });

      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        // Simulate game loop operations
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
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 500); // 500ms
    });

    test('should handle XP progression efficiently', () => {
      const task = new Task(TestDataFactory.createTaskData());
      task.xpMultipliers = [() => 1.5, () => 2.0, () => 0.8];

      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        // Simulate many XP increases
        for (let i = 0; i < 10000; i++) {
          task.increaseXp();
        }
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 1000); // 1000ms
    });

    test('should handle level progression efficiently', () => {
      const tasks = PerformanceTestUtils.createLargeDataset(100, (i) => {
        const task = new Task(TestDataFactory.createTaskData({ name: `Task ${i}` }));
        task.xpMultipliers = [() => 1000]; // High XP gain for quick leveling
        return task;
      });

      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        // Simulate leveling up all tasks
        tasks.forEach(task => {
          for (let i = 0; i < 100; i++) {
            task.increaseXp();
          }
        });
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 2000); // 2000ms
    });
  });

  describe('Requirement System Performance', () => {
    test('should handle large requirement arrays efficiently', () => {
      const mockElements = TestMocks.setupMockElements();
      const requirements = PerformanceTestUtils.createLargeDataset(1000, (i) => ({
        task: `Task${i}`,
        requirement: Math.floor(Math.random() * 100)
      }));

      const requirement = new Requirement(mockElements, requirements);
      requirement.getCondition = jest.fn().mockReturnValue(true);

      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        requirement.isCompleted();
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 100); // 100ms
    });

    test('should handle complex requirement chains efficiently', () => {
      const mockElements = TestMocks.setupMockElements();
      const taskRequirement = new TaskRequirement(mockElements, []);
      const coinRequirement = new CoinRequirement(mockElements, []);
      const ageRequirement = new AgeRequirement(mockElements, []);
      const evilRequirement = new EvilRequirement(mockElements, []);

      // Set up large gameData
      const largeTaskData = {};
      for (let i = 0; i < 1000; i++) {
        largeTaskData[`Task${i}`] = { level: Math.floor(Math.random() * 100) };
      }
      context.gameData.taskData = largeTaskData;

      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        // Test many requirement checks
        for (let i = 0; i < 1000; i++) {
          const randomTask = `Task${Math.floor(Math.random() * 1000)}`;
          taskRequirement.getCondition({ task: randomTask, requirement: 50 });
          coinRequirement.getCondition({ requirement: Math.floor(Math.random() * 1000) });
          ageRequirement.getCondition({ requirement: Math.floor(Math.random() * 100) });
          evilRequirement.getCondition({ requirement: Math.floor(Math.random() * 100) });
        }
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 1000); // 1000ms
    });
  });

  describe('Edge Case Performance', () => {
    test('should handle extreme values efficiently', () => {
      const task = new Task(TestDataFactory.createTaskData({ maxXp: Number.MAX_SAFE_INTEGER }));
      task.level = Number.MAX_SAFE_INTEGER;

      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        task.getMaxXp();
        task.getXpLeft();
        task.getMaxLevelMultiplier();
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 100); // 100ms
    });

    test('should handle floating point precision efficiently', () => {
      const skill = new Skill(TestDataFactory.createSkillData({ effect: 0.0000001 }));
      skill.level = 1000000;

      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        skill.getEffect();
        skill.getEffectDescription();
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 100); // 100ms
    });

    test('should handle circular references efficiently', () => {
      const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
        const circularData = TestDataFactory.createTaskData();
        circularData.self = circularData;
        circularData.nested = { ...circularData };
        
        const task = new Task(circularData);
        expect(task).toBeDefined();
      });
      
      PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 100); // 100ms
    });
  });

  describe('Memory Leak Detection', () => {
    test('should not leak memory with repeated operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        const task = new Task(TestDataFactory.createTaskData({ name: `Task ${i}` }));
        task.level = Math.floor(Math.random() * 100);
        task.getMaxXp();
        task.getXpLeft();
        task.getMaxLevelMultiplier();
        
        const job = new Job(TestDataFactory.createJobData({ name: `Job ${i}` }));
        job.level = Math.floor(Math.random() * 100);
        job.getLevelMultiplier();
        job.getIncome();
        
        const item = new Item(TestDataFactory.createItemData({ name: `Item ${i}` }));
        item.getEffect();
        item.getExpense();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});
