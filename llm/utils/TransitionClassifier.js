/**
 * TransitionClassifier.js - Action vs Environment transitions
 * Based on paper insights about action-driven transitions being more accurate (65% vs 35%)
 * 
 * Separates player-driven changes from world-driven changes to improve reliability.
 * Uses code for reliable environment transitions, LLM for creative action interpretations.
 */

// Dependencies will be loaded via script tags

class TransitionClassifier {
  constructor() {
    this.transitionRules = this.initializeTransitionRules();
    this.metrics = {
      totalTransitions: 0,
      actionDriven: 0,
      environmentDriven: 0,
      hybrid: 0
    };
  }

  /**
   * Classify a transition as action-driven, environment-driven, or hybrid
   * @param {Object} action - The action to classify
   * @param {GameState} gameState - Current game state
   * @returns {Object} Classification result
   */
  classifyTransition(action, gameState) {
    const classification = {
      type: 'unknown',
      requiresLLM: false,
      requiresCode: false,
      description: '',
      confidence: 0
    };

    // Check if it's a player action
    if (this.isPlayerAction(action)) {
      classification.type = 'action-driven';
      classification.requiresLLM = true;
      classification.description = 'Player-driven action requiring narrative interpretation';
      classification.confidence = 0.9;
    }
    // Check if it's an environment change
    else if (this.isEnvironmentChange(action)) {
      classification.type = 'environment-driven';
      classification.requiresCode = true;
      classification.description = 'World-driven change requiring deterministic simulation';
      classification.confidence = 0.9;
    }
    // Check if it's a hybrid action
    else if (this.isHybridAction(action)) {
      classification.type = 'hybrid';
      classification.requiresLLM = true;
      classification.requiresCode = true;
      classification.description = 'Action requiring both narrative and mechanical processing';
      classification.confidence = 0.8;
    }

    // Update metrics
    this.updateMetrics(classification.type);

    return classification;
  }

  /**
   * Get requirements for a specific action
   * @param {Object} action - The action to analyze
   * @returns {Object} Action requirements
   */
  getActionRequirements(action) {
    const requirements = {
      llm: null,
      code: null
    };

    if (this.isPlayerAction(action)) {
      requirements.llm = {
        promptType: 'narrative',
        focus: 'outcome',
        constraints: this.getLLMConstraints(action)
      };
    }

    if (this.isEnvironmentChange(action)) {
      requirements.code = {
        function: this.getCodeFunction(action),
        parameters: this.getCodeParameters(action)
      };
    }

    if (this.isHybridAction(action)) {
      requirements.llm = {
        promptType: 'narrative',
        focus: 'outcome',
        constraints: this.getLLMConstraints(action)
      };
      requirements.code = {
        function: this.getCodeFunction(action),
        parameters: this.getCodeParameters(action)
      };
    }

    return requirements;
  }

  /**
   * Validate a transition against its classification
   * @param {Object} action - The action to validate
   * @param {string} classification - The classification type
   * @returns {boolean} Whether the classification is valid
   */
  validateTransition(action, classification) {
    const actualClassification = this.classifyTransition(action, {});
    
    return actualClassification.type === classification;
  }

  /**
   * Get rules for a specific transition type
   * @param {string} transitionType - Type of transition
   * @returns {Object} Transition rules
   */
  getTransitionRules(transitionType) {
    return this.transitionRules[transitionType] || {};
  }

  /**
   * Get examples for each transition type
   * @returns {Object} Examples by type
   */
  getTransitionExamples() {
    return {
      'action-driven': [
        'combat',
        'dialogue',
        'spellcasting',
        'item_usage',
        'exploration_choice'
      ],
      'environment-driven': [
        'time_passage',
        'weather_change',
        'shop_hours',
        'guard_patrols',
        'monster_spawns'
      ],
      'hybrid': [
        'skill_check',
        'quest_completion',
        'reputation_change',
        'level_up',
        'item_crafting'
      ]
    };
  }

  /**
   * Classify complex multi-step transitions
   * @param {Object} complexAction - Multi-step action
   * @returns {Object} Classification for complex action
   */
  classifyComplexTransition(complexAction) {
    const classification = {
      type: 'hybrid',
      requiresLLM: false,
      requiresCode: false,
      steps: [],
      overallComplexity: 'medium'
    };

    if (complexAction.steps && Array.isArray(complexAction.steps)) {
      for (const step of complexAction.steps) {
        const stepClassification = this.classifyTransition(step, {});
        classification.steps.push(stepClassification);
        
        if (stepClassification.requiresLLM) {
          classification.requiresLLM = true;
        }
        if (stepClassification.requiresCode) {
          classification.requiresCode = true;
        }
      }

      // Determine overall type based on steps
      const stepTypes = classification.steps.map(s => s.type);
      if (stepTypes.every(type => type === 'action-driven')) {
        classification.type = 'action-driven';
      } else if (stepTypes.every(type => type === 'environment-driven')) {
        classification.type = 'environment-driven';
      } else {
        classification.type = 'hybrid';
      }
    }

    return classification;
  }

  /**
   * Get transition metrics
   * @param {Array} transitions - Array of transitions to analyze
   * @returns {Object} Transition metrics
   */
  getTransitionMetrics(transitions) {
    const metrics = {
      total: transitions.length,
      'action-driven': 0,
      'environment-driven': 0,
      'hybrid': 0,
      llmRequired: 0,
      codeRequired: 0
    };

    for (const transition of transitions) {
      const classification = this.classifyTransition(transition, {});
      
      metrics[classification.type]++;
      if (classification.requiresLLM) metrics.llmRequired++;
      if (classification.requiresCode) metrics.codeRequired++;
    }

    return metrics;
  }

  /**
   * Check if action is player-driven
   * @param {Object} action - Action to check
   * @returns {boolean} Whether action is player-driven
   */
  isPlayerAction(action) {
    const playerActionTypes = [
      'combat', 'dialogue', 'spellcasting', 'item_usage',
      'exploration_choice', 'npc_interaction', 'quest_choice'
    ];

    return playerActionTypes.includes(action.type) && action.playerChoice;
  }

  /**
   * Check if action is environment-driven
   * @param {Object} action - Action to check
   * @returns {boolean} Whether action is environment-driven
   */
  isEnvironmentChange(action) {
    const environmentTypes = [
      'time_passage', 'weather_change', 'shop_hours',
      'guard_patrols', 'monster_spawns', 'season_change',
      'day_night_cycle', 'economic_fluctuation'
    ];

    return environmentTypes.includes(action.type) && action.automatic;
  }

  /**
   * Check if action is hybrid
   * @param {Object} action - Action to check
   * @returns {boolean} Whether action is hybrid
   */
  isHybridAction(action) {
    const hybridTypes = [
      'skill_check', 'quest_completion', 'reputation_change',
      'level_up', 'item_crafting', 'trading', 'negotiation'
    ];

    return hybridTypes.includes(action.type) && 
           (action.playerChoice || action.skillRequired);
  }

  /**
   * Get LLM constraints for an action
   * @param {Object} action - Action to get constraints for
   * @returns {Object} LLM constraints
   */
  getLLMConstraints(action) {
    const constraints = {
      narrative: true,
      consistency: true,
      gameState: true
    };

    if (action.type === 'combat') {
      constraints.outcome = 'determined_by_code';
      constraints.narrative = 'describe_combat_result';
    } else if (action.type === 'dialogue') {
      constraints.npc_personality = true;
      constraints.context_awareness = true;
    } else if (action.type === 'spellcasting') {
      constraints.spell_effects = 'determined_by_code';
      constraints.narrative = 'describe_magical_effects';
    }

    return constraints;
  }

  /**
   * Get code function for an action
   * @param {Object} action - Action to get function for
   * @returns {string} Code function name
   */
  getCodeFunction(action) {
    const functionMap = {
      'time_passage': 'advanceTime',
      'weather_change': 'updateWeather',
      'shop_hours': 'checkShopHours',
      'guard_patrols': 'updateGuardPatrols',
      'monster_spawns': 'spawnMonsters',
      'skill_check': 'rollSkillCheck',
      'combat': 'resolveCombat',
      'level_up': 'processLevelUp'
    };

    return functionMap[action.type] || 'processAction';
  }

  /**
   * Get code parameters for an action
   * @param {Object} action - Action to get parameters for
   * @returns {Object} Code parameters
   */
  getCodeParameters(action) {
    const parameters = { ...action };
    
    // Remove LLM-specific properties
    delete parameters.playerChoice;
    delete parameters.narrative;
    delete parameters.description;
    
    return parameters;
  }

  /**
   * Update transition metrics
   * @param {string} transitionType - Type of transition
   */
  updateMetrics(transitionType) {
    this.metrics.totalTransitions++;
    
    switch (transitionType) {
      case 'action-driven':
        this.metrics.actionDriven++;
        break;
      case 'environment-driven':
        this.metrics.environmentDriven++;
        break;
      case 'hybrid':
        this.metrics.hybrid++;
        break;
    }
  }

  /**
   * Initialize transition rules
   * @returns {Object} Initialized transition rules
   */
  initializeTransitionRules() {
    return {
      'action-driven': {
        llmRequired: true,
        codeRequired: false,
        validation: 'Must have player choice and narrative outcome',
        examples: ['combat', 'dialogue', 'spellcasting']
      },
      'environment-driven': {
        llmRequired: false,
        codeRequired: true,
        validation: 'Must be automatic and deterministic',
        examples: ['time_passage', 'weather_change', 'shop_hours']
      },
      'hybrid': {
        llmRequired: true,
        codeRequired: true,
        validation: 'Must have both player choice and mechanical outcome',
        examples: ['skill_check', 'quest_completion', 'level_up']
      }
    };
  }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.TransitionClassifier = TransitionClassifier;
}
