/**
 * StateValidator.js - State consistency validation
 * Based on paper insights about 40%+ consistency error rate without validation
 * 
 * Ensures LLM narrative doesn't contradict known game state.
 * Validates LLM outputs against current game state and world rules.
 */

// Dependencies will be loaded via script tags

class StateValidator {
  constructor() {
    this.validationRules = this.initializeValidationRules();
    this.consistencyMetrics = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      errorTypes: {}
    };
  }

  /**
   * Validate inventory consistency
   * @param {GameState} gameState - Current game state
   * @returns {boolean} Whether inventory is consistent
   */
  validateInventoryConsistency(gameState) {
    const inventory = gameState.getInventory() || {};
    
    for (const [itemName, quantity] of Object.entries(inventory)) {
      if (quantity < 0) {
        this.recordValidationError('inventory', 'negative_quantity', itemName);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Validate location consistency
   * @param {GameState} gameState - Current game state
   * @returns {boolean} Whether location is consistent
   */
  validateLocationConsistency(gameState) {
    const location = gameState.getLocation();
    
    if (!location || location === '') {
      this.recordValidationError('location', 'empty_location');
      return false;
    }
    
    return true;
  }

  /**
   * Validate skill consistency
   * @param {GameState} gameState - Current game state
   * @returns {boolean} Whether skills are consistent
   */
  validateSkillConsistency(gameState) {
    const skillNames = ['Strength', 'Magic', 'Dexterity', 'Intelligence', 'Charisma'];
    
    for (const skillName of skillNames) {
      const level = gameState.getSkillLevel(skillName) || 0;
      
      if (level < 0 || level > 100) {
        this.recordValidationError('skills', 'invalid_level', skillName);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Validate time consistency
   * @param {GameState} gameState - Current game state
   * @returns {boolean} Whether time is consistent
   */
  validateTimeConsistency(gameState) {
    const time = gameState.getTime() || 0;
    
    if (time < 0) {
      this.recordValidationError('time', 'negative_time');
      return false;
    }
    
    return true;
  }

  /**
   * Validate reputation consistency
   * @param {GameState} gameState - Current game state
   * @returns {boolean} Whether reputation is consistent
   */
  validateReputationConsistency(gameState) {
    const reputation = gameState.getReputation() || 50;
    
    if (reputation < 0 || reputation > 100) {
      this.recordValidationError('reputation', 'invalid_range');
      return false;
    }
    
    return true;
  }

  /**
   * Validate resource consistency
   * @param {GameState} gameState - Current game state
   * @returns {boolean} Whether resources are consistent
   */
  validateResourceConsistency(gameState) {
    const health = gameState.getHealth() || 100;
    const mana = gameState.getMana() || 0;
    const coins = gameState.getCoins() || 0;
    
    if (health < 0 || health > 100) {
      this.recordValidationError('resources', 'invalid_health');
      return false;
    }
    
    if (mana < 0 || mana > 100) {
      this.recordValidationError('resources', 'invalid_mana');
      return false;
    }
    
    if (coins < 0) {
      this.recordValidationError('resources', 'negative_coins');
      return false;
    }
    
    return true;
  }

  /**
   * Validate action against current state
   * @param {Object} action - Action to validate
   * @param {GameState} gameState - Current game state
   * @returns {boolean} Whether action is valid
   */
  validateActionAgainstState(action, gameState) {
    this.consistencyMetrics.totalValidations++;
    
    try {
      // Check inventory requirements
      if (action.type === 'use_item' && action.item) {
        const itemQuantity = gameState.getItemCount(action.item) || 0;
        const requiredQuantity = action.quantity || 1;
        
        if (itemQuantity < requiredQuantity) {
          this.recordValidationError('action', 'insufficient_item', action.item);
          return false;
        }
      }
      
      // Check skill requirements
      if (action.skillRequired && action.minimumLevel) {
        const skillLevel = gameState.getSkillLevel(action.skillRequired) || 0;
        
        if (skillLevel < action.minimumLevel) {
          this.recordValidationError('action', 'insufficient_skill', action.skillRequired);
          return false;
        }
      }
      
      // Check mana requirements
      if (action.type === 'cast_spell' && action.manaCost) {
        const currentMana = gameState.getMana() || 0;
        
        if (currentMana < action.manaCost) {
          this.recordValidationError('action', 'insufficient_mana');
          return false;
        }
      }
      
      // Check time requirements
      if (action.timeRequired) {
        const currentTime = gameState.getTime() || 0;
        
        if (currentTime < action.timeRequired) {
          this.recordValidationError('action', 'insufficient_time');
          return false;
        }
      }
      
      // Check reputation requirements
      if (action.reputationRequired) {
        const currentReputation = gameState.getReputation() || 50;
        
        if (currentReputation < action.reputationRequired) {
          this.recordValidationError('action', 'insufficient_reputation');
          return false;
        }
      }
      
      this.consistencyMetrics.passedValidations++;
      return true;
    } catch (error) {
      this.recordValidationError('action', 'validation_error', error.message);
      return false;
    }
  }

  /**
   * Validate state transition
   * @param {GameState} initialState - Previous state
   * @param {GameState} newState - New state
   * @param {Object} action - Action that caused transition
   * @returns {boolean} Whether transition is valid
   */
  validateStateTransition(initialState, newState, action) {
    try {
      // Validate that changes match expected outcomes
      if (action.healthChange !== undefined) {
        const expectedHealth = initialState.getHealth() + action.healthChange;
        const actualHealth = newState.getHealth();
        
        if (Math.abs(expectedHealth - actualHealth) > 0.01) {
          this.recordValidationError('transition', 'health_mismatch');
          return false;
        }
      }
      
      if (action.manaChange !== undefined) {
        const expectedMana = initialState.getMana() + action.manaChange;
        const actualMana = newState.getMana();
        
        if (Math.abs(expectedMana - actualMana) > 0.01) {
          this.recordValidationError('transition', 'mana_mismatch');
          return false;
        }
      }
      
      if (action.coinChange !== undefined) {
        const expectedCoins = initialState.getCoins() + action.coinChange;
        const actualCoins = newState.getCoins();
        
        if (Math.abs(expectedCoins - actualCoins) > 0.01) {
          this.recordValidationError('transition', 'coin_mismatch');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      this.recordValidationError('transition', 'validation_error', error.message);
      return false;
    }
  }

  /**
   * Validate LLM output against game state
   * @param {Object} llmOutput - LLM output to validate
   * @param {GameState} gameState - Current game state
   * @returns {boolean} Whether LLM output is valid
   */
  validateLLMOutput(llmOutput, gameState) {
    try {
      // Check narrative consistency
      if (llmOutput.narrative) {
        const narrative = llmOutput.narrative.toLowerCase();
        
        // Check for impossible actions
        if (narrative.includes('swing your sword') && gameState.getItemCount('sword') === 0) {
          this.recordValidationError('llm_output', 'impossible_action', 'sword_usage');
          return false;
        }
        
        if (narrative.includes('cast a spell') && gameState.getMana() < 10) {
          this.recordValidationError('llm_output', 'impossible_action', 'spellcasting');
          return false;
        }
      }
      
      // Check state changes consistency
      if (llmOutput.stateChanges) {
        for (const [property, value] of Object.entries(llmOutput.stateChanges)) {
          if (property === 'health' && (value < 0 || value > 100)) {
            this.recordValidationError('llm_output', 'invalid_health', value);
            return false;
          }
          
          if (property === 'mana' && (value < 0 || value > 100)) {
            this.recordValidationError('llm_output', 'invalid_mana', value);
            return false;
          }
        }
      }
      
      // Check time consistency
      if (llmOutput.timeContext) {
        const currentTime = gameState.getTime() || 0;
        const narrativeTime = llmOutput.timeContext;
        
        if (narrativeTime < currentTime) {
          this.recordValidationError('llm_output', 'time_inconsistency');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      this.recordValidationError('llm_output', 'validation_error', error.message);
      return false;
    }
  }

  /**
   * Get comprehensive validation report
   * @param {GameState} gameState - Game state to validate
   * @returns {Object} Validation report
   */
  getValidationReport(gameState) {
    const report = {
      overall: true,
      inventory: true,
      location: true,
      skills: true,
      time: true,
      reputation: true,
      resources: true,
      issues: []
    };
    
    // Validate each component
    if (!this.validateInventoryConsistency(gameState)) {
      report.overall = false;
      report.inventory = false;
      report.issues.push('inventory');
    }
    
    if (!this.validateLocationConsistency(gameState)) {
      report.overall = false;
      report.location = false;
      report.issues.push('location');
    }
    
    if (!this.validateSkillConsistency(gameState)) {
      report.overall = false;
      report.skills = false;
      report.issues.push('skills');
    }
    
    if (!this.validateTimeConsistency(gameState)) {
      report.overall = false;
      report.time = false;
      report.issues.push('time');
    }
    
    if (!this.validateReputationConsistency(gameState)) {
      report.overall = false;
      report.reputation = false;
      report.issues.push('reputation');
    }
    
    if (!this.validateResourceConsistency(gameState)) {
      report.overall = false;
      report.resources = false;
      report.issues.push('resources');
    }
    
    return report;
  }

  /**
   * Get consistency metrics
   * @param {Array} actions - Array of actions to analyze
   * @returns {Object} Consistency metrics
   */
  getConsistencyMetrics(actions) {
    const metrics = {
      totalActions: actions.length,
      validActions: 0,
      invalidActions: 0,
      consistencyRate: 0
    };
    
    for (const action of actions) {
      if (action.valid) {
        metrics.validActions++;
      } else {
        metrics.invalidActions++;
      }
    }
    
    if (metrics.totalActions > 0) {
      metrics.consistencyRate = metrics.validActions / metrics.totalActions;
    }
    
    return metrics;
  }

  /**
   * Record validation error
   * @param {string} category - Error category
   * @param {string} type - Error type
   * @param {string} details - Error details
   */
  recordValidationError(category, type, details = '') {
    this.consistencyMetrics.failedValidations++;
    
    if (!this.consistencyMetrics.errorTypes[category]) {
      this.consistencyMetrics.errorTypes[category] = {};
    }
    
    if (!this.consistencyMetrics.errorTypes[category][type]) {
      this.consistencyMetrics.errorTypes[category][type] = 0;
    }
    
    this.consistencyMetrics.errorTypes[category][type]++;
  }

  /**
   * Initialize validation rules
   * @returns {Object} Initialized validation rules
   */
  initializeValidationRules() {
    return {
      inventory: {
        minQuantity: 0,
        maxQuantity: 999
      },
      health: {
        min: 0,
        max: 100
      },
      mana: {
        min: 0,
        max: 100
      },
      reputation: {
        min: 0,
        max: 100
      },
      skills: {
        min: 0,
        max: 100
      },
      time: {
        min: 0
      }
    };
  }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.StateValidator = StateValidator;
}
