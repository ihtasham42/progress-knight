/**
 * Power Level Calculator Tests
 * Tests the VS Battles-inspired power tiering system
 */

describe('PowerLevelCalculator', () => {
    let PowerLevelCalculator;

    beforeEach(() => {
        // Load the module
        PowerLevelCalculator = require('../../llm/utils/PowerLevelCalculator');
    });

    describe('Tier Calculation - Basic Cases', () => {
        test('should calculate 10-C tier for starting character (0 stats)', () => {
            const stats = {
                Strength: 0,
                ManaControl: 0,
                Intelligence: 0,
                Charisma: 0
            };

            const result = PowerLevelCalculator.calculatePowerLevel(stats);

            expect(result.effectivePower).toBe(0);
            expect(result.tier).toBe('10-C');
            expect(result.tierName).toBe('Below Average Human');
        });

        test('should calculate 9-C tier at Strength 55', () => {
            const stats = {
                Strength: 55,
                ManaControl: 0,
                Intelligence: 0,
                Charisma: 0
            };

            const result = PowerLevelCalculator.calculatePowerLevel(stats);

            expect(result.effectivePower).toBe(55);
            expect(result.tier).toBe('9-C');
            expect(result.tierName).toBe('Street level');
        });

        test('should calculate 6-A tier at Strength + Mana Control = 100,000', () => {
            const stats = {
                Strength: 50000,
                ManaControl: 50000,
                Intelligence: 0,
                Charisma: 0
            };

            const result = PowerLevelCalculator.calculatePowerLevel(stats);

            expect(result.primaryPower).toBe(100000);
            expect(result.effectivePower).toBe(100000);
            expect(result.tier).toBe('6-A');
            expect(result.tierName).toBe('Continent level');
        });
    });

    describe('Combat Multiplier Calculation', () => {
        test('should calculate multiplier from combat stats', () => {
            const stats = {
                Strength: 10000,
                ManaControl: 10000,
                Intelligence: 5000,
                Charisma: 5000
            };

            const result = PowerLevelCalculator.calculatePowerLevel(stats);

            // Primary: 20,000
            // Other stats: 10,000 total
            // Multiplier: 1 + (10000 / 100000) = 1.1
            // Effective: 20,000 * 1.1 = 22,000
            expect(result.primaryPower).toBe(20000);
            expect(result.combatMultiplier).toBeCloseTo(1.1, 2);
            expect(result.effectivePower).toBeCloseTo(22000, 0);
            expect(result.tier).toBe('7-B'); // 22,000 is between 10,000 (7-B) and 25,000 (7-A)
        });

        test('should cap multiplier at 2.0x when combat stats reach 100,000', () => {
            const stats = {
                Strength: 50000,
                ManaControl: 50000,
                Intelligence: 50000,
                Charisma: 50000
            };

            const result = PowerLevelCalculator.calculatePowerLevel(stats);

            // Primary: 100,000
            // Other stats: 100,000 total (max)
            // Multiplier: 1 + (100000 / 100000) = 2.0 (capped)
            // Effective: 100,000 * 2.0 = 200,000
            expect(result.primaryPower).toBe(100000);
            expect(result.combatMultiplier).toBe(2.0);
            expect(result.effectivePower).toBe(200000);
        });

        test('should not exceed 2.0x multiplier even with stats > 100,000', () => {
            const stats = {
                Strength: 50000,
                ManaControl: 50000,
                Intelligence: 75000,
                Charisma: 75000
            };

            const result = PowerLevelCalculator.calculatePowerLevel(stats);

            // Even though other stats = 150,000, multiplier caps at 2.0
            expect(result.combatMultiplier).toBe(2.0);
            expect(result.effectivePower).toBe(200000);
        });

        test('should achieve 5-C tier only with multiplier boost', () => {
            const stats = {
                Strength: 500000,
                ManaControl: 500000,
                Intelligence: 100000,
                Charisma: 0
            };

            const result = PowerLevelCalculator.calculatePowerLevel(stats);

            // Primary: 1,000,000
            // Other stats: 100,000 (max multiplier contribution)
            // Multiplier: 2.0
            // Effective: 1,000,000 * 2.0 = 2,000,000
            expect(result.primaryPower).toBe(1000000);
            expect(result.combatMultiplier).toBe(2.0);
            expect(result.effectivePower).toBe(2000000);
            expect(result.tier).toBe('5-C');
            expect(result.tierName).toBe('Moon level');
        });
    });

    describe('Tier Threshold Mapping', () => {
        const tierTests = [
            { power: 0, tier: '10-C', name: 'Below Average Human' },
            { power: 10, tier: '10-B', name: 'Human level' },
            { power: 25, tier: '10-A', name: 'Athlete level' },
            { power: 55, tier: '9-C', name: 'Street level' },
            { power: 100, tier: '9-B', name: 'Wall level' },
            { power: 200, tier: '9-A', name: 'Room level' },
            { power: 500, tier: '8-C', name: 'Building level' },
            { power: 1000, tier: '8-B', name: 'City Block level' },
            { power: 2000, tier: '8-A', name: 'Multi-City Block' },
            { power: 5000, tier: '7-C', name: 'Town level' },
            { power: 10000, tier: '7-B', name: 'City level' },
            { power: 25000, tier: '7-A', name: 'Mountain level' },
            { power: 50000, tier: '6-C', name: 'Island level' },
            { power: 75000, tier: '6-B', name: 'Country level' },
            { power: 100000, tier: '6-A', name: 'Continent level' },
            { power: 1000000, tier: '5-C', name: 'Moon level' }
        ];

        tierTests.forEach(({ power, tier, name }) => {
            test(`should map ${power} effective power to tier ${tier} (${name})`, () => {
                const result = PowerLevelCalculator.getPowerTier(power);
                expect(result.tier).toBe(tier);
                expect(result.tierName).toBe(name);
            });
        });
    });

    describe('Career-Relevant Skills Extraction', () => {
        const mockCharacterState = {
            skills: [
                { name: 'Strength', level: 100, effect: 10 },
                { name: 'Intelligence', level: 50, effect: 5 },
                { name: 'Charisma', level: 75, effect: 7 },
                { name: 'Magic', level: 25, effect: 2 }
            ],
            jobs: [
                { name: 'Farmer', level: 20, income: 100 }
            ]
        };

        test('should extract Common Work relevant skills', () => {
            const skills = PowerLevelCalculator.getCareerRelevantSkills(
                mockCharacterState,
                'Common work'
            );

            expect(skills).toContain('Strength (Lv 100)');
            expect(skills).toContain('Charisma (Lv 75)');
            expect(skills).toContain('Intelligence (Lv 50)');
        });

        test('should extract Military relevant skills', () => {
            const skills = PowerLevelCalculator.getCareerRelevantSkills(
                mockCharacterState,
                'Military'
            );

            expect(skills).toContain('Strength (Lv 100)');
            // Military focuses on strength and physical combat
        });

        test('should extract Arcane relevant skills', () => {
            const skills = PowerLevelCalculator.getCareerRelevantSkills(
                mockCharacterState,
                'The Arcane'
            );

            expect(skills).toContain('Magic (Lv 25)');
            expect(skills).toContain('Intelligence (Lv 50)');
        });

        test('should limit to top 5 skills', () => {
            const largeSkillSet = {
                skills: Array.from({ length: 20 }, (_, i) => ({
                    name: `Skill${i}`,
                    level: 100 - i,
                    effect: 10 - i
                }))
            };

            const skills = PowerLevelCalculator.getCareerRelevantSkills(
                largeSkillSet,
                'Common work'
            );

            expect(skills.length).toBeLessThanOrEqual(5);
        });
    });

    describe('Combat Capability Description', () => {
        test('should describe low-tier capabilities', () => {
            const description = PowerLevelCalculator.getCombatCapabilityDescription(
                '10-C',
                'Common work'
            );

            expect(description).toContain('struggle');
            expect(description.toLowerCase()).toContain('basic');
        });

        test('should describe mid-tier capabilities', () => {
            const description = PowerLevelCalculator.getCombatCapabilityDescription(
                '7-B',
                'Military'
            );

            expect(description.toLowerCase()).toMatch(/cit(y|ies)/);
            expect(description).toBeTruthy();
        });

        test('should describe high-tier capabilities', () => {
            const description = PowerLevelCalculator.getCombatCapabilityDescription(
                '6-A',
                'The Arcane'
            );

            // Should describe high-tier power (6-A is continent level)
            expect(description.length).toBeGreaterThan(20);
            expect(description).toBeTruthy();
        });

        test('should describe legendary-tier capabilities', () => {
            const description = PowerLevelCalculator.getCombatCapabilityDescription(
                '5-C',
                'The Void'
            );

            // Should describe legendary-tier power (5-C is moon level)
            expect(description.length).toBeGreaterThan(20);
            expect(description).toBeTruthy();
        });

        test('should adapt description to career category', () => {
            const militaryDesc = PowerLevelCalculator.getCombatCapabilityDescription(
                '7-B',
                'Military'
            );
            const arcaneDesc = PowerLevelCalculator.getCombatCapabilityDescription(
                '7-B',
                'The Arcane'
            );

            expect(militaryDesc).not.toBe(arcaneDesc);
        });
    });

    describe('Integration Tests', () => {
        test('should handle missing or null stats gracefully', () => {
            const stats = {
                Strength: null,
                ManaControl: undefined
            };

            const result = PowerLevelCalculator.calculatePowerLevel(stats);

            expect(result.effectivePower).toBe(0);
            expect(result.tier).toBe('10-C');
        });

        test('should handle negative stats by treating as 0', () => {
            const stats = {
                Strength: -100,
                ManaControl: -50
            };

            const result = PowerLevelCalculator.calculatePowerLevel(stats);

            expect(result.effectivePower).toBe(0);
            expect(result.tier).toBe('10-C');
        });

        test('should calculate realistic mid-game character', () => {
            const stats = {
                Strength: 2500,
                ManaControl: 2500,
                Intelligence: 1000,
                Charisma: 500
            };

            const result = PowerLevelCalculator.calculatePowerLevel(stats);

            // Primary: 5000
            // Other: 1500
            // Multiplier: 1.015
            // Effective: ~5075
            expect(result.primaryPower).toBe(5000);
            expect(result.tier).toBe('7-C'); // Town level
        });

        test('should calculate late-game character correctly', () => {
            const stats = {
                Strength: 40000,
                ManaControl: 40000,
                Intelligence: 20000,
                Charisma: 20000
            };

            const result = PowerLevelCalculator.calculatePowerLevel(stats);

            // Primary: 80,000
            // Other: 40,000
            // Multiplier: 1.4
            // Effective: 112,000
            expect(result.primaryPower).toBe(80000);
            expect(result.combatMultiplier).toBeCloseTo(1.4, 2);
            expect(result.tier).toBe('6-A'); // Continent level
        });
    });
});

