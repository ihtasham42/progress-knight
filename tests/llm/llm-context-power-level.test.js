/**
 * LLM Context Power Level Integration Tests
 * Tests that power levels are properly included in LLM prompts
 */

describe('LLM Context Power Level Integration', () => {
    let PowerLevelCalculator;
    let mockAdventureSystem;
    let mockCharacterState;

    beforeEach(() => {
        // Load PowerLevelCalculator
        PowerLevelCalculator = require('../../llm/utils/PowerLevelCalculator');

        // Mock character states for different power levels
        mockCharacterState = {
            age: 25,
            days: 365 * 25,
            currentJob: 'Farmer',
            coins: 1000,
            evil: 0,
            skills: [],
            jobs: []
        };
    });

    describe('Power Level Context Generation', () => {
        test('should generate context for low-level character (10-C)', () => {
            const stats = {
                Strength: 0,
                ManaControl: 0,
                Intelligence: 0,
                Charisma: 0
            };

            const powerLevel = PowerLevelCalculator.calculatePowerLevel(stats);
            
            expect(powerLevel.tier).toBe('10-C');
            expect(powerLevel.tierName).toBe('Below Average Human');
            
            const context = PowerLevelCalculator.generateLLMContext(powerLevel, 'Common work');
            
            expect(context).toContain('10-C');
            expect(context).toContain('Below Average Human');
            expect(context.toLowerCase()).toContain('struggle');
        });

        test('should generate context for mid-level character (7-B)', () => {
            const stats = {
                Strength: 5000,
                ManaControl: 5000,
                Intelligence: 1000,
                Charisma: 1000
            };

            const powerLevel = PowerLevelCalculator.calculatePowerLevel(stats);
            
            expect(powerLevel.tier).toBe('7-B');
            
            const context = PowerLevelCalculator.generateLLMContext(powerLevel, 'Military');
            
            expect(context).toContain('7-B');
            expect(context).toContain('City level');
        });

        test('should generate context for high-level character (6-A)', () => {
            const stats = {
                Strength: 50000,
                ManaControl: 50000,
                Intelligence: 10000,
                Charisma: 10000
            };

            const powerLevel = PowerLevelCalculator.calculatePowerLevel(stats);
            
            expect(powerLevel.tier).toBe('6-A');
            
            const context = PowerLevelCalculator.generateLLMContext(powerLevel, 'The Arcane');
            
            expect(context).toContain('6-A');
            expect(context).toContain('Continent level');
        });

        test('should generate context for legendary character (5-C)', () => {
            const stats = {
                Strength: 500000,
                ManaControl: 500000,
                Intelligence: 100000,
                Charisma: 0
            };

            const powerLevel = PowerLevelCalculator.calculatePowerLevel(stats);
            
            expect(powerLevel.tier).toBe('5-C');
            
            const context = PowerLevelCalculator.generateLLMContext(powerLevel, 'The Void');
            
            expect(context).toContain('5-C');
            expect(context).toContain('Moon level');
        });
    });

    describe('Narrative Guidance Generation', () => {
        test('should provide guidance for low-tier character', () => {
            const guidance = PowerLevelCalculator.getNarrativeGuidance('10-C', 'Common work');
            
            expect(guidance).toBeDefined();
            expect(guidance.difficultyLevel).toBeDefined();
            expect(guidance.challengeType).toBeDefined();
            expect(guidance.expectedOutcome).toBeDefined();
        });

        test('should provide different guidance for different tiers', () => {
            const lowTierGuidance = PowerLevelCalculator.getNarrativeGuidance('10-C', 'Military');
            const midTierGuidance = PowerLevelCalculator.getNarrativeGuidance('7-B', 'Military');
            const highTierGuidance = PowerLevelCalculator.getNarrativeGuidance('6-A', 'Military');
            
            expect(lowTierGuidance.difficultyLevel).not.toBe(midTierGuidance.difficultyLevel);
            expect(midTierGuidance.difficultyLevel).not.toBe(highTierGuidance.difficultyLevel);
        });

        test('should adapt guidance to career category', () => {
            const militaryGuidance = PowerLevelCalculator.getNarrativeGuidance('7-B', 'Military');
            const arcaneGuidance = PowerLevelCalculator.getNarrativeGuidance('7-B', 'The Arcane');
            const commonGuidance = PowerLevelCalculator.getNarrativeGuidance('7-B', 'Common work');
            
            expect(militaryGuidance.challengeType).toBeDefined();
            expect(arcaneGuidance.challengeType).toBeDefined();
            expect(commonGuidance.challengeType).toBeDefined();
        });
    });

    describe('Full Prompt Context Construction', () => {
        test('should build complete context string for LLM prompt', () => {
            const stats = {
                Strength: 2500,
                ManaControl: 2500,
                Intelligence: 1000,
                Charisma: 500
            };

            mockCharacterState.skills = [
                { name: 'Strength', level: 25, effect: 25 },
                { name: 'ManaControl', level: 25, effect: 25 },
                { name: 'Intelligence', level: 10, effect: 10 }
            ];

            const powerLevel = PowerLevelCalculator.calculatePowerLevel(stats);
            const fullContext = PowerLevelCalculator.buildFullPromptContext(
                mockCharacterState,
                powerLevel,
                'Common work',
                'age25'
            );

            // Should include all key elements
            expect(fullContext).toContain('Age: 25');
            expect(fullContext).toContain('Farmer');
            expect(fullContext).toContain('Power Tier:');
            expect(fullContext).toContain('7-C'); // Town level
            expect(fullContext).toContain('Relevant Skills:');
            expect(fullContext).toContain('NARRATIVE GUIDANCE:');
        });

        test('should format relevant skills properly', () => {
            mockCharacterState.skills = [
                { name: 'Strength', level: 50, effect: 50 },
                { name: 'Intelligence', level: 30, effect: 30 },
                { name: 'Charisma', level: 20, effect: 20 },
                { name: 'Magic', level: 10, effect: 10 }
            ];

            const stats = {
                Strength: 5000,
                ManaControl: 0,
                Intelligence: 3000,
                Charisma: 2000
            };

            const powerLevel = PowerLevelCalculator.calculatePowerLevel(stats);
            const context = PowerLevelCalculator.buildFullPromptContext(
                mockCharacterState,
                powerLevel,
                'Common work',
                'age25'
            );

            expect(context).toContain('Strength');
            expect(context).toContain('Lv');
        });

        test('should include combat capability description', () => {
            const stats = {
                Strength: 10000,
                ManaControl: 10000,
                Intelligence: 2000,
                Charisma: 2000
            };

            const powerLevel = PowerLevelCalculator.calculatePowerLevel(stats);
            const context = PowerLevelCalculator.buildFullPromptContext(
                mockCharacterState,
                powerLevel,
                'Military',
                'age45'
            );

            expect(context).toContain('Combat Capability:');
            // Should describe city-level threats
            expect(context.toLowerCase()).toContain('city');
        });
    });

    describe('Career-Specific Context', () => {
        const testStats = {
            Strength: 5000,
            ManaControl: 5000,
            Intelligence: 1000,
            Charisma: 1000
        };

        test('should generate Common Work specific context', () => {
            const powerLevel = PowerLevelCalculator.calculatePowerLevel(testStats);
            const context = PowerLevelCalculator.buildFullPromptContext(
                mockCharacterState,
                powerLevel,
                'Common work',
                'age25'
            );

            expect(context).toContain('Common work');
        });

        test('should generate Military specific context', () => {
            const powerLevel = PowerLevelCalculator.calculatePowerLevel(testStats);
            mockCharacterState.currentJob = 'Knight';
            
            const context = PowerLevelCalculator.buildFullPromptContext(
                mockCharacterState,
                powerLevel,
                'Military',
                'age25'
            );

            expect(context).toContain('Military');
            expect(context).toContain('Knight');
        });

        test('should generate Arcane specific context', () => {
            const powerLevel = PowerLevelCalculator.calculatePowerLevel(testStats);
            mockCharacterState.currentJob = 'Wizard';
            
            const context = PowerLevelCalculator.buildFullPromptContext(
                mockCharacterState,
                powerLevel,
                'The Arcane',
                'age25'
            );

            expect(context).toContain('The Arcane');
            expect(context).toContain('Wizard');
        });

        test('should generate Void specific context', () => {
            const powerLevel = PowerLevelCalculator.calculatePowerLevel(testStats);
            mockCharacterState.currentJob = 'Void mage';
            mockCharacterState.evil = 50;
            
            const context = PowerLevelCalculator.buildFullPromptContext(
                mockCharacterState,
                powerLevel,
                'The Void',
                'age25'
            );

            expect(context).toContain('The Void');
            expect(context).toContain('Void mage');
        });

        test('should generate Nobility specific context', () => {
            const powerLevel = PowerLevelCalculator.calculatePowerLevel(testStats);
            mockCharacterState.currentJob = 'Duke';
            mockCharacterState.coins = 1000000;
            
            const context = PowerLevelCalculator.buildFullPromptContext(
                mockCharacterState,
                powerLevel,
                'Nobility',
                'age25'
            );

            expect(context).toContain('Nobility');
            expect(context).toContain('Duke');
        });
    });

    describe('Difficulty Scaling', () => {
        test('low tier should face basic challenges', () => {
            const guidance = PowerLevelCalculator.getNarrativeGuidance('10-C', 'Common work');
            
            expect(guidance.difficultyLevel.toLowerCase()).toMatch(/basic|simple|easy|straightforward/);
        });

        test('mid tier should face significant challenges', () => {
            const guidance = PowerLevelCalculator.getNarrativeGuidance('8-B', 'Military');
            
            expect(guidance.difficultyLevel.toLowerCase()).toMatch(/significant|destructive/);
        });

        test('high tier should face epic challenges', () => {
            const guidance = PowerLevelCalculator.getNarrativeGuidance('6-A', 'The Arcane');
            
            expect(guidance.difficultyLevel.toLowerCase()).toMatch(/epic|legendary|continental|massive/);
        });

        test('legendary tier should face world-ending challenges', () => {
            const guidance = PowerLevelCalculator.getNarrativeGuidance('5-C', 'The Void');
            
            expect(guidance.difficultyLevel.toLowerCase()).toMatch(/world-ending|apocalyptic|cosmic|planetary/);
        });
    });

    describe('Context Consistency', () => {
        test('should generate consistent context for same inputs', () => {
            const stats = {
                Strength: 5000,
                ManaControl: 5000,
                Intelligence: 1000,
                Charisma: 1000
            };

            const powerLevel = PowerLevelCalculator.calculatePowerLevel(stats);
            const context1 = PowerLevelCalculator.buildFullPromptContext(
                mockCharacterState,
                powerLevel,
                'Military',
                'age25'
            );
            const context2 = PowerLevelCalculator.buildFullPromptContext(
                mockCharacterState,
                powerLevel,
                'Military',
                'age25'
            );

            expect(context1).toBe(context2);
        });

        test('should generate different context for different power levels', () => {
            const lowStats = { Strength: 10, ManaControl: 10, Intelligence: 5, Charisma: 5 };
            const highStats = { Strength: 50000, ManaControl: 50000, Intelligence: 10000, Charisma: 10000 };

            const lowPower = PowerLevelCalculator.calculatePowerLevel(lowStats);
            const highPower = PowerLevelCalculator.calculatePowerLevel(highStats);

            const lowContext = PowerLevelCalculator.buildFullPromptContext(
                mockCharacterState,
                lowPower,
                'Common work',
                'age25'
            );
            const highContext = PowerLevelCalculator.buildFullPromptContext(
                mockCharacterState,
                highPower,
                'Common work',
                'age25'
            );

            expect(lowContext).not.toBe(highContext);
            expect(lowPower.tier).not.toBe(highPower.tier);
        });
    });

    describe('Integration with Story Tree', () => {
        test('should store power level with story choice', () => {
            const stats = {
                Strength: 2500,
                ManaControl: 2500,
                Intelligence: 500,
                Charisma: 500
            };

            const powerLevel = PowerLevelCalculator.calculatePowerLevel(stats);

            // Mock story tree entry
            const storyBranch = {
                choice: 'Attack the dragon',
                result: true,
                powerLevel: powerLevel.effectivePower,
                powerTier: powerLevel.tier,
                timestamp: Date.now()
            };

            expect(storyBranch.powerLevel).toBeGreaterThan(0);
            expect(storyBranch.powerTier).toBeDefined();
            expect(['10-C', '10-B', '10-A', '9-C', '9-B', '9-A', '8-C', '8-B', '8-A', 
                    '7-C', '7-B', '7-A', '6-C', '6-B', '6-A', '5-C']).toContain(storyBranch.powerTier);
        });

        test('should use stored power level for revisited choices', () => {
            // First visit: low level
            const firstVisitStats = {
                Strength: 100,
                ManaControl: 100,
                Intelligence: 50,
                Charisma: 50
            };
            const firstVisitPower = PowerLevelCalculator.calculatePowerLevel(firstVisitStats);

            // Store with first visit power
            const storedChoice = {
                choice: 'Negotiate with merchant',
                result: true,
                powerLevel: firstVisitPower.effectivePower,
                powerTier: firstVisitPower.tier
            };

            // Second visit: high level (but should use stored power for story)
            const secondVisitStats = {
                Strength: 50000,
                ManaControl: 50000,
                Intelligence: 10000,
                Charisma: 10000
            };
            const secondVisitPower = PowerLevelCalculator.calculatePowerLevel(secondVisitStats);

            // Story should use stored power level from first visit
            expect(storedChoice.powerLevel).toBe(firstVisitPower.effectivePower);
            expect(storedChoice.powerTier).toBe(firstVisitPower.tier);
            expect(firstVisitPower.tier).not.toBe(secondVisitPower.tier);
        });
    });
});

