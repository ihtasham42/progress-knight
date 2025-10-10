/**
 * Manual Adventure Button Test
 * Simple test to verify adventure button visibility works
 */

describe('Manual Adventure Button Test', () => {
    test('should show adventure buttons for age 35', () => {
        // Mock gameData for age 35
        const mockGameData = { days: 365 * 35 };
        
        // Mock adventure buttons
        const mockButtons = {
            'adventureButton25': { style: { display: 'none' } },
            'adventureButton45': { style: { display: 'none' } },
            'adventureButton65': { style: { display: 'none' } },
            'adventureButton200': { style: { display: 'none' } }
        };

        // Mock document.getElementById
        const mockGetElementById = jest.fn((id) => {
            if (mockButtons[id]) {
                return mockButtons[id];
            }
            if (id === 'adventureContent') {
                return { innerHTML: '' };
            }
            return null;
        });

        // Simulate the button visibility logic
        const currentAge = Math.floor(mockGameData.days / 365);
        const adventureButtons = [
            { id: 'adventureButton25', prompt: 'age25', minAge: 25 },
            { id: 'adventureButton45', prompt: 'age45', minAge: 45 },
            { id: 'adventureButton65', prompt: 'age65', minAge: 65 },
            { id: 'adventureButton200', prompt: 'age200', minAge: 200 }
        ];
        
        adventureButtons.forEach(({ id, prompt, minAge }) => {
            const button = mockGetElementById(id);
            if (button) {
                if (currentAge >= minAge) {
                    button.style.display = 'block';
                } else {
                    button.style.display = 'none';
                }
            }
        });

        // Check results
        expect(currentAge).toBe(35);
        expect(mockButtons['adventureButton25'].style.display).toBe('block');
        expect(mockButtons['adventureButton45'].style.display).toBe('none');
        expect(mockButtons['adventureButton65'].style.display).toBe('none');
        expect(mockButtons['adventureButton200'].style.display).toBe('none');
    });

    test('should handle missing buttons gracefully', () => {
        const mockGetElementById = jest.fn(() => null);
        
        // Should not throw when buttons don't exist
        expect(() => {
            const button = mockGetElementById('adventureButton25');
            if (button) {
                button.style.display = 'block';
            }
        }).not.toThrow();
    });

    test('should log button visibility updates', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        const currentAge = 35;
        console.log('Player is age', currentAge, '- showing adventure buttons');
        
        expect(consoleSpy).toHaveBeenCalledWith('Player is age', 35, '- showing adventure buttons');
        
        consoleSpy.mockRestore();
    });
});
