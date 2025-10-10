# Power Level & Story Differentiation System Design

## Overview
This document outlines the design and implementation of a power level tiering system that affects LLM-generated story content. The system ensures that stories reflect the character's actual capabilities based on their stats.

## Goals
1. **Story Consistency**: Characters with different power levels should receive qualitatively different story narratives
2. **LLM Integration**: Pass character stats to the LLM in a way that influences story generation
3. **Rebirth Persistence**: Story trees persist across rebirths and reference the character state when first visited
4. **Differentiation Testing**: Verify that visited paths return consistent stories while new paths generate fresh content

## Power Tiering System

### Based on VS Battles Wiki Tiering
Reference: https://vsbattles.fandom.com/wiki/Tiering_System

### Core Stats
- **Primary Stats**: Strength, Mana Control (additive)
- **Combat Stats**: Other combat-related stats (multiplicative, max 2x at 100,000)

### Tier Calculation Formula
```javascript
primaryPower = Strength + ManaControl
combatMultiplier = 1 + (sumOfOtherCombatStats / totalPossibleCombatStats)
// combatMultiplier caps at 2.0 when other stats sum to 100,000
effectivePower = primaryPower * combatMultiplier
```

### Tier Thresholds

| Tier | Name | Required Effective Power | Description |
|------|------|-------------------------|-------------|
| 10-C | Below Average Human | 0 | Character start state |
| 10-B | Human level | 10 | Basic human capabilities |
| 10-A | Athlete level | 25 | Peak human performance |
| 9-C | Street level | 55 | Beyond peak human |
| 9-B | Wall level | 100 | Can damage walls |
| 9-A | Room level | 200 | Can destroy rooms |
| 8-C | Building level | 500 | Can damage buildings |
| 8-B | City Block level | 1,000 | Significant destruction |
| 8-A | Multi-City Block | 2,000 | Large-scale damage |
| 7-C | Town level | 5,000 | Town-threatening |
| 7-B | City level | 10,000 | City-threatening |
| 7-A | Mountain level | 25,000 | Massive destruction |
| 6-C | Island level | 50,000 | Island-scale power |
| 6-B | Country level | 75,000 | Country-scale power |
| 6-A | Continent level | 100,000 | **Primary stat milestone** |
| 5-C | Moon level | 1,000,000+ | **Requires multipliers** |

### Combat Stats for Multiplier
- Intelligence
- Charisma
- Speed/Dexterity (if exists)
- Constitution/Endurance (if exists)

Each combat stat contributes proportionally to the multiplier:
```javascript
// Example: If Intelligence is at 10,000 out of max 100,000
// It contributes: (10,000 / 100,000) * 1.0 = 0.1 to multiplier
// Multiplier would be 1.1x
```

## LLM Context Passing Strategy

### Option 2 + Power Level (Selected Approach)

#### Prompt Enhancement
Add to character description section:
```javascript
CHARACTER:
- Age: ${characterState.age} years
- Job: ${characterState.currentJob} (${careerCategory} career path)
- Power Tier: ${powerTier} (${tierName})
- Relevant Skills: ${careerRelevantSkills}
- Combat Capability: ${combatCapabilityDescription}
- Current situation: ${amuletStage} amulet milestone

NARRATIVE GUIDANCE:
- Narrate at ${tierName} difficulty level
- Character should face ${difficultyLevel} challenges
- Available abilities reflect ${powerTier} tier capabilities
```

### Career-Relevant Skills Mapping

**Common Work** → Strength, Charisma, Intelligence
**Military** → Strength, Constitution, Combat skills
**The Arcane** → Mana Control, Intelligence, Magic
**The Void** → Mana Control, Evil alignment, Dark magic
**Nobility** → Charisma, Intelligence, Coins/Influence

## Story Tree & Rebirth System

### Current Implementation
- `StoryTreeManager`: Persists choices to localStorage
- `StoryPersistenceManager`: Tracks adventures per life
- Story trees are keyed by: `amuletPrompt` + `careerCategory`

### Enhancement: Power Level Tracking
When storing a choice, also store the character's power level at that moment:
```javascript
{
  choice: "Attack the dragon",
  result: true,
  powerLevel: 250,
  powerTier: "9-A",
  characterLevel: 15,
  timestamp: 1234567890
}
```

### Story Consistency Rules
1. **First Visit**: Generate new story using current power level
2. **Revisit**: Return same story from tree (regardless of current power level)
3. **Power Context**: Story reflects power level from first visit, not current

## Test-Driven Development Plan

### Test Suite A: Power Level Calculation
**File**: `tests/llm/power-level-calculator.test.js`

Tests:
1. Calculate power level for starting character (0 stats) → 10-C
2. Calculate power level at Strength 55 → 9-C
3. Calculate power level at Strength+Mana = 100,000 → 6-A
4. Calculate power level with multipliers reaching 1,000,000+ → 5-C
5. Verify combat stat multipliers cap at 2.0x
6. Test tier name lookup for each threshold
7. Test career-relevant skill extraction

### Test Suite B: Story Tree Persistence with Power Levels
**File**: `tests/llm/story-tree-rebirth.test.js`

Tests:
1. **Visited Leaf Returns Same Story**
   - First visit: Level 10 character, story generated
   - Second visit: Level 50 character, same story returned
   - Assert: Story content identical

2. **Unvisited Leaf Generates New Story**
   - Path A visited at level 10
   - Path B never visited
   - Assert: Path B generates new content

3. **Power Level Persistence**
   - Store choice with power level 250 (tier 9-A)
   - Retrieve choice, verify power level stored
   - Assert: Power level metadata persists

### Test Suite C: LLM Context Integration
**File**: `tests/llm/llm-context-power-level.test.js`

Tests:
1. **Low-Level Character Context**
   - Character at 10-C tier
   - Generate prompt
   - Assert: Prompt includes "Below Average Human" tier
   - Assert: Narrative guidance mentions appropriate difficulty

2. **High-Level Character Context**
   - Character at 6-A tier
   - Generate prompt
   - Assert: Prompt includes "Continent level" tier
   - Assert: Relevant skills listed

3. **Career-Specific Skill Filtering**
   - Military character
   - Assert: Strength, combat stats highlighted
   - Arcane character
   - Assert: Mana Control, Intelligence highlighted

### Test Suite D: Full Rebirth Scenarios
**File**: `tests/llm/rebirth-story-consistency.test.js`

Tests based on user requirements:

1. **Success-Failure-Success-Failure-Failure Pattern**
   - Life 1: Make choices, track outcomes
   - Rebirth (Life 2): Replay same choices
   - Assert: Same story presented at each decision point

2. **Failure-Failure-Failure Auto-End**
   - Life 1: Make 3 failing choices
   - Assert: Adventure auto-ends
   - Life 2: Replay, same failure points
   - Assert: Same auto-end occurs

3. **Success-Success-Success-Manual End**
   - Life 1: 3 successes, manually end
   - Track all story content
   - Life 2: Replay
   - Assert: All story content identical

4. **New Path Generates Different Content**
   - Life 1: Choose path A
   - Life 2: Choose path B (never visited)
   - Assert: Path B content different from path A
   - Assert: Path B reflects current power level, not path A's

## Implementation Order

### Phase 1: Power Level Calculator ✓ (To be implemented)
**File**: `llm/utils/PowerLevelCalculator.js`

Methods:
- `calculatePrimaryPower(stats)` - Sum Strength + Mana Control
- `calculateCombatMultiplier(stats)` - Calculate multiplier from other stats
- `calculateEffectivePower(stats)` - Primary * multiplier
- `getPowerTier(effectivePower)` - Map to tier (10-C, 9-C, etc.)
- `getTierName(tier)` - Get human-readable name
- `getCareerRelevantSkills(characterState, careerCategory)` - Filter skills
- `getCombatCapabilityDescription(tier, careerCategory)` - Generate description

### Phase 2: Story Tree Power Level Integration ✓ (To be implemented)
**Files**: 
- Enhance `llm/features/story-data.js` (StoryTreeManager)
- Update branch structure to include power level metadata

### Phase 3: LLM Prompt Enhancement ✓ (To be implemented)
**Files**:
- Update `llm/features/adventure-system.js`
- Enhance `_buildContinuationPrompt()` method
- Add power level context to all LLM calls

### Phase 4: Test Suite Completion ✓ (To be implemented)
**Files**: All test files listed above

## Success Criteria

### Functional Requirements
✓ Power levels calculate correctly based on stats
✓ Story trees persist power level metadata
✓ LLM prompts include power level context
✓ Visited paths return identical stories
✓ New paths generate different stories

### Quality Requirements
✓ All tests pass
✓ Power level influences story tone/difficulty
✓ System works across rebirths
✓ No regression in existing functionality

## Example Scenarios

### Scenario 1: Beginner Character
```javascript
Character: {
  Strength: 5,
  ManaControl: 0,
  Intelligence: 10,
  Charisma: 5
}

Power Calculation:
- Primary: 5 + 0 = 5
- Multiplier: 1 + ((10+5)/200000) = ~1.000075
- Effective: 5 * 1.000075 = 5
- Tier: 10-C (Below Average Human)

Story Tone: "You struggle with basic challenges, your limited strength barely sufficient for simple tasks."
```

### Scenario 2: Mid-Level Character
```javascript
Character: {
  Strength: 5000,
  ManaControl: 5000,
  Intelligence: 1000,
  Charisma: 1000
}

Power Calculation:
- Primary: 5000 + 5000 = 10,000
- Multiplier: 1 + ((1000+1000)/200000) = 1.01
- Effective: 10,000 * 1.01 = 10,100
- Tier: 7-B (City level)

Story Tone: "Your power resonates with city-threatening force, enemies of significant power take notice."
```

### Scenario 3: High-Level Character
```javascript
Character: {
  Strength: 50000,
  ManaControl: 50000,
  Intelligence: 25000,
  Charisma: 25000
}

Power Calculation:
- Primary: 50000 + 50000 = 100,000
- Multiplier: 1 + ((25000+25000)/200000) = 1.25
- Effective: 100,000 * 1.25 = 125,000
- Tier: 6-A (Continent level)

Story Tone: "Your continental-scale power reshapes the very fabric of reality, few can stand before you."
```

## Notes & Considerations

### Token Efficiency
- Only include top 3-5 skills (not all skills)
- Use tier name instead of full stat breakdown
- Provide power level as single number + tier

### Backward Compatibility
- Existing story trees without power level metadata should still work
- Default to "Unknown" tier if metadata missing
- Gracefully handle old save data

### Future Enhancements
- Visual power level indicator in UI
- Power level progression tracking
- Achievement system tied to tier milestones
- "Tier jump" special events when crossing major thresholds

## References
- VS Battles Wiki Tiering System: https://vsbattles.fandom.com/wiki/Tiering_System
- Current adventure system: `llm/features/adventure-system.js`
- Story tree system: `llm/features/story-data.js`
- Character encoder: `llm/utils/CharacterEncoder.js`

