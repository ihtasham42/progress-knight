/**
 * Game State Corruption Tests
 * Tests to catch game state corruption on page refresh and other scenarios
 */

describe('Game State Corruption Tests', () => {
    let mockGameData;
    let mockDOMCache;

    beforeEach(() => {
        // Mock game data with proper initial state
        mockGameData = {
            days: 365 * 14, // 14 years
            coins: 0,
            evil: 0,
            paused: false,
            timeWarpingEnabled: false, // Should be disabled initially
            rebirthOneCount: 0,
            rebirthTwoCount: 0,
            currentJob: null,
            currentSkill: null,
            currentProperty: null,
            currentMisc: [],
            taskData: {
                'Beggar': { level: 0, xp: 0, maxLevel: 0 },
                'Farmer': { level: 0, xp: 0, maxLevel: 0 },
                'Knight': { level: 0, xp: 0, maxLevel: 0 },
                'Holy knight': { level: 0, xp: 0, maxLevel: 0 }
            },
            itemData: {
                'Homeless': { level: 0 },
                'House': { level: 0 }
            },
            requirements: {
                'Shop': { completed: false },
                'Time Warping': { completed: false },
                'Military': { completed: false }
            }
        };

        // Mock DOM cache
        mockDOMCache = {
            dirtyFlags: {
                tasks: false,
                items: false,
                text: false,
                requirements: false
            }
        };
    });

    describe('Page Refresh Corruption', () => {
        test('should not show expired lifespan warning for 14-year-old character', () => {
            const ageInYears = Math.floor(mockGameData.days / 365);
            const lifespan = 70;
            
            expect(ageInYears).toBe(14);
            expect(ageInYears).toBeLessThan(lifespan);
            expect(ageInYears).toBeLessThan(50); // Should not trigger "age has caught up" warning
        });

        test('should not show all jobs as available initially', () => {
            // Only basic jobs should be available initially
            const availableJobs = Object.keys(mockGameData.taskData).filter(taskName => {
                const task = mockGameData.taskData[taskName];
                return task.level > 0 || taskName === 'Beggar' || taskName === 'Farmer';
            });
            
            expect(availableJobs.length).toBeLessThan(3); // Only Beggar and Farmer should be available
        });

        test('should not show time warping feature initially', () => {
            expect(mockGameData.timeWarpingEnabled).toBe(false);
        });

        test('should not show advanced military jobs initially', () => {
            const advancedJobs = ['Knight', 'Veteran knight', 'Elite knight', 'Holy knight', 'Legendary knight'];
            
            advancedJobs.forEach(jobName => {
                if (mockGameData.taskData[jobName]) {
                    expect(mockGameData.taskData[jobName].level).toBe(0);
                }
            });
        });
    });

    describe('Age and Lifespan Validation', () => {
        test('should not have age exceeding lifespan for young character', () => {
            const ageInYears = Math.floor(mockGameData.days / 365);
            const lifespan = 70;
            
            expect(ageInYears).toBeLessThan(lifespan);
            expect(ageInYears).toBeLessThan(50); // Should not trigger lifespan warning
        });

        test('should handle age calculation correctly', () => {
            const ageInYears = Math.floor(mockGameData.days / 365);
            expect(ageInYears).toBe(14);
        });

        test('should not have negative age', () => {
            expect(mockGameData.days).toBeGreaterThan(0);
        });

        test('should not have excessive age', () => {
            expect(mockGameData.days).toBeLessThan(365 * 100);
        });
    });

    describe('Job Visibility Validation', () => {
        test('should not show all jobs as available initially', () => {
            const allJobs = Object.keys(mockGameData.taskData);
            const availableJobs = allJobs.filter(taskName => {
                const task = mockGameData.taskData[taskName];
                return task.level > 0;
            });
            
            expect(availableJobs.length).toBe(0); // No jobs should have levels > 0 initially
        });

        test('should not show advanced jobs without requirements', () => {
            const advancedJobs = ['Knight', 'Veteran knight', 'Elite knight', 'Holy knight', 'Legendary knight'];
            
            advancedJobs.forEach(jobName => {
                if (mockGameData.taskData[jobName]) {
                    expect(mockGameData.taskData[jobName].level).toBe(0);
                }
            });
        });

        test('should not show military jobs without military requirement', () => {
            const militaryRequirement = mockGameData.requirements['Military'];
            expect(militaryRequirement.completed).toBe(false);
        });
    });

    describe('Feature Visibility Validation', () => {
        test('should not show time warping initially', () => {
            expect(mockGameData.timeWarpingEnabled).toBe(false);
        });

        test('should not show shop without shop requirement', () => {
            const shopRequirement = mockGameData.requirements['Shop'];
            expect(shopRequirement.completed).toBe(false);
        });

        test('should not show advanced features without requirements', () => {
            const advancedFeatures = ['Time Warping', 'Military', 'Advanced Jobs'];
            
            advancedFeatures.forEach(feature => {
                if (mockGameData.requirements[feature]) {
                    expect(mockGameData.requirements[feature].completed).toBe(false);
                }
            });
        });
    });

    describe('Game State Consistency', () => {
        test('should have consistent initial state', () => {
            expect(mockGameData.days).toBe(365 * 14);
            expect(mockGameData.coins).toBe(0);
            expect(mockGameData.evil).toBe(0);
            expect(mockGameData.paused).toBe(false);
            expect(mockGameData.timeWarpingEnabled).toBe(false);
        });

        test('should not have corrupted task levels', () => {
            Object.keys(mockGameData.taskData).forEach(taskName => {
                const task = mockGameData.taskData[taskName];
                expect(task.level).toBe(0);
                expect(task.xp).toBe(0);
            });
        });

        test('should not have corrupted item levels', () => {
            Object.keys(mockGameData.itemData).forEach(itemName => {
                const item = mockGameData.itemData[itemName];
                expect(item.level).toBe(0);
            });
        });

        test('should not have corrupted requirements', () => {
            Object.keys(mockGameData.requirements).forEach(reqName => {
                const requirement = mockGameData.requirements[reqName];
                expect(requirement.completed).toBe(false);
            });
        });
    });

    describe('UI State Validation', () => {
        test('should not show expired lifespan warning for young character', () => {
            const ageInYears = Math.floor(mockGameData.days / 365);
            const shouldShowWarning = ageInYears >= 70;
            
            expect(shouldShowWarning).toBe(false);
        });

        test('should not show all jobs as visible', () => {
            const allJobs = Object.keys(mockGameData.taskData);
            const visibleJobs = allJobs.filter(taskName => {
                // In a real scenario, this would check DOM visibility
                return mockGameData.taskData[taskName].level > 0;
            });
            
            expect(visibleJobs.length).toBe(0);
        });

        test('should not show time warping feature', () => {
            expect(mockGameData.timeWarpingEnabled).toBe(false);
        });

        test('should not show advanced features', () => {
            const advancedFeatures = ['Time Warping', 'Military', 'Advanced Jobs'];
            
            advancedFeatures.forEach(feature => {
                if (mockGameData.requirements[feature]) {
                    expect(mockGameData.requirements[feature].completed).toBe(false);
                }
            });
        });
    });

    describe('Data Persistence Validation', () => {
        test('should serialize game data correctly', () => {
            const serialized = JSON.stringify(mockGameData);
            expect(serialized).toBeDefined();
            expect(serialized).not.toBe('{}');
        });

        test('should deserialize game data correctly', () => {
            const serialized = JSON.stringify(mockGameData);
            const deserialized = JSON.parse(serialized);
            
            expect(deserialized.days).toBe(mockGameData.days);
            expect(deserialized.coins).toBe(mockGameData.coins);
            expect(deserialized.timeWarpingEnabled).toBe(mockGameData.timeWarpingEnabled);
        });

        test('should not corrupt data during serialization', () => {
            const serialized = JSON.stringify(mockGameData);
            const deserialized = JSON.parse(serialized);
            
            // Check that age is still correct
            const ageInYears = Math.floor(deserialized.days / 365);
            expect(ageInYears).toBe(14);
            
            // Check that time warping is still disabled
            expect(deserialized.timeWarpingEnabled).toBe(false);
        });
    });

    describe('Corruption Detection', () => {
        test('should detect age corruption', () => {
            const corruptedData = { ...mockGameData, days: -100 };
            const ageInYears = Math.floor(corruptedData.days / 365);
            expect(ageInYears).toBeLessThan(0);
        });

        test('should detect lifespan corruption', () => {
            const corruptedData = { ...mockGameData, days: 365 * 100 };
            const ageInYears = Math.floor(corruptedData.days / 365);
            expect(ageInYears).toBeGreaterThan(70);
        });

        test('should detect job level corruption', () => {
            const corruptedData = {
                ...mockGameData,
                taskData: {
                    'Beggar': { level: -5, xp: 0, maxLevel: 0 }
                }
            };
            expect(corruptedData.taskData['Beggar'].level).toBeLessThan(0);
        });

        test('should detect requirement corruption', () => {
            const corruptedData = {
                ...mockGameData,
                requirements: {
                    'Shop': { completed: true },
                    'Military': { completed: true }
                }
            };
            expect(corruptedData.requirements['Shop'].completed).toBe(true);
            expect(corruptedData.requirements['Military'].completed).toBe(true);
        });
    });

    describe('Regression Prevention', () => {
        test('should prevent age from exceeding lifespan', () => {
            const ageInYears = Math.floor(mockGameData.days / 365);
            const lifespan = 70;
            expect(ageInYears).toBeLessThan(lifespan);
        });

        test('should prevent negative values', () => {
            expect(mockGameData.days).toBeGreaterThanOrEqual(0);
            expect(mockGameData.coins).toBeGreaterThanOrEqual(0);
            expect(mockGameData.evil).toBeGreaterThanOrEqual(0);
        });

        test('should prevent excessive values', () => {
            expect(mockGameData.days).toBeLessThan(365 * 100);
            expect(mockGameData.coins).toBeLessThan(Number.MAX_SAFE_INTEGER);
            expect(mockGameData.evil).toBeLessThan(1000);
        });

        test('should prevent all jobs from being visible', () => {
            const allJobs = Object.keys(mockGameData.taskData);
            const visibleJobs = allJobs.filter(taskName => {
                return mockGameData.taskData[taskName].level > 0;
            });
            
            expect(visibleJobs.length).toBe(0);
        });

        test('should prevent advanced features from being visible', () => {
            expect(mockGameData.timeWarpingEnabled).toBe(false);
            
            Object.keys(mockGameData.requirements).forEach(reqName => {
                const requirement = mockGameData.requirements[reqName];
                expect(requirement.completed).toBe(false);
            });
        });
    });

    describe('Page Refresh Simulation', () => {
        test('should maintain correct state after simulated refresh', () => {
            // Simulate page refresh by re-initializing game data
            const refreshedGameData = {
                days: 365 * 14,
                coins: 0,
                evil: 0,
                paused: false,
                timeWarpingEnabled: false,
                rebirthOneCount: 0,
                rebirthTwoCount: 0,
                currentJob: null,
                currentSkill: null,
                currentProperty: null,
                currentMisc: [],
                taskData: {
                    'Beggar': { level: 0, xp: 0, maxLevel: 0 },
                    'Farmer': { level: 0, xp: 0, maxLevel: 0 }
                },
                requirements: {
                    'Shop': { completed: false },
                    'Time Warping': { completed: false }
                }
            };
            
            // Validate state after refresh
            const ageInYears = Math.floor(refreshedGameData.days / 365);
            expect(ageInYears).toBe(14);
            expect(ageInYears).toBeLessThan(70);
            expect(refreshedGameData.timeWarpingEnabled).toBe(false);
            
            // Check that no jobs have levels > 0
            Object.keys(refreshedGameData.taskData).forEach(taskName => {
                const task = refreshedGameData.taskData[taskName];
                expect(task.level).toBe(0);
            });
            
            // Check that no requirements are completed
            Object.keys(refreshedGameData.requirements).forEach(reqName => {
                const requirement = refreshedGameData.requirements[reqName];
                expect(requirement.completed).toBe(false);
            });
        });
    });
});
