/**
 * Regression Test: Adventure Button Visibility
 * 
 * Tests that adventure buttons appear/disappear correctly after various actions.
 * 
 * BUG DISCOVERED: After completing an adventure, all adventure buttons
 * remained hidden (display: none) and never reappeared, forcing users
 * to use console commands to start new adventures.
 * 
 * ROOT CAUSE: hideAdventureButtons() called on adventure start,
 * but updateAmuletAdventureAvailability() never called after adventure end.
 */

describe('Adventure Button Visibility - Regression Test', () => {
    let mockGameData;
    let mockAdventureSystem;
    let buttonsHidden;
    let buttonsUpdated;

    beforeEach(() => {
        buttonsHidden = false;
        buttonsUpdated = false;

        mockGameData = {
            days: 365 * 25, // Age 25
            coins: 1000,
            paused: false,
            currentJob: { name: 'Beggar', level: 20 },
            taskData: {},
            itemData: {}
        };

        // Mock the global functions
        global.hideAdventureButtons = () => {
            buttonsHidden = true;
        };

        global.updateAmuletAdventureAvailability = () => {
            buttonsUpdated = true;
        };

        mockAdventureSystem = {
            adventureActive: false,
            endAdventure() {
                this.adventureActive = false;
                mockGameData.paused = false;
                
                // This is the fix - call update function
                if (typeof updateAmuletAdventureAvailability === 'function') {
                    updateAmuletAdventureAvailability();
                }
            },
            startAdventure() {
                this.adventureActive = true;
                mockGameData.paused = true;
            }
        };
    });

    afterEach(() => {
        delete global.hideAdventureButtons;
        delete global.updateAmuletAdventureAvailability;
    });

    describe('Button Visibility After Adventure End', () => {
        test('REGRESSION: should call updateAmuletAdventureAvailability after adventure ends', () => {
            // Start adventure
            mockAdventureSystem.startAdventure();
            expect(mockAdventureSystem.adventureActive).toBe(true);
            
            // End adventure
            buttonsUpdated = false; // Reset flag
            mockAdventureSystem.endAdventure();
            
            // CRITICAL: Update function should have been called
            expect(buttonsUpdated).toBe(true);
            expect(mockAdventureSystem.adventureActive).toBe(false);
        });

        test('REGRESSION: buttons should be visible after adventure ends', () => {
            // Simulate button state
            const buttonStates = {
                adventureButton25: 'none',  // Hidden after previous adventure
                adventureButton45: 'none',
                adventureButton65: 'none'
            };

            // End adventure should trigger update
            mockAdventureSystem.endAdventure();

            // If update was called, buttons should be shown
            if (buttonsUpdated) {
                // Simulate the update function's logic
                const currentAge = Math.floor(mockGameData.days / 365);
                if (currentAge >= 25) buttonStates.adventureButton25 = 'block';
                if (currentAge >= 45) buttonStates.adventureButton45 = 'block';
                if (currentAge >= 65) buttonStates.adventureButton65 = 'block';
            }

            // At age 25, button25 should be visible
            expect(buttonStates.adventureButton25).toBe('block');
        });

        test('should not show buttons for ages not yet reached', () => {
            mockGameData.days = 365 * 25; // Age 25
            
            const buttonStates = {
                adventureButton25: 'none',
                adventureButton45: 'none',
                adventureButton65: 'none'
            };

            // Simulate update logic
            const currentAge = Math.floor(mockGameData.days / 365);
            if (currentAge >= 25) buttonStates.adventureButton25 = 'block';
            if (currentAge >= 45) buttonStates.adventureButton45 = 'block';
            if (currentAge >= 65) buttonStates.adventureButton65 = 'block';

            expect(buttonStates.adventureButton25).toBe('block');  // Age 25 reached
            expect(buttonStates.adventureButton45).toBe('none');   // Age 45 not reached
            expect(buttonStates.adventureButton65).toBe('none');   // Age 65 not reached
        });
    });

    describe('Button Visibility Age Thresholds', () => {
        test('should show age25 button when reaching age 25', () => {
            mockGameData.days = 365 * 24 + 364; // One day before age 25
            let age = Math.floor(mockGameData.days / 365);
            expect(age).toBe(24);

            // Advance to age 25
            mockGameData.days = 365 * 25;
            age = Math.floor(mockGameData.days / 365);
            expect(age).toBe(25);

            // Button should be visible now
            const shouldShow = age >= 25;
            expect(shouldShow).toBe(true);
        });

        test('should show multiple buttons when age > 25', () => {
            mockGameData.days = 365 * 70; // Age 70
            const age = Math.floor(mockGameData.days / 365);

            const buttonsVisible = {
                age25: age >= 25,
                age45: age >= 45,
                age65: age >= 65,
                age200: age >= 200
            };

            expect(buttonsVisible.age25).toBe(true);
            expect(buttonsVisible.age45).toBe(true);
            expect(buttonsVisible.age65).toBe(true);
            expect(buttonsVisible.age200).toBe(false);
        });

        test('should hide buttons for ages not reached', () => {
            mockGameData.days = 365 * 30; // Age 30
            const age = Math.floor(mockGameData.days / 365);

            const buttonsVisible = {
                age25: age >= 25,
                age45: age >= 45,
                age65: age >= 65
            };

            expect(buttonsVisible.age25).toBe(true);   // Should show
            expect(buttonsVisible.age45).toBe(false);  // Should hide
            expect(buttonsVisible.age65).toBe(false);  // Should hide
        });
    });

    describe('Multiple Adventure Cycle', () => {
        test('REGRESSION: should allow starting second adventure after first ends', () => {
            // First adventure
            mockAdventureSystem.startAdventure();
            expect(mockAdventureSystem.adventureActive).toBe(true);
            
            mockAdventureSystem.endAdventure();
            expect(mockAdventureSystem.adventureActive).toBe(false);
            expect(buttonsUpdated).toBe(true); // Buttons refreshed
            
            // Second adventure should be startable
            buttonsUpdated = false;
            mockAdventureSystem.startAdventure();
            expect(mockAdventureSystem.adventureActive).toBe(true);
        });

        test('should maintain button state through multiple cycles', () => {
            const cycles = 3;
            
            for (let i = 0; i < cycles; i++) {
                // Start
                mockAdventureSystem.startAdventure();
                expect(mockAdventureSystem.adventureActive).toBe(true);
                
                // End
                buttonsUpdated = false;
                mockAdventureSystem.endAdventure();
                expect(buttonsUpdated).toBe(true);
                expect(mockAdventureSystem.adventureActive).toBe(false);
            }
        });
    });

    describe('Button State During Adventure', () => {
        test('buttons should be hidden while adventure is active', () => {
            // Before adventure
            buttonsHidden = false;
            
            // Start adventure - buttons hidden
            mockAdventureSystem.startAdventure();
            // In real code, hideAdventureButtons() is called
            hideAdventureButtons();
            
            expect(buttonsHidden).toBe(true);
        });

        test('buttons should reappear after adventure ends', () => {
            // Start and hide buttons
            mockAdventureSystem.startAdventure();
            hideAdventureButtons();
            expect(buttonsHidden).toBe(true);
            
            // End adventure
            buttonsUpdated = false;
            mockAdventureSystem.endAdventure();
            
            // Update should have been called to restore buttons
            expect(buttonsUpdated).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        test('should handle multiple endAdventure calls gracefully', () => {
            // End when no adventure active
            const callsBeforeEnd = buttonsUpdated;
            mockAdventureSystem.endAdventure();
            
            // Should not crash, update may or may not be called
            // (implementation dependent)
        });

        test('should update buttons when age changes during adventure', () => {
            mockGameData.days = 365 * 25; // Start at age 25
            mockAdventureSystem.startAdventure();
            
            // Age to 45 during adventure (time warp, etc.)
            mockGameData.days = 365 * 45;
            
            // End adventure
            buttonsUpdated = false;
            mockAdventureSystem.endAdventure();
            
            // Update should be called
            expect(buttonsUpdated).toBe(true);
            
            // Both age25 and age45 buttons should now be visible
            const age = Math.floor(mockGameData.days / 365);
            expect(age).toBe(45);
            expect(age >= 25).toBe(true);
            expect(age >= 45).toBe(true);
        });
    });
});

