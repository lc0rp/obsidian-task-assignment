import { setIcon } from 'obsidian';
import { ViewFilters, TaskStatus, TaskPriority, DateType } from '../types';
import type TaskAssignmentPlugin from '../main';

export class ExpandableFiltersComponent {
	private plugin: TaskAssignmentPlugin;
	private currentFilters: ViewFilters;
	private updateFiltersCallback: (filters: Partial<ViewFilters>) => void;
	private originalFilters: ViewFilters = {};

	constructor(
		plugin: TaskAssignmentPlugin,
		currentFilters: ViewFilters,
		updateFiltersCallback: (filters: Partial<ViewFilters>) => void
	) {
		this.plugin = plugin;
		this.currentFilters = currentFilters;
		this.updateFiltersCallback = updateFiltersCallback;
	}

	render(container: HTMLElement): void {
		const filtersEl = container.createDiv('task-assignment-filters');
		
		// Filter toggle
		const filterToggle = filtersEl.createEl('button', { cls: 'task-assignment-filter-toggle' });
		setIcon(filterToggle, 'filter');
		filterToggle.setText('Filters');
		
		// Add arrow icon
		const arrowIcon = filterToggle.createSpan('task-assignment-filter-arrow');
		setIcon(arrowIcon, 'chevron-down');
		
		const filtersContent = filtersEl.createDiv('task-assignment-filters-content');
		filtersContent.style.display = 'none';
		
		filterToggle.onclick = () => {
			const isVisible = filtersContent.style.display !== 'none';
			filtersContent.style.display = isVisible ? 'none' : 'block';
			filterToggle.toggleClass('active', !isVisible);
			
			// Store original filters when opening the section
			if (!isVisible) {
				this.originalFilters = { ...this.currentFilters };
			}
			
			// Update arrow direction
			arrowIcon.empty();
			setIcon(arrowIcon, isVisible ? 'chevron-down' : 'chevron-up');
		};

		this.renderFilterControls(filtersContent);
	}

	private renderFilterControls(container: HTMLElement): void {
		const filterGrid = container.createDiv('task-assignment-filter-grid');
		
		// Store reference to assignees display update function
		let updateAssigneesDisplay: (() => void) | null = null;

        // Assignees filter
		const assigneesGroup = filterGrid.createDiv('filter-group');
		assigneesGroup.createEl('label', { text: 'Assignees' });
		const assigneesInput = assigneesGroup.createEl('input', { 
			type: 'text', 
			placeholder: 'Select assignees',
			cls: 'task-assignment-assignees-input'
		});
		assigneesInput.readOnly = true;
		
		// Display selected assignees
		updateAssigneesDisplay = () => {
			const selectedAssignees = [
				...(this.currentFilters.people || []),
				...(this.currentFilters.companies || [])
			];
			assigneesInput.value = selectedAssignees.length > 0 
				? selectedAssignees.join(', ') 
				: '';
		};
		
		updateAssigneesDisplay();
		
		assigneesInput.onclick = () => {
			this.showAssigneeSelector(updateAssigneesDisplay);
		};

		// Text search
		const searchGroup = filterGrid.createDiv('filter-group');
		searchGroup.createEl('label', { text: 'Search' });
		const searchInput = searchGroup.createEl('input', { type: 'text', placeholder: 'Search tasks...' });
		searchInput.value = this.currentFilters.textSearch || '';
		searchInput.oninput = () => {
			this.updateFiltersCallback({ textSearch: searchInput.value });
		};

        // Role filter
		const roleGroup = filterGrid.createDiv('filter-group');
		roleGroup.createEl('label', { text: 'Roles' });
		const roleContainer = roleGroup.createDiv('filter-checkboxes');
		
		// Add "None" option for roles
		const noneSetRoleLabel = roleContainer.createEl('label');
		const noneSetRoleCheckbox = noneSetRoleLabel.createEl('input', { type: 'checkbox' });
		noneSetRoleCheckbox.checked = this.currentFilters.roles?.includes('none-set') || false;
		noneSetRoleCheckbox.onchange = () => {
			const currentRoles = this.currentFilters.roles || [];
			const newRoles = noneSetRoleCheckbox.checked
				? [...currentRoles, 'none-set']
				: currentRoles.filter(r => r !== 'none-set');
			this.updateFiltersCallback({ roles: newRoles });
		};
		noneSetRoleLabel.createSpan().setText('None');
		
		const visibleRoles = this.plugin.getVisibleRoles();
		for (const role of visibleRoles) {
			const label = roleContainer.createEl('label');
			const checkbox = label.createEl('input', { type: 'checkbox' });
			checkbox.checked = this.currentFilters.roles?.includes(role.id) || false;
			checkbox.onchange = () => {
				const currentRoles = this.currentFilters.roles || [];
				const newRoles = checkbox.checked
					? [...currentRoles, role.id]
					: currentRoles.filter(r => r !== role.id);
				this.updateFiltersCallback({ roles: newRoles });
			};
			label.createSpan().setText(`${role.icon} ${role.name}`);
		}

		// Status filter
		const statusGroup = filterGrid.createDiv('filter-group');
		statusGroup.createEl('label', { text: 'Status' });
		const statusContainer = statusGroup.createDiv('filter-checkboxes');
		
		const statuses = [
			{ value: TaskStatus.TODO, label: 'To Do' },
			{ value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
			{ value: TaskStatus.DONE, label: 'Done' },
			{ value: TaskStatus.CANCELLED, label: 'Cancelled' }
		];
		
		for (const status of statuses) {
			const label = statusContainer.createEl('label');
			const checkbox = label.createEl('input', { type: 'checkbox' });
			checkbox.checked = this.currentFilters.statuses?.includes(status.value) || false;
			checkbox.onchange = () => {
				const currentStatuses = this.currentFilters.statuses || [];
				const newStatuses = checkbox.checked
					? [...currentStatuses, status.value]
					: currentStatuses.filter(s => s !== status.value);
				this.updateFiltersCallback({ statuses: newStatuses });
			};
			label.createSpan().setText(status.label);
		}

		// Priority filter
		const priorityGroup = filterGrid.createDiv('filter-group');
		priorityGroup.createEl('label', { text: 'Priority' });
		const priorityContainer = priorityGroup.createDiv('filter-checkboxes');
		
		// Add "None" option for priority (tasks with default MEDIUM priority but no explicit priority indicators)
		const noneSetPriorityLabel = priorityContainer.createEl('label');
		const noneSetPriorityCheckbox = noneSetPriorityLabel.createEl('input', { type: 'checkbox' });
		noneSetPriorityCheckbox.checked = this.currentFilters.priorities?.includes('none-set') || false;
		noneSetPriorityCheckbox.onchange = () => {
			const currentPriorities = this.currentFilters.priorities || [];
			const newPriorities = noneSetPriorityCheckbox.checked
				? [...currentPriorities, 'none-set' as const]
				: currentPriorities.filter(p => p !== 'none-set');
			this.updateFiltersCallback({ priorities: newPriorities });
		};
		noneSetPriorityLabel.createSpan().setText('None');
		
		const priorities = [
			{ value: TaskPriority.URGENT, label: 'Urgent' },
			{ value: TaskPriority.HIGH, label: 'High' },
			{ value: TaskPriority.MEDIUM, label: 'Medium' },
			{ value: TaskPriority.LOW, label: 'Low' }
		];
		
		for (const priority of priorities) {
			const label = priorityContainer.createEl('label');
			const checkbox = label.createEl('input', { type: 'checkbox' });
			checkbox.checked = this.currentFilters.priorities?.includes(priority.value) || false;
			checkbox.onchange = () => {
				const currentPriorities = this.currentFilters.priorities || [];
				const newPriorities = checkbox.checked
					? [...currentPriorities, priority.value]
					: currentPriorities.filter(p => p !== priority.value);
				this.updateFiltersCallback({ priorities: newPriorities });
			};
			label.createSpan().setText(priority.label);
		}

		// Date filter
		const dateGroup = filterGrid.createDiv('filter-group');
		dateGroup.createEl('label', { text: 'Date Filter' });
		
		const dateTypeContainer = dateGroup.createDiv('task-assignment-layout-container');
		const dateTypeSelect = dateTypeContainer.createEl('select', { cls: 'task-assignment-date-type-select' });
		const dateTypes = [
			{ value: DateType.DUE, label: 'Due Date' },
			{ value: DateType.CREATED, label: 'Created Date' },
			{ value: DateType.COMPLETED, label: 'Completed Date' },
			{ value: DateType.SCHEDULED, label: 'Scheduled Date' }
		];
		
		for (const dateType of dateTypes) {
			const option = dateTypeSelect.createEl('option', { value: dateType.value });
			option.setText(dateType.label);
			if (dateType.value === this.currentFilters.dateType) {
				option.selected = true;
			}
		}
		
		dateTypeSelect.onchange = () => {
			this.updateFiltersCallback({ dateType: dateTypeSelect.value as DateType });
		};

		// Add dropdown arrow icon
		const dateTypeArrow = dateTypeContainer.createSpan('task-assignment-dropdown-arrow');
		setIcon(dateTypeArrow, 'chevron-down');

		const dateRangeContainer = dateGroup.createDiv('date-range-container');
		
		// Create inline date range with dash separator
		const dateRangeRow = dateRangeContainer.createDiv('date-range-row');
		
		const fromInput = dateRangeRow.createEl('input', { type: 'date', cls: 'date-range-input' });
		fromInput.value = this.currentFilters.dateRange?.from?.toISOString().split('T')[0] || '';
		fromInput.onchange = () => {
			const from = fromInput.value ? new Date(fromInput.value) : undefined;
			this.updateFiltersCallback({ 
				dateRange: { 
					...this.currentFilters.dateRange, 
					from 
				} 
			});
		};

		const dashSeparator = dateRangeRow.createSpan('date-range-separator');
		dashSeparator.setText('—');

		const toInput = dateRangeRow.createEl('input', { type: 'date', cls: 'date-range-input' });
		toInput.value = this.currentFilters.dateRange?.to?.toISOString().split('T')[0] || '';
		toInput.onchange = () => {
			const to = toInput.value ? new Date(toInput.value) : undefined;
			this.updateFiltersCallback({ 
				dateRange: { 
					...this.currentFilters.dateRange, 
					to 
				} 
			});
		};

		const includeNotSetLabel = dateRangeContainer.createEl('label');
		const includeNotSetCheckbox = includeNotSetLabel.createEl('input', { type: 'checkbox' });
		includeNotSetCheckbox.checked = this.currentFilters.dateRange?.includeNotSet || false;
		includeNotSetCheckbox.onchange = () => {
			this.updateFiltersCallback({ 
				dateRange: { 
					...this.currentFilters.dateRange, 
					includeNotSet: includeNotSetCheckbox.checked 
				} 
			});
		};
		includeNotSetLabel.createSpan().setText('Include tasks without dates');

		// Filter actions container
		const filterActionsEl = filterGrid.createDiv('task-assignment-filter-actions');
		
		// Clear filters button (first in order)
		const clearFiltersBtn = filterActionsEl.createEl('button', { cls: 'task-assignment-clear-filters-btn' });
		clearFiltersBtn.setText('Clear Filters');
		clearFiltersBtn.onclick = async () => {
			this.updateFiltersCallback({});
		};
		
		// Cancel button (second in order)
		const cancelFiltersBtn = filterActionsEl.createEl('button', { cls: 'task-assignment-cancel-filters-btn' });
		cancelFiltersBtn.setText('Cancel');
		cancelFiltersBtn.disabled = this.plugin.settings.autoApplyFilters;
		cancelFiltersBtn.onclick = () => {
			this.cancelFiltersAndClose();
		};
		
		// Apply Filters button (third in order)
		const applyFiltersBtn = filterActionsEl.createEl('button', { cls: 'task-assignment-apply-filters-btn' });
		applyFiltersBtn.setText('Apply Filters');
		applyFiltersBtn.disabled = this.plugin.settings.autoApplyFilters;
		applyFiltersBtn.onclick = () => {
			this.applyFiltersAndClose();
		};
		
		// Auto Apply container (fourth/last in order)
		const autoApplyContainer = filterActionsEl.createDiv('task-assignment-auto-apply-container');
		const autoApplyCheckbox = autoApplyContainer.createEl('input', { 
			type: 'checkbox', 
			cls: 'task-assignment-auto-apply-checkbox' 
		});
		autoApplyCheckbox.checked = this.plugin.settings.autoApplyFilters;
		
		const autoApplyLabel = autoApplyContainer.createEl('label', { cls: 'task-assignment-auto-apply-label' });
		autoApplyLabel.setText('Auto Apply');
		autoApplyLabel.onclick = () => {
			autoApplyCheckbox.click();
		};
		
		autoApplyCheckbox.onchange = async () => {
			this.plugin.settings.autoApplyFilters = autoApplyCheckbox.checked;
			await this.plugin.saveSettings();
			applyFiltersBtn.disabled = autoApplyCheckbox.checked;
			cancelFiltersBtn.disabled = autoApplyCheckbox.checked;
			
			// If Auto Apply is enabled, apply filters immediately
			if (autoApplyCheckbox.checked) {
				this.applyFiltersAndClose();
			}
		};
	}

	private async applyFiltersAndClose(): Promise<void> {
		// Force re-render with current filters
		this.updateFiltersCallback(this.currentFilters);
		
		// Close the filters section
		this.closeFiltersSection();
	}

	private async cancelFiltersAndClose(): Promise<void> {
		// Revert to original filters
		this.updateFiltersCallback(this.originalFilters);
		
		// Close the filters section
		this.closeFiltersSection();
	}

	private closeFiltersSection(): void {
		const filtersEl = document.querySelector('.task-assignment-filters');
		if (!filtersEl) return;
		
		const filterToggle = filtersEl.querySelector('.task-assignment-filter-toggle') as HTMLElement;
		const filtersContent = filtersEl.querySelector('.task-assignment-filters-content') as HTMLElement;
		const arrowIcon = filtersEl.querySelector('.task-assignment-filter-arrow') as HTMLElement;
		
		if (filterToggle && filtersContent && arrowIcon) {
			filtersContent.style.display = 'none';
			filterToggle.classList.remove('active');
			
			// Update arrow direction
			arrowIcon.empty();
			setIcon(arrowIcon, 'chevron-down');
		}
	}

	private showAssigneeSelector(updateCallback: (() => void) | null): void {
		import('../modals/assignee-selector-modal').then(({ AssigneeSelectorModal }) => {
			new AssigneeSelectorModal(this.plugin.app, this.plugin, (selectedAssignee: string) => {
				// Determine if it's a person or company based on the symbol
				const isPerson = selectedAssignee.startsWith(this.plugin.settings.contactSymbol);
				const isCompany = selectedAssignee.startsWith(this.plugin.settings.companySymbol);
				
				if (isPerson) {
					const currentPeople = this.currentFilters.people || [];
					const newPeople = currentPeople.includes(selectedAssignee)
						? currentPeople.filter(p => p !== selectedAssignee)
						: [...currentPeople, selectedAssignee];
					this.updateFiltersCallback({ people: newPeople });
				} else if (isCompany) {
					const currentCompanies = this.currentFilters.companies || [];
					const newCompanies = currentCompanies.includes(selectedAssignee)
						? currentCompanies.filter(c => c !== selectedAssignee)
						: [...currentCompanies, selectedAssignee];
					this.updateFiltersCallback({ companies: newCompanies });
				}
				
				// Update the display
				if (updateCallback) {
					updateCallback();
				}
			}, { mode: 'readonly', keepOpen: true }).open();
		});
	}
} 