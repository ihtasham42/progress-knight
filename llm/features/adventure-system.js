/**
 * Adventure System - Unified adventure management
 * Consolidates: CareerBasedStoryAdventureUI, CareerBasedAdventureIntegration, StoryAdventureManager
 * 
 * This single file handles:
 * - UI rendering and user interactions
 * - Adventure lifecycle (start/pause/end)
 * - Career-based story generation
 * - Reward calculation and application
 */

class AdventureSystem {
    constructor(gameState, mistralAPI, storyManager) {
        // Logging setup
        if (typeof log !== 'undefined' && log.noConflict) {
            this.logger = log.noConflict();
        } else {
            this.logger = {
                debug: console.debug,
                info: console.info,
                warn: console.warn,
                error: console.error,
                setLevel: function() {}
            };
        }
        this.logger.setLevel('warn');
        
        // Core dependencies
        this.gameState = gameState;
        this.mistralAPI = mistralAPI;
        this.storyManager = storyManager;
        
        // Initialize components
        this.careerAnalyzer = new CareerAnalyzer(gameState);
        this.storyTreeManager = new StoryTreeManager();
        this.storyTreeBuilder = new StoryTreeBuilder(this.storyTreeManager, this.careerAnalyzer);
        this.promptGenerator = new CareerBasedPromptGenerator(this.careerAnalyzer, this.storyTreeBuilder);
        
        // Adventure state
        this.adventureActive = false;
        this.currentAdventure = null;
        this.currentStory = null;
        this.currentChoices = [];
        this.currentStoryContinuation = null;
        
        // Stats tracking
        this.successCount = 0;
        this.failureCount = 0;
        this.turnCount = 0;
        this.choiceTypes = { aggressive: 0, diplomatic: 0, cautious: 0, creative: 0 };
        this.choiceHistory = [];
        
        // Amulet triggers
        this.amuletTriggers = { 25: 'age25', 45: 'age45', 65: 'age65', 200: 'age200' };
        this.lastTriggeredAge = null;
        
        this.logger.debug('AdventureSystem initialized');
    }

    // ============= ADVENTURE LIFECYCLE =============
    
    isAdventureActive() {
        return this.adventureActive;
    }
    
    canUnpauseGame() {
        // Can only unpause if no adventure is active
        return !this.adventureActive;
    }
    
    getSuccessCount() {
        return this.successCount;
    }
    
    getFailureCount() {
        return this.failureCount;
    }
    
    getTurnCount() {
        return this.turnCount;
    }
    
    trackChoiceResult(isSuccess, choiceType) {
        this.turnCount++;
        if (isSuccess) {
            this.successCount++;
        } else {
            this.failureCount++;
        }
        if (choiceType && this.choiceTypes[choiceType] !== undefined) {
            this.choiceTypes[choiceType]++;
        }
        this.choiceHistory.push({
            success: isSuccess,
            type: choiceType,
            timestamp: Date.now()
        });
    }
    
    startAdventure() {
        if (this.adventureActive) {
            throw new Error('Adventure already in progress');
        }
        
        this.resetAdventureState();
        this.adventureActive = true;
        
        // Pause the game - gameData is a plain object, just set paused directly
        this.gameState.paused = true;
        
        this.logger.debug('Adventure started, game paused');
    }
    
    endAdventure() {
        if (!this.adventureActive) {
            return;
        }
        
        this.adventureActive = false;
        this.currentAdventure = null;
        this.currentStory = null;
        this.currentChoices = [];
        this.currentStoryContinuation = null;
        
        // Reset stats
        this.resetAdventureState();
        
        // Unpause the game - gameData is a plain object, just set paused directly
        this.gameState.paused = false;
        
        // Restore adventure button visibility
        if (typeof updateAmuletAdventureAvailability === 'function') {
            updateAmuletAdventureAvailability();
        }
        
        this.logger.debug('Adventure ended, game unpaused');
    }
    
    resetAdventureState() {
        this.successCount = 0;
        this.failureCount = 0;
        this.turnCount = 0;
        this.choiceTypes = { aggressive: 0, diplomatic: 0, cautious: 0, creative: 0 };
        this.choiceHistory = [];
    }

    // ============= CAREER-BASED ADVENTURES =============
    
    async startCareerBasedAdventure(amuletPrompt) {
        try {
            this.logger.debug(`Starting career-based adventure: ${amuletPrompt}`);
            
            const age = Math.floor(this.gameState.days / 365);
            const careerCategory = this.careerAnalyzer.getCurrentCareerCategory();
            
            // Generate prompt
            const prompt = this.promptGenerator.generateCareerBasedPrompt(amuletPrompt, careerCategory);
            
            if (!prompt || !prompt.choices || prompt.choices.length === 0) {
                throw new Error('Failed to generate valid adventure prompt');
            }
            
            // Start adventure
            this.startAdventure();
            
            // Store adventure data
            this.currentAdventure = {
                amuletPrompt: amuletPrompt,
                careerCategory: careerCategory,
                age: age,
                prompt: prompt,
                startTime: Date.now()
            };
            
            this.currentStory = prompt.story;
            this.currentChoices = prompt.choices;
            
            // Display in UI
            this.displayAdventureStory({
                story: prompt.story,
                title: prompt.title || 'Career Adventure',
                choices: prompt.choices
            });
            
            return {
                success: true,
                prompt: prompt
            };
            
        } catch (error) {
            this.logger.error('Error starting career-based adventure:', error);
            this.endAdventure();
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async handleCareerBasedChoice(choiceText, isSuccess) {
        if (!this.currentAdventure) {
            return { success: false, message: 'No active adventure' };
        }
        
        try {
            // Find the choice
            const choice = this.currentAdventure.prompt.choices.find(c => c.text === choiceText);
            if (!choice) {
                return { success: false, message: 'Invalid choice' };
            }
            
            // Track stats
            this.turnCount++;
            if (isSuccess) {
                this.successCount++;
            } else {
                this.failureCount++;
            }
            this.choiceTypes[choice.choiceType]++;
            this.choiceHistory.push({
                choice: choiceText,
                success: isSuccess,
                type: choice.choiceType,
                timestamp: Date.now()
            });
            
            // Calculate power level
            const powerLevel = this.calculateCurrentPowerLevel();
            
            // Store choice in tree with power level
            this.storyTreeBuilder.addChoice(
                this.currentAdventure.amuletPrompt,
                this.currentAdventure.careerCategory,
                choiceText,
                isSuccess,
                powerLevel
            );
            
            // Check for auto-end after 3 failures
            if (this.failureCount >= 3) {
                this.logger.debug('Auto-ending adventure after 3 failures');
                return {
                    success: true,
                    autoEnd: true,
                    storyContinuation: {
                        story: `After ${this.failureCount} setbacks, you decide it's time to end this adventure and regroup.`,
                        choices: []
                    },
                    choiceResult: {
                        choice: choiceText,
                        success: isSuccess,
                        choiceType: choice.choiceType,
                        successProbability: choice.successProbability
                    }
                };
            }
            
            // Generate story continuation
            const storyContinuation = await this.generateStoryContinuation(choice, isSuccess);
            
            // Calculate rewards
            const rewards = this.calculateRewards(choice, isSuccess);
            this.applyRewards(rewards);
            
            return {
                success: true,
                storyContinuation: storyContinuation,
                choiceResult: {
                    choice: choiceText,
                    success: isSuccess,
                    choiceType: choice.choiceType,
                    successProbability: choice.successProbability
                },
                experienceRewards: rewards
            };
            
        } catch (error) {
            this.logger.error('Error handling choice:', error);
            return {
                success: false,
                message: 'Failed to process choice: ' + error.message
            };
        }
    }
    
    async generateStoryContinuation(choice, isSuccess) {
        // Call LLM to generate story continuation
        return await this._generateLLMStoryContinuation(choice, isSuccess);
    }
    
    async _generateLLMStoryContinuation(choice, isSuccess) {
        // Encode character state
        const characterState = CharacterEncoder.encodeCharacterState(this.gameState);
        
        // Build story context
        const storyContext = {
            genre: this._getGenreForCareer(this.currentAdventure.careerCategory),
            storyTurns: this.turnCount,
            lastChoice: choice.text,
            lastChoiceResult: isSuccess ? 'succeeded' : 'failed',
            choiceType: choice.choiceType,
            careerCategory: this.currentAdventure.careerCategory,
            amuletStage: this.currentAdventure.amuletPrompt,
            characterTraits: {},
            worldState: {},
            storyHistory: this.choiceHistory.map(h => `${h.choice} (${h.success ? 'success' : 'failure'})`)
        };
        
        // Generate prompt for continuation
        const prompt = this._buildContinuationPrompt(characterState, storyContext, choice, isSuccess);
        
        // Call Mistral API
        const llmResponse = await this.mistralAPI.generateWorldDescription(characterState, prompt);
        
        // Parse the LLM response
        return this._parseLLMResponse(llmResponse, choice, isSuccess);
    }
    
    _buildContinuationPrompt(characterState, storyContext, choice, isSuccess) {
        const result = isSuccess ? 'succeeded' : 'failed';
        const careerContext = this._getCareerContext(storyContext.careerCategory);
        
        // Calculate current power level for context
        const powerLevel = this.calculateCurrentPowerLevel();
        let powerContext = '';
        
        // Use PowerLevelCalculator if available for detailed context
        if (typeof PowerLevelCalculator !== 'undefined') {
            powerContext = PowerLevelCalculator.buildFullPromptContext(
                characterState,
                powerLevel,
                storyContext.careerCategory,
                storyContext.amuletStage
            );
        } else {
            // Fallback to basic context
            powerContext = `CHARACTER:
- Age: ${characterState.age} years
- Job: ${characterState.currentJob} (${storyContext.careerCategory} career path)
- Current situation: ${storyContext.amuletStage} amulet milestone`;
        }
        
        return `You are narrating a ${storyContext.genre} adventure for a character.

${powerContext}

PREVIOUS CHOICE: "${choice.text}"
RESULT: The character ${result} in their ${choice.choiceType} approach.

CONTEXT: ${careerContext}

PREVIOUS ADVENTURE HISTORY:
${storyContext.storyHistory.slice(-3).join('\n') || 'This is the first choice'}

Generate a story continuation (2-3 sentences) that:
1. Shows the consequences of the ${result} ${choice.choiceType} choice
2. Reflects the ${storyContext.careerCategory} career context and character power level
3. Creates natural tension or opportunity for the next decision
4. Stays consistent with the ${storyContext.amuletStage} milestone theme
5. Adapts challenge difficulty to match the character's power tier

Then provide exactly 3 new choices, each with:
- A clear action statement
- One of these types: aggressive, diplomatic, cautious, or creative
- Appropriate for the ${storyContext.careerCategory} career
- Scaled to the character's power level

Format your response EXACTLY as:

STORY: [Your 2-3 sentence continuation here]

CHOICES:
1. [Choice 1 text] (TYPE: aggressive/diplomatic/cautious/creative)
2. [Choice 2 text] (TYPE: aggressive/diplomatic/cautious/creative)
3. [Choice 3 text] (TYPE: aggressive/diplomatic/cautious/creative)`;
    }
    
    _getGenreForCareer(careerCategory) {
        const genres = {
            'Common work': 'Merchant Fantasy',
            'Military': 'Medieval Combat',
            'The Arcane': 'High Magic Fantasy',
            'The Void': 'Dark Fantasy',
            'Nobility': 'Political Intrigue'
        };
        return genres[careerCategory] || 'General Fantasy';
    }
    
    _getCareerContext(careerCategory) {
        const contexts = {
            'Common work': 'The character is involved in trade and commerce, dealing with merchants and business opportunities.',
            'Military': 'The character is engaged in military pursuits, facing combat situations and tactical challenges.',
            'The Arcane': 'The character is practicing arcane magic, dealing with spells and mystical phenomena.',
            'The Void': 'The character delves into dark magic and forbidden knowledge.',
            'Nobility': 'The character navigates the complexities of noble politics and power.'
        };
        return contexts[careerCategory] || contexts['Common work'];
    }
    
    _parseLLMResponse(llmResponse, choice, isSuccess) {
        try {
            // Parse the LLM response to extract story and choices
            const storyMatch = llmResponse.match(/STORY:\s*(.+?)(?=CHOICES:|$)/s);
            const choicesMatch = llmResponse.match(/CHOICES:\s*\n(.+?)(?=DIFFICULTY|$)/s);
            
            if (!storyMatch || !choicesMatch) {
                throw new Error('Failed to parse LLM response format');
            }
            
            const story = storyMatch[1].trim();
            const choicesText = choicesMatch[1].trim();
            
            // Parse individual choices
            const choiceLines = choicesText.split('\n').filter(line => line.match(/^\d+\./));
            const choices = choiceLines.map(line => {
                const match = line.match(/^\d+\.\s*(.+?)\s*\(TYPE:\s*(\w+)\)/);
                if (match) {
                    const [_, text, type] = match;
                    return {
                        text: text.trim(),
                        description: '',
                        choiceType: type,
                        successProbability: this._calculateSuccessProbability(type)
                    };
                }
                return null;
            }).filter(c => c !== null);
            
            if (choices.length === 0) {
                throw new Error('No valid choices parsed from LLM response');
            }
            
            return {
                story: story,
                choices: choices.length >= 3 ? choices : this._generateFallbackChoices(),
                success: isSuccess,
                choiceType: choice.choiceType
            };
            
        } catch (error) {
            this.logger.error('Failed to parse LLM response:', error);
            throw error;
        }
    }
    
    _calculateSuccessProbability(choiceType) {
        const careerCategory = this.currentAdventure?.careerCategory || 'Common work';
        const characterLevel = this.careerAnalyzer.getCharacterLevel();
        return ProbabilityCalculator.calculateSuccessProbability(choiceType, careerCategory, characterLevel);
    }
    
    _generateFallbackChoices() {
        // Fallback choices when LLM parsing fails
        const careerCategory = this.currentAdventure?.careerCategory || 'Common work';
        
        return [
            {
                text: 'Continue cautiously',
                description: 'Take a careful approach',
                choiceType: 'cautious',
                successProbability: 0.7
            },
            {
                text: 'Act boldly',
                description: 'Take decisive action',
                choiceType: 'aggressive',
                successProbability: 0.5
            },
            {
                text: 'Find a diplomatic solution',
                description: 'Seek to negotiate',
                choiceType: 'diplomatic',
                successProbability: 0.6
            }
        ];
    }
    
    calculateCurrentPowerLevel() {
        // Extract stats from game state
        const stats = {
            Strength: 0,
            ManaControl: 0,
            Intelligence: 0,
            Charisma: 0
        };
        
        if (this.gameState.taskData) {
            for (const [key, task] of Object.entries(this.gameState.taskData)) {
                if (task && typeof task.level === 'number') {
                    if (key === 'Strength' || key.includes('Strength')) {
                        stats.Strength = Math.max(stats.Strength, task.level);
                    } else if (key === 'Magic' || key.includes('Magic') || key === 'ManaControl') {
                        stats.ManaControl = Math.max(stats.ManaControl, task.level);
                    } else if (key === 'Intelligence' || key.includes('Intelligence')) {
                        stats.Intelligence = Math.max(stats.Intelligence, task.level);
                    } else if (key === 'Charisma' || key.includes('Charisma')) {
                        stats.Charisma = Math.max(stats.Charisma, task.level);
                    }
                }
            }
        }
        
        // Use PowerLevelCalculator if available
        if (typeof PowerLevelCalculator !== 'undefined') {
            return PowerLevelCalculator.calculatePowerLevel(stats);
        }
        
        // Fallback: return basic stats
        return {
            effectivePower: stats.Strength + stats.ManaControl,
            tier: '10-C',
            tierName: 'Below Average Human',
            primaryPower: stats.Strength + stats.ManaControl,
            combatMultiplier: 1.0
        };
    }
    
    calculateBaseXP() {
        if (!this.gameState.taskData) {
            return 500; // Default value
        }
        
        const tasks = Object.values(this.gameState.taskData);
        if (tasks.length === 0) {
            return 500; // Default value
        }
        
        // Calculate average level
        let totalLevel = 0;
        let count = 0;
        for (const task of tasks) {
            if (task && typeof task.level === 'number') {
                totalLevel += task.level;
                count++;
            }
        }
        
        if (count === 0) {
            return 500; // Default value
        }
        
        const averageLevel = totalLevel / count;
        const baseXP = 500 + Math.floor(averageLevel * 15);
        
        // Clamp between 500 and 5000
        return Math.max(500, Math.min(5000, baseXP));
    }
    
    calculateRewards(choice, isSuccess) {
        const baseReward = this.calculateBaseXP();
        const successMultiplier = isSuccess ? 1.5 : 0.5;
        const difficultyMultiplier = 1 - (choice.successProbability || 0.5);
        
        const totalXP = Math.floor(baseReward * successMultiplier * (1 + difficultyMultiplier));
        
        return {
            xp: totalXP,
            choiceType: choice.choiceType,
            success: isSuccess
        };
    }
    
    applyRewards(rewards) {
        if (!this.gameState || !this.gameState.taskData) return;
        
        // Apply XP to relevant skills
        const skillMapping = {
            aggressive: 'Strength',
            diplomatic: 'Charisma',
            cautious: 'Intelligence',
            creative: 'Magic'
        };
        
        const skill = skillMapping[rewards.choiceType];
        if (skill && this.gameState.taskData[skill]) {
            if (typeof this.gameState.taskData[skill].addXp === 'function') {
                this.gameState.taskData[skill].addXp(rewards.xp);
            }
        }
    }
    
    endCareerBasedAdventure() {
        if (!this.currentAdventure) {
            return { success: true, message: 'No active adventure to end' };
        }
        
        const duration = Date.now() - this.currentAdventure.startTime;
        const summary = {
            amuletPrompt: this.currentAdventure.amuletPrompt,
            careerCategory: this.currentAdventure.careerCategory,
            duration: duration,
            choices: this.choiceHistory.length,
            successes: this.successCount,
            failures: this.failureCount
        };
        
        this.endAdventure();
        
        // Restore adventure button visibility (event-driven, not periodic)
        if (typeof updateAmuletAdventureAvailability === 'function') {
            updateAmuletAdventureAvailability();
        }
        
        return {
            success: true,
            summary: summary
        };
    }

    // ============= UI METHODS =============
    
    displayAdventureStory(data) {
        const container = document.getElementById('adventureContainer');
        if (!container) {
            this.logger.error('Adventure container not found');
            return;
        }
        
        // Show the overlay
        container.style.display = 'flex';
        
        const html = `
            <div class="career-adventure">
                <div class="adventure-header">
                    <h2>${data.title || 'Adventure'}</h2>
                    <div class="adventure-meta">
                        <span class="career-badge">${this.currentAdventure?.careerCategory || 'Adventure'}</span>
                        <span class="age-badge">${this.currentAdventure?.amuletPrompt || ''}</span>
                    </div>
                </div>
                
                <div class="story-content">
                    <p>${data.story}</p>
                </div>
                
                <div class="choices-section">
                    <h3>Choose your approach:</h3>
                    <div class="choices-grid">
                        ${data.choices.map((choice, index) => `
                            <div class="choice-card">
                                <div class="choice-header">
                                    <span class="choice-type ${choice.choiceType}">${choice.choiceType}</span>
                                    <span class="success-chance">${Math.round(choice.successProbability * 100)}% success</span>
                                </div>
                                <div class="choice-text">${choice.text}</div>
                                <div class="choice-description">${choice.description || ''}</div>
                                <button class="choice-button" onclick="window.adventureSystem.selectChoice(${index})">
                                    Choose This Option
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    async selectChoice(choiceIndex) {
        if (!this.currentStory || !this.currentChoices || choiceIndex >= this.currentChoices.length) {
            this.showError('Invalid choice selection');
            return;
        }
        
        const choice = this.currentChoices[choiceIndex];
        const isSuccess = Math.random() < (choice.successProbability || 0.5);
        
        this.logger.debug(`Choice selected: ${choice.text}, success: ${isSuccess}`);
        
        const result = await this.handleCareerBasedChoice(choice.text, isSuccess);
        
        if (result.success) {
            this.displayChoiceResult(result);
        } else {
            this.showError(result.message || 'Failed to process choice');
        }
    }
    
    displayChoiceResult(result) {
        const container = document.getElementById('adventureContainer');
        if (!container) return;
        
        // Check for auto-end
        if (result.autoEnd) {
            this.showAdventureCompletion();
            return;
        }
        
        // Store continuation
        this.currentStoryContinuation = result.storyContinuation;
        
        const html = `
            <div class="choice-result">
                <div class="result-header">
                    <h3>${result.choiceResult.success ? 'Success!' : 'Failure!'}</h3>
                    <div class="result-meta">
                        <span class="choice-type">${result.choiceResult.choiceType}</span>
                        <span class="probability">${Math.round(result.choiceResult.successProbability * 100)}% chance</span>
                        <span class="failure-count">${this.failureCount} failures</span>
                    </div>
                </div>
                
                <div class="story-continuation">
                    <h4>Story Continues...</h4>
                    <p>${result.storyContinuation.story}</p>
                </div>
                
                <div class="result-actions">
                    <button class="continue-button" onclick="window.adventureSystem.continueAdventure()">
                        Continue Adventure
                    </button>
                    <button class="end-button" onclick="window.adventureSystem.endCareerBasedAdventure(); window.adventureSystem.showSummary();">
                        End Adventure
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    async continueAdventure() {
        if (!this.currentStoryContinuation) {
            this.showError('No story continuation available');
            return;
        }
        
        if (this.currentStoryContinuation.choices && this.currentStoryContinuation.choices.length > 0) {
            this.currentStory = this.currentStoryContinuation.story;
            this.currentChoices = this.currentStoryContinuation.choices;
            
            // Update the adventure's prompt with new choices
            if (this.currentAdventure) {
                this.currentAdventure.prompt.choices = this.currentStoryContinuation.choices;
            }
            
            this.displayAdventureStory({
                story: this.currentStoryContinuation.story,
                choices: this.currentStoryContinuation.choices
            });
            
            this.currentStoryContinuation = null;
        } else {
            this.showAdventureCompletion();
        }
    }
    
    showAdventureCompletion() {
        const container = document.getElementById('adventureContainer');
        if (!container) return;
        
        // Show the overlay
        container.style.display = 'flex';
        
        container.innerHTML = `
            <div class="adventure-completion">
                <h3>🎉 Adventure Complete!</h3>
                <p>Your adventure has come to an end. Thank you for playing!</p>
                <button class="end-button" onclick="window.adventureSystem.endCareerBasedAdventure(); window.adventureSystem.showSummary();">
                    Close Adventure
                </button>
            </div>
        `;
    }
    
    showSummary() {
        const container = document.getElementById('adventureContainer');
        if (!container) return;
        
        const summary = {
            choices: this.choiceHistory.length,
            successes: this.successCount,
            failures: this.failureCount
        };
        
        container.innerHTML = `
            <div class="adventure-summary">
                <h3>Adventure Summary</h3>
                <p>Total Choices: ${summary.choices}</p>
                <p>Successes: ${summary.successes}</p>
                <p>Failures: ${summary.failures}</p>
                <button onclick="document.getElementById('adventureContainer').style.display='none'; document.getElementById('adventureContainer').innerHTML='';">Close</button>
            </div>
        `;
    }
    
    showError(message) {
        const container = document.getElementById('adventureContainer');
        if (!container) return;
        
        // Show the overlay
        container.style.display = 'flex';
        
        container.innerHTML = `
            <div class="adventure-error">
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="document.getElementById('adventureContainer').innerHTML = ''">Close</button>
            </div>
        `;
    }
}

