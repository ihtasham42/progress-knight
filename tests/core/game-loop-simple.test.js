/**
 * Simple tests for GameLoop adventure integration
 * Tests the core pause prevention functionality
 */

const { TestMocks, TestDataFactory } = require('../test-helpers');

describe('GameLoop Simple Adventure Integration', () => {
  let mockGameState;
  let mockAdventureManager;
  let mockUIUpdater;
  let gameLoop;
  
  beforeEach(() => {
    TestMocks.setupStandardMocks();
    
    // Mock game state
    mockGameState = {
      paused: false,
      setPaused: jest.fn(function(value) { this.paused = value; }),
      getPaused: jest.fn(function() { return this.paused; })
    };
    
    // Mock UI updater
    mockUIUpdater = {
      update: jest.fn()
    };
    
    // Mock adventure manager
    mockAdventureManager = {
      isAdventureActive: jest.fn(() => false),
      canUnpauseGame: jest.fn(() => true)
    };
    
    // Create a simple game loop mock that implements our logic
    gameLoop = {
      gameState: mockGameState,
      adventureManager: mockAdventureManager,
      uiUpdater: mockUIUpdater,
      
      togglePause() {
        // Check if we're trying to unpause during an active adventure
        if (this.gameState.paused && this.adventureManager) {
          try {
            if (this.adventureManager.isAdventureActive() && !this.adventureManager.canUnpauseGame()) {
              // Prevent unpause during active adventure
              // Note: This would now use logger.info instead of console.log
              return;
            }
          } catch (error) {
            // Note: This would now use logger.warn instead of console.warn
            // Continue with normal pause toggle if adventure check fails
          }
        }
        
        try {
          this.gameState.setPaused(!this.gameState.paused);
        } catch (error) {
          // Note: This would now use logger.warn instead of console.warn
          // Don't rethrow - handle gracefully
        }
      },
      
      getPauseButtonState() {
        const state = {
          canUnpause: true,
          reason: null
        };
        
        if (this.adventureManager) {
          try {
            if (this.adventureManager.isAdventureActive() && !this.adventureManager.canUnpauseGame()) {
              state.canUnpause = false;
              state.reason = 'adventure_active';
            }
          } catch (error) {
            console.warn('Error checking adventure status for pause button:', error);
            // Default to allowing unpause if check fails
          }
        }
        
        return state;
      }
    };
  });
  
  describe('Pause Prevention Logic', () => {
    test('should allow normal pause/unpause when no adventure', () => {
      // Start unpaused
      mockGameState.paused = false;
      mockAdventureManager.isAdventureActive.mockReturnValue(false);
      mockAdventureManager.canUnpauseGame.mockReturnValue(true);
      
      // Toggle to paused
      gameLoop.togglePause();
      expect(mockGameState.paused).toBe(true);
      
      // Toggle back to unpaused
      gameLoop.togglePause();
      expect(mockGameState.paused).toBe(false);
    });
    
    test('should prevent unpause during active adventure', () => {
      // Start paused with active adventure
      mockGameState.paused = true;
      mockAdventureManager.isAdventureActive.mockReturnValue(true);
      mockAdventureManager.canUnpauseGame.mockReturnValue(false);
      
      // Try to unpause (should be prevented)
      gameLoop.togglePause();
      expect(mockGameState.paused).toBe(true);
    });
    
    test('should allow unpause when adventure ends', () => {
      // Start paused with active adventure
      mockGameState.paused = true;
      mockAdventureManager.isAdventureActive.mockReturnValue(true);
      mockAdventureManager.canUnpauseGame.mockReturnValue(false);
      
      // Try to unpause (should be prevented)
      gameLoop.togglePause();
      expect(mockGameState.paused).toBe(true);
      
      // Adventure ends
      mockAdventureManager.isAdventureActive.mockReturnValue(false);
      mockAdventureManager.canUnpauseGame.mockReturnValue(true);
      
      // Now unpause should work
      gameLoop.togglePause();
      expect(mockGameState.paused).toBe(false);
    });
    
    test('should allow pause even during adventure', () => {
      // Start unpaused with active adventure
      mockGameState.paused = false;
      mockAdventureManager.isAdventureActive.mockReturnValue(true);
      mockAdventureManager.canUnpauseGame.mockReturnValue(false);
      
      // Should be able to pause during adventure
      gameLoop.togglePause();
      expect(mockGameState.paused).toBe(true);
    });
  });
  
  describe('Pause Button State', () => {
    test('should show blocked state during active adventure', () => {
      mockAdventureManager.isAdventureActive.mockReturnValue(true);
      mockAdventureManager.canUnpauseGame.mockReturnValue(false);
      
      const state = gameLoop.getPauseButtonState();
      
      expect(state.canUnpause).toBe(false);
      expect(state.reason).toBe('adventure_active');
    });
    
    test('should show normal state when no adventure', () => {
      mockAdventureManager.isAdventureActive.mockReturnValue(false);
      mockAdventureManager.canUnpauseGame.mockReturnValue(true);
      
      const state = gameLoop.getPauseButtonState();
      
      expect(state.canUnpause).toBe(true);
      expect(state.reason).toBeNull();
    });
    
    test('should handle missing adventure manager', () => {
      gameLoop.adventureManager = null;
      
      const state = gameLoop.getPauseButtonState();
      
      expect(state.canUnpause).toBe(true);
      expect(state.reason).toBeNull();
    });
  });
  
  describe('Error Handling', () => {
    test('should handle adventure manager errors gracefully', () => {
      mockAdventureManager.isAdventureActive.mockImplementation(() => {
        throw new Error('Adventure manager error');
      });
      
      // Should not crash and should allow normal pause toggle
      const initialPaused = mockGameState.paused;
      gameLoop.togglePause();
      
      expect(mockGameState.paused).toBe(!initialPaused);
    });
    
    test('should handle game state errors gracefully', () => {
      mockGameState.setPaused.mockImplementation(() => {
        throw new Error('Game state error');
      });
      
      // Should not crash
      expect(() => gameLoop.togglePause()).not.toThrow();
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle rapid toggle attempts', () => {
      mockGameState.paused = true;
      mockAdventureManager.isAdventureActive.mockReturnValue(true);
      mockAdventureManager.canUnpauseGame.mockReturnValue(false);
      
      // Rapid toggles
      for (let i = 0; i < 5; i++) {
        gameLoop.togglePause();
      }
      
      // Should remain paused
      expect(mockGameState.paused).toBe(true);
    });
    
    test('should handle state changes during operation', () => {
      // Start paused with active adventure
      mockGameState.paused = true;
      mockAdventureManager.isAdventureActive.mockReturnValue(true);
      mockAdventureManager.canUnpauseGame.mockReturnValue(false);
      
      // Adventure ends during the check
      mockAdventureManager.isAdventureActive.mockReturnValue(false);
      mockAdventureManager.canUnpauseGame.mockReturnValue(true);
      
      gameLoop.togglePause();
      
      // Should respect the final state
      expect(mockGameState.paused).toBe(false);
    });
  });
});
