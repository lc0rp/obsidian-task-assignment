import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskQueryService } from '../src/services/task-query.service';
import { TaskCacheService } from '../src/services/task-cache.service';
import { ViewFilters, Role, TaskStatus, TaskPriority } from '../src/types';

// Mock plugin
const mockPlugin = {
    getVisibleRoles: vi.fn(() => [
        { id: 'driver', name: 'Driver', icon: '🚗' },
        { id: 'approver', name: 'Approver', icon: '👍' }
    ] as Role[])
};

const mockTaskCacheService = {} as TaskCacheService;

describe('TaskQueryService', () => {
    let service: TaskQueryService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new TaskQueryService(mockPlugin as any, mockTaskCacheService);
    });

    it('should build query from role filters', () => {
        const filters: ViewFilters = {
            roles: ['driver', 'approver'],
            people: [],
            companies: [],
            statuses: [],
            tags: [],
            priorities: []
        };

        const query = service.buildTaskQueryFromFilters(filters);
        expect(query).toBe('((description includes 🚗) OR (description includes 👍))');
    });

    it('should handle "none-set" role filter', () => {
        const filters: ViewFilters = {
            roles: ['none-set'],
            people: [],
            companies: [],
            statuses: [],
            tags: [],
            priorities: []
        };

        const query = service.buildTaskQueryFromFilters(filters);
        expect(query).toBe('((description does not include 🚗) AND (description does not include 👍))');
    });

    it('should build query from people filters', () => {
        const filters: ViewFilters = {
            roles: [],
            people: ['john', 'jane'],
            companies: [],
            statuses: [],
            tags: [],
            priorities: []
        };

        const query = service.buildTaskQueryFromFilters(filters);
        expect(query).toBe('(((description regex matches /🚗::(?:(?!\\s+\\[[^\\]]+::).)*john/) OR (description regex matches /👍::(?:(?!\\s+\\[[^\\]]+::).)*john/)) OR ((description regex matches /🚗::(?:(?!\\s+\\[[^\\]]+::).)*jane/) OR (description regex matches /👍::(?:(?!\\s+\\[[^\\]]+::).)*jane/)))');
    });

    it('should build query from company filters', () => {
        const filters: ViewFilters = {
            roles: [],
            people: [],
            companies: ['acme', 'corp'],
            statuses: [],
            tags: [],
            priorities: []
        };

        const query = service.buildTaskQueryFromFilters(filters);
        expect(query).toBe('(((description regex matches /🚗::(?:(?!\\s+\\[[^\\]]+::).)*\\+acme/) OR (description regex matches /👍::(?:(?!\\s+\\[[^\\]]+::).)*\\+acme/)) OR ((description regex matches /🚗::(?:(?!\\s+\\[[^\\]]+::).)*\\+corp/) OR (description regex matches /👍::(?:(?!\\s+\\[[^\\]]+::).)*\\+corp/)))');
    });

    it('should build query from status filters', () => {
        const filters: ViewFilters = {
            roles: [],
            people: [],
            companies: [],
            statuses: [TaskStatus.TODO, TaskStatus.DONE],
            tags: [],
            priorities: []
        };

        const query = service.buildTaskQueryFromFilters(filters);
        // When both todo and done are selected, no status filter is needed
        // as this would match all tasks - avoids Boolean combination error
        expect(query).toBe('filter by function task.status.type !== \'IN_PROGRESS\'\nfilter by function task.status.type !== \'CANCELLED\'');
    });

    it('should build query from tag filters', () => {
        const filters: ViewFilters = {
            roles: [],
            people: [],
            companies: [],
            statuses: [],
            tags: ['urgent', 'project'],
            priorities: []
        };

        const query = service.buildTaskQueryFromFilters(filters);
        expect(query).toBe('(#urgent OR #project)');
    });

    it('should build query from priority filters', () => {
        const filters: ViewFilters = {
            roles: [],
            people: [],
            companies: [],
            statuses: [],
            tags: [],
            priorities: [TaskPriority.HIGH, TaskPriority.MEDIUM]
        };

        const query = service.buildTaskQueryFromFilters(filters);
        expect(query).toBe('(priority is high) OR (priority is medium)');
    });

    it('should combine multiple filter types with AND', () => {
        const filters: ViewFilters = {
            roles: ['driver'],
            statuses: [TaskStatus.TODO],
            tags: ['urgent'],
            priorities: [TaskPriority.HIGH]
        };
    
        const query = service.buildTaskQueryFromFilters(filters);
        expect(query).toBe('(description includes 🚗)\nnot done\nfilter by function task.status.type !== \'IN_PROGRESS\'\npriority is high\n#urgent');
    });

    it('should return empty string for no filters', () => {
        const filters: ViewFilters = {
            roles: [],
            people: [],
            companies: [],
            statuses: [],
            tags: [],
            priorities: []
        };

        const query = service.buildTaskQueryFromFilters(filters);
        expect(query).toBe('');
    });

    it('should handle unknown role IDs', () => {
        const filters: ViewFilters = {
            roles: ['unknown-role'],
            people: [],
            companies: [],
            statuses: [],
            tags: [],
            priorities: []
        };

        const query = service.buildTaskQueryFromFilters(filters);
        expect(query).toBe('');
    });

    it('should handle mixed role types', () => {
        const filters: ViewFilters = {
            roles: ['driver', 'none-set', 'unknown-role'],
            people: [],
            companies: [],
            statuses: [],
            tags: [],
            priorities: []
        };

        const query = service.buildTaskQueryFromFilters(filters);
        expect(query).toBe('((description includes 🚗) OR ((description does not include 🚗) AND (description does not include 👍)))');
    });

    it('should handle todo+done combination with other filters to avoid Boolean combination error', () => {
        const filters: ViewFilters = {
            roles: ['driver'],
            people: [],
            companies: [],
            statuses: [TaskStatus.TODO, TaskStatus.DONE], // This should not generate "(done OR not done)" error
            tags: [],
            priorities: []
        };

        const query = service.buildTaskQueryFromFilters(filters);
        // Should only include role filter, not status filter to avoid Boolean combination error
        expect(query).toBe('(description includes 🚗)\nfilter by function task.status.type !== \'IN_PROGRESS\'\nfilter by function task.status.type !== \'CANCELLED\'');
    });

    it('should handle "all" role filter by skipping role filtering', () => {
        const filters: ViewFilters = {
            roles: ['all'],
            people: ['john'],
            companies: [],
            statuses: [],
            tags: [],
            priorities: []
        };

        const query = service.buildTaskQueryFromFilters(filters);
        expect(query).toBe('(((description regex matches /🚗::(?:(?!\\s+\\[[^\\]]+::).)*john/) OR (description regex matches /👍::(?:(?!\\s+\\[[^\\]]+::).)*john/)))');
    });

    it('should handle mixed "all" with other roles by skipping role filtering', () => {
        const filters: ViewFilters = {
            roles: ['driver', 'all'],
            people: [],
            companies: [],
            statuses: [],
            tags: [],
            priorities: []
        };

        const query = service.buildTaskQueryFromFilters(filters);
        expect(query).toBe('');
    });

    describe('Cross Product Filtering', () => {
        it('should use cross product when both roles and people filters are present', () => {
            const filters: ViewFilters = {
                roles: ['driver', 'approver'],
                people: ['Luke', 'Jane'],
                companies: [],
                statuses: [],
                tags: [],
                priorities: []
            };

            const query = service.buildTaskQueryFromFilters(filters);
            // Should create (role1::assignee1) OR (role1::assignee2) OR (role2::assignee1) OR (role2::assignee2)
            expect(query).toBe('((description regex matches /🚗::(?:(?!\\s+\\[[^\\]]+::).)*Luke/) OR (description regex matches /🚗::(?:(?!\\s+\\[[^\\]]+::).)*Jane/) OR (description regex matches /👍::(?:(?!\\s+\\[[^\\]]+::).)*Luke/) OR (description regex matches /👍::(?:(?!\\s+\\[[^\\]]+::).)*Jane/))');
        });

        it('should use cross product when both roles and companies filters are present', () => {
            const filters: ViewFilters = {
                roles: ['driver'],
                people: [],
                companies: ['Acme', 'Corp'],
                statuses: [],
                tags: [],
                priorities: []
            };

            const query = service.buildTaskQueryFromFilters(filters);
            // Should create (role1::company1) OR (role1::company2)
            expect(query).toBe('((description regex matches /🚗::(?:(?!\\s+\\[[^\\]]+::).)*\\+Acme/) OR (description regex matches /🚗::(?:(?!\\s+\\[[^\\]]+::).)*\\+Corp/))');
        });

        it('should use cross product when roles, people, and companies are all present', () => {
            const filters: ViewFilters = {
                roles: ['driver'],
                people: ['Luke'],
                companies: ['Acme'],
                statuses: [],
                tags: [],
                priorities: []
            };

            const query = service.buildTaskQueryFromFilters(filters);
            // Should create (role1::person1) OR (role1::company1)
            expect(query).toBe('((description regex matches /🚗::(?:(?!\\s+\\[[^\\]]+::).)*Luke/) OR (description regex matches /🚗::(?:(?!\\s+\\[[^\\]]+::).)*\\+Acme/))');
        });

        it('should exclude "none-set" role from cross product when other roles are present', () => {
            const filters: ViewFilters = {
                roles: ['driver', 'none-set'],
                people: ['Luke'],
                companies: [],
                statuses: [],
                tags: [],
                priorities: []
            };

            const query = service.buildTaskQueryFromFilters(filters);
            // Should only create cross product for actual roles, not "none-set"
            expect(query).toBe('(description regex matches /🚗::(?:(?!\\s+\\[[^\\]]+::).)*Luke/)');
        });

        it('should return no tasks when only "none-set" role is crossed with assignees', () => {
            const filters: ViewFilters = {
                roles: ['none-set'],
                people: ['Luke'],
                companies: [],
                statuses: [],
                tags: [],
                priorities: []
            };

            const query = service.buildTaskQueryFromFilters(filters);
            // Should return a condition that matches no tasks
            expect(query).toBe('(description regex matches /NEVER_MATCH_ANYTHING/)');
        });

        it('should handle "all" role with assignees by not filtering roles', () => {
            const filters: ViewFilters = {
                roles: ['all'],
                people: ['Luke'],
                companies: [],
                statuses: [],
                tags: [],
                priorities: []
            };

            const query = service.buildTaskQueryFromFilters(filters);
            // Should create assignee patterns for all visible roles (same as current behavior)
            expect(query).toBe('(((description regex matches /🚗::(?:(?!\\s+\\[[^\\]]+::).)*Luke/) OR (description regex matches /👍::(?:(?!\\s+\\[[^\\]]+::).)*Luke/)))');
        });

        it('should handle cross product with other filter types', () => {
            const filters: ViewFilters = {
                roles: ['driver'],
                people: ['Luke'],
                companies: [],
                statuses: [TaskStatus.TODO],
                tags: ['urgent'],
                priorities: []
            };

            const query = service.buildTaskQueryFromFilters(filters);
            // Should include cross product AND other filters
            expect(query).toBe('(description regex matches /🚗::(?:(?!\\s+\\[[^\\]]+::).)*Luke/)\nnot done\nfilter by function task.status.type !== \'IN_PROGRESS\'\n#urgent');
        });
    });
});