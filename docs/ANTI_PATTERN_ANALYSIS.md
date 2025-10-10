# Anti-Pattern Analysis: setInterval Usage

**Date:** October 10, 2025  
**Reviewer Feedback:** "What the fuck kind of solution is adding a periodic check?"  
**Status:** Valid Criticism - Anti-Pattern Identified

---

## 🔍 Coworker's Critique: VALID ✅

### The Question
> "Why periodically check if variables have changed rather than just call the logic when necessary? This isn't a dynamically updating UI right? So why do something like this ever?"

### The Answer: **They're Absolutely Right**

The periodic check I added (`setInterval(updateAmuletAdventureAvailability, 5000)`) is indeed an anti-pattern for this use case.

---

## 📊 setInterval Usage in Codebase

### Legitimate Uses (js/main.js)

**1. Game Loop (Line 1185)**
```javascript
setInterval(update, 1000 / updateSpeed)
```
**Purpose:** Run game simulation  
**Justification:** ✅ VALID - This IS a dynamically updating system  
**Frequency:** ~60 FPS (16ms intervals)  
**Why It Makes Sense:** Game needs to continuously update time, XP, resources

**2. Auto-Save (Line 1186)**
```javascript
setInterval(saveGameData, 3000)
```
**Purpose:** Periodically persist game state  
**Justification:** ✅ VALID - Common game pattern  
**Frequency:** Every 3 seconds  
**Why It Makes Sense:** 
- User might close browser anytime
- Saves aren't tied to specific events
- Performance: Batches saves instead of saving on every state change

**3. Auto-Learn (Line 1187)**
```javascript
setInterval(setSkillWithLowestMaxXp, 1000)
```
**Purpose:** Auto-skill selection  
**Justification:** ✅ PROBABLY VALID (needs review)  
**Frequency:** Every 1 second  
**Why It Might Make Sense:** Simplifies logic vs tracking every skill level change

### Anti-Pattern (My Code - amulet-adventure-integration.js)

**4. Button Visibility Check (Line 132)**
```javascript
setInterval(updateAmuletAdventureAvailability, 5000)
```
**Purpose:** Update button visibility  
**Justification:** ❌ **ANTI-PATTERN**  
**Frequency:** Every 5 seconds  
**Why It's Wrong:**
- Buttons don't change state on their own
- State changes are event-driven (adventure end, age change)
- Wastes CPU checking the same state repeatedly
- Harder to debug (when did state change?)
- Band-aid over missing event handlers

---

## ⚖️ Analysis: When Is setInterval Appropriate?

### ✅ Good Use Cases

**1. Continuous Simulation**
```javascript
setInterval(update, 16)  // Game loop
```
- System continuously evolves
- No discrete "events" to trigger updates
- Time-based progression

**2. Periodic Persistence**
```javascript
setInterval(save, 3000)  // Auto-save
```
- Save isn't tied to specific events
- Batching improves performance
- Protection against unexpected closures

**3. Polling External State**
```javascript
setInterval(checkServerStatus, 5000)  // Network status
```
- External system outside our control
- No event notification mechanism
- Must poll to detect changes

### ❌ Bad Use Cases (My Mistake)

**1. Event-Driven State**
```javascript
setInterval(updateButtons, 5000)  // ❌ WRONG
```
- State changes are deterministic (we control them)
- We KNOW when changes happen
- Should call update when we make the change

**Correct Approach:**
```javascript
endAdventure() {
    this.gameState.paused = false;
    updateButtons();  // ✅ Call when state changes
}
```

---

## 🎯 The Right Solution

### Remove Periodic Check, Use Event-Driven Updates

**When to Update Button Visibility:**

1. **After Adventure Ends** → Call directly
2. **When Tab Switches to Amulet** → Event listener
3. **When Age Changes** → Already happens in game loop

**No Need For:**
- ❌ Checking every 5 seconds "just in case"
- ❌ Polling for state changes we control
- ❌ Wasteful CPU cycles

### The Fix

**Remove:**
```javascript
setInterval(updateAmuletAdventureAvailability, 5000);  // ❌ Delete this
```

**Keep/Add:**
```javascript
// 1. Direct call after adventure ends
endAdventure() {
    updateAmuletAdventureAvailability();  // ✅ Event-driven
}

// 2. Tab switch listener (fix the selector)
amuletTab.addEventListener('click', () => {
    updateAmuletAdventureAvailability();  // ✅ Event-driven
});

// 3. Called in game update (only when age changes)
function update() {
    updateUI();
    if (gameData.paused) return;
    
    const oldAge = Math.floor(gameData.days / 365);
    increaseDays();
    const newAge = Math.floor(gameData.days / 365);
    
    if (oldAge !== newAge) {
        updateAmuletAdventureAvailability();  // ✅ Event-driven
    }
}
```

---

## 🐛 Additional Regression: One Adventure Per Life

### The Problem

**User's Observation:** 
> "Adventure should only be startable once per age per life, not clickable a second time"

**Current Behavior:**
- Start adventure at age 25 → Complete it
- Button reappears → Can start age 25 adventure again ❌

**Expected Behavior:**
- Start adventure at age 25 → Complete it
- Button grayed out/disabled for rest of this life
- After rebirth → Button available again ✅

### Why This Happens

**No Tracking:**
```javascript
// Current code doesn't track:
// - Which adventures were used THIS LIFE
// - Only tracks story tree choices (across all lives)
```

**Need:**
```javascript
// Track per-life adventure usage
currentLifeAdventures = {
    age25: false,  // Not used yet
    age45: false,
    age65: false,
    age200: false
};

// On rebirth: Reset to false
// After adventure: Set to true
// Update buttons: Disable if true
```

---

## 🎯 Correct Implementation Plan

### 1. Remove Periodic Check Anti-Pattern
```javascript
// DELETE:
setInterval(updateAmuletAdventureAvailability, 5000);
```

### 2. Add Event-Driven Updates
```javascript
// Call when events happen:
- endAdventure() → update buttons
- Tab switch → update buttons
- Age milestone crossed → update buttons
```

### 3. Track Adventures Per Life
```javascript
class AdventureTracker {
    constructor() {
        this.currentLifeAdventures = {
            age25: false,
            age45: false,
            age65: false,
            age200: false
        };
    }
    
    markUsed(amuletPrompt) {
        this.currentLifeAdventures[amuletPrompt] = true;
    }
    
    isUsed(amuletPrompt) {
        return this.currentLifeAdventures[amuletPrompt];
    }
    
    resetForNewLife() {
        Object.keys(this.currentLifeAdventures).forEach(key => {
            this.currentLifeAdventures[key] = false;
        });
    }
}
```

### 4. Update Button Display Logic
```javascript
updateAmuletAdventureAvailability() {
    buttons.forEach(({ id, prompt, minAge }) => {
        const ageRequirementMet = currentAge >= minAge;
        const alreadyUsed = adventureTracker.isUsed(prompt);
        const apiKeyAvailable = hasAPIKey();
        
        // Show if age met, but disable if already used this life
        container.style.display = ageRequirementMet ? 'block' : 'none';
        button.disabled = alreadyUsed || !apiKeyAvailable;
        button.style.opacity = (alreadyUsed || !apiKeyAvailable) ? '0.5' : '1';
        button.title = alreadyUsed ? 
            'Already completed this adventure in this life' :
            !apiKeyAvailable ? 'Configure API key first' : '';
    });
}
```

---

## 🎓 Lessons Learned

### My Mistake: Band-Aid Fix

**What I Did:**
- Found button didn't reappear after adventure
- Added periodic check to "make sure it appears"
- Didn't think about **why** it wasn't appearing

**What I Should Have Done:**
- Find where button state changes
- Call update at those specific points
- Event-driven, not polling

### The Right Pattern

**Bad (Polling):**
```javascript
setInterval(() => {
    if (somethingChanged()) {
        updateUI();
    }
}, 1000);
```

**Good (Event-Driven):**
```javascript
function doSomething() {
    changeState();
    updateUI();  // Update when we know it changed
}
```

---

## 🔧 Action Items

1. **Remove periodic check** - It's an anti-pattern
2. **Add proper event listeners** - Tab switch, adventure end, age change
3. **Track adventures per life** - Prevent multiple uses
4. **Grey out used adventures** - Visual feedback
5. **Create regression tests** - Verify one-per-life logic
6. **Apologize to coworker** - They're absolutely right!

---

## 🎯 Defense of Existing setInterval Uses

### Game Loop (update): VALID ✅
- **Purpose:** Continuous simulation
- **Justification:** Game progresses over time, not event-driven
- **Alternative:** Would need requestAnimationFrame + time tracking (more complex)
- **Verdict:** Appropriate use

### Auto-Save (saveGameData): VALID ✅
- **Purpose:** Periodic persistence
- **Justification:** Protects against unexpected closures
- **Alternative:** Save on every state change (performance hit with 100+ changes/sec)
- **Verdict:** Standard game pattern, appropriate

### Auto-Learn (setSkillWithLowestMaxXp): QUESTIONABLE ⚠️
- **Purpose:** Select skill with lowest max XP
- **Justification:** Simplifies logic
- **Alternative:** Call when skills change (better)
- **Verdict:** Could be event-driven, but low impact

### Button Visibility: ANTI-PATTERN ❌
- **Purpose:** Make sure buttons appear
- **Justification:** None - pure band-aid
- **Alternative:** Event-driven updates (much better)
- **Verdict:** Remove immediately, replace with proper solution

---

## ✅ Conclusion

**Coworker's Critique:** 100% Valid ✅

**My Defense:** 
- Game loop & auto-save are legitimate uses
- Auto-learn is questionable but low impact
- **Button visibility check is indefensible** - I'll fix it immediately

**Action:** 
1. Remove the periodic check
2. Implement proper event-driven updates
3. Fix the one-adventure-per-life regression
4. Create proper tests

**Apology:** Your coworker is right to call this out. It's the kind of lazy fix that leads to maintenance nightmares. I'll do it properly now.

---

**Note to Self:** Always ask "Why doesn't the event handler work?" instead of "How can I check more often?"

