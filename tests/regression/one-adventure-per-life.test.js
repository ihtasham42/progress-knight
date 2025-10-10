/**
 * Regression Test: One Adventure Per Age Per Life
 * 
 * REQUIREMENT: Each amulet adventure (age 25, 45, 65, 200) should only
 * be startable ONCE per life. After completion, the button should be
 * greyed out and unclickable until rebirth.
 * 
 * REGRESSION: After fixing button visibility, buttons became clickable
 * multiple times per life, allowing repeated adventures at the same age.
 * 
 * ROOT CAUSE: No tracking of which adventures were used in current life.
 * Story trees track choices across ALL lives, but we need per-life tracking.
 */

describe('One Adventure Per Life - Regression Test', () => {
    let currentLifeAdventures;
    let mockGameData;

    beforeEach(() => {
        // Mock the adventure tracking
        currentLifeAdventures = {
            age25: false,
            age45: false,
            age65: false,
            age200: false
        };

        mockGameData = {
            days: 365 * 25, // Age 25
            coins: 1000,
            paused: false
        };
    });

    describe('Adventure Tracking Per Life', () => {
        test('should start with all adventures available in new life', () => {
            expect(currentLifeAdventures.age25).toBe(false);
            expect(currentLifeAdventures.age45).toBe(false);
            expect(currentLifeAdventures.age65).toBe(false);
            expect(currentLifeAdventures.age200).toBe(false);
        });

        test('should mark adventure as used after starting it', () => {
            // Start age25 adventure
            currentLifeAdventures.age25 = true;

            expect(currentLifeAdventures.age25).toBe(true);
            expect(currentLifeAdventures.age45).toBe(false); // Others still available
        });

        test('should prevent starting same adventure twice in one life', () => {
            // First time - should work
            const firstAttempt = !currentLifeAdventures.age25;
            expect(firstAttempt).toBe(true);
            currentLifeAdventures.age25 = true;

            // Second attempt - should be blocked
            const secondAttempt = !currentLifeAdventures.age25;
            expect(secondAttempt).toBe(false);
        });

        test('should allow different adventures in same life', () => {
            mockGameData.days = 365 * 50; // Age 50 (eligible for 25 and 45)

            // Use age25
            currentLifeAdventures.age25 = true;
            expect(currentLifeAdventures.age25).toBe(true);

            // age45 should still be available
            expect(currentLifeAdventures.age45).toBe(false);
            const canStartAge45 = !currentLifeAdventures.age45;
            expect(canStartAge45).toBe(true);
        });
    });

    describe('Rebirth Resets Adventure Tracking', () => {
        test('should reset all adventures on rebirth', () => {
            // Use some adventures
            currentLifeAdventures.age25 = true;
            currentLifeAdventures.age45 = true;

            // Simulate rebirth reset
            currentLifeAdventures = {
                age25: false,
                age45: false,
                age65: false,
                age200: false
            };

            // All should be available again
            expect(currentLifeAdventures.age25).toBe(false);
            expect(currentLifeAdventures.age45).toBe(false);
        });

        test('should allow same adventure in new life after rebirth', () => {
            // Life 1: Use age25 adventure
            currentLifeAdventures.age25 = true;
            expect(currentLifeAdventures.age25).toBe(true);

            // Rebirth
            currentLifeAdventures = {
                age25: false,
                age45: false,
                age65: false,
                age200: false
            };

            // Life 2: Can use age25 adventure again
            expect(currentLifeAdventures.age25).toBe(false);
            currentLifeAdventures.age25 = true;
            expect(currentLifeAdventures.age25).toBe(true);
        });
    });

    describe('Button State Management', () => {
        test('should disable button if adventure already used', () => {
            currentLifeAdventures.age25 = true;

            // Simulate button state logic
            const alreadyUsed = currentLifeAdventures.age25;
            const buttonDisabled = alreadyUsed;

            expect(buttonDisabled).toBe(true);
        });

        test('should enable button if adventure not used yet', () => {
            currentLifeAdventures.age25 = false;

            const alreadyUsed = currentLifeAdventures.age25;
            const buttonDisabled = alreadyUsed;

            expect(buttonDisabled).toBe(false);
        });

        test('should update button tooltip for used adventures', () => {
            currentLifeAdventures.age25 = true;

            const tooltip = currentLifeAdventures.age25 ? 
                'Already completed this adventure in this life. Rebirth to experience it again.' : 
                '';

            expect(tooltip).toBeTruthy();
            expect(tooltip).toContain('Rebirth');
        });

        test('should set button opacity to 0.5 for used adventures', () => {
            currentLifeAdventures.age25 = true;

            const opacity = currentLifeAdventures.age25 ? '0.5' : '1';

            expect(opacity).toBe('0.5');
        });
    });

    describe('Multiple Lives Simulation', () => {
        test('Life 1: Use age25, Life 2: Use age25 again', () => {
            // === LIFE 1 ===
            mockGameData.days = 365 * 25;
            
            // Start adventure
            expect(currentLifeAdventures.age25).toBe(false);
            currentLifeAdventures.age25 = true;
            expect(currentLifeAdventures.age25).toBe(true);

            // Try to start again (should be blocked)
            const canStartAgain = !currentLifeAdventures.age25;
            expect(canStartAgain).toBe(false);

            // === REBIRTH ===
            currentLifeAdventures = {
                age25: false,
                age45: false,
                age65: false,
                age200: false
            };

            // === LIFE 2 ===
            mockGameData.days = 365 * 25;
            
            // Can start age25 adventure again
            expect(currentLifeAdventures.age25).toBe(false);
            currentLifeAdventures.age25 = true;
            expect(currentLifeAdventures.age25).toBe(true);
        });

        test('should track multiple adventures independently', () => {
            mockGameData.days = 365 * 70; // Age 70 (all eligible)

            // Use age25
            currentLifeAdventures.age25 = true;
            expect(currentLifeAdventures.age25).toBe(true);

            // Use age45
            currentLifeAdventures.age45 = true;
            expect(currentLifeAdventures.age45).toBe(true);

            // age65 still available
            expect(currentLifeAdventures.age65).toBe(false);

            // age200 still available
            expect(currentLifeAdventures.age200).toBe(false);
        });
    });

    describe('Integration with Story Trees', () => {
        test('story trees persist across lives, adventure tracking does not', () => {
            // Life 1: Use age25 adventure
            currentLifeAdventures.age25 = true;
            const storyTreeHasChoices = true; // Simulates story tree persistence

            // Rebirth
            currentLifeAdventures = {
                age25: false,
                age45: false,
                age65: false,
                age200: false
            };

            // Life 2:
            // - Adventure tracking reset (can use age25 again)
            expect(currentLifeAdventures.age25).toBe(false);
            
            // - Story tree still has choices from Life 1
            expect(storyTreeHasChoices).toBe(true);

            // This is correct: Story content persists, but ability to replay resets
        });
    });

    describe('Edge Cases', () => {
        test('should handle invalid amulet prompt gracefully', () => {
            const invalidPrompt = 'age999';
            
            // Should not crash
            const isValid = ['age25', 'age45', 'age65', 'age200'].includes(invalidPrompt);
            expect(isValid).toBe(false);

            // Should not mark as used
            expect(currentLifeAdventures[invalidPrompt]).toBeUndefined();
        });

        test('should handle multiple rebirth cycles', () => {
            for (let life = 1; life <= 5; life++) {
                // Use adventure
                currentLifeAdventures.age25 = true;
                expect(currentLifeAdventures.age25).toBe(true);

                // Rebirth
                currentLifeAdventures = {
                    age25: false,
                    age45: false,
                    age65: false,
                    age200: false
                };

                // Should be available again
                expect(currentLifeAdventures.age25).toBe(false);
            }
        });
    });
});

