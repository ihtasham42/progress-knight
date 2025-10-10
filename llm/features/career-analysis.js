/**
 * Career Analysis - Unified career progression logic
 * Consolidates: CareerAnalyzer, CareerBasedPromptGenerator, CareerWeights, ProbabilityCalculator
 * 
 * Handles:
 * - Career category detection
 * - Career weight calculations
 * - Probability calculations for success/failure
 * - Career-based prompt generation
 */

// ============= CAREER WEIGHTS =============

class CareerWeights {
    static CATEGORIES = {
        'Common work': ['Beggar', 'Farmer', 'Fisherman', 'Miner', 'Lumberjack'],
        'Military': ['Squire', 'Footman', 'Veteran footman', 'Knight', 'Veteran knight', 'Holy knight'],
        'The Arcane': ['Apprentice mage', 'Mage', 'Wizard', 'Master wizard', 'Archmage'],
        'The Void': ['Cultist', 'Acolyte', 'Void mage', 'Void wizard', 'Void master', 'Void archmage'],
        'Nobility': ['Baron', 'Viscount', 'Earl', 'Marquess', 'Duke', 'Overlord']
    };

    static getCategoryForJob(jobName) {
        for (const [category, jobs] of Object.entries(this.CATEGORIES)) {
            if (jobs.includes(jobName)) {
                return category;
            }
        }
        return 'Common work';
    }

    static getCategoryWeight(category, age) {
        const baseWeights = {
            'Common work': 1.0,
            'Military': 1.2,
            'The Arcane': 1.5,
            'The Void': 1.8,
            'Nobility': 2.0
        };

        const ageMultiplier = Math.min(1 + (age - 25) / 100, 2.0);
        return (baseWeights[category] || 1.0) * ageMultiplier;
    }
}

// ============= PROBABILITY CALCULATOR =============

class ProbabilityCalculator {
    static calculateSuccessProbability(choiceType, careerCategory, characterLevel = 1) {
        const baseProb = {
            aggressive: 0.4,
            diplomatic: 0.6,
            cautious: 0.7,
            creative: 0.5
        };

        const categoryBonus = {
            'Common work': { aggressive: 0.1, diplomatic: 0.0, cautious: 0.1, creative: 0.0 },
            'Military': { aggressive: 0.2, diplomatic: -0.1, cautious: 0.0, creative: -0.1 },
            'The Arcane': { aggressive: -0.1, diplomatic: 0.1, cautious: 0.2, creative: 0.2 },
            'The Void': { aggressive: 0.1, diplomatic: -0.2, cautious: 0.0, creative: 0.3 },
            'Nobility': { aggressive: -0.1, diplomatic: 0.3, cautious: 0.1, creative: 0.1 }
        };

        const base = baseProb[choiceType] || 0.5;
        const bonus = categoryBonus[careerCategory]?.[choiceType] || 0;
        const levelBonus = Math.min(characterLevel / 100, 0.2);

        return Math.max(0.1, Math.min(0.9, base + bonus + levelBonus));
    }
}

// ============= CAREER ANALYZER =============

class CareerAnalyzer {
    constructor(gameState) {
        this.gameState = gameState;
    }

    getCurrentCareerCategory() {
        const currentJob = this.gameState.currentJob || 'Beggar';
        return CareerWeights.getCategoryForJob(currentJob);
    }

    getCareerWeight() {
        const category = this.getCurrentCareerCategory();
        const age = Math.floor(this.gameState.days / 365);
        return CareerWeights.getCategoryWeight(category, age);
    }

    getCharacterLevel() {
        if (!this.gameState.taskData) return 1;
        
        let totalLevel = 0;
        let count = 0;
        
        for (const task of Object.values(this.gameState.taskData)) {
            if (task.level) {
                totalLevel += task.level;
                count++;
            }
        }
        
        return count > 0 ? Math.floor(totalLevel / count) : 1;
    }

    analyzeCareerProgression() {
        const category = this.getCurrentCareerCategory();
        const weight = this.getCareerWeight();
        const level = this.getCharacterLevel();
        const age = Math.floor(this.gameState.days / 365);

        return {
            category: category,
            weight: weight,
            level: level,
            age: age
        };
    }
}

// ============= PROMPT GENERATOR =============

class CareerBasedPromptGenerator {
    constructor(careerAnalyzer, storyTreeBuilder) {
        this.careerAnalyzer = careerAnalyzer;
        this.storyTreeBuilder = storyTreeBuilder;
        this.promptCache = new Map();
        this.promptStats = {
            totalPrompts: 0,
            promptsByCategory: {},
            promptsByAmulet: {},
            choiceTypeDistribution: {
                aggressive: 0,
                diplomatic: 0,
                cautious: 0,
                creative: 0
            }
        };
    }

    generateCareerBasedPrompt(amuletPrompt, careerCategory, skills = null, playerLevel = null) {
        const cacheKey = `${amuletPrompt}_${careerCategory}`;
        
        if (this.promptCache.has(cacheKey)) {
            return this.promptCache.get(cacheKey);
        }

        const progression = this.careerAnalyzer.analyzeCareerProgression();
        
        // Use playerLevel if provided, otherwise use progression level
        const effectiveLevel = playerLevel !== null ? playerLevel : progression.level;
        
        const prompt = this._createPrompt(amuletPrompt, careerCategory, {
            ...progression,
            level: effectiveLevel
        });
        
        this.promptCache.set(cacheKey, prompt);
        this._updatePromptStats(amuletPrompt, careerCategory, prompt);
        
        return prompt;
    }

    _createPrompt(amuletPrompt, careerCategory, progression) {
        const templates = this._getTemplates(amuletPrompt, careerCategory);
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        const choices = this._generateChoices(careerCategory, progression.level);
        
        return {
            title: template.title,
            story: template.story.replace('{weight}', progression.weight.toFixed(1)),
            choices: choices,
            amuletPrompt: amuletPrompt,
            careerCategory: careerCategory
        };
    }

    _getTemplates(amuletPrompt, careerCategory) {
        const ageTemplates = {
            age25: [
                {
                    title: "The Young Merchant's Dilemma",
                    story: "You find yourself at a crossroads in your early career, holding a mysterious amulet... A merchant approaches you with an intriguing business opportunity. Your career experience (weight: {weight}) will influence your options."
                }
            ],
            age45: [
                {
                    title: "Mid-Life Challenges",
                    story: "At the height of your career, the amulet pulses with energy. A significant opportunity presents itself, but with considerable risk. Your experience (weight: {weight}) shapes your approach."
                }
            ],
            age65: [
                {
                    title: "The Wisdom of Age",
                    story: "In your later years, the amulet reveals a final challenge. Your lifetime of experience (weight: {weight}) has prepared you for this moment."
                }
            ],
            age200: [
                {
                    title: "The Eternal Journey",
                    story: "Having lived far beyond normal years, the amulet shows you paths beyond mortal comprehension. Your vast experience (weight: {weight}) opens unique possibilities."
                }
            ]
        };

        return ageTemplates[amuletPrompt] || ageTemplates.age25;
    }

    _generateChoices(careerCategory, characterLevel) {
        const choiceTypes = ['aggressive', 'diplomatic', 'cautious', 'creative'];
        const choices = [];

        for (const type of choiceTypes) {
            const prob = ProbabilityCalculator.calculateSuccessProbability(
                type,
                careerCategory,
                characterLevel
            );

            choices.push({
                text: this._getChoiceText(type, careerCategory),
                description: this._getChoiceDescription(type),
                choiceType: type,
                successProbability: prob
            });
        }

        return choices;
    }

    _getChoiceText(choiceType, careerCategory) {
        const texts = {
            aggressive: {
                'Common work': "Confront the merchant directly",
                'Military': "Challenge them to combat",
                'The Arcane': "Unleash magical power",
                'The Void': "Call upon dark forces",
                'Nobility': "Assert your authority"
            },
            diplomatic: {
                'Common work': "Negotiate a fair deal",
                'Military': "Propose an alliance",
                'The Arcane': "Seek magical understanding",
                'The Void': "Bargain with forbidden knowledge",
                'Nobility': "Leverage political connections"
            },
            cautious: {
                'Common work': "Carefully examine the merchant's goods",
                'Military': "Scout the situation thoroughly",
                'The Arcane': "Study the magical implications",
                'The Void': "Analyze the void energies",
                'Nobility': "Conduct due diligence"
            },
            creative: {
                'Common work': "Propose a unique business partnership",
                'Military': "Devise an unconventional strategy",
                'The Arcane': "Invent a new spell approach",
                'The Void': "Channel void in novel ways",
                'Nobility': "Create an innovative solution"
            }
        };

        return texts[choiceType]?.[careerCategory] || texts[choiceType]['Common work'];
    }

    _getChoiceDescription(choiceType) {
        const descriptions = {
            aggressive: "A bold, direct approach that may yield quick results but carries higher risk",
            diplomatic: "A careful, measured approach that seeks to find common ground",
            cautious: "A careful, measured approach that minimizes risk but may take longer",
            creative: "An innovative approach that may yield unexpected results"
        };

        return descriptions[choiceType] || "";
    }

    _updatePromptStats(amuletPrompt, careerCategory, prompt) {
        this.promptStats.totalPrompts++;
        this.promptStats.promptsByCategory[careerCategory] = 
            (this.promptStats.promptsByCategory[careerCategory] || 0) + 1;
        this.promptStats.promptsByAmulet[amuletPrompt] = 
            (this.promptStats.promptsByAmulet[amuletPrompt] || 0) + 1;
        
        prompt.choices.forEach(choice => {
            this.promptStats.choiceTypeDistribution[choice.choiceType]++;
        });
    }

    getPromptStats() {
        return { ...this.promptStats };
    }

    clearCache() {
        this.promptCache.clear();
    }

    validatePrompt(prompt) {
        if (!prompt || typeof prompt !== 'object') {
            return false;
        }
        if (!prompt.title || typeof prompt.title !== 'string') {
            return false;
        }
        if (!prompt.story || typeof prompt.story !== 'string') {
            return false;
        }
        if (!Array.isArray(prompt.choices) || prompt.choices.length === 0) {
            return false;
        }
        return prompt.choices.every(choice => this.validateChoice(choice));
    }

    validateChoice(choice) {
        if (!choice || typeof choice !== 'object') {
            return false;
        }
        if (!choice.text || typeof choice.text !== 'string') {
            return false;
        }
        if (!choice.choiceType || typeof choice.choiceType !== 'string') {
            return false;
        }
        if (typeof choice.successProbability !== 'number' || 
            choice.successProbability < 0 || 
            choice.successProbability > 1) {
            return false;
        }
        return true;
    }
}


