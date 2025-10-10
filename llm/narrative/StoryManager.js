/**
 * StoryManager - Manages narrative context and story progression
 * Inspired by the ai-text-adventure repository structure
 */

class StoryManager {
    constructor(gameManager = null) {
        // Set up logging
        if (typeof log !== 'undefined' && log.noConflict) {
            this.logger = log.noConflict();
        } else if (typeof log !== 'undefined') {
            this.logger = log;
        } else {
            // Fallback to console if loglevel is not available
            this.logger = {
                debug: console.debug,
                info: console.info,
                warn: console.warn,
                error: console.error,
                setLevel: function() {}
            };
        }
        this.logger.setLevel('warn'); // Only show warnings and errors in production
        
        // Reference to game manager for hybrid state management
        this.gameManager = gameManager;
        
        this.storyContext = {
            currentStory: null,
            storyHistory: [],
            conversationHistory: [], // Full conversation for context
            characterTraits: {},
            storyTurns: 0,
            lastChoice: null,
            storyGenre: null,
            worldState: {},
            maxContextLength: 3000 // Limit context to prevent token overflow
        };
        
        this.initializeStory();
    }
    
    /**
     * Initialize a new story session
     */
    initializeStory() {
        this.storyContext = {
            currentStory: null,
            storyHistory: [],
            conversationHistory: [], // Full conversation for context
            characterTraits: {},
            storyTurns: 0,
            lastChoice: null,
            storyGenre: null,
            worldState: {},
            maxContextLength: 3000 // Limit context to prevent token overflow
        };
    }
    
    /**
     * Start a new story based on character state
     */
    startNewStory(characterState) {
        this.initializeStory();
        this.storyContext.storyGenre = this.determineGenre(characterState);
        this.storyContext.characterTraits = this.extractCharacterTraits(characterState);
        this.storyContext.worldState = this.createInitialWorldState(characterState);
        
        // Generate and store character name persistently
        this.storyContext.characterName = this.generateCharacterName(characterState);
        
        // Generate difficulty coefficients for the first set of choices
        this.storyContext.currentDifficultyCoefficients = this.generateDifficultyCoefficients();
        
        return {
            genre: this.storyContext.storyGenre,
            characterTraits: this.storyContext.characterTraits,
            worldState: this.storyContext.worldState,
            characterName: this.storyContext.characterName,
            difficultyCoefficients: this.storyContext.currentDifficultyCoefficients
        };
    }
    
    /**
     * Generate a consistent character name based on character state
     */
    generateCharacterName(characterState) {
        if (!characterState) {
            return 'Adventurer';
        }
        
        const { currentJob = '', evil = 0, rebirthCount = 0 } = characterState;
        
        const names = {
            knight: ['Marcus', 'Thorin', 'Roland', 'Arthur', 'Cedric'],
            mage: ['Aldric', 'Merlin', 'Elara', 'Zephyr', 'Cassius'],
            thief: ['Raven', 'Shadow', 'Quinn', 'Finn', 'Sable'],
            beggar: ['Dust', 'Ash', 'Rags', 'Ember', 'Cinder'],
            evil: ['Malakar', 'Morgrath', 'Dravon', 'Nyx', 'Vex'],
            reborn: ['Aetherius', 'Chronos', 'Phoenix', 'Lazarus', 'Eternal']
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
     * Continue existing story with new choice
     */
    continueStory(choice, characterState) {
        this.storyContext.lastChoice = choice;
        this.storyContext.storyTurns++;
        
        // Update character traits based on choice and character development
        this.updateCharacterTraits(choice, characterState);
        
        // Add to story history
        this.storyContext.storyHistory.push({
            turn: this.storyContext.storyTurns,
            choice: choice,
            characterState: this.snapshotCharacterState(characterState),
            timestamp: Date.now()
        });
        
        // Add to conversation history for context
        this.addToConversationHistory('user', choice);
        
        // Generate new difficulty coefficients for next set of choices
        this.storyContext.currentDifficultyCoefficients = this.generateDifficultyCoefficients();
        
        return {
            storyTurns: this.storyContext.storyTurns,
            lastChoice: choice,
            characterTraits: this.storyContext.characterTraits,
            storyHistory: this.storyContext.storyHistory,
            conversationHistory: this.getConversationContext(),
            difficultyCoefficients: this.storyContext.currentDifficultyCoefficients
        };
    }
    
    /**
     * Generate difficulty coefficients for each choice slot
     * Each choice has a 50% chance of being "low likelihood" (0.5) or "normal" (1.0)
     */
    generateDifficultyCoefficients() {
        return [
            Math.random() < 0.5 ? 0.5 : 1.0,  // Choice 1
            Math.random() < 0.5 ? 0.5 : 1.0,  // Choice 2
            Math.random() < 0.5 ? 0.5 : 1.0,  // Choice 3
            Math.random() < 0.5 ? 0.5 : 1.0   // Choice 4
        ];
    }
    
    /**
     * Get difficulty labels for prompt generation
     */
    getDifficultyLabels() {
        if (!this.storyContext.currentDifficultyCoefficients) {
            this.storyContext.currentDifficultyCoefficients = this.generateDifficultyCoefficients();
        }
        
        return this.storyContext.currentDifficultyCoefficients.map(coef => 
            coef === 0.5 ? 'LOW LIKELIHOOD' : 'NORMAL LIKELIHOOD'
        );
    }
    
    /**
     * Get current story context for LLM
     */
    getStoryContext() {
        return {
            ...this.storyContext,
            hasActiveStory: this.storyContext.currentStory !== null,
            storyLength: this.storyContext.storyHistory.length
        };
    }
    
    /**
     * Determine story genre based on character state
     */
    determineGenre(characterState) {
        if (!characterState) {
            return 'General Fantasy';
        }
        
        const { currentJob = '', evil = 0, rebirthCount = 0, age = 25 } = characterState;
        
        // High evil characters get darker genres
        if (evil > 50) {
            return rebirthCount > 0 ? 'Dark Fantasy' : 'Gothic Horror';
        }
        
        // Reborn characters get more mystical genres
        if (rebirthCount > 0) {
            return 'High Fantasy';
        }
        
        // Job-based genres
        if (currentJob && (currentJob.includes('Knight') || currentJob.includes('Warrior'))) {
            return 'Medieval Fantasy';
        }
        
        if (currentJob && (currentJob.includes('Mage') || currentJob.includes('Wizard'))) {
            return 'Magical Fantasy';
        }
        
        if (currentJob && (currentJob.includes('Thief') || currentJob.includes('Rogue'))) {
            return 'Urban Fantasy';
        }
        
        // Age-based genres
        if (age < 20) {
            return 'Young Adult Fantasy';
        }
        
        if (age > 60) {
            return 'Sage Fantasy';
        }
        
        return 'General Fantasy';
    }
    
    /**
     * Extract character traits from game state
     */
    extractCharacterTraits(characterState) {
        if (!characterState) {
            return {
                age: 25,
                wealth: 0,
                evil: 0,
                rebirths: 0,
                personality: ['curious'],
                motivations: ['survival'],
                fears: ['unknown'],
                goals: ['discovery'],
                primarySkills: [],
                specialAbilities: [],
                currentSituation: 'seeking their place in the world'
            };
        }
        
        const traits = {
            // Basic traits
            age: characterState.age || 25,
            wealth: characterState.coins || 0,
            evil: characterState.evil || 0,
            rebirths: characterState.rebirthCount || 0,
            
            // Personality traits based on game state
            personality: this.determinePersonality(characterState),
            motivations: this.determineMotivations(characterState),
            fears: this.determineFears(characterState),
            goals: this.determineGoals(characterState),
            
            // Skills and abilities
            primarySkills: this.getPrimarySkills(characterState),
            specialAbilities: this.getSpecialAbilities(characterState),
            
            // Current situation
            currentSituation: this.getCurrentSituation(characterState)
        };
        
        return traits;
    }
    
    /**
     * Determine personality based on character state
     */
    determinePersonality(characterState) {
        if (!characterState) {
            return ['curious', 'adventurous'];
        }
        
        const { evil = 0, rebirthCount = 0, currentJob = '', coins = 0 } = characterState;
        
        let personality = [];
        
        // Evil-based traits
        if (evil > 70) {
            personality.push('malevolent', 'calculating', 'ruthless');
        } else if (evil > 30) {
            personality.push('morally ambiguous', 'pragmatic');
        } else {
            personality.push('virtuous', 'compassionate');
        }
        
        // Rebirth-based traits
        if (rebirthCount > 2) {
            personality.push('ancient', 'wise', 'patient');
        } else if (rebirthCount > 0) {
            personality.push('experienced', 'determined');
        } else {
            personality.push('young', 'eager', 'curious');
        }
        
        // Job-based traits
        if (currentJob && currentJob.includes('Knight')) {
            personality.push('honorable', 'brave', 'loyal');
        } else if (currentJob && currentJob.includes('Mage')) {
            personality.push('intellectual', 'mysterious', 'powerful');
        } else if (currentJob && currentJob.includes('Thief')) {
            personality.push('clever', 'resourceful', 'independent');
        } else if (currentJob === 'Beggar') {
            personality.push('resilient', 'humble', 'survivor');
        }
        
        // Wealth-based traits
        if (coins > 100000) {
            personality.push('influential', 'confident');
        } else if (coins < 1000) {
            personality.push('struggling', 'determined');
        }
        
        return personality;
    }
    
    /**
     * Determine character motivations
     */
    determineMotivations(characterState) {
        const { evil, rebirthCount, currentJob, coins } = characterState;
        const motivations = [];
        
        if (evil > 50) {
            motivations.push('seeking power', 'domination', 'revenge');
        } else {
            motivations.push('protecting others', 'seeking knowledge', 'helping the innocent');
        }
        
        if (rebirthCount > 0) {
            motivations.push('breaking the cycle', 'transcending mortality');
        }
        
        if (currentJob === 'Beggar' && coins < 1000) {
            motivations.push('survival', 'finding purpose');
        }
        
        if (coins > 100000) {
            motivations.push('maintaining wealth', 'influence');
        }
        
        return motivations;
    }
    
    /**
     * Determine character fears
     */
    determineFears(characterState) {
        const { evil, rebirthCount, age } = characterState;
        const fears = [];
        
        if (rebirthCount > 0) {
            fears.push('eternal repetition', 'being trapped in cycles');
        }
        
        if (evil > 70) {
            fears.push('redemption', 'being forgotten');
        } else {
            fears.push('corruption', 'losing innocence');
        }
        
        if (age > 50) {
            fears.push('time running out', 'legacy');
        }
        
        return fears;
    }
    
    /**
     * Determine character goals
     */
    determineGoals(characterState) {
        const { evil, rebirthCount, currentJob } = characterState;
        const goals = [];
        
        if (rebirthCount > 0) {
            goals.push('transcending the cycle', 'achieving true freedom');
        }
        
        if (evil > 50) {
            goals.push('ultimate power', 'world domination');
        } else {
            goals.push('protecting the realm', 'bringing peace');
        }
        
        if (currentJob === 'Beggar') {
            goals.push('finding purpose', 'making a difference');
        }
        
        return goals;
    }
    
    /**
     * Get primary skills from character state
     */
    getPrimarySkills(characterState) {
        if (!characterState || !characterState.skills || !Array.isArray(characterState.skills)) {
            return [];
        }
        
        return characterState.skills
            .filter(skill => skill && skill.level > 10)
            .map(skill => ({
                name: skill.name || 'Unknown',
                level: skill.level || 0,
                description: skill.description || 'No description'
            }));
    }
    
    /**
     * Get special abilities based on character state
     */
    getSpecialAbilities(characterState) {
        if (!characterState) {
            return [];
        }
        
        const abilities = [];
        const { evil = 0, rebirthCount = 0, currentJob = '' } = characterState;
        
        if (evil > 50) {
            abilities.push('dark magic', 'corruption', 'fear manipulation');
        }
        
        if (rebirthCount > 0) {
            abilities.push('ancient knowledge', 'time manipulation', 'soul memory');
        }
        
        if (currentJob && currentJob.includes('Mage')) {
            abilities.push('arcane mastery', 'spell weaving', 'mana manipulation');
        }
        
        if (currentJob && currentJob.includes('Knight')) {
            abilities.push('combat mastery', 'leadership', 'tactical genius');
        }
        
        return abilities;
    }
    
    /**
     * Get current situation description
     */
    getCurrentSituation(characterState) {
        if (!characterState) {
            return 'seeking their place in the world';
        }
        
        const { currentJob = '', currentSkill = '', coins = 0, age = 25 } = characterState;
        
        if (currentJob === 'Beggar') {
            return 'struggling to survive on the streets';
        } else if (currentJob && currentJob.includes('Knight')) {
            return 'serving in military capacity';
        } else if (currentJob && currentJob.includes('Mage')) {
            return 'studying the arcane arts';
        } else {
            return 'seeking their place in the world';
        }
    }
    
    /**
     * Create initial world state
     */
    createInitialWorldState(characterState) {
        return {
            location: this.determineStartingLocation(characterState),
            timeOfDay: 'morning',
            weather: 'clear',
            politicalClimate: this.determinePoliticalClimate(characterState),
            magicalLevel: this.determineMagicalLevel(characterState),
            dangerLevel: this.determineDangerLevel(characterState)
        };
    }
    
    /**
     * Determine starting location based on character
     */
    determineStartingLocation(characterState) {
        if (!characterState) {
            return 'a mysterious location';
        }
        
        const { currentJob = '', evil = 0, rebirthCount = 0 } = characterState;
        
        if (currentJob === 'Beggar') {
            return 'the slums of a bustling city';
        } else if (currentJob && currentJob.includes('Knight')) {
            return 'a military outpost';
        } else if (currentJob && currentJob.includes('Mage')) {
            return 'an arcane academy';
        } else if (evil > 70) {
            return 'the shadowy underworld';
        } else if (rebirthCount > 0) {
            return 'an ancient, mystical location';
        } else {
            return 'a peaceful village';
        }
    }
    
    /**
     * Determine political climate
     */
    determinePoliticalClimate(characterState) {
        if (!characterState) {
            return 'stable';
        }
        
        const { evil = 0, rebirthCount = 0 } = characterState;
        
        if (evil > 70) {
            return 'chaotic and corrupt';
        } else if (rebirthCount > 0) {
            return 'ancient and mysterious';
        } else {
            return 'stable but changing';
        }
    }
    
    /**
     * Determine magical level
     */
    determineMagicalLevel(characterState) {
        if (!characterState) {
            return 'low';
        }
        
        const { currentJob = '', rebirthCount = 0 } = characterState;
        
        if ((currentJob && currentJob.includes('Mage')) || rebirthCount > 0) {
            return 'high';
        } else {
            return 'moderate';
        }
    }
    
    /**
     * Determine danger level
     */
    determineDangerLevel(characterState) {
        if (!characterState) {
            return 'low';
        }
        
        const { evil = 0, rebirthCount = 0, age = 25 } = characterState;
        
        if (evil > 70 || rebirthCount > 2) {
            return 'extreme';
        } else if (age > 50 || rebirthCount > 0) {
            return 'moderate';
        } else {
            return 'low';
        }
    }
    
    /**
     * Update character traits based on choice
     */
    updateCharacterTraits(choice, characterState) {
        // Analyze choice for trait changes
        if (choice.toLowerCase().includes('fight') || choice.toLowerCase().includes('attack')) {
            this.storyContext.characterTraits.aggression = (this.storyContext.characterTraits.aggression || 0) + 1;
        }
        
        if (choice.toLowerCase().includes('help') || choice.toLowerCase().includes('save')) {
            this.storyContext.characterTraits.compassion = (this.storyContext.characterTraits.compassion || 0) + 1;
        }
        
        if (choice.toLowerCase().includes('magic') || choice.toLowerCase().includes('spell')) {
            this.storyContext.characterTraits.magicalAffinity = (this.storyContext.characterTraits.magicalAffinity || 0) + 1;
        }
        
        // Update world state based on choice
        this.updateWorldState(choice);
    }
    
    /**
     * Update world state based on choice
     */
    updateWorldState(choice) {
        // Simple world state updates based on choices
        if (choice.toLowerCase().includes('time')) {
            this.storyContext.worldState.timeOfDay = this.advanceTime();
        }
        
        if (choice.toLowerCase().includes('weather')) {
            this.storyContext.worldState.weather = this.changeWeather();
        }
    }
    
    /**
     * Advance time in the story
     */
    advanceTime() {
        const times = ['morning', 'afternoon', 'evening', 'night'];
        const currentIndex = times.indexOf(this.storyContext.worldState.timeOfDay);
        return times[(currentIndex + 1) % times.length];
    }
    
    /**
     * Change weather
     */
    changeWeather() {
        const weathers = ['clear', 'cloudy', 'rainy', 'stormy', 'foggy'];
        return weathers[Math.floor(Math.random() * weathers.length)];
    }
    
    /**
     * Take snapshot of character state
     */
    snapshotCharacterState(characterState) {
        return {
            age: characterState.age,
            coins: characterState.coins,
            evil: characterState.evil,
            currentJob: characterState.currentJob,
            currentSkill: characterState.currentSkill,
            timestamp: Date.now()
        };
    }
    
    /**
     * Add message to conversation history
     */
    addToConversationHistory(role, content) {
        this.storyContext.conversationHistory.push({
            role: role,
            content: content,
            timestamp: Date.now()
        });
        
        // Trim conversation if it gets too long
        this.trimConversationHistory();
    }
    
    /**
     * Get conversation context for LLM
     */
    getConversationContext() {
        // Return recent conversation history, limited by maxContextLength
        let context = '';
        let currentLength = 0;
        
        // Start from most recent and work backwards
        for (let i = this.storyContext.conversationHistory.length - 1; i >= 0; i--) {
            const message = this.storyContext.conversationHistory[i];
            const messageText = `${message.role}: ${message.content}\n`;
            
            if (currentLength + messageText.length > this.storyContext.maxContextLength) {
                break;
            }
            
            context = messageText + context;
            currentLength += messageText.length;
        }
        
        return context;
    }
    
    /**
     * Get conversation history as message array (for API calls)
     */
    getMessagesForAPI() {
        // Return conversation history in Mistral/OpenAI format
        return this.storyContext.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }
    
    /**
     * Get system message with character context
     */
    getSystemMessage() {
        const characterName = this.storyContext.characterName || 'Adventurer';
        const genre = this.storyContext.storyGenre || 'Fantasy';
        
        return `You are a master storyteller creating an interactive ${genre} adventure. The protagonist is named ${characterName}. 

IMPORTANT RULES:
1. ALWAYS refer to the protagonist as "${characterName}" - never change their name
2. Maintain consistency with previous story events and choices
3. Format your response EXACTLY as:
   STORY: [2-3 paragraphs of narrative]
   
   CHOICES:
   1. [Aggressive/confrontational option]
   2. [Cautious/stealthy option]
   3. [Diplomatic/negotiation option]
   4. [Creative/unconventional option]

4. ALWAYS provide exactly 4 distinct, detailed choices
5. Each choice should be a complete sentence describing what ${characterName} does
6. Maintain the character's personality and the world's continuity`;
    }
    
    /**
     * Trim conversation history to prevent token overflow
     */
    trimConversationHistory() {
        if (this.storyContext.conversationHistory.length > 20) {
            // Keep the most recent 15 messages
            this.storyContext.conversationHistory = this.storyContext.conversationHistory.slice(-15);
        }
    }
    
    /**
     * Add story response to conversation history
     */
    addStoryResponse(storyText, choices) {
        const response = `Story: ${storyText}\n\nChoices:\n${choices.map((choice, index) => `${index + 1}. ${choice}`).join('\n')}`;
        this.addToConversationHistory('assistant', response);
    }
    
    /**
     * Calculate success chance for a choice based on character state and story context
     */
    calculateSuccessChance(choice, characterState, currentStory, choiceIndex = null) {
        // Base success chance starts at 50%
        let successChance = 50;
        
        // Get choice-specific difficulty coefficient if available
        let choiceDifficultyCoef = 1.0;
        if (choiceIndex !== null && this.storyContext.currentDifficultyCoefficients) {
            choiceDifficultyCoef = this.storyContext.currentDifficultyCoefficients[choiceIndex] || 1.0;
        }
        
        // Analyze choice type
        const isAggressive = choice.toLowerCase().includes('attack') || 
                            choice.toLowerCase().includes('fight') || 
                            choice.toLowerCase().includes('charge') ||
                            choice.toLowerCase().includes('confront');
        
        const isCautious = choice.toLowerCase().includes('stealth') || 
                          choice.toLowerCase().includes('retreat') || 
                          choice.toLowerCase().includes('hide') ||
                          choice.toLowerCase().includes('careful');
        
        const isDiplomatic = choice.toLowerCase().includes('talk') || 
                            choice.toLowerCase().includes('negotiate') || 
                            choice.toLowerCase().includes('reason') ||
                            choice.toLowerCase().includes('persuade');
        
        const isCreative = !isAggressive && !isCautious && !isDiplomatic;
        
        // Analyze difficulty from the story
        const difficultyMultiplier = this.analyzeDifficulty(currentStory);
        
        // Adjust based on character stats
        if (characterState) {
            // Skill-based modifiers (PRIMARY)
            if (characterState.skills && Array.isArray(characterState.skills)) {
                // Aggressive actions: Strength, Combat, Fighting
                if (isAggressive) {
                    const strength = this.getSkillLevel(characterState.skills, 'strength');
                    const combat = this.getSkillLevel(characterState.skills, 'combat');
                    successChance += Math.floor((strength + combat) / 20); // +1% per 20 skill levels
                }
                
                // Cautious actions: Productivity, Concentration, Dexterity
                if (isCautious) {
                    const productivity = this.getSkillLevel(characterState.skills, 'productivity');
                    const concentration = this.getSkillLevel(characterState.skills, 'concentration');
                    successChance += Math.floor((productivity + concentration) / 20);
                }
                
                // Diplomatic actions: Charisma, Bargaining, Concentration
                if (isDiplomatic) {
                    const bargaining = this.getSkillLevel(characterState.skills, 'bargaining');
                    const concentration = this.getSkillLevel(characterState.skills, 'concentration');
                    successChance += Math.floor((bargaining + concentration) / 20);
                }
                
                // Creative actions: Intelligence, Concentration, Magic
                if (isCreative) {
                    const concentration = this.getSkillLevel(characterState.skills, 'concentration');
                    const magic = this.getSkillLevel(characterState.skills, 'magic');
                    successChance += Math.floor((concentration + magic) / 20);
                }
            }
            
            // Age factor (experience)
            if (characterState.age > 40) successChance += 5;
            if (characterState.age > 60) successChance += 5;
            
            // Rebirth factor (powerful characters)
            successChance += characterState.rebirthCount * 10;
            
            // Wealth factor (resources)
            if (characterState.coins > 100000) successChance += 10;
            else if (characterState.coins > 10000) successChance += 5;
            
            // Evil factor (ruthlessness for aggressive actions)
            if (isAggressive && characterState.evil > 50) {
                successChance += 10;
            }
            
            // Job-based modifiers
            const job = characterState.currentJob || '';
            if (isAggressive && (job.includes('Knight') || job.includes('Warrior'))) {
                successChance += 15;
            }
            if (isDiplomatic && job.includes('Noble')) {
                successChance += 15;
            }
            if (isCautious && job.includes('Thief')) {
                successChance += 15;
            }
            if (isCreative && job.includes('Mage')) {
                successChance += 15;
            }
        }
        
        // Apply difficulty multiplier from story context
        successChance = Math.round(successChance * difficultyMultiplier);
        
        // Apply choice-specific difficulty coefficient (0.5 for low likelihood, 1.0 for normal)
        successChance = Math.round(successChance * choiceDifficultyCoef);
        
        // Clamp between 5% and 95%
        return Math.max(5, Math.min(95, successChance));
    }
    
    /**
     * Analyze difficulty from story text
     */
    analyzeDifficulty(storyText) {
        if (!storyText) return 1.0;
        
        const lowerStory = storyText.toLowerCase();
        let difficulty = 1.0;
        
        // Look for numbers indicating enemy count
        const largeNumberMatch = lowerStory.match(/(\d+)\s+(bandits|enemies|soldiers|guards|men)/);
        if (largeNumberMatch) {
            const count = parseInt(largeNumberMatch[1]);
            if (count > 50) difficulty *= 0.5;
            else if (count > 20) difficulty *= 0.7;
            else if (count > 10) difficulty *= 0.85;
        }
        
        // Look for power indicators
        if (lowerStory.includes('powerful') || lowerStory.includes('mighty')) difficulty *= 0.8;
        if (lowerStory.includes('ancient') || lowerStory.includes('legendary')) difficulty *= 0.7;
        if (lowerStory.includes('overwhelming') || lowerStory.includes('impossible')) difficulty *= 0.5;
        
        // Look for advantage indicators
        if (lowerStory.includes('weak') || lowerStory.includes('exhausted')) difficulty *= 1.2;
        if (lowerStory.includes('outnumbered') || lowerStory.includes('surrounded')) difficulty *= 0.8;
        
        return difficulty;
    }
    
    /**
     * Get skill level by name from character skills
     */
    getSkillLevel(skills, skillName) {
        const skill = skills.find(s => 
            s && s.name && s.name.toLowerCase().includes(skillName.toLowerCase())
        );
        return skill ? (skill.level || 0) : 0;
    }
    
    /**
     * Roll for success/failure
     */
    rollForSuccess(successChance) {
        const roll = Math.random() * 100;
        const success = roll <= successChance; // Changed < to <= for proper threshold
        
        this.logger.debug(`Roll Debug: rolled ${roll.toFixed(2)}, needed ${successChance}, success: ${success}`);
        
        return {
            success: success,
            roll: parseFloat(roll.toFixed(1)), // Keep one decimal for display
            needed: successChance
        };
    }
    
    /**
     * Get story summary for display
     */
    getStorySummary() {
        return {
            turns: this.storyContext.storyTurns,
            genre: this.storyContext.storyGenre,
            lastChoice: this.storyContext.lastChoice,
            characterTraits: this.storyContext.characterTraits,
            worldState: this.storyContext.worldState,
            hasActiveStory: this.storyContext.currentStory !== null,
            conversationLength: this.storyContext.conversationHistory.length
        };
    }
    
    /**
     * Process story choice through hybrid state management
     * @param {string} choice - The player's choice
     * @param {Object} characterState - Current character state
     * @returns {Promise<Object>} Processing result
     */
    async processStoryChoice(choice, characterState) {
        if (!this.gameManager) {
            this.logger.warn('Game manager not available for hybrid state management');
            return this.continueStory(choice, characterState);
        }
        
        try {
            // Classify the choice as an action
            const action = this.classifyChoiceAsAction(choice, characterState);
            
            // Process through hybrid state management
            const result = await this.gameManager.processAction(action, {
                storyContext: this.getStoryContext(),
                characterState: characterState,
                choice: choice
            });
            
            // Update story context based on result
            this.updateStoryFromResult(result, choice);
            
            return {
                success: result.success,
                storyContext: this.getStoryContext(),
                stateChanges: result.stateDiff,
                validation: result.validationReport,
                metrics: result.metrics
            };
            
        } catch (error) {
            this.logger.error('Error processing story choice through hybrid state management:', error);
            // Fallback to original method
            return this.continueStory(choice, characterState);
        }
    }
    
    /**
     * Classify a story choice as a game action
     * @param {string} choice - The player's choice
     * @param {Object} characterState - Current character state
     * @returns {Object} Classified action
     */
    classifyChoiceAsAction(choice, characterState) {
        const lowerChoice = choice.toLowerCase();
        
        // Combat actions
        if (lowerChoice.includes('attack') || lowerChoice.includes('fight') || lowerChoice.includes('combat')) {
            return {
                type: 'combat',
                action: 'attack',
                playerChoice: choice,
                weapon: this.determineWeapon(characterState),
                skill: 'Strength',
                level: this.getSkillLevel(characterState, 'Strength')
            };
        }
        
        // Dialogue actions
        if (lowerChoice.includes('talk') || lowerChoice.includes('negotiate') || lowerChoice.includes('persuade')) {
            return {
                type: 'dialogue',
                action: 'bargain',
                playerChoice: choice,
                skill: 'Charisma',
                level: this.getSkillLevel(characterState, 'Charisma')
            };
        }
        
        // Magic actions
        if (lowerChoice.includes('spell') || lowerChoice.includes('magic') || lowerChoice.includes('cast')) {
            return {
                type: 'magic',
                action: 'cast_spell',
                playerChoice: choice,
                spell: this.determineSpell(choice),
                skill: 'Magic',
                level: this.getSkillLevel(characterState, 'Magic')
            };
        }
        
        // Skill check actions
        if (lowerChoice.includes('climb') || lowerChoice.includes('jump') || lowerChoice.includes('stealth')) {
            return {
                type: 'skill_check',
                skill: this.determineSkill(choice),
                difficulty: this.determineDifficulty(choice),
                playerChoice: choice,
                level: this.getSkillLevel(characterState, this.determineSkill(choice))
            };
        }
        
        // Default to exploration
        return {
            type: 'exploration',
            action: 'explore',
            playerChoice: choice,
            skill: 'Dexterity',
            level: this.getSkillLevel(characterState, 'Dexterity')
        };
    }
    
    /**
     * Determine weapon from character state
     * @param {Object} characterState - Character state
     * @returns {string} Weapon type
     */
    determineWeapon(characterState) {
        const job = characterState.currentJob || '';
        
        if (job.includes('Knight') || job.includes('Warrior')) {
            return 'sword';
        } else if (job.includes('Mage')) {
            return 'staff';
        } else if (job.includes('Thief')) {
            return 'dagger';
        } else {
            return 'fists';
        }
    }
    
    /**
     * Determine spell from choice
     * @param {string} choice - Player choice
     * @returns {string} Spell type
     */
    determineSpell(choice) {
        const lowerChoice = choice.toLowerCase();
        
        if (lowerChoice.includes('heal')) return 'healing';
        if (lowerChoice.includes('fire')) return 'damage';
        if (lowerChoice.includes('light')) return 'utility';
        if (lowerChoice.includes('shield')) return 'buff';
        
        return 'healing'; // Default
    }
    
    /**
     * Determine skill from choice
     * @param {string} choice - Player choice
     * @returns {string} Skill name
     */
    determineSkill(choice) {
        const lowerChoice = choice.toLowerCase();
        
        if (lowerChoice.includes('climb')) return 'Strength';
        if (lowerChoice.includes('jump')) return 'Dexterity';
        if (lowerChoice.includes('stealth')) return 'Dexterity';
        if (lowerChoice.includes('magic')) return 'Magic';
        if (lowerChoice.includes('talk')) return 'Charisma';
        
        return 'Dexterity'; // Default
    }
    
    /**
     * Determine difficulty from choice
     * @param {string} choice - Player choice
     * @returns {number} Difficulty level
     */
    determineDifficulty(choice) {
        const lowerChoice = choice.toLowerCase();
        
        if (lowerChoice.includes('difficult') || lowerChoice.includes('challenging')) return 15;
        if (lowerChoice.includes('easy') || lowerChoice.includes('simple')) return 5;
        
        return 10; // Default
    }
    
    /**
     * Get skill level from character state
     * @param {Object} characterState - Character state
     * @param {string} skillName - Skill name
     * @returns {number} Skill level
     */
    getSkillLevel(characterState, skillName) {
        if (!characterState.skills || !Array.isArray(characterState.skills)) {
            return 0;
        }
        
        const skill = characterState.skills.find(s => 
            s && s.name && s.name.toLowerCase().includes(skillName.toLowerCase())
        );
        
        return skill ? (skill.level || 0) : 0;
    }
    
    /**
     * Update story context from hybrid state management result
     * @param {Object} result - Hybrid state management result
     * @param {string} choice - Player choice
     */
    updateStoryFromResult(result, choice) {
        // Update story context based on the result
        if (result.stateDiff) {
            // Track state changes in story context
            this.storyContext.worldState = {
                ...this.storyContext.worldState,
                lastStateChange: result.stateDiff,
                timestamp: Date.now()
            };
        }
        
        if (result.validation && result.validation.issues) {
            // Log validation issues
            this.logger.warn('Story choice validation issues:', result.validation.issues);
        }
        
        // Update character traits based on choice success
        if (result.result && result.result.success !== undefined) {
            this.updateCharacterTraits(choice, result.result.success);
        }
    }
    
    /**
     * Get enhanced story context with hybrid state management data
     * @returns {Object} Enhanced story context
     */
    getEnhancedStoryContext() {
        const baseContext = this.getStoryContext();
        
        if (this.gameManager) {
            try {
                const systemMetrics = this.gameManager.getSystemMetrics();
                const stateDifferences = this.gameManager.getStateDifferences();
                const validationReport = this.gameManager.validateCurrentState();
                
                return {
                    ...baseContext,
                    hybridStateManagement: {
                        metrics: systemMetrics,
                        stateDifferences: stateDifferences,
                        validationReport: validationReport,
                        available: true
                    }
                };
            } catch (error) {
                this.logger.warn('Could not get hybrid state management data:', error);
                return {
                    ...baseContext,
                    hybridStateManagement: {
                        available: false,
                        error: error.message
                    }
                };
            }
        }
        
        return {
            ...baseContext,
            hybridStateManagement: {
                available: false,
                reason: 'Game manager not available'
            }
        };
    }
}

// Export for both CommonJS and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryManager;
}
if (typeof window !== 'undefined') {
    window.StoryManager = StoryManager;
}
