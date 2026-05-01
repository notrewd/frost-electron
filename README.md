# Frost

A cross-platform desktop UML class diagram editor. Build, browse, and reverse-engineer class diagrams for Java, Python, and C++ projects from a single application.

Built with Electron, React 19, TypeScript, and Vite. Diagrams are rendered with React Flow (`@xyflow/react`) and laid out with `elkjs`. State is managed with Zustand (with `zundo` for undo/redo history).

## Features

- **Visual class editor.** Drag-and-drop nodes for classes and interfaces, with inline editing of attributes, methods, parameters, return types, and access modifiers.
- **Relationships.** Generalization, implementation, and association edges with directional markers and optional labels.
- **Reverse engineering.** Point Frost at Java, Python, or C++ sources (single files or directories, optionally recursive) and generate a starter diagram automatically. Source folders can be preserved as visual groups.
- **Layouts.** Automatic vertical and horizontal arrangement powered by ELK. Save and recall custom panel layouts; three built-in presets (Default, Focused, Reversed).
- **Suggestions / lint.** Optional design checks for encapsulation violations, naming conventions, god classes, empty classes, missing return types, mutable getter exposure, missing constructors, unused abstracts, and overly large parameter lists.
- **Multi-window workflow.** Separate windows for the welcome screen, project editor, settings, export, edges outliner, history, and code generation.
- **Export.** Render diagrams to PNG.
- **Persistence.** Projects are saved as `.fr` files. Recent projects, settings, and custom layout presets are stored under the OS-appropriate app data directory.
- **Theming.** Dark/light themes with extensive per-element color customization for nodes, types, parameters, and access modifiers.

## Install

Pre-built installers for Windows, macOS, and Linux are available on the [Releases page](https://github.com/notrewd/frost-electron/releases). Pick the artifact for your platform:

- Windows — `.exe` (NSIS installer)
- macOS — `.dmg`
- Linux — `.AppImage`

To build from source instead, see [Getting started](#getting-started) below.

## Getting started

### Requirements

- Node.js 20+
- npm

### Install

```bash
npm install
```

### Run in development

Starts Vite and Electron together with hot reload:

```bash
npm run dev
```

Vite serves the renderer at `http://localhost:1420` and Electron loads it once the dev server is ready.

### Build

Build the renderer bundle only:

```bash
npm run build
```

Build a distributable Electron application for the current platform:

```bash
npm run build:electron
```

Artifacts are written to `release/`. Targets are configured per platform:

| Platform | Target   |
|----------|----------|
| Windows  | NSIS     |
| macOS    | DMG      |
| Linux    | AppImage |

CI builds for all three platforms run on push to `master` (see `.github/workflows/build.yml`) and produce a draft GitHub release.

## Project structure

```
electron/        Electron main process, preload bridge, and source-code parser
  main.mjs         Window management, IPC, menu, settings/recent-projects/layout presets
  generator.mjs    Java / Python / C++ parser used by "Generate from Source Code"
  preload.cjs      contextBridge IPC surface
src/
  routes/        One React route per window (welcome, editor, settings, export, ...)
  components/    Nodes, edges, panels, settings, providers, UI primitives
  stores/        Zustand stores (flow, layout, project, settings)
  schemas/       Zod schemas (project name/path validation)
  managers/      App-wide managers (theme)
  hooks/, lib/, types/
public/          App icons (icon.ico, icon.icns)
scripts/         Dev tooling (e.g. wait-for-vite.mjs)
```

## File format

Frost projects are saved as `.fr` files containing the serialized diagram (nodes, edges, and metadata). They open directly from the welcome screen's recent projects list, the File menu, or by passing them to `open_project_file` via IPC.

## Keyboard shortcuts

The editor exposes the standard menu accelerators (Cmd/Ctrl based):

- `N` New project, `O` Open project, `S` Save, `Shift+S` Save As, `E` Export
- `Z` Undo, `Shift+Z` Redo
- `X` / `C` / `V` Cut / Copy / Paste node, `A` Select all nodes
- `Shift+V` Arrange vertically, `Shift+H` Arrange horizontally
- `H` History, `L` Edges outliner

## License

MIT — see [LICENSE](LICENSE).
