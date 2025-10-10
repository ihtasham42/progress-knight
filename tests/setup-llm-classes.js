// Shared setup for loading LLM classes using VM module
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// Create a controlled context with all required globals
const context = {
  // Mock loglevel for legacy JavaScript files
  log: {
    noConflict: () => ({
      setLevel: () => {},
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    }),
    setLevel: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  },

  // Mock functions that classes depend on
  applyMultipliers: (value, multipliers) => {
    let finalMultiplier = 1;
    multipliers.forEach(multiplierFunction => {
      const multiplier = multiplierFunction();
      finalMultiplier *= multiplier;
    });
    return Math.round(value * finalMultiplier);
  },

  applySpeed: (value) => value,

  // Mock gameData
  gameData: {
    taskData: {},
    itemData: {},
    coins: 0,
    days: 365 * 14,
    evil: 0,
    paused: false,
    timeWarpingEnabled: true,
    rebirthOneCount: 0,
    rebirthTwoCount: 0,
    currentJob: null,
    currentSkill: null,
    currentProperty: null,
    currentMisc: []
  },

  // Mock localStorage - bridge to global localStorage when available
  localStorage: {
    data: {},
    getItem: function(key) { 
      // In test environment, check global localStorage first
      if (typeof global !== 'undefined' && global.localStorage && global.localStorage.data) {
        return global.localStorage.data[key] || null;
      }
      return this.data[key] || null; 
    },
    setItem: function(key, value) { 
      if (typeof global !== 'undefined' && global.localStorage && global.localStorage.data) {
        global.localStorage.data[key] = value;
      }
      this.data[key] = value; 
    },
    removeItem: function(key) { 
      if (typeof global !== 'undefined' && global.localStorage && global.localStorage.data) {
        delete global.localStorage.data[key];
      }
      delete this.data[key]; 
    },
    clear: function() { 
      if (typeof global !== 'undefined' && global.localStorage && global.localStorage.data) {
        global.localStorage.data = {};
      }
      this.data = {}; 
    }
  },

  // Mock console to avoid noise
  console: { 
    log: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    info: () => {}
  },

  // Mock window object
  window: {
    localStorage: {
      data: {},
      getItem: function(key) { return this.data[key] || null; },
      setItem: function(key, value) { this.data[key] = value; },
      removeItem: function(key) { delete this.data[key]; },
      clear: function() { this.data = {}; }
    }
  }
};

// Create VM context
const vmContext = vm.createContext(context);

// Load and execute the LLM classes in the controlled context
// Order matters due to dependencies
// Now using consolidated classes
const llmClasses = [
  'CharacterEncoder.js',  // Contains: CharacterEncoder (required by AdventureSystem)
  'story-data.js',        // Contains: StoryTreeData, StoryTreeManager, StoryTreeBuilder, StoryPersistenceManager
  'career-analysis.js',   // Contains: CareerWeights, ProbabilityCalculator, CareerAnalyzer, CareerBasedPromptGenerator
  'adventure-system.js'   // Contains: AdventureSystem (replaces StoryAdventureManager, CareerBasedAdventureIntegration)
];

const loadedClasses = {};

// Load all classes at once in a single wrapped function
try {
  const allClassContent = llmClasses.map(className => {
    // Map class names to new organized structure
    let subdir = '';
    if (className === 'CharacterEncoder.js') subdir = 'utils';
    else if (className === 'story-data.js') subdir = 'features';
    else if (className === 'career-analysis.js') subdir = 'features';
    else if (className === 'adventure-system.js') subdir = 'features';
    
    const classPath = path.join(__dirname, '../llm', subdir, className);
    return fs.readFileSync(classPath, 'utf8');
  }).join('\n\n');

  // Wrap all classes in a function that returns them
  const wrappedCode = `
    (function() {
      ${allClassContent}
      return {
        // From CharacterEncoder.js
        CharacterEncoder: CharacterEncoder,
        
        // From story-data.js
        StoryTreeData: StoryTreeData,
        StoryTreeManager: StoryTreeManager,
        StoryTreeBuilder: StoryTreeBuilder,
        StoryPersistenceManager: StoryPersistenceManager,
        
        // From career-analysis.js
        CareerWeights: CareerWeights,
        ProbabilityCalculator: ProbabilityCalculator,
        CareerAnalyzer: CareerAnalyzer,
        CareerBasedPromptGenerator: CareerBasedPromptGenerator,
        
        // From adventure-system.js
        AdventureSystem: AdventureSystem
      };
    })()
  `;
  
  const result = vm.runInContext(wrappedCode, vmContext);
  
  // Add the classes to our context
  Object.assign(loadedClasses, result);
  
} catch (error) {
  console.warn('Error loading LLM classes:', error.message);
}

// Export the classes for use in tests
module.exports = {
  ...loadedClasses,
  // Export the context so tests can access the same gameData and functions
  context: context
};
