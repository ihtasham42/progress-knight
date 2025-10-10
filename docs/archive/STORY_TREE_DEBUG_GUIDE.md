# Story Tree Debug Guide

## 🔍 **Debugging Story Trees**

The career-based adventure system now includes comprehensive debugging functionality to help you understand how story trees are created and updated across rebirths.

## 🎯 **Automatic Debug Output**

### **When Debug Output Appears:**
1. **Before Starting Adventure**: Shows current story tree state
2. **After Making a Choice**: Shows updated story tree structure
3. **After Adventure Completion**: Shows final story tree state

### **Debug Output Format:**
```
🌳 === STORY TREE DEBUG ===
📅 Current Life: life_0
🎯 Adventure: age25 - Military

🔮 AGE25 TREE:
  🎭 Military:
    📊 Total Choices: 1
    ✅ Successes: 1
    ❌ Failures: 0
    📈 Success Rate: 100.0%
    🌿 Choices:
      ✅ "Lead a direct assault" (aggressive) - 2:30:45 PM
    📏 Tree Depth: 1

📊 OVERALL STATISTICS:
  🎯 Total Choices: 1
  ✅ Total Successes: 1
  ❌ Total Failures: 0
  📈 Overall Success Rate: 100.0%

📅 Choices by Prompt:
  age25: 1 choices

🎭 Choices by Category:
  Military: 1 choices

🌳 === END STORY TREE DEBUG ===
```

## 🛠️ **Manual Debug Functions**

### **Available in Browser Console:**

#### **1. Print Story Tree Debug Info**
```javascript
debugStoryTrees()
```
- Prints complete story tree structure to console
- Shows all amulet prompts and career categories
- Displays statistics and choices

#### **2. Get Story Tree Summary**
```javascript
getStoryTreeSummary()
```
- Returns JSON object with story tree data
- Useful for programmatic access
- Includes life ID, statistics, and tree structure

### **Example Usage:**
```javascript
// Print debug info to console
debugStoryTrees();

// Get summary data
const summary = getStoryTreeSummary();
console.log('Total choices:', summary.totalChoices);
console.log('Success rate:', summary.successRate);
```

## 📊 **Debug Output Explained**

### **Tree Structure:**
- **🔮 AGE25 TREE**: Shows all career categories for age 25
- **🎭 Military**: Shows choices for Military career category
- **📊 Total Choices**: Number of choices made in this category
- **✅ Successes**: Number of successful choices
- **❌ Failures**: Number of failed choices
- **📈 Success Rate**: Percentage of successful choices

### **Choice Details:**
- **✅/❌**: Success or failure indicator
- **"Choice Text"**: The actual choice made
- **(choiceType)**: Type of choice (aggressive, diplomatic, etc.)
- **timestamp**: When the choice was made

### **Statistics:**
- **🎯 Total Choices**: All choices across all trees
- **✅ Total Successes**: All successful choices
- **❌ Total Failures**: All failed choices
- **📈 Overall Success Rate**: Overall success percentage

## 🔄 **Cross-Life Debugging**

### **Life Tracking:**
- **📅 Current Life**: Shows current life ID (life_0, life_1, etc.)
- **Life ID Changes**: Updates when player rebirths
- **Tree Persistence**: Shows how trees persist across lives

### **Example Cross-Life Output:**
```
🌳 === STORY TREE DEBUG ===
📅 Current Life: life_1
🎯 Adventure: age25 - Military

🔮 AGE25 TREE:
  🎭 Military:
    📊 Total Choices: 2
    ✅ Successes: 1
    ❌ Failures: 1
    📈 Success Rate: 50.0%
    🌿 Choices:
      ✅ "Lead a direct assault" (aggressive) - 2:30:45 PM
      ❌ "Negotiate a peaceful resolution" (diplomatic) - 2:35:20 PM
    📏 Tree Depth: 2
```

## 🎮 **How to Use Debugging**

### **1. During Development:**
- Open browser console
- Start an adventure
- Make choices
- Watch debug output appear automatically

### **2. For Testing:**
- Use `debugStoryTrees()` to see current state
- Use `getStoryTreeSummary()` to get data programmatically
- Check console output after each adventure

### **3. For Troubleshooting:**
- Look for missing choices or incorrect statistics
- Check if trees are persisting across lives
- Verify career categories are correct

## 🚀 **Advanced Debugging**

### **Story Tree Structure:**
```javascript
const summary = getStoryTreeSummary();
console.log('Life ID:', summary.lifeId);
console.log('Total trees:', summary.totalTrees);
console.log('All trees:', summary.trees);
```

### **Career-Specific Debugging:**
```javascript
// Check specific career category
const trees = summary.trees;
if (trees.age25 && trees.age25.Military) {
    console.log('Military choices:', trees.age25.Military.choices);
    console.log('Success rate:', trees.age25.Military.metadata.successCount / trees.age25.Military.metadata.totalChoices);
}
```

### **Cross-Life Analysis:**
```javascript
// Check if trees persist across lives
const life0Trees = localStorage.getItem('storyTrees');
const life1Trees = localStorage.getItem('storyTrees');
console.log('Life 0 trees:', life0Trees);
console.log('Life 1 trees:', life1Trees);
```

## 📝 **Debug Output Examples**

### **Empty Tree (First Adventure):**
```
🌳 === STORY TREE DEBUG ===
📅 Current Life: life_0
🎯 Adventure: age25 - Military

🔮 AGE25 TREE:
  📝 No career categories for this prompt

📊 OVERALL STATISTICS:
  🎯 Total Choices: 0
  ✅ Total Successes: 0
  ❌ Total Failures: 0
  📈 Overall Success Rate: 0.0%
```

### **Populated Tree (After Choices):**
```
🌳 === STORY TREE DEBUG ===
📅 Current Life: life_0
🎯 Adventure: age25 - Military

🔮 AGE25 TREE:
  🎭 Military:
    📊 Total Choices: 2
    ✅ Successes: 1
    ❌ Failures: 1
    📈 Success Rate: 50.0%
    🌿 Choices:
      ✅ "Lead a direct assault" (aggressive) - 2:30:45 PM
      ❌ "Negotiate a peaceful resolution" (diplomatic) - 2:35:20 PM
    📏 Tree Depth: 2
```

## 🎯 **Key Benefits**

1. **Visual Tree Structure**: See exactly how trees are built
2. **Choice Tracking**: Monitor all choices and outcomes
3. **Cross-Life Persistence**: Verify trees persist across rebirths
4. **Statistics**: Track success rates and choice patterns
5. **Troubleshooting**: Identify issues with tree creation/updates
6. **Development**: Understand system behavior during development

The debug system provides complete visibility into how story trees are created, updated, and persist across player lives, making it easy to verify the system is working correctly!
