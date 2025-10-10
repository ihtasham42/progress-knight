const { TestMocks, TestDataFactory } = require('../test-helpers');
// Handle both Node.js and browser environments
let MistralAPI;
try {
  MistralAPI = require('../../llm/core/MistralAPI');
} catch (e) {
  // For browser environment, use global
  MistralAPI = global.MistralAPI;
}
// Handle PromptGenerator for both environments
let PromptGenerator;
try {
  PromptGenerator = require('../../llm/narrative/PromptGenerator').PromptGenerator;
} catch (e) {
  PromptGenerator = global.PromptGenerator;
}

describe('Mistral API Tests', () => {
  let mistralAPI;
  let mockFetch;

  beforeEach(() => {
    TestMocks.setupStandardMocks();
    
    mistralAPI = new MistralAPI();
    
    // Mock fetch globally
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('API Configuration', () => {
    test('should initialize with null API key', () => {
      expect(mistralAPI.apiKey).toBeNull();
    });

    test('should set API key correctly', () => {
      const testKey = 'test-api-key-123';
      mistralAPI.apiKey = testKey;
      
      expect(mistralAPI.apiKey).toBe(testKey);
    });

    test('should have correct base URL', () => {
      expect(mistralAPI.baseURL).toBe('https://api.mistral.ai/v1/chat/completions');
    });
  });

  describe('World Description Generation', () => {
    beforeEach(() => {
      mistralAPI.apiKey = 'test-api-key-123';
    });

    test('should generate world description successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'You find yourself in a bustling medieval town...'
            }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const characterState = {
        age: 25,
        currentJob: 'Knight',
        currentSkill: 'Strength'
      };

      const result = await mistralAPI.generateWorldDescription(characterState);

      expect(result).toBe('You find yourself in a bustling medieval town...');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should make correct API request', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const characterState = { age: 25, currentJob: 'Knight' };
      await mistralAPI.generateWorldDescription(characterState);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.mistral.ai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key-123'
          },
          body: expect.stringContaining('mistral-tiny')
        })
      );
    });

    test('should use correct model and parameters', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await mistralAPI.generateWorldDescription({});

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      
      expect(requestBody.model).toBe('mistral-tiny');
      expect(requestBody.max_tokens).toBe(600); // Updated for longer stories
      expect(requestBody.temperature).toBe(0.8);
      expect(requestBody.messages).toHaveLength(1);
      expect(requestBody.messages[0].role).toBe('user');
    });

    test('should throw error when API key is not set', async () => {
      mistralAPI.apiKey = null;

      await expect(mistralAPI.generateWorldDescription({}))
        .rejects.toThrow('Mistral API key not configured');
    });

    test('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Authentication failed')
      });

      await expect(mistralAPI.generateWorldDescription({}))
        .rejects.toThrow('Mistral API error');
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(mistralAPI.generateWorldDescription({}))
        .rejects.toThrow('Network error');
    });

    test('should handle malformed API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}) // Missing choices array
      });

      await expect(mistralAPI.generateWorldDescription({}))
        .rejects.toThrow();
    });
  });

  describe('Request Formatting', () => {
    beforeEach(() => {
      mistralAPI.apiKey = 'test-api-key-123';
    });

    test('should include character state in prompt', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const characterState = {
        age: 30,
        currentJob: 'Mage',
        skills: [{ name: 'Magic', level: 10 }]
      };

      await mistralAPI.generateWorldDescription(characterState);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const prompt = requestBody.messages[0].content;
      
      expect(prompt).toContain('30 years old');
      expect(prompt).toContain('Mage');
      expect(prompt).toContain('Magic');
    });

    test('should handle empty character state', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await mistralAPI.generateWorldDescription({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mistralAPI.apiKey = 'test-api-key-123';
    });

    test('should handle 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Authentication failed')
      });

      await expect(mistralAPI.generateWorldDescription({}))
        .rejects.toThrow('Mistral API error');
    });

    test('should handle 429 Rate Limited', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: () => Promise.resolve('Rate limit exceeded')
      });

      await expect(mistralAPI.generateWorldDescription({}))
        .rejects.toThrow('Mistral API error');
    });

    test('should handle 500 Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error')
      });

      await expect(mistralAPI.generateWorldDescription({}))
        .rejects.toThrow('Mistral API error');
    });
  });

  describe('Response Processing', () => {
    beforeEach(() => {
      mistralAPI.apiKey = 'test-api-key-123';
    });

    test('should extract content from valid response', async () => {
      const expectedContent = 'You discover a hidden treasure chest...';
      const mockResponse = {
        choices: [
          {
            message: {
              content: expectedContent
            }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await mistralAPI.generateWorldDescription({});
      
      expect(result).toBe(expectedContent);
    });

    test('should handle multiple choices by taking first', async () => {
      const expectedContent = 'First choice content';
      const mockResponse = {
        choices: [
          { message: { content: expectedContent } },
          { message: { content: 'Second choice content' } }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await mistralAPI.generateWorldDescription({});
      
      expect(result).toBe(expectedContent);
    });
  });
});
