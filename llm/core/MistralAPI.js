/**
 * Mistral API Integration - Handles communication with Mistral AI
 */
class MistralAPI {
    constructor() {
        this.apiKey = null;
        this.baseURL = 'https://api.mistral.ai/v1/chat/completions';
    }
    
    /**
     * Generate world description using Mistral API
     * @param {Object} characterState - Character state for prompt generation
     * @param {string|null} customPrompt - Custom prompt or null
     * @param {Array|null} messages - Array of conversation messages or null
     * @param {string|null} systemMessage - System message or null
     * @returns {Promise<string>} Generated world description
     */
    async generateWorldDescription(characterState, customPrompt = null, messages = null, systemMessage = null) {
        if (!this.apiKey) {
            throw new Error('Mistral API key not configured');
        }
        
        // Build messages array
        let messageArray;
        
        if (messages && messages.length > 0) {
            // Use provided message history
            messageArray = [...messages];
        } else if (customPrompt) {
            // Use custom prompt as single user message
            messageArray = [{
                role: 'user',
                content: customPrompt
            }];
        } else {
            // Fallback to default prompt
            const prompt = PromptGenerator.generateExplorationPrompt(characterState);
            messageArray = [{
                role: 'user',
                content: prompt
            }];
        }
        
        // Add system message if provided (Mistral supports system messages)
        if (systemMessage) {
            messageArray.unshift({
                role: 'system',
                content: systemMessage
            });
        }
        
        const response = await fetch(this.baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-tiny', // Free tier model
                messages: messageArray,
                max_tokens: 600, // Increased for longer stories with 4 choices
                temperature: 0.8
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Mistral API error: ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid API response format');
        }
        
        return data.choices[0].message.content;
    }
}

// Export for both CommonJS and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MistralAPI;
}
if (typeof window !== 'undefined') {
    window.MistralAPI = MistralAPI;
}
