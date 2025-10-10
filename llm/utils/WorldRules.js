/**
 * WorldRules.js - Explicit world rules for LLM consistency
 * Based on paper insights about explicit rules improving LLM accuracy by 10-15%
 * 
 * Provides structured game rules to LLM for better narrative consistency.
 * Validates LLM outputs against known game mechanics.
 */

// Dependencies will be loaded via script tags

class WorldRules {
  constructor() {
    this.rules = this.initializeRules();
    this.customRules = {};
    this.validationMetrics = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0
    };
  }

  /**
   * Get combat rules
   * @returns {Object} Combat rules
   */
  getCombatRules() {
    return {
      requiresWeapon: true,
      skillRequired: 'Strength',
      minimumLevel: 5,
      damageCalculation: 'skill_level + weapon_damage + random_factor',
      successThreshold: 0.6,
      weaponTypes: ['sword', 'bow', 'staff', 'dagger', 'axe', 'mace'],
      weaponSkills: {
        sword: 'Strength',
        bow: 'Dexterity',
        staff: 'Magic',
        dagger: 'Dexterity',
        axe: 'Strength',
        mace: 'Strength'
      },
      criticalHit: 0.1,
      criticalDamage: 2.0
    };
  }

  /**
   * Get magic rules
   * @returns {Object} Magic rules
   */
  getMagicRules() {
    return {
      requiresMana: true,
      skillRequired: 'Magic',
      minimumLevel: 10,
      manaCost: {
        healing: 10,
        damage: 15,
        utility: 5,
        buff: 8,
        debuff: 12
      },
      spellTypes: ['healing', 'damage', 'utility', 'buff', 'debuff'],
      spellCosts: {
        healing: 10,
        damage: 15,
        utility: 5,
        buff: 8,
        debuff: 12
      },
      spellRequirements: {
        healing: { skill: 'Magic', level: 5 },
        damage: { skill: 'Magic', level: 8 },
        utility: { skill: 'Magic', level: 3 },
        buff: { skill: 'Magic', level: 6 },
        debuff: { skill: 'Magic', level: 10 }
      }
    };
  }

  /**
   * Get time-based rules
   * @returns {Object} Time rules
   */
  getTimeRules() {
    return {
      shopsCloseAtNight: true,
      guardsPatrolAtNight: true,
      fastTravelRequiresDay: true,
      nightTime: '18:00-06:00',
      shopHours: {
        open: '08:00',
        close: '18:00',
        closedDays: ['sunday']
      },
      guardPatrols: {
        night: true,
        day: false,
        frequency: 'every 2 hours'
      },
      timeEffects: {
        fatigue: 'increases_over_time',
        hunger: 'increases_over_time',
        healing: 'natural_regeneration'
      }
    };
  }

  /**
   * Get reputation-based rules
   * @returns {Object} Reputation rules
   */
  getReputationRules() {
    return {
      highEvilAffectsNPC: true,
      guardsAttackAbove: 70,
      shopsRefuseServiceAbove: 90,
      reputationRanges: {
        heroic: { min: 80, max: 100 },
        good: { min: 60, max: 79 },
        neutral: { min: 40, max: 59 },
        evil: { min: 0, max: 39 }
      },
      npcBehavior: {
        guards: {
          attackThreshold: 70,
          friendlyThreshold: 30
        },
        merchants: {
          refuseServiceThreshold: 90,
          priceModifierThreshold: 60
        },
        citizens: {
          hostileThreshold: 80,
          friendlyThreshold: 20
        }
      }
    };
  }

  /**
   * Get location-specific rules
   * @returns {Object} Location rules
   */
  getLocationRules() {
    return {
      dungeon: {
        requiresLight: true,
        dangerLevel: 'high',
        monsterSpawnRate: 0.3,
        lootRate: 0.2,
        experienceMultiplier: 1.5
      },
      town: {
        safe: true,
        hasShops: true,
        hasInn: true,
        hasGuards: true,
        experienceMultiplier: 1.0
      },
      wilderness: {
        dangerLevel: 'medium',
        monsterSpawnRate: 0.1,
        weatherEffects: true,
        experienceMultiplier: 1.2
      },
      castle: {
        requiresPermission: true,
        dangerLevel: 'low',
        hasNobles: true,
        experienceMultiplier: 1.1
      }
    };
  }

  /**
   * Get skill-based rules
   * @returns {Object} Skill rules
   */
  getSkillRules() {
    return {
      Strength: {
        combat: 5,
        climbing: 10,
        lifting: 15,
        intimidation: 8
      },
      Magic: {
        spellcasting: 3,
        enchantment: 8,
        divination: 12,
        healing: 6
      },
      Dexterity: {
        stealth: 5,
        acrobatics: 8,
        lockpicking: 10,
        archery: 6
      },
      Intelligence: {
        research: 5,
        crafting: 8,
        strategy: 10,
        memory: 6
      },
      Charisma: {
        persuasion: 5,
        leadership: 10,
        intimidation: 8,
        performance: 6
      },
      synergies: {
        'Strength + Dexterity': 'combat',
        'Magic + Intelligence': 'spellcasting',
        'Dexterity + Intelligence': 'crafting',
        'Charisma + Intelligence': 'diplomacy'
      }
    };
  }

  /**
   * Get specific rule for an action
   * @param {string} actionType - Type of action
   * @param {string} actionName - Name of action
   * @returns {Object} Specific rule
   */
  getRuleForAction(actionType, actionName) {
    const ruleMap = {
      combat: {
        attack: this.getCombatRules(),
        defend: { ...this.getCombatRules(), damageCalculation: 'reduced_damage' },
        special_attack: { ...this.getCombatRules(), specialRequirement: 'rage_mode' }
      },
      magic: {
        cast_spell: this.getMagicRules(),
        enchant_item: { ...this.getMagicRules(), requiresMaterials: true },
        dispel_magic: { ...this.getMagicRules(), skillRequired: 'Magic', level: 15 }
      },
      dialogue: {
        bargain: {
          skillRequired: 'Charisma',
          minimumLevel: 3,
          reputationModifier: true,
          successThreshold: 0.7
        },
        intimidate: {
          skillRequired: 'Charisma',
          minimumLevel: 5,
          strengthBonus: true,
          successThreshold: 0.6
        },
        persuade: {
          skillRequired: 'Charisma',
          minimumLevel: 4,
          intelligenceBonus: true,
          successThreshold: 0.8
        }
      }
    };

    return ruleMap[actionType]?.[actionName] || {};
  }

  /**
   * Validate an action against rules
   * @param {Object} action - Action to validate
   * @returns {boolean} Whether action is valid
   */
  validateAction(action) {
    this.validationMetrics.totalValidations++;
    
    try {
      const rule = this.getRuleForAction(action.type, action.action);
      
      if (!rule || Object.keys(rule).length === 0) {
        this.validationMetrics.failedValidations++;
        return false;
      }

      // Check weapon requirements for combat
      if (action.type === 'combat' && rule.requiresWeapon && !action.weapon) {
        this.validationMetrics.failedValidations++;
        return false;
      }

      // Check skill requirements
      if (rule.skillRequired && rule.minimumLevel) {
        const skillLevel = action[rule.skillRequired.toLowerCase()] || 0;
        if (skillLevel < rule.minimumLevel) {
          this.validationMetrics.failedValidations++;
          return false;
        }
      }

      // Check mana requirements for magic
      if (action.type === 'magic' && rule.requiresMana) {
        const manaCost = rule.spellCosts?.[action.spell] || 0;
        if (action.mana < manaCost) {
          this.validationMetrics.failedValidations++;
          return false;
        }
      }

      this.validationMetrics.passedValidations++;
      return true;
    } catch (error) {
      this.validationMetrics.failedValidations++;
      return false;
    }
  }

  /**
   * Get formatted rules for LLM consumption
   * @returns {Object} Formatted rules for LLM
   */
  getRulesForLLM() {
    return {
      systemPrompt: `
        You are a narrative AI for a text-based adventure game.
        Follow these rules to maintain consistency and accuracy:
        
        1. Always validate your narrative against the current game state
        2. Ensure your descriptions match the game mechanics
        3. Use the provided rules to determine what is possible
        4. Maintain narrative consistency across interactions
        5. Focus on storytelling, not changing game mechanics
        
        Remember: You create the story, the game engine handles the mechanics.
      `.trim(),
      rules: {
        combat: this.getCombatRules(),
        magic: this.getMagicRules(),
        time: this.getTimeRules(),
        reputation: this.getReputationRules(),
        location: this.getLocationRules(),
        skills: this.getSkillRules()
      },
      examples: {
        combat: 'Player attacks dragon with sword - describe the combat outcome',
        magic: 'Player casts healing spell - describe the magical effects',
        dialogue: 'Player bargains with merchant - describe the negotiation'
      }
    };
  }

  /**
   * Get rule coverage metrics
   * @returns {Object} Rule metrics
   */
  getRuleMetrics() {
    const totalRules = Object.keys(this.rules).length + Object.keys(this.customRules).length;
    const ruleCategories = Object.keys(this.rules).length;
    
    return {
      totalRules,
      ruleCategories,
      coverage: {
        combat: this.rules.combat ? 100 : 0,
        magic: this.rules.magic ? 100 : 0,
        dialogue: this.rules.dialogue ? 100 : 0,
        time: this.rules.time ? 100 : 0,
        reputation: this.rules.reputation ? 100 : 0,
        location: this.rules.location ? 100 : 0,
        skills: this.rules.skills ? 100 : 0
      },
      validationRate: this.validationMetrics.totalValidations > 0 ? 
        this.validationMetrics.passedValidations / this.validationMetrics.totalValidations : 0
    };
  }

  /**
   * Add custom rule
   * @param {Object} customRule - Custom rule to add
   */
  addCustomRule(customRule) {
    if (!this.customRules[customRule.type]) {
      this.customRules[customRule.type] = {};
    }
    
    this.customRules[customRule.type][customRule.action] = customRule;
  }

  /**
   * Initialize default rules
   * @returns {Object} Initialized rules
   */
  initializeRules() {
    return {
      combat: this.getCombatRules(),
      magic: this.getMagicRules(),
      time: this.getTimeRules(),
      reputation: this.getReputationRules(),
      location: this.getLocationRules(),
      skills: this.getSkillRules()
    };
  }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.WorldRules = WorldRules;
}
