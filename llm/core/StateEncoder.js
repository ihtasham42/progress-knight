/**
 * StateEncoder.js - Structured state representation for LLM
 * Based on paper insights about JSON representation improving LLM accuracy
 * 
 * Converts game state to/from structured JSON format for better LLM comprehension
 * and narrative consistency.
 */

// Dependencies will be loaded via script tags

class StateEncoder {
  constructor() {
    this.schema = this.initializeSchema();
  }

  /**
   * Encode game state to structured JSON format
   * @param {GameState} gameState - The current game state
   * @returns {Object} Structured JSON representation
   */
  encodeGameState(gameState) {
    return {
      player: {
        name: gameState.getPlayerName() || 'Unknown',
        age: gameState.getAge() || 0,
        health: gameState.getHealth() || 100,
        mana: gameState.getMana() || 0,
        coins: gameState.getCoins() || 0,
        level: gameState.getLevel() || 1,
        reputation: gameState.getReputation() || 50
      },
      skills: this.encodeSkills(gameState),
      inventory: this.encodeInventory(gameState),
      world: {
        location: gameState.getLocation() || 'unknown',
        conditions: this.encodeWorldConditions(gameState),
        time: gameState.getTime() || 0
      },
      time: gameState.getTime() || 0,
      level: gameState.getLevel() || 1,
      reputation: gameState.getReputation() || 50
    };
  }

  /**
   * Decode JSON back to game state
   * @param {Object} jsonState - Structured JSON state
   * @returns {GameState} Decoded game state
   */
  decodeGameState(jsonState) {
    const gameState = new GameState();
    
    if (jsonState.player) {
      gameState.setPlayerName(jsonState.player.name || 'Unknown');
      gameState.setAge(jsonState.player.age || 0);
      gameState.setHealth(jsonState.player.health || 100);
      gameState.setMana(jsonState.player.mana || 0);
      gameState.setCoins(jsonState.player.coins || 0);
      gameState.setLevel(jsonState.player.level || 1);
      gameState.setReputation(jsonState.player.reputation || 50);
    }

    if (jsonState.skills) {
      this.decodeSkills(gameState, jsonState.skills);
    }

    if (jsonState.inventory) {
      this.decodeInventory(gameState, jsonState.inventory);
    }

    if (jsonState.world) {
      gameState.setLocation(jsonState.world.location || 'unknown');
      gameState.setTime(jsonState.world.time || 0);
      this.decodeWorldConditions(gameState, jsonState.world.conditions);
    }

    if (jsonState.time !== undefined) {
      gameState.setTime(jsonState.time);
    }

    if (jsonState.level !== undefined) {
      gameState.setLevel(jsonState.level);
    }

    if (jsonState.reputation !== undefined) {
      gameState.setReputation(jsonState.reputation);
    }

    return gameState;
  }

  /**
   * Get structured schema for LLM prompts
   * @returns {Object} JSON schema for state validation
   */
  getStateSchema() {
    return {
      type: 'object',
      properties: {
        player: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number', minimum: 0, maximum: 1000 },
            health: { type: 'number', minimum: 0, maximum: 100 },
            mana: { type: 'number', minimum: 0, maximum: 100 },
            coins: { type: 'number', minimum: 0 },
            level: { type: 'number', minimum: 1, maximum: 100 },
            reputation: { type: 'number', minimum: 0, maximum: 100 }
          },
          required: ['name', 'age', 'health', 'mana', 'coins', 'level', 'reputation']
        },
        skills: {
          type: 'object',
          patternProperties: {
            '^[A-Za-z]+$': {
              type: 'object',
              properties: {
                level: { type: 'number', minimum: 0, maximum: 100 },
                experience: { type: 'number', minimum: 0 }
              },
              required: ['level', 'experience']
            }
          }
        },
        inventory: {
          type: 'object',
          patternProperties: {
            '^[A-Za-z_]+$': { type: 'number', minimum: 0 }
          }
        },
        world: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            conditions: { type: 'object' },
            time: { type: 'number', minimum: 0 }
          },
          required: ['location', 'conditions', 'time']
        }
      },
      required: ['player', 'skills', 'inventory', 'world']
    };
  }

  /**
   * Validate state against schema
   * @param {Object} state - State to validate
   * @returns {boolean} Whether state is valid
   */
  validateState(state) {
    try {
      // Basic validation - check required properties
      if (!state.player || !state.skills || !state.inventory || !state.world) {
        return false;
      }

      // Validate player properties
      const player = state.player;
      if (player.health < 0 || player.health > 100) return false;
      if (player.mana < 0 || player.mana > 100) return false;
      if (player.age < 0 || player.age > 1000) return false;
      if (player.level < 1 || player.level > 100) return false;
      if (player.reputation < 0 || player.reputation > 100) return false;

      // Validate skills
      for (const [skillName, skillData] of Object.entries(state.skills)) {
        if (skillData.level < 0 || skillData.level > 100) return false;
        if (skillData.experience < 0) return false;
      }

      // Validate inventory
      for (const [itemName, quantity] of Object.entries(state.inventory)) {
        if (quantity < 0) return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get formatted state for LLM consumption
   * @param {GameState} gameState - Current game state
   * @returns {Object} Formatted state with instructions
   */
  getStateForLLM(gameState) {
    const encodedState = this.encodeGameState(gameState);
    
    return {
      currentState: encodedState,
      schema: this.getStateSchema(),
      instructions: `
        You are a narrative AI for a text-based adventure game. 
        Use this structured JSON state to understand the current game situation.
        
        Focus on:
        - Creating immersive narrative descriptions
        - Generating appropriate dialogue for NPCs
        - Describing world events and consequences
        - Maintaining narrative consistency with the game state
        
        The state is provided in structured JSON format for better accuracy.
        Always validate your narrative against the current state.
        
        Remember: You are creating story and dialogue, not changing game mechanics.
        Game mechanics are handled by the game engine.
      `.trim()
    };
  }

  /**
   * Encode skills from game state
   * @param {GameState} gameState - Current game state
   * @returns {Object} Encoded skills
   */
  encodeSkills(gameState) {
    const skills = {};
    const skillNames = ['Strength', 'Magic', 'Dexterity', 'Intelligence', 'Charisma'];
    
    for (const skillName of skillNames) {
      const level = gameState.getSkillLevel(skillName) || 0;
      const experience = gameState.getSkillExperience(skillName) || 0;
      skills[skillName] = { level, experience };
    }
    
    return skills;
  }

  /**
   * Decode skills to game state
   * @param {GameState} gameState - Game state to update
   * @param {Object} skills - Encoded skills
   */
  decodeSkills(gameState, skills) {
    for (const [skillName, skillData] of Object.entries(skills)) {
      gameState.addSkill(skillName, skillData.level || 0);
      if (skillData.experience) {
        gameState.setSkillExperience(skillName, skillData.experience);
      }
    }
  }

  /**
   * Encode inventory from game state
   * @param {GameState} gameState - Current game state
   * @returns {Object} Encoded inventory
   */
  encodeInventory(gameState) {
    const inventory = {};
    const items = gameState.getInventory() || {};
    
    for (const [itemName, quantity] of Object.entries(items)) {
      inventory[itemName] = quantity;
    }
    
    return inventory;
  }

  /**
   * Decode inventory to game state
   * @param {GameState} gameState - Game state to update
   * @param {Object} inventory - Encoded inventory
   */
  decodeInventory(gameState, inventory) {
    for (const [itemName, quantity] of Object.entries(inventory)) {
      gameState.addItem(itemName, quantity);
    }
  }

  /**
   * Encode world conditions from game state
   * @param {GameState} gameState - Current game state
   * @returns {Object} Encoded world conditions
   */
  encodeWorldConditions(gameState) {
    const conditions = {};
    
    // Add common world conditions
    conditions.safe = gameState.getLocation() === 'town';
    conditions.dangerous = gameState.getLocation() === 'dungeon';
    conditions.dark = gameState.getLocation() === 'dungeon';
    
    // Add time-based conditions
    const time = gameState.getTime() || 0;
    conditions.daytime = time >= 360 && time < 1080; // 6 AM to 6 PM
    conditions.nighttime = time >= 1080 || time < 360;
    
    // Add reputation-based conditions
    const reputation = gameState.getReputation() || 50;
    conditions.hostile = reputation < 30;
    conditions.friendly = reputation > 70;
    
    return conditions;
  }

  /**
   * Decode world conditions to game state
   * @param {GameState} gameState - Game state to update
   * @param {Object} conditions - Encoded world conditions
   */
  decodeWorldConditions(gameState, conditions) {
    // World conditions are derived from other state, so we don't need to decode them
    // They will be recalculated when the state is encoded again
  }

  /**
   * Initialize the JSON schema for state validation
   * @returns {Object} Initialized schema
   */
  initializeSchema() {
    return {
      type: 'object',
      properties: {
        player: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number', minimum: 0, maximum: 1000 },
            health: { type: 'number', minimum: 0, maximum: 100 },
            mana: { type: 'number', minimum: 0, maximum: 100 },
            coins: { type: 'number', minimum: 0 },
            level: { type: 'number', minimum: 1, maximum: 100 },
            reputation: { type: 'number', minimum: 0, maximum: 100 }
          },
          required: ['name', 'age', 'health', 'mana', 'coins', 'level', 'reputation']
        },
        skills: {
          type: 'object',
          patternProperties: {
            '^[A-Za-z]+$': {
              type: 'object',
              properties: {
                level: { type: 'number', minimum: 0, maximum: 100 },
                experience: { type: 'number', minimum: 0 }
              },
              required: ['level', 'experience']
            }
          }
        },
        inventory: {
          type: 'object',
          patternProperties: {
            '^[A-Za-z_]+$': { type: 'number', minimum: 0 }
          }
        },
        world: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            conditions: { type: 'object' },
            time: { type: 'number', minimum: 0 }
          },
          required: ['location', 'conditions', 'time']
        }
      },
      required: ['player', 'skills', 'inventory', 'world']
    };
  }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.StateEncoder = StateEncoder;
}
