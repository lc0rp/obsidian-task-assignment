# Task Assignment

Assign contacts, companies and roles to tasks using DACI (Driver, Approver, Contributors, Informed) methodology.

## Features

### 🎯 Quick Task Assignment

- **One-click assignment**: A person icon (👤) appears at the end of every task line for instant access
- **Smart detection**: Icons appear automatically when you start typing task content
- **Natural workflow**: The cursor stays between the checkbox and icon, so you can type naturally

### 👥 Contact & Company Management

- Link tasks to contacts using `@` prefix (e.g., `@John`)
- Link tasks to companies using `+` prefix (e.g., `+AcmeCorp`)
- Auto-complete suggestions from configured directories
- Special `@me` contact for self-assignment

### 🎭 Role-Based Assignment (DACI)

- **Drivers** 🚗: Who is responsible for driving the task forward
- **Approvers** 👍: Who needs to approve the task
- **Contributors** 👥: Who will contribute to the task
- **Informed** 📢: Who needs to be kept informed

### ⚙️ Customizable Roles

- Add custom roles with your own icons
- Hide default roles you don't need
- Reorder roles by priority

### 📋 Task Assignment View

- **Kanban-Style Layout**: Organize tasks by status, role, person, company, or date
- **Advanced Filtering**: Filter by entity, date range, content, status, priority, and tags
- **Real-Time Task Cache**: Background task scanning with automatic updates
- **Interactive Task Cards**: Clickable status toggles and detailed side panels
- **Saved Views**: Save and recall custom filter and layout configurations
- **Multiple View Layouts**:
  - **Status View**: Organize by task completion status
  - **Role View**: Group by assigned roles (with user/others separation)
  - **Person/Contact View**: Organize by individual assignees
  - **Company/Group View**: Group by organizational entities
  - **Date View**: Organize by date categories (overdue, today, this week, etc.)

## Usage

### Quick Assignment with Icons

1. Create a task: `- [ ] Complete project documentation`
2. Start typing after the checkbox - a users icon automatically appears at the end
3. Click the icon to open the assignment dialog
4. Select roles and assign contacts/companies

### Assignment Format

When you assign people to a task, it gets formatted like this:
`[icon] [comma-separated contact links]`

Example: `🚗 [[John Doe|@John]], [[Jane Smith|@Jane]] 👍 [[Manager|@Manager]]`

## Ways to Assign

1. **Click the person icon**: Appears automatically at the end of task lines
2. **"Assign task roles to People/Companies" command**: Use on any checkbox item (task)
3. **Keyboard shortcut**: Configurable shortcut to trigger assignment
4. **Inline typing**: Type role icon + space + `@` or `+` to trigger auto-suggest

## Using the Task Center

### Opening the Task Center

1. **Command Palette**: Use "Open Task Center" command
2. **Ribbon Icon**: Click the users icon in the left ribbon (if enabled)
3. **Hotkey**: Configure a keyboard shortcut for quick access

### View Features

- **Layout Switching**: Use the dropdown to switch between Status, Role, Person, Company, or Date views
- **Filtering**: Click the "Filters" button to access advanced filtering options
- **Task Interaction**: Click task cards to view details in the side panel
- **Status Updates**: Toggle task completion directly from the cards
- **Cache Refresh**: Use the refresh button to manually update the task cache
- **Save View Config.**: Save your current filter and layout configuration for later use

### Task Cache

The Task Center uses a background task cache that:

- Automatically scans all markdown files for tasks
- Updates in real-time when files are modified
- Parses task metadata including assignments, dates, priorities, and tags
- Stores cache data in `.obsidian/task-assignment-cache.json`

## Editing Assignments

Select "Assign task roles to People/Companies" on a task that already has roles to edit existing assignments. Only known, unhidden roles will be parsed and displayed.

## Settings

- **Change @ symbol**: Customize contact prefix (affects future data only)
- **Change + symbol**: Customize company prefix (affects future data only)
- **Select @ directory**: Choose directory for contacts (affects future data only)
- **Select + directory**: Choose directory for companies (affects future data only)
- **Create @me contact**: Button to create the special @me contact if it doesn't exist
- **Manage roles**:
  - Hide default roles (prevents them from appearing in future dialogs)
  - Add, edit, and delete custom roles
  - Note: Editing custom roles won't update historical records

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "Task Assignment"
4. Install and enable the plugin

### Manual Installation

1. Download the latest release from GitHub
2. Extract the files to your vault's `.obsidian/plugins/obsidian-task-assignment/` folder
3. Reload Obsidian and enable the plugin in settings

## How It Works

The plugin uses CodeMirror editor extensions to:

- Detect task lines in real-time
- Add clickable person icons at the end of task lines
- Maintain cursor position between checkbox and icon
- Trigger assignment dialogs when icons are clicked

This approach is similar to how TaskNotes implements their functionality, providing a seamless user experience.

## Development

This plugin is built with TypeScript and follows Obsidian's plugin development guidelines.

### Project Structure

```
obsidian-task-assignment/
├── docs/                    # Documentation files
├── src/                     # TypeScript source code
│   ├── main.ts             # Main plugin entry point
│   ├── types/              # TypeScript interfaces and constants
│   ├── services/           # Business logic and data processing
│   ├── components/         # Reusable UI components and widgets
│   ├── editor/             # Editor extensions and suggestions
│   ├── modals/             # Modal dialogs and popups
│   ├── settings/           # Plugin settings and configuration
│   ├── ui/                 # UI utilities (reserved for future use)
│   ├── utils/              # General utilities (reserved for future use)
│   └── views/              # Custom views (reserved for future use)
├── styles/                 # CSS stylesheets
│   └── styles.css          # Plugin styles
├── tests/                  # Test files (future)
├── media/                  # Media assets (icons, images)
├── manifest.json           # Plugin manifest
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

### Architecture

The plugin follows a modular architecture with clear separation of concerns:

- **Main Plugin** (`main.ts`) - Entry point, command registration, and plugin lifecycle
- **Types** (`types/`) - TypeScript interfaces and constants
- **Services** (`services/`) - Business logic and data processing
- **Components** (`components/`) - Reusable UI widgets
- **Editor** (`editor/`) - CodeMirror extensions and suggestions
- **Modals** (`modals/`) - Dialog windows and user interactions
- **Settings** (`settings/`) - Configuration and preferences

This modular design makes the codebase more maintainable, testable, and extensible for future features.

### Building

```bash
npm install
npm run build
```

### Development Mode

```bash
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

MIT

## Support

If you find this plugin helpful, consider supporting its development:

- ⭐ Star this repository
- 🐛 Report bugs and request features
- 💡 Contribute code improvements
- ☕ [Buy me a coffee](https://buymeacoffee.com) (if funding URL is configured)
