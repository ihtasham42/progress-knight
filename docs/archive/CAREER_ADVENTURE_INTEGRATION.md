# Career-Based Adventure Integration Guide

## Overview

This guide explains how to integrate the career-based adventure system with your existing game. The system provides career-specific adventure prompts that trigger at specific age milestones (25, 45, 65, 200 years).

## Files Added

### Core Modules
- `src/llm/CareerBasedAdventureIntegration.js` - Main integration module
- `src/ui/CareerBasedStoryAdventureUI.js` - UI for career-based adventures
- `js/career-based-adventure-integration.js` - Integration script for main.js

### Test Files
- `test-career-adventures.html` - Test page for the integration

## Integration Steps

### 1. Include the Integration Script

Add this to your main HTML file, after the main game scripts:

```html
<script src="js/career-based-adventure-integration.js"></script>
```

### 2. Ensure Required Classes Are Available

Make sure these classes are loaded before the integration script:
- `CareerBasedStoryAdventureUI`
- `CareerBasedAdventureIntegration`
- `CareerBasedPromptGenerator`
- `CareerAnalyzer`
- `StoryTreeManager`
- `StoryTreeBuilder`

### 3. Add Adventure Container

The integration script will automatically create an adventure container, but you can also add it manually:

```html
<div id="adventureContainer" style="display: none;"></div>
```

### 4. Update Your Game Loop

The integration script automatically modifies the `update()` function to check for amulet prompt triggers. No manual changes needed.

## How It Works

### Amulet Prompt Triggers

The system automatically checks for amulet prompt triggers at ages:
- **25 years**: `age25` - Early career decisions
- **45 years**: `age45` - Mid-career challenges  
- **65 years**: `age65` - Senior career choices
- **200 years**: `age200` - Legendary career paths

### Career Analysis

The system analyzes the player's career progression based on:
- **Job levels achieved** in each category
- **Career weights** calculated from job levels
- **Dominant career category** (Common work, Military, The Arcane Association)

### Adventure Generation

When an amulet prompt is triggered:
1. **Career analysis** determines the dominant career category
2. **Career-based prompt** is generated with relevant options
3. **Story tree integration** shows previous choices if available
4. **Success probabilities** are calculated based on career progression

### Choice Processing

When a player makes a choice:
1. **Success/failure** is determined by probability
2. **Choice is locked** in the story tree for future lives
3. **Story continuation** is generated based on the result
4. **Career progression** affects future adventure options

## API Reference

### CareerBasedAdventureIntegration

```javascript
// Check if amulet prompt should trigger
const amuletPrompt = integration.shouldTriggerAmuletPrompt(currentAge);

// Start career-based adventure
const result = await integration.startCareerBasedAdventure(amuletPrompt);

// Handle player choice
const result = await integration.handleCareerBasedChoice(choiceText, isSuccess);

// End adventure
const result = integration.endCareerBasedAdventure();
```

### CareerBasedStoryAdventureUI

```javascript
// Check if adventure is active
const isActive = ui.isAdventureActive();

// Get career analysis
const analysis = ui.getCareerAnalysis();

// Get story tree statistics
const stats = ui.getStoryTreeStats();
```

## Testing

### Test Page

Open `test-career-adventures.html` in a browser to test the integration:

1. **Trigger Adventures**: Click buttons to simulate different ages
2. **View Career Analysis**: See how career progression affects options
3. **Test Story Trees**: Make choices and see them persist
4. **Monitor Logs**: Watch the activity log for system events

### Manual Testing

1. **Age Simulation**: Change `gameData.days` to trigger amulet prompts
2. **Career Progression**: Modify `gameData.taskData` to test different career paths
3. **Story Tree Persistence**: Check localStorage for `storyTrees` data

## Customization

### Career Categories

Modify `src/llm/CareerWeights.js` to add new career categories or adjust weights:

```javascript
static jobWeights = {
    "Common work": { /* jobs */ },
    "Military": { /* jobs */ },
    "The Arcane Association": { /* jobs */ },
    "New Category": { /* jobs */ }  // Add new category
};
```

### Amulet Prompt Triggers

Modify `CareerBasedAdventureIntegration.js` to change trigger ages:

```javascript
this.amuletPromptTriggers = {
    25: 'age25',
    45: 'age45', 
    65: 'age65',
    200: 'age200',
    300: 'age300'  // Add new trigger
};
```

### Adventure Content

Modify `CareerBasedPromptGenerator.js` to customize adventure content:

```javascript
_generateChoiceText(amuletPrompt, careerCategory, choiceType) {
    // Add custom choice templates
}
```

## Troubleshooting

### Common Issues

1. **Classes not loaded**: Ensure all required classes are loaded before the integration script
2. **Adventure container missing**: The integration script creates it automatically
3. **Career analysis not working**: Check that `gameData.taskData` is properly populated
4. **Story trees not persisting**: Check localStorage permissions and data structure

### Debug Mode

Enable debug logging by setting the logger level:

```javascript
if (window.careerBasedStoryAdventureUI) {
    window.careerBasedStoryAdventureUI.logger.setLevel('debug');
}
```

### Console Commands

```javascript
// Check integration status
console.log(window.careerBasedStoryAdventureUI);

// Trigger manual adventure
window.triggerCareerBasedAdventure('age25');

// Check career analysis
console.log(window.careerBasedStoryAdventureUI.getCareerAnalysis());

// View story tree stats
console.log(window.careerBasedStoryAdventureUI.getStoryTreeStats());
```

## Performance Considerations

- **Caching**: Prompts are cached to avoid regeneration
- **LocalStorage**: Story trees are stored locally for persistence
- **Memory**: Old adventures are cleaned up automatically
- **Async**: All LLM calls are asynchronous to prevent blocking

## Future Enhancements

- **Dynamic Content**: AI-generated adventure content
- **Multiplayer**: Shared story trees between players
- **Analytics**: Track player choice patterns
- **Customization**: Player-defined career categories
- **Integration**: Connect with existing adventure systems
