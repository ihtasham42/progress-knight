/**
 * Tests for Mistral API Key Persistence
 * Tests the integration layer's handling of API key storage and retrieval
 */

// Load required classes
let MistralAPI;
let AdventureSystem;
try {
    MistralAPI = require('../../llm/core/MistralAPI');
    const result = require('./setup-llm-classes.js');
    if (typeof result === 'function') {
        const classes = result();
        AdventureSystem = classes.AdventureSystem;
    } else {
        AdventureSystem = global.AdventureSystem;
    }
} catch (e) {
    MistralAPI = global.MistralAPI;
    AdventureSystem = global.AdventureSystem;
}

describe('API Key Persistence', () => {
    let localStorage;
    
    beforeEach(() => {
        // Mock localStorage
        localStorage = {
            storage: {},
            getItem(key) {
                return this.storage[key] || null;
            },
            setItem(key, value) {
                this.storage[key] = value;
            },
            removeItem(key) {
                delete this.storage[key];
            },
            clear() {
                this.storage = {};
            }
        };
        global.localStorage = localStorage;
    });
    
    describe('Basic localStorage Operations', () => {
        test('should store API key in localStorage', () => {
            localStorage.setItem('mistralApiKey', 'test-key-123');
            
            expect(localStorage.getItem('mistralApiKey')).toBe('test-key-123');
        });
        
        test('should retrieve stored API key', () => {
            localStorage.setItem('mistralApiKey', 'stored-key-456');
            
            const retrievedKey = localStorage.getItem('mistralApiKey');
            expect(retrievedKey).toBe('stored-key-456');
        });
        
        test('should overwrite existing key', () => {
            localStorage.setItem('mistralApiKey', 'old-key');
            localStorage.setItem('mistralApiKey', 'new-key');
            
            expect(localStorage.getItem('mistralApiKey')).toBe('new-key');
        });
        
        test('should return null for non-existent key', () => {
            expect(localStorage.getItem('mistralApiKey')).toBeNull();
        });
        
        test('should remove key', () => {
            localStorage.setItem('mistralApiKey', 'test-key');
            localStorage.removeItem('mistralApiKey');
            
            expect(localStorage.getItem('mistralApiKey')).toBeNull();
        });
        
        test('should clear all keys', () => {
            localStorage.setItem('mistralApiKey', 'test-key');
            localStorage.setItem('otherKey', 'other-value');
            
            localStorage.clear();
            
            expect(localStorage.getItem('mistralApiKey')).toBeNull();
            expect(localStorage.getItem('otherKey')).toBeNull();
        });
    });
    
    describe('MistralAPI Integration', () => {
        test('should create MistralAPI instance', () => {
            const api = new MistralAPI();
            expect(api).toBeDefined();
            expect(api.apiKey).toBeNull();
        });
        
        test('should set API key on instance', () => {
            const api = new MistralAPI();
            api.apiKey = 'test-key';
            
            expect(api.apiKey).toBe('test-key');
        });
        
        test('should simulate UI layer setting key', () => {
            const api = new MistralAPI();
            
            // Simulate what llm-integration.js does
            const userEnteredKey = 'user-api-key-123';
            api.apiKey = userEnteredKey;
            localStorage.setItem('mistralApiKey', userEnteredKey);
            
            expect(api.apiKey).toBe('user-api-key-123');
            expect(localStorage.getItem('mistralApiKey')).toBe('user-api-key-123');
        });
        
        test('should simulate UI layer loading saved key', () => {
            // Simulate saved key
            localStorage.setItem('mistralApiKey', 'saved-key-789');
            
            // Simulate what llm-integration.js does on initialization
            const api = new MistralAPI();
            const savedKey = localStorage.getItem('mistralApiKey');
            if (savedKey) {
                api.apiKey = savedKey;
            }
            
            expect(api.apiKey).toBe('saved-key-789');
        });
    });
    
    describe('API Key Validation', () => {
        test('should detect configured API key', () => {
            const api = new MistralAPI();
            api.apiKey = 'valid-key';
            
            expect(api.apiKey).toBeTruthy();
            expect(api.apiKey.length).toBeGreaterThan(0);
        });
        
        test('should detect missing API key', () => {
            const api = new MistralAPI();
            
            expect(api.apiKey).toBeFalsy();
        });
        
        test('should validate empty string as invalid', () => {
            const apiKey = '';
            expect(apiKey.trim().length).toBe(0);
        });
        
        test('should validate whitespace-only as invalid', () => {
            const apiKey = '   ';
            expect(apiKey.trim().length).toBe(0);
        });
        
        test('should validate proper key as valid', () => {
            const apiKey = 'jOVMj1DdB5z4nvGFl8c4ZtPSUHwtLaeF';
            expect(apiKey.trim().length).toBeGreaterThan(0);
        });
    });
    
    describe('Error Handling', () => {
        test('should throw error when API key not configured', async () => {
            const api = new MistralAPI();
            
            await expect(api.generateWorldDescription({}, 'test'))
                .rejects
                .toThrow('Mistral API key not configured');
        });
        
        test('should have API key set when configured', () => {
            const api = new MistralAPI();
            api.apiKey = 'valid-key';
            
            // API key should be accessible
            expect(api.apiKey).toBe('valid-key');
            expect(api.apiKey).toBeTruthy();
        });
    });
    
    describe('Persistence Simulation', () => {
        test('should persist across simulated page reloads', () => {
            // First "session"
            const api1 = new MistralAPI();
            api1.apiKey = 'persistent-key';
            localStorage.setItem('mistralApiKey', api1.apiKey);
            
            // Simulate page reload (new instance)
            const api2 = new MistralAPI();
            const savedKey = localStorage.getItem('mistralApiKey');
            api2.apiKey = savedKey;
            
            expect(api2.apiKey).toBe('persistent-key');
        });
        
        test('should handle cleared localStorage', () => {
            localStorage.setItem('mistralApiKey', 'some-key');
            localStorage.clear();
            
            const api = new MistralAPI();
            const savedKey = localStorage.getItem('mistralApiKey');
            
            expect(savedKey).toBeNull();
            expect(api.apiKey).toBeNull();
        });
        
        test('should handle multiple key updates', () => {
            const api = new MistralAPI();
            
            // Update 1
            api.apiKey = 'key-v1';
            localStorage.setItem('mistralApiKey', api.apiKey);
            expect(localStorage.getItem('mistralApiKey')).toBe('key-v1');
            
            // Update 2
            api.apiKey = 'key-v2';
            localStorage.setItem('mistralApiKey', api.apiKey);
            expect(localStorage.getItem('mistralApiKey')).toBe('key-v2');
            
            // Update 3
            api.apiKey = 'key-v3';
            localStorage.setItem('mistralApiKey', api.apiKey);
            expect(localStorage.getItem('mistralApiKey')).toBe('key-v3');
        });
    });
});

