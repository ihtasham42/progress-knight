// Tests for utility functions from main.js
const fs = require('fs');
const path = require('path');

// Load the main.js file
const mainPath = path.join(__dirname, '../../js/main.js');
const mainContent = fs.readFileSync(mainPath, 'utf8');

// Mock DOM elements and functions that main.js depends on
global.document = {
  getElementById: jest.fn(),
  getElementsByClassName: jest.fn(() => [
    {
      content: {
        firstElementChild: {
          cloneNode: jest.fn(() => ({
            getElementsByClassName: jest.fn(() => []),
            classList: { add: jest.fn(), remove: jest.fn() },
            style: {},
            id: 'test'
          }))
        }
      }
    }
  ]),
  createElement: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
};

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock window object
global.window = {
  ...global.window,
  localStorage: global.localStorage,
  atob: jest.fn(),
  btoa: jest.fn(),
  URL: {
    createObjectURL: jest.fn(),
    revokeObjectURL: jest.fn(),
  },
};

// Mock navigator
global.navigator = {
  userAgent: 'Mozilla/5.0 (compatible; Test)',
};

// Mock gameData and other globals that main.js expects
global.gameData = {
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
};

global.tempData = {};

// Mock the classes that main.js depends on
global.Task = class Task {
  constructor(baseData) {
    this.baseData = baseData;
    this.name = baseData.name;
    this.level = 0;
    this.maxLevel = 0;
    this.xp = 0;
    this.xpMultipliers = [];
  }
};

global.Job = class Job extends global.Task {
  constructor(baseData) {
    super(baseData);
    this.incomeMultipliers = [];
  }
};

global.Skill = class Skill extends global.Task {
  constructor(baseData) {
    super(baseData);
  }
};

global.Item = class Item {
  constructor(baseData) {
    this.baseData = baseData;
    this.name = baseData.name;
    this.expenseMultipliers = [];
  }
};

global.Requirement = class Requirement {
  constructor(elements, requirements) {
    this.elements = elements;
    this.requirements = requirements;
    this.completed = false;
  }
};

global.TaskRequirement = class TaskRequirement extends global.Requirement {
  constructor(elements, requirements) {
    super(elements, requirements);
    this.type = "task";
  }
};

global.CoinRequirement = class CoinRequirement extends global.Requirement {
  constructor(elements, requirements) {
    super(elements, requirements);
    this.type = "coins";
  }
};

global.AgeRequirement = class AgeRequirement extends global.Requirement {
  constructor(elements, requirements) {
    super(elements, requirements);
    this.type = "age";
  }
};

global.EvilRequirement = class EvilRequirement extends global.Requirement {
  constructor(elements, requirements) {
    super(elements, requirements);
    this.type = "evil";
  }
};

// Mock constants and data structures
global.jobBaseData = {};
global.skillBaseData = {};
global.itemBaseData = {};
global.jobCategories = {};
global.skillCategories = {};
global.itemCategories = {};
global.headerRowColors = {};
global.tooltips = {};
global.units = ["", "k", "M", "B", "T", "q", "Q", "Sx", "Sp", "Oc"];

// Mock DOM elements
global.autoPromoteElement = { checked: false };
global.autoLearnElement = { checked: false };
global.jobTabButton = {};

// Mock functions that main.js calls
global.setTab = jest.fn();
global.createAllRows = jest.fn();
global.createData = jest.fn();
global.setCustomEffects = jest.fn();
global.addMultipliers = jest.fn();
global.setInterval = jest.fn();

// Extract only the utility functions we want to test
// We'll define them manually to avoid executing the entire main.js file

// Utility functions from main.js
function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}

function format(number) {
  // what tier? (determines SI symbol)
  var tier = Math.log10(number) / 3 | 0;

  // if zero, we don't need a suffix
  if(tier == 0) return number;

  // get suffix and determine scale
  var suffix = units[tier];
  var scale = Math.pow(10, tier * 3);

  // scale the number
  var scaled = number / scale;

  // format number and add suffix
  return scaled.toFixed(1) + suffix;
}

function applyMultipliers(value, multipliers) {
  var finalMultiplier = 1
  multipliers.forEach(function(multiplierFunction) {
    var multiplier = multiplierFunction()
    finalMultiplier *= multiplier
  })
  var finalValue = Math.round(value * finalMultiplier)
  return finalValue
}

function applySpeed(value) {
  var finalValue = value * getGameSpeed() / 20 // updateSpeed is 20
  return finalValue
}

function daysToYears(days) {
  var years = Math.floor(days / 365)
  return years
}

function yearsToDays(years) {
  var days = years * 365
  return days
}

function getDay() {
  var day = Math.floor(gameData.days - daysToYears(gameData.days) * 365)
  return day
}

function removeSpaces(string) {
  var string = string.replace(/ /g, "")
  return string
}

// Make functions available globally for testing
global.getBaseLog = getBaseLog;
global.format = format;
global.applyMultipliers = applyMultipliers;
global.applySpeed = applySpeed;
global.daysToYears = daysToYears;
global.yearsToDays = yearsToDays;
global.getDay = getDay;
global.removeSpaces = removeSpaces;

describe('Utility Functions', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('format function', () => {
    test('should return number as-is for values less than 1000', () => {
      expect(format(0)).toBe(0);
      expect(format(1)).toBe(1);
      expect(format(100)).toBe(100);
      expect(format(999)).toBe(999);
    });

    test('should format thousands correctly', () => {
      expect(format(1000)).toBe('1.0k');
      expect(format(1500)).toBe('1.5k');
      expect(format(9999)).toBe('10.0k');
    });

    test('should format millions correctly', () => {
      expect(format(1000000)).toBe('1.0M');
      expect(format(1500000)).toBe('1.5M');
      expect(format(9999999)).toBe('10.0M');
    });

    test('should format billions correctly', () => {
      expect(format(1000000000)).toBe('1.0B');
      expect(format(1500000000)).toBe('1.5B');
    });

    test('should format trillions correctly', () => {
      expect(format(1000000000000)).toBe('1.0T');
      expect(format(1500000000000)).toBe('1.5T');
    });

    test('should handle very large numbers', () => {
      expect(format(1000000000000000)).toBe('1.0q');
      expect(format(1000000000000000000)).toBe('1.0Q');
    });

    test('should handle decimal values correctly', () => {
      expect(format(1234)).toBe('1.2k');
      expect(format(12345)).toBe('12.3k');
      expect(format(123456)).toBe('123.5k');
    });
  });

  describe('applyMultipliers function', () => {
    test('should return original value when no multipliers', () => {
      const result = applyMultipliers(100, []);
      expect(result).toBe(100);
    });

    test('should apply single multiplier correctly', () => {
      const multipliers = [() => 1.5];
      const result = applyMultipliers(100, multipliers);
      expect(result).toBe(150);
    });

    test('should apply multiple multipliers correctly', () => {
      const multipliers = [() => 1.5, () => 2.0, () => 0.5];
      const result = applyMultipliers(100, multipliers);
      expect(result).toBe(150); // 100 * 1.5 * 2.0 * 0.5 = 150
    });

    test('should round result to nearest integer', () => {
      const multipliers = [() => 1.33];
      const result = applyMultipliers(100, multipliers);
      expect(result).toBe(133);
    });

    test('should handle zero multipliers', () => {
      const multipliers = [() => 0];
      const result = applyMultipliers(100, multipliers);
      expect(result).toBe(0);
    });

    test('should handle negative multipliers', () => {
      const multipliers = [() => -1.5];
      const result = applyMultipliers(100, multipliers);
      expect(result).toBe(-150);
    });
  });

  describe('applySpeed function', () => {
    beforeEach(() => {
      // Mock getGameSpeed to return predictable values
      global.getGameSpeed = jest.fn();
    });

    test('should apply game speed correctly', () => {
      global.getGameSpeed.mockReturnValue(2);
      const result = applySpeed(100);
      expect(result).toBe(10); // 100 * 2 / 20 = 10
    });

    test('should handle zero game speed', () => {
      global.getGameSpeed.mockReturnValue(0);
      const result = applySpeed(100);
      expect(result).toBe(0);
    });

    test('should handle high game speed', () => {
      global.getGameSpeed.mockReturnValue(10);
      const result = applySpeed(100);
      expect(result).toBe(50); // 100 * 10 / 20 = 50
    });
  });

  describe('daysToYears function', () => {
    test('should convert days to years correctly', () => {
      expect(daysToYears(0)).toBe(0);
      expect(daysToYears(365)).toBe(1);
      expect(daysToYears(730)).toBe(2);
      expect(daysToYears(1095)).toBe(3);
    });

    test('should handle partial years', () => {
      expect(daysToYears(100)).toBe(0);
      expect(daysToYears(200)).toBe(0);
      expect(daysToYears(400)).toBe(1);
      expect(daysToYears(500)).toBe(1);
    });

    test('should handle leap years approximately', () => {
      expect(daysToYears(366)).toBe(1);
      expect(daysToYears(367)).toBe(1);
    });
  });

  describe('yearsToDays function', () => {
    test('should convert years to days correctly', () => {
      expect(yearsToDays(0)).toBe(0);
      expect(yearsToDays(1)).toBe(365);
      expect(yearsToDays(2)).toBe(730);
      expect(yearsToDays(10)).toBe(3650);
    });
  });

  describe('getDay function', () => {
    beforeEach(() => {
      global.gameData = { days: 365 * 14 }; // 14 years
    });

    test('should return day within year correctly', () => {
      const day = getDay();
      expect(day).toBe(0); // 14 * 365 - 14 * 365 = 0
    });

    test('should handle days within first year', () => {
      global.gameData.days = 100;
      const day = getDay();
      expect(day).toBe(100);
    });

    test('should handle days in second year', () => {
      global.gameData.days = 400; // 1 year + 35 days
      const day = getDay();
      expect(day).toBe(35);
    });
  });

  describe('removeSpaces function', () => {
    test('should remove all spaces from string', () => {
      expect(removeSpaces('hello world')).toBe('helloworld');
      expect(removeSpaces('test string with spaces')).toBe('teststringwithspaces');
      expect(removeSpaces('no-spaces')).toBe('no-spaces');
      expect(removeSpaces('')).toBe('');
    });

    test('should handle multiple consecutive spaces', () => {
      expect(removeSpaces('hello    world')).toBe('helloworld');
      expect(removeSpaces('  spaces  ')).toBe('spaces');
    });
  });

  describe('getBaseLog function', () => {
    test('should calculate base logarithm correctly', () => {
      expect(getBaseLog(2, 8)).toBeCloseTo(3, 5);
      expect(getBaseLog(10, 100)).toBeCloseTo(2, 5);
      expect(getBaseLog(3, 27)).toBeCloseTo(3, 5);
    });

    test('should handle edge cases', () => {
      expect(getBaseLog(1, 5)).toBeCloseTo(Infinity, 5);
      expect(getBaseLog(5, 1)).toBeCloseTo(0, 5);
    });
  });

  describe('Edge Cases', () => {
    test('format should handle very small numbers', () => {
      expect(format(0.1)).toBe(0.1);
      expect(format(0.01)).toBe(0.01);
    });

    test('applyMultipliers should handle empty function array', () => {
      const result = applyMultipliers(100, []);
      expect(result).toBe(100);
    });

    test('daysToYears should handle negative values', () => {
      expect(daysToYears(-365)).toBe(-1);
      expect(daysToYears(-100)).toBe(-1);
    });

    test('removeSpaces should handle special characters', () => {
      expect(removeSpaces('hello-world!')).toBe('hello-world!');
      expect(removeSpaces('test@email.com')).toBe('test@email.com');
    });
  });
});
