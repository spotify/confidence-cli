---
name: ink-tui
description: Develop and modify the Ink-based terminal UI for the Confidence Wizard
version: '0.1'
---

# Ink TUI Wizard Skill

This skill covers building and modifying the interactive terminal user interface for the Confidence Wizard CLI. The TUI is built with Ink (React for CLIs), @inkjs/ui, and nanostores for state management.

## Core Architecture

The TUI follows a **reactive session-driven pattern**: the rendered screen derives from session state. Business logic updates state through store setters, and the router determines which screen to display.

### Central Components

- **WizardSession** (`src/lib/session.ts`) — Source of truth for wizard state
- **WizardStore** (`src/ui/tui/store.ts`) — Nanostores-backed reactive store with explicit setters
- **WizardRouter** (`src/ui/tui/router.ts`) — Declarative sequence-based navigation
- **ScreenContainer** (`src/ui/tui/components/ScreenContainer.tsx`) — Root layout orchestrating screens
- **Screen Registry** (`src/ui/tui/screen-registry.tsx`) — Factory mapping ScreenId to components

## Adding a Screen

1. Create the component in `src/ui/tui/screens/YourScreen.tsx`
2. Add a `ScreenId` entry in `src/lib/session.ts`
3. Register the mapping in `src/ui/tui/screen-registry.tsx`
4. Add to the sequence in `src/ui/tui/screen-sequences.ts`

No other files need changes.

## Adding Store State

For state that affects screen resolution:

1. Add field to `WizardSession` interface
2. Add setter to `WizardStore` that calls `emitChange()`

For display-only state:

1. Add a private atom to `WizardStore`
2. Add getter/setter methods

## Layout & UI

### Components (`src/ui/tui/components/`)

Reusable building blocks and composites: `TextBlock`, `Divider`, `KeyboardHintsBar`, `ScreenContainer`, `TitleBar`, etc. Barrel-exported from `index.ts`.

### Theme (`src/ui/tui/styles.ts`)

Shared constants: `Colors`, `Icons`, `HAlign`, `VAlign`. Import from here for consistent styling.

## Key Dependencies

```
ink                   # Terminal React renderer (Yoga Flexbox)
react                 # Peer dependency
@inkjs/ui             # Select, TextInput, Spinner, ProgressBar,
                      # ConfirmInput, MultiSelect, Badge, StatusMessage
```

**Avoid** standalone `ink-text-input`, `ink-select-input` — use `@inkjs/ui` instead.

## Ink Rendering Model

| Browser       | Ink Terminal                              |
| ------------- | ----------------------------------------- |
| `<div>`       | `<Box>`                                   |
| `<span>`      | `<Text>`                                  |
| CSS/className | Direct props (`flexDirection`, `padding`) |
| `onClick`     | `useInput()` hook                         |
| Window size   | `useStdout().stdout.{columns,rows}`       |
| Layout        | Flexbox via `flexDirection`               |

## Rules

- No product knowledge in the TUI — domain logic belongs in the Confidence Skill / MCP tools
- Use `ScreenId` enum values, never raw strings for screen identification
- All state mutations go through `WizardStore` setters
- Use `Colors` and `Icons` from `styles.ts` for consistent theming
- Each screen receives `router` as a prop for navigation
- Prefer `@inkjs/ui` components over custom implementations
- Use named functions in `useEffect`, not arrow functions — e.g. `useEffect(function autoAdvance() { ... }, [deps])`
- Use `HAlign` / `VAlign` enums from `styles.ts` instead of raw alignment strings (`'flex-start'`, `'center'`, `'flex-end'`)
