import { describe, it, expect, beforeEach, vi } from "vitest";
import { TaskRolesService } from "../src/services/task-roles.service";
import { DEFAULT_SETTINGS } from "../src/types/index";

// Mock Obsidian APIs
const mockVault = {
	adapter: {
		exists: vi.fn(),
	},
	create: vi.fn(),
	createFolder: vi.fn(),
};

const appStub = {
	vault: mockVault,
	workspace: {},
};

function createService() {
	const service = new TaskRolesService(appStub, DEFAULT_SETTINGS);
	service.refreshAssigneeCache = vi.fn(); // Mock the cache refresh
	return service;
}

describe("TaskRolesService - @me Person Functions", () => {
	beforeEach(() => {
		// Reset all mocks before each test
		vi.clearAllMocks();
	});

	describe("mePersonExists()", () => {
		it("returns true when Me.md exists", async () => {
			const service = createService();
			mockVault.adapter.exists.mockImplementation((path) => {
				return Promise.resolve(path === "People/Me.md");
			});

			const result = await service.mePersonExists();
			expect(result).toBe(true);
			expect(mockVault.adapter.exists).toHaveBeenCalledWith(
				"People/Me.md"
			);
		});

		it("returns true when me.md exists (lowercase)", async () => {
			const service = createService();
			mockVault.adapter.exists.mockImplementation((path) => {
				return Promise.resolve(path === "People/me.md");
			});

			const result = await service.mePersonExists();
			expect(result).toBe(true);
			expect(mockVault.adapter.exists).toHaveBeenCalledWith(
				"People/Me.md"
			);
			expect(mockVault.adapter.exists).toHaveBeenCalledWith(
				"People/me.md"
			);
		});

		it("returns true when ME.md exists (uppercase)", async () => {
			const service = createService();
			mockVault.adapter.exists.mockImplementation((path) => {
				return Promise.resolve(path === "People/ME.md");
			});

			const result = await service.mePersonExists();
			expect(result).toBe(true);
			expect(mockVault.adapter.exists).toHaveBeenCalledWith(
				"People/Me.md"
			);
			expect(mockVault.adapter.exists).toHaveBeenCalledWith(
				"People/me.md"
			);
			expect(mockVault.adapter.exists).toHaveBeenCalledWith(
				"People/ME.md"
			);
		});

		it("returns false when no @me file exists", async () => {
			const service = createService();
			mockVault.adapter.exists.mockResolvedValue(false);

			const result = await service.mePersonExists();
			expect(result).toBe(false);
			expect(mockVault.adapter.exists).toHaveBeenCalledTimes(3);
		});

		it("checks all case variations in order", async () => {
			const service = createService();
			mockVault.adapter.exists.mockResolvedValue(false);

			await service.mePersonExists();

			expect(mockVault.adapter.exists).toHaveBeenNthCalledWith(
				1,
				"People/Me.md"
			);
			expect(mockVault.adapter.exists).toHaveBeenNthCalledWith(
				2,
				"People/me.md"
			);
			expect(mockVault.adapter.exists).toHaveBeenNthCalledWith(
				3,
				"People/ME.md"
			);
		});

		it("uses custom person directory from settings", async () => {
			const customSettings = {
				...DEFAULT_SETTINGS,
				personDirectory: "MyPeople",
			};
			const service = new TaskRolesService(appStub, customSettings);
			service.refreshAssigneeCache = vi.fn();
			mockVault.adapter.exists.mockResolvedValue(false);

			await service.mePersonExists();

			expect(mockVault.adapter.exists).toHaveBeenCalledWith(
				"MyPeople/Me.md"
			);
			expect(mockVault.adapter.exists).toHaveBeenCalledWith(
				"MyPeople/me.md"
			);
			expect(mockVault.adapter.exists).toHaveBeenCalledWith(
				"MyPeople/ME.md"
			);
		});

		it("stops checking after finding first match", async () => {
			const service = createService();
			mockVault.adapter.exists.mockImplementation((path) => {
				return Promise.resolve(path === "People/Me.md");
			});

			const result = await service.mePersonExists();
			expect(result).toBe(true);
			expect(mockVault.adapter.exists).toHaveBeenCalledTimes(1);
			expect(mockVault.adapter.exists).toHaveBeenCalledWith(
				"People/Me.md"
			);
		});
	});

	describe("createMePerson()", () => {
		it("does not create file when Me.md already exists", async () => {
			const service = createService();
			mockVault.adapter.exists.mockImplementation((path) => {
				return Promise.resolve(path === "People/Me.md");
			});

			await service.createMePerson();

			expect(mockVault.create).not.toHaveBeenCalled();
			expect(mockVault.createFolder).not.toHaveBeenCalled();
		});

		it("does not create file when me.md already exists (lowercase)", async () => {
			const service = createService();
			mockVault.adapter.exists.mockImplementation((path) => {
				return Promise.resolve(path === "People/me.md");
			});

			await service.createMePerson();

			expect(mockVault.create).not.toHaveBeenCalled();
			expect(mockVault.createFolder).not.toHaveBeenCalled();
		});

		it("does not create file when ME.md already exists (uppercase)", async () => {
			const service = createService();
			mockVault.adapter.exists.mockImplementation((path) => {
				return Promise.resolve(path === "People/ME.md");
			});

			await service.createMePerson();

			expect(mockVault.create).not.toHaveBeenCalled();
			expect(mockVault.createFolder).not.toHaveBeenCalled();
		});

		it("creates Me.md file when no @me file exists", async () => {
			const service = createService();
			mockVault.adapter.exists.mockImplementation((path) => {
				// Directory exists, but no @me files exist
				return Promise.resolve(path === "People");
			});

			await service.createMePerson();

			expect(mockVault.create).toHaveBeenCalledWith(
				"People/Me.md",
				"# Me\n\nThis is your personal file."
			);
			expect(service.refreshAssigneeCache).toHaveBeenCalled();
		});

		it("creates directory if it does not exist", async () => {
			const service = createService();
			mockVault.adapter.exists.mockResolvedValue(false);

			await service.createMePerson();

			expect(mockVault.createFolder).toHaveBeenCalledWith("People");
			expect(mockVault.create).toHaveBeenCalledWith(
				"People/Me.md",
				"# Me\n\nThis is your personal file."
			);
		});

		it("uses custom person directory from settings", async () => {
			const customSettings = {
				...DEFAULT_SETTINGS,
				personDirectory: "People",
			};
			const service = new TaskRolesService(appStub, customSettings);
			service.refreshAssigneeCache = vi.fn();
			mockVault.adapter.exists.mockResolvedValue(false);

			await service.createMePerson();

			expect(mockVault.createFolder).toHaveBeenCalledWith("People");
			expect(mockVault.create).toHaveBeenCalledWith(
				"People/Me.md",
				"# Me\n\nThis is your personal file."
			);
		});

		it("always creates file with capitalized name even if other cases exist", async () => {
			const service = createService();
			mockVault.adapter.exists.mockImplementation((path) => {
				// Directory exists, no @me files exist
				return Promise.resolve(path === "People");
			});

			await service.createMePerson();

			expect(mockVault.create).toHaveBeenCalledWith(
				"People/Me.md",
				"# Me\n\nThis is your personal file."
			);
		});
	});
});
