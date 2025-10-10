const { TestMocks, TestDataFactory } = require('../test-helpers');

// Handle both Node.js and browser environments
let StoryPromptGenerator;
try {
  StoryPromptGenerator = require('../../llm/narrative/StoryPromptGenerator');
} catch (e) {
  StoryPromptGenerator = global.StoryPromptGenerator;
}

describe('Story Prompt Generator Tests', () => {
  let mockCharacterState;
  let mockStoryContext;

  beforeEach(() => {
    TestMocks.setupStandardMocks();
    
    mockCharacterState = {
      age: 25,
      days: 365 * 25,
      coins: 5000,
      evil: 10,
      rebirthCount: 0,
      currentJob: 'Knight',
      currentSkill: 'Strength',
      skills: [
        { name: 'Strength', level: 20, description: 'Physical power' },
        { name: 'Magic', level: 5, description: 'Arcane knowledge' }
      ],
      jobs: [
        { name: 'Knight', level: 15, income: 100 }
      ]
    };
    
    mockStoryContext = {
      genre: 'Medieval Fantasy',
      characterTraits: {
        personality: ['honorable', 'brave', 'loyal'],
        motivations: ['protecting others', 'seeking justice'],
        fears: ['corruption', 'losing innocence'],
        goals: ['protecting the realm', 'bringing peace'],
        specialAbilities: ['combat mastery', 'leadership']
      },
      worldState: {
        location: 'a military outpost',
        timeOfDay: 'morning',
        weather: 'clear',
        politicalClimate: 'stable',
        magicalLevel: 'moderate',
        dangerLevel: 'low'
      },
      storyTurns: 0,
      lastChoice: null,
      storyHistory: []
    };
  });

  describe('New Story Prompt Generation', () => {
    test('should generate new story prompt', () => {
      const prompt = StoryPromptGenerator.generateStoryPrompt(mockCharacterState, mockStoryContext, true);
      
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(100);
    });

    test('should include character information in prompt', () => {
      const prompt = StoryPromptGenerator.generateStoryPrompt(mockCharacterState, mockStoryContext, true);
      
      expect(prompt).toContain('25 years old');
      expect(prompt).toContain('Knight');
      expect(prompt).toContain('Strength');
      expect(prompt).toContain('5.0K');
      expect(prompt).toContain('10');
    });

    test('should include genre in prompt', () => {
      const prompt = StoryPromptGenerator.generateStoryPrompt(mockCharacterState, mockStoryContext, true);
      
      expect(prompt).toContain('Medieval Fantasy');
    });

    test('should include character traits in prompt', () => {
      const prompt = StoryPromptGenerator.generateStoryPrompt(mockCharacterState, mockStoryContext, true);
      
      expect(prompt).toContain('honorable');
      expect(prompt).toContain('brave');
      expect(prompt).toContain('loyal');
    });

    test('should include world context in prompt', () => {
      const prompt = StoryPromptGenerator.generateStoryPrompt(mockCharacterState, mockStoryContext, true);
      
      expect(prompt).toContain('military outpost');
      expect(prompt).toContain('morning');
      expect(prompt).toContain('clear');
    });

    test('should request 4 choices in prompt', () => {
      const prompt = StoryPromptGenerator.generateStoryPrompt(mockCharacterState, mockStoryContext, true);
      
      expect(prompt).toContain('exactly 4 different choices');
      expect(prompt).toContain('aggressive/confrontational');
      expect(prompt).toContain('cautious/stealthy');
      expect(prompt).toContain('diplomatic/negotiation');
      expect(prompt).toContain('creative/unconventional');
    });
  });

  describe('Story Continuation Prompt Generation', () => {
    beforeEach(() => {
      mockStoryContext.storyTurns = 2;
      mockStoryContext.lastChoice = 'Attack the dragon';
      mockStoryContext.storyHistory = [
        { turn: 1, choice: 'Enter the cave', characterState: {}, timestamp: Date.now() },
        { turn: 2, choice: 'Attack the dragon', characterState: {}, timestamp: Date.now() }
      ];
    });

    test('should generate continuation prompt', () => {
      const prompt = StoryPromptGenerator.generateStoryPrompt(mockCharacterState, mockStoryContext, false);
      
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(100);
    });

    test('should include story history in continuation prompt', () => {
      const prompt = StoryPromptGenerator.generateStoryPrompt(mockCharacterState, mockStoryContext, false);
      
      expect(prompt).toContain('2 previous choices');
      expect(prompt).toContain('Attack the dragon');
    });

    test('should include story turns in continuation prompt', () => {
      const prompt = StoryPromptGenerator.generateStoryPrompt(mockCharacterState, mockStoryContext, false);
      
      expect(prompt).toContain('2 previous choices');
    });

    test('should request consequences of previous choice', () => {
      const prompt = StoryPromptGenerator.generateStoryPrompt(mockCharacterState, mockStoryContext, false);
      
      expect(prompt).toContain('consequences of their previous choice');
      expect(prompt).toContain('new challenges or opportunities');
    });
  });

  describe('Character Name Generation', () => {
    test('should generate knight names', () => {
      const knightCharacter = { ...mockCharacterState, currentJob: 'Knight' };
      const name = StoryPromptGenerator.generateCharacterName(knightCharacter);
      
      expect(['Alexander', 'Gareth', 'Marcus', 'Thorin']).toContain(name);
    });

    test('should generate mage names', () => {
      const mageCharacter = { ...mockCharacterState, currentJob: 'Mage' };
      const name = StoryPromptGenerator.generateCharacterName(mageCharacter);
      
      expect(['Eldrin', 'Mystara', 'Zephyr', 'Luna']).toContain(name);
    });

    test('should generate evil names for high evil characters', () => {
      const evilCharacter = { ...mockCharacterState, evil: 80 };
      const name = StoryPromptGenerator.generateCharacterName(evilCharacter);
      
      expect(['Malachar', 'Vorthak', 'Nexus', 'Void']).toContain(name);
    });

    test('should generate reborn names for reborn characters', () => {
      const rebornCharacter = { ...mockCharacterState, rebirthCount: 2 };
      const name = StoryPromptGenerator.generateCharacterName(rebornCharacter);
      
      expect(['Ancient', 'Eternal', 'Timeless', 'Sage']).toContain(name);
    });
  });

  describe('Story Response Parsing', () => {
    test('should parse valid story response', () => {
      const mockResponse = `
STORY: You find yourself in a dark forest. The trees tower above you, their branches reaching like gnarled fingers. A mysterious light glows in the distance.

CHOICES:
1. Follow the light cautiously
2. Turn around and leave
3. Call out to see if anyone is there
4. Climb a tree to get a better view
      `;
      
      const parsed = StoryPromptGenerator.parseStoryResponse(mockResponse);
      
      expect(parsed.story).toContain('dark forest');
      expect(parsed.choices).toHaveLength(4);
      expect(parsed.choices[0]).toContain('Follow the light');
      expect(parsed.hasValidFormat).toBe(true);
    });

    test('should handle response with extra content', () => {
      const mockResponse = `
Some extra text here.

STORY: The adventure begins in a bustling city. Merchants call out their wares and the streets are alive with activity.

CHOICES:
1. Explore the marketplace
2. Visit the tavern
3. Head to the castle
4. Talk to the guards

More extra text.
      `;
      
      const parsed = StoryPromptGenerator.parseStoryResponse(mockResponse);
      
      expect(parsed.story).toContain('bustling city');
      expect(parsed.choices).toHaveLength(4);
      expect(parsed.hasValidFormat).toBe(true);
    });

    test('should handle response with missing choices', () => {
      const mockResponse = `
STORY: You are in a peaceful meadow.
      `;
      
      const parsed = StoryPromptGenerator.parseStoryResponse(mockResponse);
      
      expect(parsed.story).toContain('peaceful meadow');
      expect(parsed.choices).toHaveLength(4); // Should provide fallback choices
      expect(parsed.hasValidFormat).toBe(true); // Should accept any response
    });

    test('should handle response with missing story', () => {
      const mockResponse = `
CHOICES:
1. Choice one
2. Choice two
      `;
      
      const parsed = StoryPromptGenerator.parseStoryResponse(mockResponse);
      
      expect(parsed.story).toBe('CHOICES:'); // Should use the entire response as story
      expect(parsed.choices).toHaveLength(4); // Should provide fallback choices
      expect(parsed.hasValidFormat).toBe(true); // Should accept any response
    });

    test('should limit choices to maximum of 4', () => {
      const mockResponse = `
STORY: A test story.

CHOICES:
1. Choice 1
2. Choice 2
3. Choice 3
4. Choice 4
5. Choice 5
6. Choice 6
      `;
      
      const parsed = StoryPromptGenerator.parseStoryResponse(mockResponse);
      
      expect(parsed.choices).toHaveLength(4);
      expect(parsed.choices[3]).toContain('Choice 4');
    });

    test('should remove difficulty labels from choice text', () => {
      const mockResponse = `
STORY: A test story.

CHOICES:
1. Attack the enemy - LOW LIKELIHOOD SUCCESS
2. Sneak past them - NORMAL LIKELIHOOD SUCCESS
3. Negotiate peacefully - HIGH LIKELIHOOD SUCCESS
4. Use magic creatively
      `;
      
      const parsed = StoryPromptGenerator.parseStoryResponse(mockResponse);
      
      // Choices should not contain difficulty labels
      expect(parsed.choices[0]).not.toContain('LOW LIKELIHOOD');
      expect(parsed.choices[1]).not.toContain('NORMAL LIKELIHOOD');
      expect(parsed.choices[2]).not.toContain('HIGH LIKELIHOOD');
      
      // Choices should be clean action text
      expect(parsed.choices[0]).toBe('Attack the enemy');
      expect(parsed.choices[1]).toBe('Sneak past them');
      expect(parsed.choices[2]).toBe('Negotiate peacefully');
      expect(parsed.choices[3]).toBe('Use magic creatively');
    });

    test('should handle choices with various difficulty label formats', () => {
      const mockResponse = `
STORY: A test story.

CHOICES:
1. Fight them (LOW LIKELIHOOD)
2. Run away [NORMAL LIKELIHOOD SUCCESS]
3. Talk to them - Low Likelihood
4. Hide quietly
      `;
      
      const parsed = StoryPromptGenerator.parseStoryResponse(mockResponse);
      
      // All should be cleaned
      expect(parsed.choices[0]).toBe('Fight them');
      expect(parsed.choices[1]).toBe('Run away');
      expect(parsed.choices[2]).toBe('Talk to them');
      expect(parsed.choices[3]).toBe('Hide quietly');
    });
  });

  describe('Choice Analysis', () => {
    test('should generate choice analysis prompt', () => {
      const choice = 'Attack the dragon head-on';
      const prompt = StoryPromptGenerator.generateChoiceAnalysisPrompt(choice, mockCharacterState, mockStoryContext);
      
      expect(prompt).toContain('Attack the dragon head-on');
      expect(prompt).toContain('Knight');
      expect(prompt).toContain('honorable');
    });
  });

  describe('Utility Functions', () => {
    test('should format coins correctly', () => {
      expect(StoryPromptGenerator.formatCoins(500)).toBe('500');
      expect(StoryPromptGenerator.formatCoins(1500)).toBe('1.5K');
      expect(StoryPromptGenerator.formatCoins(1500000)).toBe('1.5M');
    });

    test('should format character traits', () => {
      const traits = {
        personality: ['brave', 'honest'],
        motivations: ['justice', 'peace'],
        fears: ['corruption'],
        goals: ['protect realm'],
        specialAbilities: ['sword mastery']
      };
      
      const formatted = StoryPromptGenerator.formatCharacterTraits(traits);
      
      expect(formatted).toContain('brave');
      expect(formatted).toContain('justice');
      expect(formatted).toContain('corruption');
    });

    test('should handle empty traits', () => {
      const formatted = StoryPromptGenerator.formatCharacterTraits({});
      
      expect(formatted).toContain('No specific traits identified');
    });

    test('should format story history', () => {
      const history = [
        { turn: 1, choice: 'Enter cave' },
        { turn: 2, choice: 'Fight dragon' }
      ];
      
      const formatted = StoryPromptGenerator.formatStoryHistory(history);
      
      expect(formatted).toContain('Turn 1: Enter cave');
      expect(formatted).toContain('Turn 2: Fight dragon');
    });

    test('should handle empty history', () => {
      const formatted = StoryPromptGenerator.formatStoryHistory([]);
      
      expect(formatted).toContain('beginning of their adventure');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing character data', () => {
      const incompleteCharacter = { age: 25 };
      
      expect(() => StoryPromptGenerator.generateStoryPrompt(incompleteCharacter, mockStoryContext, true)).not.toThrow();
    });

    test('should handle null character state', () => {
      expect(() => StoryPromptGenerator.generateStoryPrompt(null, mockStoryContext, true)).not.toThrow();
    });

    test('should handle empty story context', () => {
      const emptyContext = {};
      
      expect(() => StoryPromptGenerator.generateStoryPrompt(mockCharacterState, emptyContext, true)).not.toThrow();
    });
  });
});
