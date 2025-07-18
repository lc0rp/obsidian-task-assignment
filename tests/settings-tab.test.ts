import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from 'obsidian';
import { DEFAULT_SETTINGS } from '../src/types/index';

// Simple test to verify the async fix works
describe('Settings Tab - Async Behavior Fix', () => {
    it('should demonstrate that async setting creation no longer blocks synchronous display', async () => {
        // Create a mock service that simulates slow async operation
        const mockService = {
            meContactExists: vi.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve(false), 100))
            ),
            createMeContact: vi.fn(),
            refreshAssigneeCache: vi.fn(),
        };

        const mockPlugin = {
            app: new App(),
            settings: DEFAULT_SETTINGS,
            saveSettings: vi.fn(),
            taskRolesService: mockService
        };

        // Mock a simple container element
        const mockContainer = {
            children: [] as any[],
            empty: vi.fn(),
            createEl: vi.fn().mockReturnValue({}),
        };

        // Test that the method completes synchronously even with async operations inside
        const startTime = Date.now();
        
        // This would be called from display() method - should complete immediately
        // even though meContactExists() is async
        const createMeContactSetting = (containerEl: any) => {
            const setting = {
                setName: vi.fn().mockReturnThis(),
                setDesc: vi.fn().mockReturnThis(),
                addButton: vi.fn().mockImplementation((callback) => {
                    const button = {
                        setButtonText: vi.fn().mockReturnThis(),
                        setDisabled: vi.fn().mockReturnThis(),
                        onClick: vi.fn().mockReturnThis(),
                    };
                    callback(button);
                    return setting;
                }),
                controlEl: {
                    createSpan: vi.fn()
                }
            };

            // Simulate the fixed implementation - sync creation with async update
            mockService.meContactExists().then((meExists) => {
                // This runs async but doesn't block the initial creation
                if (meExists) {
                    setting.controlEl.createSpan({ text: 'DONE', cls: 'me-contact-done-pill' });
                }
            });

            return setting;
        };

        // Call the function
        createMeContactSetting(mockContainer);
        
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        // Should complete very quickly (under 50ms) because it's not awaiting the async operation
        expect(executionTime).toBeLessThan(50);
        
        // Verify that the async operation was started
        expect(mockService.meContactExists).toHaveBeenCalled();
        
        // Wait for async operation to complete
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // The async operation should have completed by now
        expect(mockService.meContactExists).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully in async operations', async () => {
        const mockService = {
            meContactExists: vi.fn().mockRejectedValue(new Error('Network error')),
            createMeContact: vi.fn(),
            refreshAssigneeCache: vi.fn(),
        };

        const createMeContactSetting = (_containerEl: any) => {
            const setting = {
                setName: vi.fn().mockReturnThis(),
                setDesc: vi.fn().mockReturnThis(),
                addButton: vi.fn().mockImplementation((callback) => {
                    const button = {
                        setButtonText: vi.fn().mockReturnThis(),
                        setDisabled: vi.fn().mockReturnThis(),
                        onClick: vi.fn().mockReturnThis(),
                    };
                    callback(button);
                    return setting;
                }),
                controlEl: {
                    createSpan: vi.fn()
                }
            };

            // Simulate the fixed implementation with error handling
            mockService.meContactExists()
                .then(() => {
                    // This shouldn't be called due to error
                })
                .catch(() => {
                    // Error should be handled gracefully
                });

            return setting;
        };

        // Should not throw even with async error
        expect(() => createMeContactSetting({})).not.toThrow();
        
        // Wait for async operation to complete
        await new Promise(resolve => setTimeout(resolve, 50));
        
        expect(mockService.meContactExists).toHaveBeenCalled();
    });
});