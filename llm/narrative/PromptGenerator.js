/**
 * Prompt Generator - Creates LLM prompts from character state
 */
class PromptGenerator {
    /**
     * Generate an exploration prompt based on character state
     * @param {Object} characterState - Encoded character state
     * @returns {string} Generated prompt
     */
    static generateExplorationPrompt(characterState) {
        const context = this.buildContext(characterState);
        const prompt = `
You are a fantasy world narrator. Based on this character's current state, describe what they encounter in their world:

CHARACTER STATE:
- Age: ${characterState.age || 0} years old
- Current Job: ${characterState.currentJob || 'Unknown'}
- Current Skill: ${characterState.currentSkill || 'None'}
- Wealth: ${this.formatCoins(characterState.coins || 0)}
- Evil Level: ${characterState.evil || 0}
- Rebirth Count: ${characterState.rebirthCount || 0}

SKILLS & ABILITIES:
${this.formatSkills(characterState.skills || [])}

CURRENT SITUATION:
${context}

Generate a vivid, immersive description of what the character encounters in their world. 
Consider their current profession, skills, and circumstances. 
Make it feel like a natural progression of their current life path.
Keep it to 2-3 paragraphs and focus on opportunities that match their current abilities.
        `;
        return prompt.trim();
    }
    
    /**
     * Build context based on character state
     * @param {Object} characterState - Character state
     * @returns {string} Context description
     */
    static buildContext(characterState) {
        const job = characterState.currentJob || '';
        
        if (job.toLowerCase().includes('beggar')) {
            return "A destitute beggar struggling to survive on the streets";
        } else if (job.toLowerCase().includes('knight')) {
            return "A military professional with combat training";
        } else if (job.toLowerCase().includes('mage')) {
            return "A magic practitioner with arcane knowledge";
        }
        
        return "An adventurer exploring the world";
    }
    
    /**
     * Format skills for prompt
     * @param {Array} skills - Array of skill objects
     * @returns {string} Formatted skills string
     */
    static formatSkills(skills) {
        if (!Array.isArray(skills) || skills.length === 0) {
            return "- No skills available";
        }
        
        return skills.map(skill => 
            `- ${skill.name} (Level ${skill.level || 0}): ${skill.description || 'No description'}`
        ).join('\n');
    }
    
    /**
     * Format coins for display
     * @param {number} coins - Number of coins
     * @returns {string} Formatted coins string
     */
    static formatCoins(coins) {
        if (typeof coins !== 'number') return '0';
        
        if (coins >= 1000000) {
            return `${(coins / 1000000).toFixed(1)}M`;
        } else if (coins >= 1000) {
            return `${(coins / 1000).toFixed(1)}K`;
        }
        
        return coins.toString();
    }
}

/**
 * Contextual Prompt Generator - Adds context-specific elements
 */
class ContextualPromptGenerator extends PromptGenerator {
    /**
     * Generate exploration prompt with contextual elements
     * @param {Object} characterState - Character state
     * @returns {string} Contextual prompt
     */
    static generateExplorationPrompt(characterState) {
        const basePrompt = super.generateExplorationPrompt(characterState);
        
        // Add contextual elements based on character state
        if (characterState.evil > 50) {
            return basePrompt + "\n\nFocus on darker, more sinister encounters that match their evil nature.";
        } else if (characterState.rebirthCount > 0) {
            return basePrompt + "\n\nInclude elements that reflect their previous life experiences and wisdom.";
        }
        
        return basePrompt;
    }
}

// Export for both CommonJS and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PromptGenerator, ContextualPromptGenerator };
}
if (typeof window !== 'undefined') {
    window.PromptGenerator = PromptGenerator;
    window.ContextualPromptGenerator = ContextualPromptGenerator;
}
