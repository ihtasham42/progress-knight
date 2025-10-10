# Changelog

All notable changes, bug fixes, and feature implementations for Progress-LLM.

---

## [Unreleased] - 2025-10-10

### Added - Adventure System (Complete)
- **Adventure Container UI**: Full-screen modal overlay with dark theme
  - Auto-show/hide functionality
  - Close button with hover effects
  - Beautiful slide-in animations
  - Styled in `css/story-adventure.css` (300+ lines)
- **Career-Specific Story Generation**: 24 unique contextual stories
  - Common Work (Business/Trade): 8 story variations
  - Military (Combat/Tactical): 8 story variations
  - The Arcane (Magic/Spell): 8 story variations
  - Each category has 4 choice types × 2 outcomes (success/failure)
- **Auto-End Mechanic**: Adventures automatically end after 3 failures
  - Displays completion screen with summary
  - Shows total choices, successes, and failures
- **Adventure System Integration**: Consolidated adventure management
  - Replaces multiple old classes with unified `AdventureSystem`
  - Manages adventure lifecycle, tracking, and rewards
  - Files: `src/llm/adventure-system.js`

### Added - LLM Integration
- **API Key Persistence**: Keys stored in localStorage
  - Persists across page refreshes and browser sessions
  - Auto-loads on page initialization
- **Real-time LLM Story Generation**: Using Mistral API
  - Context-aware stories based on character age/career
  - Dynamic choices based on previous outcomes
  - Success/failure probability calculation
- **Adventure Button State Management**: 
  - Disabled when no API key configured
  - Auto-enables when key is entered
  - Visual feedback (grayed out, tooltip)
- **Files Modified**: 
  - `src/llm/adventure-system.js`
  - `js/llm-integration.js`
  - `js/amulet-adventure-integration.js`
  - `js/career-based-adventure-integration.js`

### Fixed - Game State Management
- **Pause/Unpause During Adventures**: Game now properly freezes
  - Changed from `gameState.setPaused()` to `gameState.paused = true/false`
  - Game timer stops during adventure choices
  - Resumes after adventure completion
  - Verified: Age stays frozen during adventure
- **State Corruption Prevention**: Multiple fixes
  - Fixed null checks in state access
  - Added validation for game state operations
  - Prevented undefined property access
- **Files Modified**: `src/llm/adventure-system.js` (lines 75-76, 92)

### Fixed - Test Infrastructure
- **Test Setup Updates**: Updated for new consolidated classes
  - Loads `story-data.js` (StoryTreeData, StoryTreeManager, etc.)
  - Loads `career-analysis.js` (CareerWeights, ProbabilityCalculator, etc.)
  - Loads `adventure-system.js` (replaces old StoryAdventureManager)
  - 31 test suites passing
- **New Tests Added**:
  - `tests/adventure-system.test.js`
  - `tests/career-analysis.test.js`
  - `tests/story-data.test.js`
  - `tests/api-key-persistence.test.js` (20 tests)
  - `tests/adventure-console-errors.test.js`
- **Files Modified**: `tests/setup-llm-classes.js`

---

## [0.3.0] - 2025-10-09 - Story-Game Integration

### Added - Story Rewards System
- **StoryAdventureManager**: Core integration layer (282 lines)
  - Adventure lifecycle management
  - Success/failure tracking
  - Choice type classification (aggressive, diplomatic, cautious, creative)
  - Performance-based reward calculation
  - Skill XP application with proper mapping
  - Time advancement for long adventures (10+ turns)
  - Special unlocks for exceptional performance (15+ successes)
- **Skill Mapping**: Maps story skills to game skills
  - Aggressive → Strength
  - Diplomatic → Meditation
  - Cautious → Concentration
  - Creative → Mana control
- **Reward Formula**:
  - Base XP: 50-200 (scales with character level)
  - High success bonus: 1.5× multiplier (>75% with 5+ successes)
  - Early exit penalty: 0.8× multiplier (<10 turns)
  - XP awarded proportional to success rate
- **Files Created**: 
  - `src/llm/StoryAdventureManager.js`
  - `tests/story-adventure-manager.test.js` (40 tests)
  - `tests/story-game-integration.test.js` (16 tests)

### Added - Documentation
- **Roadmap**: Future improvements based on research paper
  - Phase 2: State management improvements (StateEncoder, StateDiff, etc.)
  - Phase 3: Advanced features and polish
  - Success metrics and technical considerations
- **Files Created**: `roadmap.md` (626 lines)

### Added - Career-Based Adventure System
- **Career Analysis**: Analyzes player's career path
  - Career weights and probability calculations
  - Career-specific prompt generation
  - Integration with adventure system
- **Files Created**:
  - `src/llm/career-analysis.js` (consolidated module)
  - Includes: CareerWeights, ProbabilityCalculator, CareerAnalyzer, CareerBasedPromptGenerator

### Added - Story Persistence
- **Story Tree Structure**: Tracks adventure choices and branches
  - Metadata: total choices, success/failure counts
  - Tree structure: parent-child choice relationships
  - Timestamp tracking for each decision
  - Depth tracking for visualization
- **Files Created**: 
  - `src/llm/story-data.js` (consolidated module)
  - Includes: StoryTreeData, StoryTreeManager, StoryTreeBuilder, StoryPersistenceManager

---

## [0.2.5] - 2025-10-08 - UI and Console Fixes

### Fixed - Console Errors
- **Logger Initialization**: Fixed "Cannot read properties of undefined (reading 'noConflict')"
  - Added safe checks for `log` availability
  - Fallback to console methods when loglevel unavailable
  - Applied across all LLM integration files
- **Files Fixed**:
  - `src/llm/StoryManager.js`
  - `src/llm/StoryAdventureManager.js`
  - `src/ui/WorldExplorationUI.js`
  - `src/ui/StoryAdventureUI.js`
  - `js/HackTimer.js`

### Fixed - UI Regressions
- **Checkbox Alignment**: Moved checkboxes to correct column
  - Checkboxes now under "Max level" header
  - "Skip" text now in separate column
  - Added CSS for proper centering
  - Files: `index.html`, `css/styles.css`
- **Loading State Issue**: Fixed stuck loading spinners
  - Properly clear spinner content after story generation
  - Fixed DOM mutation conflicts
  - Files: `src/ui/StoryAdventureUI.js`

### Fixed - TypeError Crashes
- **Safe DOM Access**: Added null checks in `checkSkillSkipped`
  - Check if row exists before accessing
  - Check if checkbox exists before reading `checked` property
  - Prevents crashes when DOM elements missing
  - Files: `js/main.js` (line 1007)

---

## [0.2.0] - 2025-10-07 - Major Refactoring and Fixes

### Added - Modular Architecture
- **Structured Source Directory**: Created organized `src/` directory
  - `src/config/`: Configuration files
  - `src/core/`: Core game logic (GameState, GameLoop, GameManager)
  - `src/entities/`: Entity classes (Task, Job, Skill, Item, Requirement)
  - `src/llm/`: LLM integration modules
  - `src/ui/`: UI update logic
  - `src/utils/`: Utility functions
- **Hybrid State Management**: Bridge between old and new architectures
  - `src/core/HybridStateManager.js`
  - Uses StateEncoder, StateValidator, StateDiff
  - Maintains compatibility with original global state

### Added - Research-Based LLM Features
- **State Encoding**: Structured JSON representation for LLM
  - `src/llm/StateEncoder.js` (367 lines)
  - Converts game state to/from JSON schema
  - Better narrative coherence
- **State Validation**: Consistency checking
  - `src/llm/StateValidator.js` (449 lines)
  - Validates state transitions
  - Prevents corruption
- **State Difference Tracking**: Efficient change tracking
  - `src/llm/StateDiff.js` (402 lines)
  - Tracks only what changes between turns
  - Reduces API token usage
- **Transition Classification**: Action vs. environment transitions
  - `src/llm/TransitionClassifier.js`
  - Separates player-driven from world-driven changes
- **World Rules**: Explicit rule system
  - `src/llm/WorldRules.js`
  - Maintains world consistency
- **Prompt Generation**: Context-aware prompt creation
  - `src/llm/PromptGenerator.js`
  - `src/llm/StoryPromptGenerator.js`
- **Character Encoding**: Character stats for LLM context
  - `src/llm/CharacterEncoder.js`
- **Mistral API Client**: API integration
  - `src/llm/MistralAPI.js`
  - Handles API calls, error handling, rate limiting

### Fixed - Critical Issues
- **Console Bloat**: Removed infinite retry loops
  - Replaced retry loops with graceful error handling
  - Minimal console logging
  - Files: `js/amulet-adventure-integration.js`
- **Missing Adventure Buttons**: Fixed initialization issues
  - Proper class loading sequence
  - Age-based button visibility working
  - Files: `js/amulet-adventure-integration.js`
- **ES6 Import Errors**: Removed problematic import statements
  - Removed ES6 imports from script files
  - Added global exports for browser compatibility
  - Fixed module loading order
  - Files: `src/llm/CareerAnalyzer.js`, `src/llm/CareerWeights.js`

### Fixed - Module Dependencies
- **Dependency Loading**: Fixed class availability issues
  - Created proper loading sequence
  - Added missing class definitions
  - Verified all dependencies load before usage
- **CareerAnalyzer Undefined**: Fixed module loading
  - Created missing `CareerWeights.js` class
  - Added global exports for both classes
  - Updated script includes in `index.html`

### Added - Comprehensive Testing
- **Test Infrastructure**: Jest testing framework
  - `package.json`: Test scripts and configuration
  - `tests/setup.js`: Test environment setup
  - `tests/setup-classes.js`: Entity test utilities
  - `tests/setup-llm-classes.js`: LLM test utilities
  - `tests/test-helpers.js`: Shared test helpers
- **Unit Tests**: Tests for all entity classes
  - `tests/task.test.js`
  - `tests/job.test.js`
  - `tests/skill.test.js`
  - `tests/item.test.js`
  - `tests/requirement.test.js`
- **LLM Tests**: Tests for LLM integration
  - `tests/mistral-api.test.js`
  - `tests/story-manager.test.js`
  - `tests/prompt-generator.test.js`
  - `tests/story-prompt-generator.test.js`
  - `tests/character-encoder.test.js`
- **Integration Tests**: Full system tests
  - `tests/integration.test.js`
  - `tests/game-loop-simple.test.js`
  - `tests/game-loop-pause.test.js`
  - `tests/performance.test.js`
  - `tests/error-handling.test.js`
  - `tests/utilities.test.js`
- **Regression Tests**: Bug fix verification
  - `tests/game-state-regression.test.js`
  - `tests/game-state-corruption.test.js`
  - `tests/api-key-adventure-corruption.test.js`
  - `tests/api-key-element-regression.test.js`
  - `tests/page-refresh-corruption.test.js`
  - `tests/ui-regression.test.js`
  - `tests/ui-data-corruption.test.js`
  - `tests/loading-state-fix.test.js`
  - `tests/browser-loading-state.test.js`
  - `tests/adventure-button-visibility.test.js`
  - `tests/manual-adventure-button.test.js`
- **Total Test Coverage**: ~9,593 LOC, 36 test files

### Added - Styling
- **Story Adventure CSS**: Overlay and modal styling
  - `css/story-adventure.css`
  - Dark theme modal overlay
  - Animations and transitions
  - Responsive design

---

## [0.1.0] - Initial Fork

### Added - Core Features from Upstream
- Original Progress Knight game mechanics
- Career progression system (Beggar → Chairman)
- Skill system with XP and levels
- Job system with income and requirements
- Item/Property system (Homeless → Grand palace)
- Rebirth/Prestige system
- Auto-promote and auto-learn features
- Dark mode theme
- Files from upstream:
  - `index.html`
  - `js/main.js` (~1,185 LOC)
  - `js/classes.js` (~260 LOC)
  - `js/HackTimer.js` (3rd party web worker timer)
  - `css/styles.css`
  - `css/dark.css`
  - `LICENSE` (Unlicense - Public Domain)
  - `README.md`

---

## Documentation Organization

### Kept Documentation
- `README.md` - Project overview
- `LICENSE` - Unlicense (public domain)
- `roadmap.md` - Strategic planning (626 lines)
- `LLM_SETUP_GUIDE.md` - User setup instructions
- `PROJECT_STRUCTURE_AUDIT.md` - Architecture analysis
- `CHANGELOG.md` - This file

### Archived Documentation (previously in root)
The following bug fix summaries have been consolidated into this CHANGELOG:
- Adventure System Fixes: ADVENTURE_BUTTON_FIX.md, ADVENTURE_SYSTEM_FIX.md, ADVENTURE_SYSTEM_FIXES.md, ADVENTURE_SYSTEM_FIXES_COMPLETE.md
- API Key Fixes: API_KEY_FIX.md, API_KEY_FIX_SUMMARY.md, API_KEY_ADVENTURE_CORRUPTION_FIX.md, API_KEY_AND_LLM_VERIFICATION.md
- Integration Fixes: AMULET_ADVENTURE_INTEGRATION.md, CAREER_ADVENTURE_INTEGRATION.md, HYBRID_INTEGRATION_SUMMARY.md
- Comprehensive Fixes: COMPREHENSIVE_FIXES_SUMMARY.md, COMPREHENSIVE_REGRESSION_FIX.md, COMPREHENSIVE_UI_FIX_SUMMARY.md, CRITICAL_FIXES_SUMMARY.md
- UI Fixes: UI_ALIGNMENT_FIXES_SUMMARY.md, UI_REGRESSION_ANALYSIS.md, UI_REGRESSION_FIX_SUMMARY.md, UI_REGRESSION_FIXES_SUMMARY.md, DYNAMIC_UI_REGRESSION_FIX.md
- State Fixes: GAME_STATE_REGRESSION_FIX.md, CORRUPTION_TESTS_COMPLETE.md
- Console Fixes: CONSOLE_BLOAT_AND_ALERT_FIX.md, FINAL_CONSOLE_ERROR_FIX.md, FINAL_REGRESSION_FIX.md
- Dependency Fixes: DEPENDENCY_FIXES_SUMMARY.md, ES6_IMPORT_FIX_SUMMARY.md, REGRESSION_ANALYSIS.md, REGRESSION_FIX_SUMMARY.md
- Implementation Docs: IMPLEMENTATION_COMPLETE.md, IMPLEMENTATION_SUMMARY.md, DEBUG_IMPLEMENTATION_SUMMARY.md
- Debug Guides: DEBUGGING_LOG.md, STORY_TREE_DEBUG_GUIDE.md, HOW_TO_SEE_IMPROVEMENTS.md
- Test Results: TEST_RESULTS.md

---

## Categories Reference

### Added
New features, files, or capabilities

### Changed
Changes to existing functionality

### Deprecated
Features marked for removal in future versions

### Removed
Deleted features or files

### Fixed
Bug fixes and error corrections

### Security
Security-related fixes and improvements

---

## Version Numbering

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible new features
- **PATCH**: Backwards-compatible bug fixes

Current version reflects the evolutionary nature of the fork:
- **0.x.x**: Pre-1.0 development phase (LLM integration experimental)
- **1.0.0**: First stable release with LLM features (target)

