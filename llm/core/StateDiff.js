/**
 * StateDiff.js - State difference tracking for efficiency
 * Based on paper insights about state difference prediction being more efficient
 * 
 * Tracks only what changes between turns to reduce token usage and improve performance.
 * Asks LLM to predict/describe state changes rather than full state regeneration.
 */

// Dependencies will be loaded via script tags

class StateDiff {
  constructor() {
    this.diffHistory = [];
    this.maxHistorySize = 10;
  }

  /**
   * Calculate differences between two game states
   * @param {GameState} initialState - Previous state
   * @param {GameState} newState - Current state
   * @returns {Object} State differences
   */
  calculateDiff(initialState, newState) {
    const diff = {
      changes: {},
      additions: {},
      removals: {},
      modifications: {},
      timestamp: Date.now()
    };

    // Compare player properties
    this.comparePlayerProperties(initialState, newState, diff);
    
    // Compare skills
    this.compareSkills(initialState, newState, diff);
    
    // Compare inventory
    this.compareInventory(initialState, newState, diff);
    
    // Compare world state
    this.compareWorldState(initialState, newState, diff);

    // Store diff in history
    this.diffHistory.push(diff);
    if (this.diffHistory.length > this.maxHistorySize) {
      this.diffHistory.shift();
    }

    return diff;
  }

  /**
   * Apply diff to a game state
   * @param {GameState} gameState - State to apply diff to
   * @param {Object} diff - State differences to apply
   * @returns {GameState} Updated game state
   */
  applyDiff(gameState, diff) {
    const newState = gameState.clone();

    // Apply changes
    for (const [property, change] of Object.entries(diff.changes)) {
      if (property === 'health') {
        newState.setHealth(change.to);
      } else if (property === 'mana') {
        newState.setMana(change.to);
      } else if (property === 'coins') {
        newState.setCoins(change.to);
      } else if (property === 'location') {
        newState.setLocation(change.to);
      } else if (property === 'time') {
        newState.setTime(change.to);
      } else if (property === 'reputation') {
        newState.setReputation(change.to);
      }
    }

    // Apply skill changes
    if (diff.changes.skills) {
      for (const [skillName, skillChange] of Object.entries(diff.changes.skills)) {
        newState.addSkill(skillName, skillChange.to);
      }
    }

    // Apply inventory additions
    if (diff.additions.inventory) {
      for (const [itemName, quantity] of Object.entries(diff.additions.inventory)) {
        newState.addItem(itemName, quantity);
      }
    }

    // Apply inventory modifications
    if (diff.modifications.inventory) {
      for (const [itemName, change] of Object.entries(diff.modifications.inventory)) {
        const currentQuantity = newState.getItemCount(itemName) || 0;
        newState.addItem(itemName, change.delta);
      }
    }

    return newState;
  }

  /**
   * Get formatted diff for LLM consumption
   * @param {Object} diff - State differences
   * @returns {Object} Formatted diff for LLM
   */
  getDiffForLLM(diff) {
    const summary = this.generateDiffSummary(diff);
    
    return {
      summary: summary,
      changes: diff.changes,
      additions: diff.additions,
      removals: diff.removals,
      modifications: diff.modifications,
      instructions: `
        You are a narrative AI for a text-based adventure game.
        Use this state difference information to create appropriate narrative descriptions.
        
        Focus on:
        - Describing what changed and why
        - Creating immersive narrative for state transitions
        - Explaining consequences of player actions
        - Maintaining narrative consistency
        
        The changes shown represent what happened between game turns.
        Create narrative that explains these changes in an engaging way.
      `.trim()
    };
  }

  /**
   * Validate diff structure
   * @param {Object} diff - Diff to validate
   * @returns {boolean} Whether diff is valid
   */
  validateDiff(diff) {
    try {
      // Check required properties
      if (!diff.changes || !diff.additions || !diff.removals || !diff.modifications) {
        return false;
      }

      // Validate change structure
      for (const [property, change] of Object.entries(diff.changes)) {
        if (!change.hasOwnProperty('from') || !change.hasOwnProperty('to')) {
          return false;
        }
        if (change.hasOwnProperty('delta') && typeof change.delta !== 'number') {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get diff statistics and metrics
   * @param {Object} diff - State differences
   * @returns {Object} Diff metrics
   */
  getDiffMetrics(diff) {
    const totalChanges = Object.keys(diff.changes).length;
    const additions = Object.keys(diff.additions).length;
    const removals = Object.keys(diff.removals).length;
    const modifications = Object.keys(diff.modifications).length;

    let complexity = 'low';
    if (totalChanges > 5 || additions > 3 || modifications > 3) {
      complexity = 'high';
    } else if (totalChanges > 2 || additions > 1 || modifications > 1) {
      complexity = 'medium';
    }

    return {
      totalChanges,
      additions,
      removals,
      modifications,
      complexity,
      timestamp: diff.timestamp
    };
  }

  /**
   * Merge multiple diffs
   * @param {Array} diffs - Array of diffs to merge
   * @returns {Object} Merged diff
   */
  mergeDiffs(diffs) {
    const merged = {
      changes: {},
      additions: {},
      removals: {},
      modifications: {},
      timestamp: Date.now()
    };

    for (const diff of diffs) {
      // Merge changes (later diffs override earlier ones)
      Object.assign(merged.changes, diff.changes);
      Object.assign(merged.additions, diff.additions);
      Object.assign(merged.removals, diff.removals);
      Object.assign(merged.modifications, diff.modifications);
    }

    return merged;
  }

  /**
   * Compare player properties between states
   * @param {GameState} initialState - Previous state
   * @param {GameState} newState - Current state
   * @param {Object} diff - Diff object to update
   */
  comparePlayerProperties(initialState, newState, diff) {
    const properties = ['health', 'mana', 'coins', 'location', 'time', 'reputation'];
    
    for (const property of properties) {
      const initialValue = this.getPropertyValue(initialState, property);
      const newValue = this.getPropertyValue(newState, property);
      
      if (initialValue !== newValue) {
        diff.changes[property] = {
          from: initialValue,
          to: newValue,
          delta: newValue - initialValue
        };
      }
    }
  }

  /**
   * Compare skills between states
   * @param {GameState} initialState - Previous state
   * @param {GameState} newState - Current state
   * @param {Object} diff - Diff object to update
   */
  compareSkills(initialState, newState, diff) {
    const skillNames = ['Strength', 'Magic', 'Dexterity', 'Intelligence', 'Charisma'];
    const skillChanges = {};

    for (const skillName of skillNames) {
      const initialLevel = initialState.getSkillLevel(skillName) || 0;
      const newLevel = newState.getSkillLevel(skillName) || 0;
      
      if (initialLevel !== newLevel) {
        skillChanges[skillName] = {
          from: initialLevel,
          to: newLevel,
          delta: newLevel - initialLevel
        };
      }
    }

    if (Object.keys(skillChanges).length > 0) {
      diff.changes.skills = skillChanges;
    }
  }

  /**
   * Compare inventory between states
   * @param {GameState} initialState - Previous state
   * @param {GameState} newState - Current state
   * @param {Object} diff - Diff object to update
   */
  compareInventory(initialState, newState, diff) {
    const initialInventory = initialState.getInventory() || {};
    const newInventory = newState.getInventory() || {};
    
    const allItems = new Set([...Object.keys(initialInventory), ...Object.keys(newInventory)]);
    
    for (const itemName of allItems) {
      const initialQuantity = initialInventory[itemName] || 0;
      const newQuantity = newInventory[itemName] || 0;
      
      if (newQuantity > initialQuantity) {
        // Item added or quantity increased
        if (!diff.additions.inventory) {
          diff.additions.inventory = {};
        }
        diff.additions.inventory[itemName] = newQuantity - initialQuantity;
      } else if (newQuantity < initialQuantity) {
        // Item removed or quantity decreased
        if (!diff.removals.inventory) {
          diff.removals.inventory = {};
        }
        diff.removals.inventory[itemName] = initialQuantity - newQuantity;
      }
    }
  }

  /**
   * Compare world state between states
   * @param {GameState} initialState - Previous state
   * @param {GameState} newState - Current state
   * @param {Object} diff - Diff object to update
   */
  compareWorldState(initialState, newState, diff) {
    const initialLocation = initialState.getLocation();
    const newLocation = newState.getLocation();
    
    if (initialLocation !== newLocation) {
      diff.changes.location = {
        from: initialLocation,
        to: newLocation
      };
    }
  }

  /**
   * Get property value from game state
   * @param {GameState} gameState - Game state
   * @param {string} property - Property name
   * @returns {*} Property value
   */
  getPropertyValue(gameState, property) {
    switch (property) {
      case 'health': return gameState.getHealth();
      case 'mana': return gameState.getMana();
      case 'coins': return gameState.getCoins();
      case 'location': return gameState.getLocation();
      case 'time': return gameState.getTime();
      case 'reputation': return gameState.getReputation();
      default: return null;
    }
  }

  /**
   * Generate human-readable summary of changes
   * @param {Object} diff - State differences
   * @returns {string} Summary of changes
   */
  generateDiffSummary(diff) {
    const changes = [];
    
    // Health changes
    if (diff.changes.health) {
      const delta = diff.changes.health.delta;
      if (delta > 0) {
        changes.push(`Health increased by ${delta}`);
      } else if (delta < 0) {
        changes.push(`Health decreased by ${Math.abs(delta)}`);
      }
    }
    
    // Location changes
    if (diff.changes.location) {
      changes.push(`Moved from ${diff.changes.location.from} to ${diff.changes.location.to}`);
    }
    
    // Skill changes
    if (diff.changes.skills) {
      for (const [skillName, skillChange] of Object.entries(diff.changes.skills)) {
        if (skillChange.delta > 0) {
          changes.push(`${skillName} skill increased by ${skillChange.delta}`);
        } else if (skillChange.delta < 0) {
          changes.push(`${skillName} skill decreased by ${Math.abs(skillChange.delta)}`);
        }
      }
    }
    
    // Inventory changes
    if (diff.additions.inventory) {
      for (const [itemName, quantity] of Object.entries(diff.additions.inventory)) {
        changes.push(`Gained ${quantity} ${itemName}`);
      }
    }
    
    if (diff.removals.inventory) {
      for (const [itemName, quantity] of Object.entries(diff.removals.inventory)) {
        changes.push(`Lost ${quantity} ${itemName}`);
      }
    }
    
    return changes.join(', ') || 'No significant changes';
  }

  /**
   * Get diff history
   * @returns {Array} Array of recent diffs
   */
  getDiffHistory() {
    return this.diffHistory;
  }

  /**
   * Clear diff history
   */
  clearHistory() {
    this.diffHistory = [];
  }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.StateDiff = StateDiff;
}
