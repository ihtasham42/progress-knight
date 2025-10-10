/**
 * Power Level Calculator
 * Calculates character power tiers based on VS Battles Wiki tiering system
 * Reference: https://vsbattles.fandom.com/wiki/Tiering_System
 */

class PowerLevelCalculator {
    /**
     * Tier thresholds mapping
     * Maps effective power to tier codes
     */
    static TIER_THRESHOLDS = [
        { threshold: 1000000, tier: '5-C', name: 'Moon level' },
        { threshold: 100000, tier: '6-A', name: 'Continent level' },
        { threshold: 75000, tier: '6-B', name: 'Country level' },
        { threshold: 50000, tier: '6-C', name: 'Island level' },
        { threshold: 25000, tier: '7-A', name: 'Mountain level' },
        { threshold: 10000, tier: '7-B', name: 'City level' },
        { threshold: 5000, tier: '7-C', name: 'Town level' },
        { threshold: 2000, tier: '8-A', name: 'Multi-City Block' },
        { threshold: 1000, tier: '8-B', name: 'City Block level' },
        { threshold: 500, tier: '8-C', name: 'Building level' },
        { threshold: 200, tier: '9-A', name: 'Room level' },
        { threshold: 100, tier: '9-B', name: 'Wall level' },
        { threshold: 55, tier: '9-C', name: 'Street level' },
        { threshold: 25, tier: '10-A', name: 'Athlete level' },
        { threshold: 10, tier: '10-B', name: 'Human level' },
        { threshold: 0, tier: '10-C', name: 'Below Average Human' }
    ];

    /**
     * Career-relevant skills mapping
     */
    static CAREER_SKILLS = {
        'Common work': ['Strength', 'Charisma', 'Intelligence'],
        'Military': ['Strength', 'Constitution', 'Combat', 'Endurance'],
        'The Arcane': ['ManaControl', 'Magic', 'Intelligence'],
        'The Void': ['ManaControl', 'Evil', 'DarkMagic', 'Intelligence'],
        'Nobility': ['Charisma', 'Intelligence', 'Influence']
    };

    /**
     * Calculate complete power level information
     * @param {Object} stats - Character stats { Strength, ManaControl, Intelligence, Charisma, ... }
     * @returns {Object} Power level details
     */
    static calculatePowerLevel(stats) {
        const primaryPower = this.calculatePrimaryPower(stats);
        const combatMultiplier = this.calculateCombatMultiplier(stats);
        const effectivePower = Math.floor(primaryPower * combatMultiplier);
        const tierInfo = this.getPowerTier(effectivePower);

        return {
            primaryPower,
            combatMultiplier,
            effectivePower,
            tier: tierInfo.tier,
            tierName: tierInfo.tierName
        };
    }

    /**
     * Calculate primary power from Strength + Mana Control
     * @param {Object} stats - Character stats
     * @returns {number} Primary power value
     */
    static calculatePrimaryPower(stats) {
        const strength = this.getSafeStat(stats.Strength);
        const manaControl = this.getSafeStat(stats.ManaControl);
        return strength + manaControl;
    }

    /**
     * Calculate combat multiplier from other stats
     * Caps at 2.0x when other stats sum to 100,000
     * @param {Object} stats - Character stats
     * @returns {number} Combat multiplier (1.0 to 2.0)
     */
    static calculateCombatMultiplier(stats) {
        const intelligence = this.getSafeStat(stats.Intelligence);
        const charisma = this.getSafeStat(stats.Charisma);
        const constitution = this.getSafeStat(stats.Constitution) || 0;
        const speed = this.getSafeStat(stats.Speed) || 0;
        const endurance = this.getSafeStat(stats.Endurance) || 0;

        const otherStatsSum = intelligence + charisma + constitution + speed + endurance;
        const maxOtherStats = 100000;

        // Calculate multiplier: 1.0 + (otherStats / maxOtherStats)
        // Caps at 2.0 when otherStats reaches maxOtherStats
        const multiplier = 1.0 + Math.min(otherStatsSum / maxOtherStats, 1.0);

        return multiplier;
    }

    /**
     * Get power tier from effective power
     * @param {number} effectivePower - The calculated effective power
     * @returns {Object} { tier, tierName }
     */
    static getPowerTier(effectivePower) {
        // Ensure non-negative
        const power = Math.max(0, effectivePower);

        // Find the appropriate tier
        for (const threshold of this.TIER_THRESHOLDS) {
            if (power >= threshold.threshold) {
                return {
                    tier: threshold.tier,
                    tierName: threshold.name
                };
            }
        }

        // Fallback to lowest tier
        return {
            tier: '10-C',
            tierName: 'Below Average Human'
        };
    }

    /**
     * Get career-relevant skills from character state
     * @param {Object} characterState - The encoded character state
     * @param {string} careerCategory - Career category name
     * @returns {Array<string>} Array of skill descriptions
     */
    static getCareerRelevantSkills(characterState, careerCategory) {
        if (!characterState.skills || !Array.isArray(characterState.skills)) {
            return [];
        }

        const relevantSkillNames = this.CAREER_SKILLS[careerCategory] || this.CAREER_SKILLS['Common work'];
        
        // Filter and format skills
        const relevantSkills = characterState.skills
            .filter(skill => {
                // Check if skill name matches any relevant skill (case-insensitive partial match)
                return relevantSkillNames.some(relevantName => 
                    skill.name.toLowerCase().includes(relevantName.toLowerCase()) ||
                    relevantName.toLowerCase().includes(skill.name.toLowerCase())
                );
            })
            .sort((a, b) => b.level - a.level) // Sort by level descending
            .slice(0, 5) // Take top 5
            .map(skill => `${skill.name} (Lv ${skill.level})`);

        return relevantSkills;
    }

    /**
     * Get combat capability description for a tier
     * @param {string} tier - Power tier code (e.g., '7-B')
     * @param {string} careerCategory - Career category
     * @returns {string} Description of combat capabilities
     */
    static getCombatCapabilityDescription(tier, careerCategory) {
        const descriptions = {
            '10-C': {
                'Common work': 'You struggle with basic labor, your limited strength barely sufficient for simple tasks.',
                'Military': 'You are weaker than an average soldier, unable to wield standard weapons effectively.',
                'The Arcane': 'You barely grasp the fundamentals of magic, struggling with the simplest cantrips.',
                'The Void': 'The void remains beyond your reach, its power too great for your frail grasp.',
                'Nobility': 'You lack the presence and influence to command even basic respect.'
            },
            '10-B': {
                'Common work': 'You possess average human strength, capable of standard labor.',
                'Military': 'You can handle basic weapons and armor like a common soldier.',
                'The Arcane': 'You can cast simple spells, though nothing extraordinary.',
                'The Void': 'You sense the void\'s presence but cannot yet tap its power.',
                'Nobility': 'You have basic social graces and can navigate simple negotiations.'
            },
            '10-A': {
                'Common work': 'Your physical prowess matches that of a trained athlete or craftsman.',
                'Military': 'You fight with the skill of a seasoned warrior.',
                'The Arcane': 'Your magical abilities surpass common practitioners.',
                'The Void': 'You can channel minor void energies, though with effort.',
                'Nobility': 'Your charisma and influence command respect in social circles.'
            },
            '9-C': {
                'Common work': 'Your strength exceeds peak human ability, capable of impressive physical feats.',
                'Military': 'You can break through wooden doors and overpower multiple opponents.',
                'The Arcane': 'Your spells can affect groups of people or objects.',
                'The Void': 'You wield void magic that unsettles even experienced mages.',
                'Nobility': 'Your presence and political acumen rival established nobles.'
            },
            '9-B': {
                'Common work': 'You can damage walls and lift tremendous weight.',
                'Military': 'Your strikes can shatter stone and your endurance is legendary.',
                'The Arcane': 'Your magic can alter the battlefield and control elements.',
                'The Void': 'Your void magic corrupts reality in noticeable ways.',
                'Nobility': 'Your influence extends across multiple regions.'
            },
            '9-A': {
                'Common work': 'You can demolish rooms and structures with your bare hands.',
                'Military': 'You are a one-person army, capable of routing enemy formations.',
                'The Arcane': 'Your spells reshape landscapes and summon powerful entities.',
                'The Void': 'The void responds to your will, warping space itself.',
                'Nobility': 'Nations seek your favor and alliances.'
            },
            '8-C': {
                'Common work': 'Your power can level buildings, making conventional construction insignificant.',
                'Military': 'You can single-handedly destroy fortifications.',
                'The Arcane': 'Your magic commands respect from the most powerful wizards.',
                'The Void': 'Your void magic threatens entire communities.',
                'Nobility': 'You rule with power that shapes kingdoms.'
            },
            '8-B': {
                'Common work': 'You can destroy city blocks with your might.',
                'Military': 'Armies flee before your approach, knowing conventional forces cannot stop you.',
                'The Arcane': 'Your spells are legendary, studied by generations of mages.',
                'The Void': 'The void bends reality around you, creating zones of impossible physics.',
                'Nobility': 'Your word can topple kingdoms or raise them up.'
            },
            '8-A': {
                'Common work': 'Your power threatens multiple city districts.',
                'Military': 'You are a living weapon of mass destruction.',
                'The Arcane': 'Your magic reshapes the fundamental laws of nature.',
                'The Void': 'You command void energies that terrify even the most powerful beings.',
                'Nobility': 'Empires rise and fall at your command.'
            },
            '7-C': {
                'Common work': 'Your might can devastate entire towns.',
                'Military': 'You are a town-threatening force, capable of razing settlements.',
                'The Arcane': 'Your magic rivals the greatest archmages in history.',
                'The Void': 'Your connection to the void is so profound that reality trembles.',
                'Nobility': 'Continental powers negotiate with you as an equal.'
            },
            '7-B': {
                'Common work': 'Your power operates on a city-wide scale.',
                'Military': 'Cities fortify their defenses when you march to war.',
                'The Arcane': 'Your spells can alter weather patterns and reshape geography.',
                'The Void': 'The void manifests physically around you, consuming light itself.',
                'Nobility': 'You command the loyalty of entire civilizations.'
            },
            '7-A': {
                'Common work': 'You can reshape mountains and alter landscapes.',
                'Military': 'Your presence on the battlefield determines the fate of nations.',
                'The Arcane': 'You bend reality itself to your arcane will.',
                'The Void': 'You are a living conduit to the void, a tear in reality.',
                'Nobility': 'Your influence spans continents, shaping the course of history.'
            },
            '6-C': {
                'Common work': 'Your power operates on an island-wide scale.',
                'Military': 'You are a strategic asset worth more than entire armies.',
                'The Arcane': 'Your magic transcends mortal understanding.',
                'The Void': 'The void responds to your thoughts, reality your plaything.',
                'Nobility': 'Civilizations worship you as a living god.'
            },
            '6-B': {
                'Common work': 'You threaten countries with your mere existence.',
                'Military': 'Nations unite or perish in your wake.',
                'The Arcane': 'You rewrite the laws of magic itself.',
                'The Void': 'You are the void made flesh, entropy incarnate.',
                'Nobility': 'You rule not through title but through absolute power.'
            },
            '6-A': {
                'Common work': 'Your continental-scale power reshapes civilization.',
                'Military': 'You are a force of nature, unstoppable and inevitable.',
                'The Arcane': 'Reality bends to accommodate your magical supremacy.',
                'The Void': 'The boundary between you and the void no longer exists.',
                'Nobility': 'The world itself recognizes your sovereignty.'
            },
            '5-C': {
                'Common work': 'Your power rivals celestial bodies, threatening the very planet.',
                'Military': 'You transcend the concept of warfare, a living apocalypse.',
                'The Arcane': 'You have become magic itself, beyond mortal comprehension.',
                'The Void': 'You are the void, the end of all things, the final darkness.',
                'Nobility': 'You stand alone as a power beyond nations, beyond worlds.'
            }
        };

        const tierDescriptions = descriptions[tier];
        if (!tierDescriptions) {
            return 'Your power is difficult to measure.';
        }

        return tierDescriptions[careerCategory] || tierDescriptions['Common work'];
    }

    /**
     * Generate LLM context string
     * @param {Object} powerLevel - Power level calculation result
     * @param {string} careerCategory - Career category
     * @returns {string} Context string for LLM
     */
    static generateLLMContext(powerLevel, careerCategory) {
        const capability = this.getCombatCapabilityDescription(powerLevel.tier, careerCategory);
        
        return `Power Tier: ${powerLevel.tier} (${powerLevel.tierName})
Effective Power: ${powerLevel.effectivePower}
Combat Capability: ${capability}`;
    }

    /**
     * Get narrative guidance for a tier
     * @param {string} tier - Power tier
     * @param {string} careerCategory - Career category
     * @returns {Object} Narrative guidance
     */
    static getNarrativeGuidance(tier, careerCategory) {
        const tierNum = this.getTierNumericValue(tier);
        
        let difficultyLevel, challengeType, expectedOutcome;

        if (tierNum >= 10) { // 10-C, 10-B, 10-A
            difficultyLevel = 'basic';
            challengeType = 'everyday struggles';
            expectedOutcome = 'hard-won victories against ordinary challenges';
        } else if (tierNum >= 9) { // 9-C, 9-B, 9-A
            difficultyLevel = 'moderate';
            challengeType = 'superhuman challenges';
            expectedOutcome = 'success against formidable foes';
        } else if (tierNum >= 8) { // 8-C, 8-B, 8-A
            difficultyLevel = 'significant';
            challengeType = 'destructive threats';
            expectedOutcome = 'dominance over large-scale conflicts';
        } else if (tierNum >= 7) { // 7-C, 7-B, 7-A
            difficultyLevel = 'epic';
            challengeType = 'civilization-threatening dangers';
            expectedOutcome = 'legendary triumphs that reshape regions';
        } else if (tierNum >= 6) { // 6-C, 6-B, 6-A
            difficultyLevel = 'legendary';
            challengeType = 'continental or world-scale threats';
            expectedOutcome = 'godlike achievements that alter the world';
        } else { // 5-C and below
            difficultyLevel = 'cosmic';
            challengeType = 'apocalyptic or planetary threats';
            expectedOutcome = 'transcendent victories beyond mortal comprehension';
        }

        return {
            difficultyLevel,
            challengeType,
            expectedOutcome
        };
    }

    /**
     * Build full prompt context for LLM
     * @param {Object} characterState - Encoded character state
     * @param {Object} powerLevel - Power level calculation
     * @param {string} careerCategory - Career category
     * @param {string} amuletStage - Amulet stage (age25, age45, etc.)
     * @returns {string} Full context string
     */
    static buildFullPromptContext(characterState, powerLevel, careerCategory, amuletStage) {
        const relevantSkills = this.getCareerRelevantSkills(characterState, careerCategory);
        const skillsText = relevantSkills.length > 0 
            ? relevantSkills.join(', ')
            : 'No significant skills';

        const capability = this.getCombatCapabilityDescription(powerLevel.tier, careerCategory);
        const guidance = this.getNarrativeGuidance(powerLevel.tier, careerCategory);

        return `CHARACTER:
- Age: ${characterState.age} years
- Job: ${characterState.currentJob} (${careerCategory} career path)
- Power Tier: ${powerLevel.tier} (${powerLevel.tierName})
- Relevant Skills: ${skillsText}
- Combat Capability: ${capability}
- Current situation: ${amuletStage} amulet milestone

NARRATIVE GUIDANCE:
- Narrate at ${powerLevel.tierName} difficulty level
- Character should face ${guidance.challengeType}
- Expected outcomes: ${guidance.expectedOutcome}
- Difficulty: ${guidance.difficultyLevel}`;
    }

    /**
     * Get numeric value from tier string for comparison
     * @param {string} tier - Tier code (e.g., '7-B')
     * @returns {number} Numeric tier value
     */
    static getTierNumericValue(tier) {
        const match = tier.match(/^(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * Safely get stat value, handling null/undefined/negative
     * @param {number|null|undefined} value - Stat value
     * @returns {number} Safe stat value (0 or positive)
     */
    static getSafeStat(value) {
        if (value === null || value === undefined || isNaN(value)) {
            return 0;
        }
        return Math.max(0, Number(value));
    }
}

// Export for both CommonJS and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PowerLevelCalculator;
}
if (typeof window !== 'undefined') {
    window.PowerLevelCalculator = PowerLevelCalculator;
}

