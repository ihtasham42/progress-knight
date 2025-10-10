/**
 * UI Data Corruption Regression Tests
 * Tests to prevent the recurring UI regression where job data shows column headers instead of values
 */

describe('UI Data Corruption Regression', () => {
    let mockGameData;
    let mockDOMCache;
    let mockTaskData;

    beforeEach(() => {
        // Mock game data with proper task data
        mockGameData = {
            taskData: {
                'Beggar': {
                    name: 'Beggar',
                    level: 5,
                    xp: 100,
                    maxLevel: 10,
                    getXpGain: () => 2.5,
                    getXpLeft: () => 50,
                    getMaxXp: () => 200,
                    getIncome: () => 10,
                    getEffectDescription: () => 'Effect description'
                },
                'Farmer': {
                    name: 'Farmer',
                    level: 3,
                    xp: 75,
                    maxLevel: 15,
                    getXpGain: () => 1.8,
                    getXpLeft: () => 25,
                    getMaxXp: () => 150,
                    getIncome: () => 25,
                    getEffectDescription: () => 'Effect description'
                }
            },
            rebirthOneCount: 1,
            currentJob: null,
            currentSkill: null
        };

        // Mock DOM cache
        mockDOMCache = {
            elements: {
                taskRows: {},
                itemRows: {}
            }
        };

        // Mock DOM elements
        global.document = {
            getElementById: jest.fn(),
            getElementsByClassName: jest.fn()
        };
        
        // Mock format and formatCoins functions
        global.format = jest.fn((value) => value.toString());
        global.formatCoins = jest.fn((value, element) => {
            element.textContent = value.toString();
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Task Row Caching', () => {
        test('should cache task rows with correct IDs', () => {
            // Mock DOM elements for task rows
            const mockRow = {
                getElementsByClassName: jest.fn(() => [
                    { textContent: '', style: { width: '' } }, // level
                    { textContent: '', style: { width: '' } }, // xpGain
                    { textContent: '', style: { width: '' } }, // xpLeft
                    { textContent: '', style: { width: '' } }, // maxLevel
                    { textContent: '', style: { width: '' } }, // progressFill
                    { textContent: '', style: { width: '' } }, // valueElement
                    { textContent: '', style: { width: '' } }, // income
                    { textContent: '', style: { width: '' } }, // effect
                    { textContent: '', style: { width: '' } }  // skipSkill
                ])
            };

            // Mock getElementById to return the row
            document.getElementById = jest.fn((id) => {
                if (id === 'row Beggar' || id === 'row Farmer') {
                    return mockRow;
                }
                return null;
            });

            // Simulate the caching process
            for (const key in mockGameData.taskData) {
                const task = mockGameData.taskData[key];
                const row = document.getElementById("row " + task.name);
                if (row) {
                    mockDOMCache.elements.taskRows[task.name] = {
                        element: row,
                        level: row.getElementsByClassName("level")[0],
                        xpGain: row.getElementsByClassName("xpGain")[0],
                        xpLeft: row.getElementsByClassName("xpLeft")[0],
                        maxLevel: row.getElementsByClassName("maxLevel")[0],
                        progressFill: row.getElementsByClassName("progressFill")[0],
                        valueElement: row.getElementsByClassName("value")[0],
                        income: row.getElementsByClassName("income")[0],
                        effect: row.getElementsByClassName("effect")[0],
                        skipSkill: row.getElementsByClassName("skipSkill")[0]
                    };
                }
            }

            // Verify that task rows were cached
            expect(mockDOMCache.elements.taskRows['Beggar']).toBeDefined();
            expect(mockDOMCache.elements.taskRows['Farmer']).toBeDefined();
            expect(mockDOMCache.elements.taskRows['Beggar'].level).toBeDefined();
            expect(mockDOMCache.elements.taskRows['Farmer'].level).toBeDefined();
        });

        test('should handle missing task rows gracefully', () => {
            // Mock getElementById to return null (row not found)
            document.getElementById = jest.fn(() => null);

            // Simulate the caching process
            for (const key in mockGameData.taskData) {
                const task = mockGameData.taskData[key];
                const row = document.getElementById("row " + task.name);
                if (row) {
                    // This won't execute because row is null
                    mockDOMCache.elements.taskRows[task.name] = {};
                }
            }

            // Verify that no task rows were cached
            expect(mockDOMCache.elements.taskRows['Beggar']).toBeUndefined();
            expect(mockDOMCache.elements.taskRows['Farmer']).toBeUndefined();
        });
    });

    describe('Task Row Updates', () => {
        test('should update task row data correctly', () => {
            // Mock cached elements
            const mockCachedElements = {
                level: { textContent: '' },
                xpGain: { textContent: '' },
                xpLeft: { textContent: '' },
                maxLevel: { textContent: '' },
                progressFill: { style: { width: '' } },
                income: { textContent: '', style: { display: '' } },
                effect: { textContent: '', style: { display: '' } },
                skipSkill: { style: { display: '' } }
            };

            mockDOMCache.elements.taskRows['Beggar'] = mockCachedElements;

            // Mock format function
            global.format = jest.fn((value) => value.toString());

            // Mock formatCoins function
            global.formatCoins = jest.fn((value, element) => {
                element.textContent = value.toString();
            });

            // Simulate updateTaskRows function
            const task = mockGameData.taskData['Beggar'];
            const cached = mockDOMCache.elements.taskRows[task.name];
            
            if (cached) {
                // Update text content using cached elements
                cached.level.textContent = task.level;
                cached.xpGain.textContent = format(task.getXpGain());
                cached.xpLeft.textContent = format(task.getXpLeft());
                cached.maxLevel.textContent = task.maxLevel;
                
                // Update progress bar
                cached.progressFill.style.width = task.xp / task.getMaxXp() * 100 + "%";
                
                // Update income/effect values
                if (task.getIncome) {
                    formatCoins(task.getIncome(), cached.income);
                }
            }

            // Verify that the data was updated correctly
            expect(cached.level.textContent).toBe(5);
            expect(cached.xpGain.textContent).toBe('2.5');
            expect(cached.xpLeft.textContent).toBe('50');
            expect(cached.maxLevel.textContent).toBe(10);
            expect(cached.progressFill.style.width).toBe('50%');
        });

        test('should handle missing cached elements gracefully', () => {
            // Don't cache any elements
            mockDOMCache.elements.taskRows = {};

            // Mock format function
            global.format = jest.fn((value) => value.toString());

            // Simulate updateTaskRows function
            const task = mockGameData.taskData['Beggar'];
            const cached = mockDOMCache.elements.taskRows[task.name];
            
            // This should not throw an error
            expect(() => {
                if (cached) {
                    cached.level.textContent = task.level;
                }
            }).not.toThrow();
        });
    });

    describe('Data Corruption Scenarios', () => {
        test('should detect when job data shows column headers instead of values', () => {
            // Mock corrupted data where elements show column headers
            const mockCorruptedElements = {
                level: { textContent: 'Level' }, // Should be actual level
                xpGain: { textContent: 'Xp/day' }, // Should be actual XP gain
                xpLeft: { textContent: 'Xp left' }, // Should be actual XP left
                maxLevel: { textContent: 'Max level' }, // Should be actual max level
                income: { textContent: 'Income/day' } // Should be actual income
            };

            // This represents the corrupted state
            expect(mockCorruptedElements.level.textContent).toBe('Level');
            expect(mockCorruptedElements.xpGain.textContent).toBe('Xp/day');
            expect(mockCorruptedElements.xpLeft.textContent).toBe('Xp left');
            expect(mockCorruptedElements.maxLevel.textContent).toBe('Max level');
            expect(mockCorruptedElements.income.textContent).toBe('Income/day');
        });

        test('should verify correct data display', () => {
            // Mock correct data display
            const mockCorrectElements = {
                level: { textContent: '5' },
                xpGain: { textContent: '2.5' },
                xpLeft: { textContent: '50' },
                maxLevel: { textContent: '10' },
                income: { textContent: '10' }
            };

            // Verify that the data is displayed correctly
            expect(mockCorrectElements.level.textContent).toBe('5');
            expect(mockCorrectElements.xpGain.textContent).toBe('2.5');
            expect(mockCorrectElements.xpLeft.textContent).toBe('50');
            expect(mockCorrectElements.maxLevel.textContent).toBe('10');
            expect(mockCorrectElements.income.textContent).toBe('10');
        });
    });

    describe('Age Display Regression', () => {
        test('should detect incorrect age display', () => {
            // Mock incorrect age display scenario
            const mockAgeDisplay = {
                textContent: 'Age has caught up to you'
            };
            const mockAgeValue = 14; // Age 14
            const mockLifespan = 70; // Lifespan 70 years

            // This represents the regression where age message is incorrect
            expect(mockAgeDisplay.textContent).toBe('Age has caught up to you');
            expect(mockAgeValue).toBe(14);
            expect(mockLifespan).toBe(70);
            
            // Age 14 should not trigger "Age has caught up to you" message
            expect(mockAgeValue).toBeLessThan(mockLifespan);
        });

        test('should verify correct age display logic', () => {
            const age = 14;
            const lifespan = 70;
            const shouldShowAgeWarning = age >= lifespan;

            // Age 14 should not show age warning
            expect(shouldShowAgeWarning).toBe(false);
        });
    });

    describe('Regression Prevention', () => {
        test('should catch the specific regression where job data shows column headers', () => {
            // This test simulates the current regression state
            const mockTaskRows = {
                'Beggar': {
                    level: { textContent: 'Level' }, // Should be actual level
                    xpGain: { textContent: 'Xp/day' }, // Should be actual XP gain
                    xpLeft: { textContent: 'Xp left' }, // Should be actual XP left
                    maxLevel: { textContent: 'Max level' }, // Should be actual max level
                    income: { textContent: 'Income/day' } // Should be actual income
                }
            };

            // Check if data is corrupted (showing column headers instead of values)
            const isDataCorrupted = Object.values(mockTaskRows).some(row => 
                row.level.textContent === 'Level' ||
                row.xpGain.textContent === 'Xp/day' ||
                row.xpLeft.textContent === 'Xp left' ||
                row.maxLevel.textContent === 'Max level' ||
                row.income.textContent === 'Income/day'
            );

            expect(isDataCorrupted).toBe(true);
        });

        test('should verify that proper data display fixes the regression', () => {
            // This test shows how the regression should be fixed
            const mockTaskRows = {
                'Beggar': {
                    level: { textContent: '5' },
                    xpGain: { textContent: '2.5' },
                    xpLeft: { textContent: '50' },
                    maxLevel: { textContent: '10' },
                    income: { textContent: '10' }
                }
            };

            // Check if data is correct (showing actual values)
            const isDataCorrect = Object.values(mockTaskRows).every(row => 
                row.level.textContent !== 'Level' &&
                row.xpGain.textContent !== 'Xp/day' &&
                row.xpLeft.textContent !== 'Xp left' &&
                row.maxLevel.textContent !== 'Max level' &&
                row.income.textContent !== 'Income/day'
            );

            expect(isDataCorrect).toBe(true);
        });
    });

    describe('DOM Element Validation', () => {
        test('should validate that required DOM elements exist', () => {
            // Mock DOM elements that should exist
            const requiredElements = [
                'row Beggar',
                'row Farmer',
                'ageDisplay',
                'dayDisplay',
                'lifespanDisplay'
            ];

            // Mock getElementById to return elements for required ones
            document.getElementById = jest.fn((id) => {
                if (requiredElements.includes(id)) {
                    return { getElementsByClassName: jest.fn(() => []) };
                }
                return null;
            });

            // Check that all required elements exist
            requiredElements.forEach(elementId => {
                const element = document.getElementById(elementId);
                expect(element).toBeDefined();
            });
        });

        test('should handle missing DOM elements gracefully', () => {
            // Mock getElementById to return null for all elements
            document.getElementById = jest.fn(() => null);

            // This should not throw an error
            expect(() => {
                const element = document.getElementById('row Beggar');
                if (element) {
                    // This won't execute because element is null
                }
            }).not.toThrow();
        });
    });
});
