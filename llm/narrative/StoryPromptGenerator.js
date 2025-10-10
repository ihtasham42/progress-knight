/**
 * StoryPromptGenerator - Generates story prompts with multiple choice options
 * Inspired by the ai-text-adventure repository structure
 */

class StoryPromptGenerator {
    /**
     * Generate a story continuation prompt with choices
     */
    static generateStoryPrompt(characterState, storyContext, isNewStory = false, difficultyLabels = null) {
        const context = this.buildStoryContext(characterState, storyContext);
        const genre = storyContext.genre || 'General Fantasy';
        const turns = storyContext.storyTurns || 0;
        
        let prompt;
        
        if (isNewStory) {
            prompt = this.generateNewStoryPrompt(characterState, storyContext, genre, difficultyLabels);
        } else {
            prompt = this.generateContinuationPrompt(characterState, storyContext, genre, turns, difficultyLabels);
        }
        
        return prompt;
    }
    
    /**
     * Generate prompt for starting a new story
     */
    static generateNewStoryPrompt(characterState, storyContext, genre, difficultyLabels = null) {
        const context = this.buildStoryContext(characterState, storyContext);
        
        // Default difficulty labels if not provided
        const difficulties = difficultyLabels || ['NORMAL LIKELIHOOD', 'NORMAL LIKELIHOOD', 'NORMAL LIKELIHOOD', 'NORMAL LIKELIHOOD'];
        
        return `
You are a master storyteller creating an immersive ${genre} adventure. Based on this character's current state, create the opening scene of their adventure:

CHARACTER STATE:
- Name: ${this.generateCharacterName(characterState)}
- Age: ${characterState?.age || 25} years old
- Current Job: ${characterState?.currentJob || 'Adventurer'}
- Current Skill: ${characterState?.currentSkill || 'None'}
- Wealth: ${this.formatCoins(characterState?.coins)}
- Evil Level: ${characterState?.evil || 0}
- Rebirth Count: ${characterState?.rebirthCount || 0}

CHARACTER TRAITS:
${this.formatCharacterTraits(storyContext.characterTraits)}

WORLD CONTEXT:
- Genre: ${genre}
- Starting Location: ${storyContext.worldState?.location || 'a mysterious location'}
- Time: ${storyContext.worldState?.timeOfDay || 'morning'}
- Weather: ${storyContext.worldState?.weather || 'clear'}
- Political Climate: ${storyContext.worldState?.politicalClimate || 'stable'}
- Magical Level: ${storyContext.worldState?.magicalLevel || 'moderate'}
- Danger Level: ${storyContext.worldState?.dangerLevel || 'low'}

CURRENT SITUATION:
${context}

Create an engaging opening scene (2-3 paragraphs) that:
1. Establishes the setting and atmosphere
2. Introduces the character in their current situation
3. Presents an immediate challenge or opportunity
4. Ends with a dramatic moment that requires a choice

Then provide exactly 4 different choices the character can make, each representing a different approach:
- One aggressive/confrontational option
- One cautious/stealthy option  
- One diplomatic/negotiation option
- One creative/unconventional option

IMPORTANT: Format your response EXACTLY like this:

STORY: [Your narrative here - 2-3 paragraphs describing the opening scene]

CHOICES:
1. [First choice - aggressive/confrontational option]
2. [Second choice - cautious/stealthy option]
3. [Third choice - diplomatic/negotiation option]
4. [Fourth choice - creative/unconventional option]

DIFFICULTY REQUIREMENTS FOR EACH CHOICE:
- Choice 1: ${difficulties[0]} - ${this.getDifficultyExample(difficulties[0], 'aggressive')}
- Choice 2: ${difficulties[1]} - ${this.getDifficultyExample(difficulties[1], 'cautious')}
- Choice 3: ${difficulties[2]} - ${this.getDifficultyExample(difficulties[2], 'diplomatic')}
- Choice 4: ${difficulties[3]} - ${this.getDifficultyExample(difficulties[3], 'creative')}

IMPORTANT: 
- Do NOT include "LOW LIKELIHOOD" or "NORMAL LIKELIHOOD" in the choice text itself
- Write clear, descriptive action sentences
- LOW LIKELIHOOD choices should be risky actions (fighting without weapon, negotiating with enemies who hate you, etc.)
- NORMAL LIKELIHOOD choices should be reasonable given the situation
        `;
    }
    
    /**
     * Generate prompt for continuing an existing story
     */
    static generateContinuationPrompt(characterState, storyContext, genre, turns, difficultyLabels = null) {
        const context = this.buildStoryContext(characterState, storyContext);
        const lastChoice = storyContext.lastChoice || 'their previous decision';
        
        // Default difficulty labels if not provided
        const difficulties = difficultyLabels || ['NORMAL LIKELIHOOD', 'NORMAL LIKELIHOOD', 'NORMAL LIKELIHOOD', 'NORMAL LIKELIHOOD'];
        
        return `
You are continuing a ${genre} adventure story. The character has made ${turns} previous choices, with their last choice being: "${lastChoice}".

CHARACTER STATE:
- Name: ${this.generateCharacterName(characterState)}
- Age: ${characterState.age} years old
- Current Job: ${characterState.currentJob}
- Current Skill: ${characterState.currentSkill}
- Wealth: ${this.formatCoins(characterState.coins)}
- Evil Level: ${characterState.evil}
- Rebirth Count: ${characterState.rebirthCount}

CHARACTER TRAITS:
${this.formatCharacterTraits(storyContext.characterTraits)}

WORLD CONTEXT:
- Genre: ${genre}
- Current Location: ${storyContext.worldState?.location || 'their current location'}
- Time: ${storyContext.worldState?.timeOfDay || 'morning'}
- Weather: ${storyContext.worldState?.weather || 'clear'}
- Political Climate: ${storyContext.worldState?.politicalClimate || 'stable'}
- Magical Level: ${storyContext.worldState?.magicalLevel || 'moderate'}
- Danger Level: ${storyContext.worldState?.dangerLevel || 'low'}

STORY HISTORY:
${this.formatStoryHistory(storyContext.storyHistory)}

CURRENT SITUATION:
${context}

Continue the story from where it left off. The consequences of their previous choice should be evident, and new challenges should arise naturally from the story's progression.

Create the next scene (2-3 paragraphs) that:
1. Shows the consequences of their previous choice
2. Introduces new challenges or opportunities
3. Develops the character and world further
4. Ends with a new dramatic moment requiring a choice

Then provide exactly 4 different choices the character can make, each representing a different approach:
- One aggressive/confrontational option
- One cautious/stealthy option
- One diplomatic/negotiation option
- One creative/unconventional option

Format the response as:
STORY: [narrative text]

CHOICES:
1. [First choice - aggressive option]
2. [Second choice - cautious option]
3. [Third choice - diplomatic option]
4. [Fourth choice - creative option]

DIFFICULTY REQUIREMENTS FOR EACH CHOICE:
- Choice 1: ${difficulties[0]} - ${this.getDifficultyExample(difficulties[0], 'aggressive')}
- Choice 2: ${difficulties[1]} - ${this.getDifficultyExample(difficulties[1], 'cautious')}
- Choice 3: ${difficulties[2]} - ${this.getDifficultyExample(difficulties[2], 'diplomatic')}
- Choice 4: ${difficulties[3]} - ${this.getDifficultyExample(difficulties[3], 'creative')}

IMPORTANT:
- Do NOT include "LOW LIKELIHOOD" or "NORMAL LIKELIHOOD" in the choice text itself
- Write clear, descriptive action sentences
- LOW LIKELIHOOD choices should be risky actions
- NORMAL LIKELIHOOD choices should be reasonable given the situation

Make each choice distinct and meaningful, building on the story's momentum.
        `;
    }
    
    /**
     * Get difficulty example text for prompt
     */
    static getDifficultyExample(difficulty, actionType) {
        if (difficulty === 'LOW LIKELIHOOD') {
            const examples = {
                aggressive: 'Make it risky (e.g., fight without weapon, charge overwhelming force)',
                cautious: 'Make it difficult (e.g., sneak while being watched, hide in plain sight)',
                diplomatic: 'Make it unlikely (e.g., persuade someone who hates you, negotiate with no leverage)',
                creative: 'Make it ambitious (e.g., complex magic while distracted, impossible feat)'
            };
            return examples[actionType] || 'Make it challenging';
        } else {
            const examples = {
                aggressive: 'Make it reasonable (e.g., fight with weapon, tactical approach)',
                cautious: 'Make it feasible (e.g., sneak when possible, find cover)',
                diplomatic: 'Make it plausible (e.g., reasonable negotiation, fair appeal)',
                creative: 'Make it practical (e.g., use available resources, smart solution)'
            };
            return examples[actionType] || 'Make it reasonable';
        }
    }
    
    /**
     * Build story context from character state
     */
    static buildStoryContext(characterState, storyContext) {
        if (!characterState) {
            return 'An adventurer seeking their place in the world';
        }
        
        const { currentJob = '', evil = 0, rebirthCount = 0, age = 25 } = characterState;
        
        let context = '';
        
        if (currentJob === 'Beggar') {
            context = 'A destitute individual struggling to survive, but with hidden potential';
        } else if (currentJob && currentJob.includes('Knight')) {
            context = 'A military professional with combat training and a sense of duty';
        } else if (currentJob && currentJob.includes('Mage')) {
            context = 'A magic practitioner with arcane knowledge and mystical abilities';
        } else if (currentJob && currentJob.includes('Thief')) {
            context = 'A skilled rogue with street smarts and quick reflexes';
        } else {
            context = 'An adventurer seeking their place in the world';
        }
        
        if (evil > 70) {
            context += ', with a dark and malevolent presence';
        } else if (evil > 30) {
            context += ', with morally ambiguous tendencies';
        } else {
            context += ', with a generally virtuous nature';
        }
        
        if (rebirthCount > 0) {
            context += `, having been reborn ${rebirthCount} time${rebirthCount > 1 ? 's' : ''} and carrying ancient wisdom`;
        }
        
        return context;
    }
    
    /**
     * Generate character name based on state
     */
    static generateCharacterName(characterState) {
        if (!characterState) {
            return 'Adventurer';
        }
        
        const { currentJob = '', evil = 0, rebirthCount = 0 } = characterState;
        
        const names = {
            knight: ['Alexander', 'Gareth', 'Marcus', 'Thorin'],
            mage: ['Eldrin', 'Mystara', 'Zephyr', 'Luna'],
            thief: ['Shadow', 'Raven', 'Whisper', 'Ghost'],
            beggar: ['Rust', 'Ash', 'Dust', 'Ember'],
            evil: ['Malachar', 'Vorthak', 'Nexus', 'Void'],
            reborn: ['Ancient', 'Eternal', 'Timeless', 'Sage']
        };
        
        let nameList = names.knight; // default
        
        if (currentJob && currentJob.includes('Knight')) nameList = names.knight;
        else if (currentJob && currentJob.includes('Mage')) nameList = names.mage;
        else if (currentJob && currentJob.includes('Thief')) nameList = names.thief;
        else if (currentJob === 'Beggar') nameList = names.beggar;
        
        if (evil > 70) nameList = names.evil;
        if (rebirthCount > 0) nameList = names.reborn;
        
        return nameList[Math.floor(Math.random() * nameList.length)];
    }
    
    /**
     * Format character traits for prompt
     */
    static formatCharacterTraits(traits) {
        if (!traits) return 'No specific traits identified';
        
        let formatted = '';
        
        if (traits.personality && traits.personality.length > 0) {
            formatted += `- Personality: ${traits.personality.join(', ')}\n`;
        }
        
        if (traits.motivations && traits.motivations.length > 0) {
            formatted += `- Motivations: ${traits.motivations.join(', ')}\n`;
        }
        
        if (traits.fears && traits.fears.length > 0) {
            formatted += `- Fears: ${traits.fears.join(', ')}\n`;
        }
        
        if (traits.goals && traits.goals.length > 0) {
            formatted += `- Goals: ${traits.goals.join(', ')}\n`;
        }
        
        if (traits.specialAbilities && traits.specialAbilities.length > 0) {
            formatted += `- Special Abilities: ${traits.specialAbilities.join(', ')}\n`;
        }
        
        return formatted || 'No specific traits identified';
    }
    
    /**
     * Format story history for prompt
     */
    static formatStoryHistory(history) {
        if (!history || history.length === 0) {
            return 'This is the beginning of their adventure.';
        }
        
        const recentHistory = history.slice(-3); // Last 3 choices
        return recentHistory.map(entry => 
            `Turn ${entry.turn}: ${entry.choice}`
        ).join('\n');
    }
    
    /**
     * Format coins for display
     */
    static formatCoins(coins) {
        if (!coins || isNaN(coins)) {
            return '0';
        }
        
        if (coins >= 1000000) {
            return `${(coins / 1000000).toFixed(1)}M`;
        } else if (coins >= 1000) {
            return `${(coins / 1000).toFixed(1)}K`;
        } else {
            return coins.toString();
        }
    }
    
    /**
     * Parse story response from LLM
     */
    static parseStoryResponse(response) {
        if (!response || typeof response !== 'string') {
            return {
                story: 'The story continues...',
                choices: ['Continue exploring', 'Look around', 'Move forward', 'Wait and observe'],
                hasValidFormat: false
            };
        }
        
        const cleanResponse = response.trim();
        const lines = cleanResponse.split('\n');
        let story = '';
        let choices = [];
        let inStorySection = false;
        let inChoicesSection = false;
        let hasValidFormat = false;
        
        // Strategy 1: Look for STORY: and CHOICES: markers
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('STORY:')) {
                inStorySection = true;
                inChoicesSection = false;
                story = trimmedLine.substring(6).trim();
            } else if (trimmedLine.startsWith('CHOICES:')) {
                inStorySection = false;
                inChoicesSection = true;
            } else if (inStorySection) {
                story += ' ' + trimmedLine;
            } else if (inChoicesSection) {
                const choiceMatch = trimmedLine.match(/^\d+\.\s*(.+)$/);
                if (choiceMatch) {
                    choices.push(choiceMatch[1].trim());
                }
            }
        }
        
        // If we found story and choices, validate
        if (story.length > 0 && choices.length >= 2) {
            hasValidFormat = true;
        } else {
            // Strategy 2: Look for numbered choices anywhere in the response
            story = '';
            choices = [];
            let storyLines = [];
            let choiceLines = [];
            let foundChoices = false;
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                
                if (trimmedLine.match(/^\d+\.\s*/)) {
                    foundChoices = true;
                    choiceLines.push(trimmedLine);
                } else if (!foundChoices && trimmedLine.length > 0) {
                    storyLines.push(trimmedLine);
                }
            }
            
            if (storyLines.length > 0 && choiceLines.length >= 2) {
                story = storyLines.join(' ');
                choices = choiceLines.map(line => {
                    return line.replace(/^\d+\.\s*/, '').trim();
                }).filter(choice => choice.length > 0);
                hasValidFormat = true;
            } else {
                // Strategy 3: Look for bullet points or dashes
                story = '';
                choices = [];
                storyLines = [];
                choiceLines = [];
                foundChoices = false;
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    
                    if (trimmedLine.match(/^[-•]\s*/) || trimmedLine.match(/^\d+\.\s*/)) {
                        foundChoices = true;
                        choiceLines.push(trimmedLine);
                    } else if (!foundChoices && trimmedLine.length > 0) {
                        storyLines.push(trimmedLine);
                    }
                }
                
                if (storyLines.length > 0 && choiceLines.length >= 2) {
                    story = storyLines.join(' ');
                    choices = choiceLines.map(line => {
                        return line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
                    }).filter(choice => choice.length > 0);
                    hasValidFormat = true;
                } else {
                    // Fallback: Use entire response as story
                    story = cleanResponse;
                    choices = [
                        'Continue exploring',
                        'Look around carefully',
                        'Move forward cautiously', 
                        'Wait and observe'
                    ];
                    hasValidFormat = true; // Accept any response
                }
            }
        }
        
        // Clean difficulty labels from choices
        choices = choices.map(choice => this.cleanDifficultyLabels(choice));
        
        // Ensure we have exactly 4 choices
        if (choices.length > 4) {
            choices = choices.slice(0, 4);
        } else while (choices.length < 4) {
            choices.push(`Choice ${choices.length + 1}`);
        }
        
        return {
            story: story.trim(),
            choices: choices,
            hasValidFormat: hasValidFormat
        };
    }
    
    /**
     * Clean difficulty labels from choice text
     */
    static cleanDifficultyLabels(choiceText) {
        if (!choiceText) return choiceText;
        
        let cleaned = choiceText;
        
        // Remove common difficulty label patterns
        const patterns = [
            / - (LOW|NORMAL|HIGH) LIKELIHOOD SUCCESS?/gi,
            / - (LOW|NORMAL|HIGH) LIKELIHOOD/gi,
            / \((LOW|NORMAL|HIGH) LIKELIHOOD SUCCESS?\)/gi,
            / \((LOW|NORMAL|HIGH) LIKELIHOOD\)/gi,
            / \[(LOW|NORMAL|HIGH) LIKELIHOOD SUCCESS?\]/gi,
            / \[(LOW|NORMAL|HIGH) LIKELIHOOD\]/gi,
            / - (Low|Normal|High) Likelihood/gi,
            / \((Low|Normal|High) Likelihood\)/gi
        ];
        
        for (const pattern of patterns) {
            cleaned = cleaned.replace(pattern, '');
        }
        
        return cleaned.trim();
    }
    
    /**
     * Generate choice analysis prompt
     */
    static generateChoiceAnalysisPrompt(choice, characterState, storyContext) {
        return `
Analyze this character choice in the context of their adventure:

CHOICE: "${choice}"

CHARACTER STATE:
- Job: ${characterState.currentJob}
- Skill: ${characterState.currentSkill}
- Evil Level: ${characterState.evil}
- Rebirth Count: ${characterState.rebirthCount}

CHARACTER TRAITS:
${this.formatCharacterTraits(storyContext.characterTraits)}

Provide a brief analysis (1-2 sentences) of:
1. What this choice reveals about the character
2. How it aligns with their current traits and situation
3. Potential consequences or implications

Keep the analysis concise and insightful.
        `;
    }
    
    /**
     * Generate continuation prompt with conversation history
     */
    static generateContinuationPromptWithHistory(characterState, storyContext, conversationHistory = '') {
        const context = this.buildStoryContext(characterState, storyContext);
        const genre = storyContext.genre || 'General Fantasy';
        const turns = storyContext.storyTurns || 0;
        const conversationContext = conversationHistory ? `\n\nCONVERSATION HISTORY:\n${conversationHistory}` : '';
        
        return `
You are continuing an interactive ${genre} adventure. The story has progressed ${turns} turns. Based on the character's current state and conversation history, continue the story:

CHARACTER STATE:
- Name: ${this.generateCharacterName(characterState)}
- Age: ${characterState?.age || 25} years old
- Current Job: ${characterState?.currentJob || 'Adventurer'}
- Current Skill: ${characterState?.currentSkill || 'None'}
- Wealth: ${this.formatCoins(characterState?.coins)}
- Evil Level: ${characterState?.evil || 0}
- Rebirth Count: ${characterState?.rebirthCount || 0}

CHARACTER TRAITS:
${this.formatCharacterTraits(storyContext.characterTraits)}

WORLD CONTEXT:
- Location: ${storyContext.worldState?.location || 'unknown'}
- Time of Day: ${storyContext.worldState?.timeOfDay || 'morning'}
- Weather: ${storyContext.worldState?.weather || 'clear'}
- Political Climate: ${storyContext.worldState?.politicalClimate || 'stable'}
- Magical Level: ${storyContext.worldState?.magicalLevel || 'moderate'}
- Danger Level: ${storyContext.worldState?.dangerLevel || 'low'}

STORY PROGRESSION:
- Story Turns: ${turns}
- Last Choice: ${storyContext.lastChoice || 'None'}

${conversationContext}

TASK:
Continue the story from where it left off. Generate a vivid, immersive description of what happens next (2-3 paragraphs).
Then, provide exactly 4 distinct choices the character can make.

IMPORTANT: Format your response EXACTLY like this:

STORY: [Your narrative here - 2-3 paragraphs describing what happens next]

CHOICES:
1. [First choice - aggressive/confrontational option]
2. [Second choice - cautious/stealthy option]  
3. [Third choice - diplomatic/negotiation option]
4. [Fourth choice - creative/unconventional option]

Ensure the narrative and choices are consistent with the character's traits, current situation, and the conversation history.
        `;
    }
}

// Export for both CommonJS and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryPromptGenerator;
}
if (typeof window !== 'undefined') {
    window.StoryPromptGenerator = StoryPromptGenerator;
}
