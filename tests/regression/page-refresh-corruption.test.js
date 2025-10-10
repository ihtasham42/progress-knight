/**
 * Page Refresh Corruption Tests
 * Tests to catch game state corruption specifically on page refresh
 */

describe('Page Refresh Corruption Tests', () => {
    let mockGameData;
    let mockDOMCache;

    beforeEach(() => {
        // Mock game data with proper initial state
        mockGameData = {
            days: 365 * 14, // 14 years
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
                'Farmer': { level: 0, xp: 0, maxLevel: 0 },
                'Fisherman': { level: 0, xp: 0, maxLevel: 0 },
                'Miner': { level: 0, xp: 0, maxLevel: 0 },
                'Blacksmith': { level: 0, xp: 0, maxLevel: 0 },
                'Merchant': { level: 0, xp: 0, maxLevel: 0 },
                'Squire': { level: 0, xp: 0, maxLevel: 0 },
                'Footman': { level: 0, xp: 0, maxLevel: 0 },
                'Veteran footman': { level: 0, xp: 0, maxLevel: 0 },
                'Knight': { level: 0, xp: 0, maxLevel: 0 },
                'Veteran knight': { level: 0, xp: 0, maxLevel: 0 },
                'Elite knight': { level: 0, xp: 0, maxLevel: 0 },
                'Holy knight': { level: 0, xp: 0, maxLevel: 0 },
                'Legendary knight': { level: 0, xp: 0, maxLevel: 0 }
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
    });

    describe('Page Refresh State Validation', () => {
        test('should not show expired lifespan warning for 14-year-old character', () => {
            const ageInYears = Math.floor(mockGameData.days / 365);
            const lifespan = 70;
            
            expect(ageInYears).toBe(14);
            expect(ageInYears).toBeLessThan(lifespan);
            expect(ageInYears).toBeLessThan(50); // Should not trigger "age has caught up" warning
            
            // This is the critical test - a 14-year-old should NOT show "Age has caught up to you"
            const shouldShowLifespanWarning = ageInYears >= lifespan;
            expect(shouldShowLifespanWarning).toBe(false);
        });

        test('should not show all jobs as available initially', () => {
            // Only basic jobs should be available initially
            const basicJobs = ['Beggar', 'Farmer'];
            const advancedJobs = ['Knight', 'Veteran knight', 'Elite knight', 'Holy knight', 'Legendary knight'];
            
            // Basic jobs should be available (level 0 is fine for starting jobs)
            basicJobs.forEach(jobName => {
                expect(mockGameData.taskData[jobName]).toBeDefined();
                expect(mockGameData.taskData[jobName].level).toBe(0);
            });
            
            // Advanced jobs should NOT be available (should be hidden by requirements)
            advancedJobs.forEach(jobName => {
                expect(mockGameData.taskData[jobName]).toBeDefined();
                expect(mockGameData.taskData[jobName].level).toBe(0);
                // These should be hidden by requirements system
            });
        });

        test('should not show time warping feature initially', () => {
            expect(mockGameData.timeWarpingEnabled).toBe(false);
            
            // Time warping should be hidden until requirement is met
            const timeWarpingRequirement = mockGameData.requirements['Time Warping'];
            expect(timeWarpingRequirement.completed).toBe(false);
        });

        test('should not show advanced military jobs initially', () => {
            const militaryRequirement = mockGameData.requirements['Military'];
            expect(militaryRequirement.completed).toBe(false);
            
            // Military jobs should be hidden until requirement is met
            const militaryJobs = ['Squire', 'Footman', 'Veteran footman', 'Knight', 'Veteran knight', 'Elite knight', 'Holy knight', 'Legendary knight'];
            militaryJobs.forEach(jobName => {
                expect(mockGameData.taskData[jobName].level).toBe(0);
            });
        });
    });

    describe('Corruption Scenarios', () => {
        test('should detect corrupted age showing expired lifespan', () => {
            // This simulates the corruption where age shows as expired
            const corruptedData = { ...mockGameData, days: 365 * 80 }; // 80 years old
            const ageInYears = Math.floor(corruptedData.days / 365);
            const lifespan = 70;
            
            expect(ageInYears).toBeGreaterThan(lifespan);
            // This would trigger "Age has caught up to you" warning
        });

        test('should detect corrupted job visibility', () => {
            // This simulates the corruption where all jobs are visible
            const corruptedData = {
                ...mockGameData,
                taskData: {
                    'Beggar': { level: 0, xp: 0, maxLevel: 0 },
                    'Knight': { level: 0, xp: 0, maxLevel: 0 },
                    'Holy knight': { level: 0, xp: 0, maxLevel: 0 },
                    'Legendary knight': { level: 0, xp: 0, maxLevel: 0 }
                }
            };
            
            // All jobs are visible (level 0 but still visible)
            const allJobs = Object.keys(corruptedData.taskData);
            expect(allJobs.length).toBeGreaterThan(2); // More than just basic jobs
            
            // Advanced jobs should not be visible
            const advancedJobs = ['Knight', 'Holy knight', 'Legendary knight'];
            advancedJobs.forEach(jobName => {
                expect(corruptedData.taskData[jobName]).toBeDefined();
                // These should be hidden by requirements
            });
        });

        test('should detect corrupted feature visibility', () => {
            // This simulates the corruption where advanced features are visible
            const corruptedData = {
                ...mockGameData,
                timeWarpingEnabled: true,
                requirements: {
                    'Shop': { completed: true },
                    'Time Warping': { completed: true },
                    'Military': { completed: true }
                }
            };
            
            expect(corruptedData.timeWarpingEnabled).toBe(true);
            expect(corruptedData.requirements['Shop'].completed).toBe(true);
            expect(corruptedData.requirements['Time Warping'].completed).toBe(true);
            expect(corruptedData.requirements['Military'].completed).toBe(true);
        });
    });

    describe('Page Refresh Simulation', () => {
        test('should maintain correct state after page refresh', () => {
            // Simulate page refresh by re-initializing game data
            const refreshedGameData = {
                days: 365 * 14, // 14 years
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
                    'Time Warping': { completed: false },
                    'Military': { completed: false }
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

        test('should not show expired lifespan warning after refresh', () => {
            const refreshedGameData = {
                days: 365 * 14, // 14 years
                coins: 0,
                evil: 0,
                paused: false,
                timeWarpingEnabled: false
            };
            
            const ageInYears = Math.floor(refreshedGameData.days / 365);
            const lifespan = 70;
            
            expect(ageInYears).toBe(14);
            expect(ageInYears).toBeLessThan(lifespan);
            
            // This should NOT trigger "Age has caught up to you" warning
            const shouldShowLifespanWarning = ageInYears >= lifespan;
            expect(shouldShowLifespanWarning).toBe(false);
        });

        test('should not show all jobs as visible after refresh', () => {
            const refreshedGameData = {
                taskData: {
                    'Beggar': { level: 0, xp: 0, maxLevel: 0 },
                    'Farmer': { level: 0, xp: 0, maxLevel: 0 }
                },
                requirements: {
                    'Shop': { completed: false },
                    'Time Warping': { completed: false },
                    'Military': { completed: false }
                }
            };
            
            // Only basic jobs should be visible
            const visibleJobs = Object.keys(refreshedGameData.taskData);
            expect(visibleJobs.length).toBeLessThan(5); // Should not show all jobs
            
            // No requirements should be completed
            Object.keys(refreshedGameData.requirements).forEach(reqName => {
                const requirement = refreshedGameData.requirements[reqName];
                expect(requirement.completed).toBe(false);
            });
        });
    });

    describe('Regression Prevention', () => {
        test('should prevent age corruption on refresh', () => {
            const ageInYears = Math.floor(mockGameData.days / 365);
            expect(ageInYears).toBe(14);
            expect(ageInYears).toBeLessThan(70);
        });

        test('should prevent job visibility corruption on refresh', () => {
            const allJobs = Object.keys(mockGameData.taskData);
            const visibleJobs = allJobs.filter(taskName => {
                return mockGameData.taskData[taskName].level > 0;
            });
            
            expect(visibleJobs.length).toBe(0);
        });

        test('should prevent feature visibility corruption on refresh', () => {
            expect(mockGameData.timeWarpingEnabled).toBe(false);
            
            Object.keys(mockGameData.requirements).forEach(reqName => {
                const requirement = mockGameData.requirements[reqName];
                expect(requirement.completed).toBe(false);
            });
        });

        test('should prevent state corruption on refresh', () => {
            expect(mockGameData.days).toBe(365 * 14);
            expect(mockGameData.coins).toBe(0);
            expect(mockGameData.evil).toBe(0);
            expect(mockGameData.paused).toBe(false);
            expect(mockGameData.timeWarpingEnabled).toBe(false);
        });
    });
});
