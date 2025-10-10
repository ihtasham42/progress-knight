/**
 * Character Encoder - Converts game state to LLM-friendly format
 */
class CharacterEncoder {
    /**
     * Encode the current game state into a format suitable for LLM processing
     * @param {Object} gameData - The current game state
     * @returns {Object} Encoded character state
     */
    static encodeCharacterState(gameData) {
        return {
            // Basic Stats
            age: Math.floor(gameData.days / 365),
            days: gameData.days,
            coins: gameData.coins,
            evil: gameData.evil,
            
            // Current Activities
            currentJob: gameData.currentJob?.name || "Unemployed",
            currentSkill: gameData.currentSkill?.name || "None",
            currentProperty: gameData.currentProperty?.name || "Homeless",
            
            // Skills & Levels
            skills: this.encodeSkills(gameData.taskData),
            jobs: this.encodeJobs(gameData.taskData),
            
            // Items & Equipment
            properties: this.encodeProperties(gameData.itemData),
            miscItems: this.encodeMiscItems(gameData.itemData),
            
            // Progression
            rebirthCount: (gameData.rebirthOneCount || 0) + (gameData.rebirthTwoCount || 0),
            isAlive: this.isAlive(gameData),
            lifespan: this.getLifespan(gameData)
        };
    }
    
    /**
     * Encode skills from task data
     * @param {Object} taskData - Game task data
     * @returns {Array} Array of skill objects
     */
    static encodeSkills(taskData) {
        if (!taskData) return [];
        
        return Object.values(taskData)
            .filter(task => task && typeof task.getEffect === 'function')
            .map(skill => ({
                name: skill.name,
                level: skill.level,
                effect: skill.getEffect(),
                description: skill.baseData?.description || 'No description available'
            }));
    }
    
    /**
     * Encode jobs from task data
     * @param {Object} taskData - Game task data
     * @returns {Array} Array of job objects
     */
    static encodeJobs(taskData) {
        if (!taskData) return [];
        
        return Object.values(taskData)
            .filter(task => task && typeof task.getIncome === 'function')
            .map(job => ({
                name: job.name,
                level: job.level,
                income: job.getIncome(),
                maxLevel: job.maxLevel || 0
            }));
    }
    
    /**
     * Encode properties from item data
     * @param {Object} itemData - Game item data
     * @returns {Array} Array of property objects
     */
    static encodeProperties(itemData) {
        if (!itemData) return [];
        
        return Object.values(itemData)
            .filter(item => item && typeof item.getExpense === 'function')
            .map(property => ({
                name: property.name,
                expense: property.getExpense()
            }));
    }
    
    /**
     * Encode misc items from item data
     * @param {Object} itemData - Game item data
     * @returns {Array} Array of misc item objects
     */
    static encodeMiscItems(itemData) {
        if (!itemData) return [];
        
        return Object.values(itemData)
            .filter(item => item && typeof item.getExpense === 'function')
            .map(item => ({
                name: item.name,
                expense: item.getExpense()
            }));
    }
    
    /**
     * Check if character is alive
     * @param {Object} gameData - Game state
     * @returns {boolean} Whether character is alive
     */
    static isAlive(gameData) {
        if (!gameData || typeof gameData.days !== 'number') return true;
        
        const lifespan = this.getLifespan(gameData);
        return gameData.days < lifespan;
    }
    
    /**
     * Get character lifespan
     * @param {Object} gameData - Game state
     * @returns {number} Lifespan in days
     */
    static getLifespan(gameData) {
        if (!gameData) return 365 * 70; // Default 70 years
        
        // Base lifespan calculation (simplified)
        const baseLifespan = 365 * 70; // 70 years
        return baseLifespan;
    }
}

// Export for both CommonJS and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterEncoder;
}
if (typeof window !== 'undefined') {
    window.CharacterEncoder = CharacterEncoder;
}
