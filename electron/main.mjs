import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  shell,
  nativeTheme,
} from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { generateDiagram } from "./generator.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.setName("Frost");
const isDev = !app.isPackaged;
const DEV_URL = "http://localhost:1420";

function getRendererPath(route = "/") {
  if (isDev) {
    return `${DEV_URL}#${route}`;
  }
  return path.join(__dirname, "..", "dist", "index.html");
}

// ─── App Data Paths ───────────────────────────────────────────────────────────

function getAppDataDir() {
  const base =
    process.platform === "darwin"
      ? path.join(app.getPath("appData"), "Frost")
      : process.platform === "win32"
        ? path.join(app.getPath("appData"), "Frost")
        : path.join(app.getPath("home"), ".local", "share", "Frost");
  fs.mkdirSync(base, { recursive: true });
  return base;
}

function getSettingsPath() {
  return path.join(getAppDataDir(), "settings.json");
}

function getRecentProjectsPath() {
  return path.join(getAppDataDir(), "recent_projects.json");
}

// ─── State ────────────────────────────────────────────────────────────────────

const defaultSettings = {
  theme: "dark",
  pan_on_scroll: false,
  show_minimap: true,
  colored_nodes: true,
  show_controls: true,
  edge_style: "bezier",
  auto_save: false,
  auto_save_interval: 5,
  show_grid: true,
  snap_to_grid: false,
  grid_size: 15,
  compact_nodes: false,
  object_node_access_modifier_color_light: "#16a34a",
  object_node_access_modifier_color_dark: "#4ade80",
  object_node_type_separator_color_light: "#dc2626",
  object_node_type_separator_color_dark: "#f87171",
  object_node_type_color_light: "#2563eb",
  object_node_type_color_dark: "#60a5fa",
  object_node_default_value_color_light: "#9333ea",
  object_node_default_value_color_dark: "#c084fc",
  object_node_parameter_name_color_light: "#ea580c",
  object_node_parameter_name_color_dark: "#fb923c",
  node_border_radius: 8,
  show_edge_labels: true,
};

let settings = { ...defaultSettings };
let projectDetails = { name: null, path: null };

/** @type {Record<string, BrowserWindow>} */
const windows = {};

// ─── Settings Persistence ─────────────────────────────────────────────────────

function loadSettings() {
  try {
    const data = fs.readFileSync(getSettingsPath(), "utf-8");
    settings = { ...defaultSettings, ...JSON.parse(data) };
  } catch {
    settings = { ...defaultSettings };
  }
}

function saveSettings() {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
}

// ─── Recent Projects ──────────────────────────────────────────────────────────

function getRecentProjects() {
  try {
    const data = fs.readFileSync(getRecentProjectsPath(), "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function addRecentProject(project) {
  let recents = getRecentProjects();
  recents = recents.filter((p) => p.path !== project.path);
  recents.unshift(project);
  if (recents.length > 10) recents.length = 10;
  fs.writeFileSync(getRecentProjectsPath(), JSON.stringify(recents, null, 2));
}

function removeRecentProject(projectPath) {
  let recents = getRecentProjects();
  recents = recents.filter((p) => p.path !== projectPath);
  fs.writeFileSync(getRecentProjectsPath(), JSON.stringify(recents, null, 2));
}

function clearRecentProjects() {
  fs.writeFileSync(getRecentProjectsPath(), "[]");
}

// ─── Window Factory ───────────────────────────────────────────────────────────

function createWindow(label, route, options = {}) {
  if (windows[label]) {
    windows[label].focus();
    return windows[label];
  }

  const winOptions = {
    width: options.width || 800,
    height: options.height || 600,
    minWidth: options.minWidth || 400,
    minHeight: options.minHeight || 300,
    title: options.title || "Frost",
    show: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    frame: process.platform !== "win32",
    backgroundColor: "#09090b",
    alwaysOnTop: options.alwaysOnTop || false,
    minimizable: options.minimizable !== false,
    maximizable: options.maximizable !== false,
    resizable: options.resizable !== false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  };

  const win = new BrowserWindow(winOptions);

  // Prevent the HTML <title> from overriding the window title
  win.on("page-title-updated", (e) => {
    e.preventDefault();
  });

  if (isDev) {
    win.loadURL(`${DEV_URL}#${route}`);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"), {
      hash: route,
    });
  }

  win.once("ready-to-show", () => {
    win.show();
    if (options.maximized) {
      win.maximize();
    }
  });

  win.on("closed", () => {
    delete windows[label];
  });

  windows[label] = win;
  return win;
}

// ─── Window Openers ───────────────────────────────────────────────────────────

function openWelcomeWindow() {
  return createWindow("welcome", "/", {
    width: 800,
    height: 600,
    minWidth: 400,
    minHeight: 300,
    title: "Frost",
  });
}

function openNewProjectWindow() {
  return createWindow("new-project", "/new-project", {
    width: 400,
    height: 600,
    minWidth: 400,
    minHeight: 600,
    title: "Create new project",
    alwaysOnTop: true,
    minimizable: false,
    maximizable: false,
  });
}

function openEditorWindow(projectName, projectPath, projectData) {
  projectDetails.name = projectName;
  projectDetails.path = projectPath;

  const title = projectName
    ? `${projectName} \u2013 Frost Editor`
    : "Frost Editor";

  const existing = windows["editor"];
  if (existing) {
    existing.setTitle(title);
    existing.focus();
  } else {
    const win = createWindow("editor", "/editor", {
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      title,
      maximized: true,
    });
    updateMenuEnabledState(true);
    return win;
  }

  // Emit project-opened to the editor window
  const editor = windows["editor"];
  if (editor) {
    editor.webContents.send("app-event", "project-opened", {
      name: projectDetails.name || "",
      path: projectDetails.path || "",
      data: projectData || null,
    });
  }

  return existing;
}

function openSettingsWindow() {
  return createWindow("settings", "/settings", {
    width: 800,
    height: 600,
    minWidth: 400,
    minHeight: 600,
    title: "Settings",
  });
}

function openExportWindow() {
  return createWindow("export", "/export", {
    width: 1000,
    height: 600,
    minWidth: 400,
    minHeight: 600,
    title: "Export",
  });
}

function openEdgesOutlinerWindow() {
  return createWindow("edges-outliner", "/edges-outliner", {
    width: 700,
    height: 600,
    minWidth: 700,
    minHeight: 600,
    title: "Edges Outliner",
    alwaysOnTop: true,
  });
}

function openHistoryWindow() {
  return createWindow("history", "/history", {
    width: 400,
    height: 500,
    minWidth: 400,
    minHeight: 500,
    title: "History",
    alwaysOnTop: true,
  });
}

function openGenerateWindow() {
  return createWindow("generate", "/generate", {
    width: 400,
    height: 500,
    minWidth: 400,
    minHeight: 500,
    title: "Generate Diagram",
    maximizable: false,
  });
}

function openGeneratingWindow() {
  return createWindow("generating", "/generating", {
    width: 400,
    height: 250,
    minWidth: 400,
    minHeight: 250,
    title: "Generating...",
    maximizable: false,
    minimizable: false,
    resizable: false,
    alwaysOnTop: true,
  });
}

// ─── Broadcast to all windows ─────────────────────────────────────────────────

function broadcastEvent(eventName, payload) {
  for (const win of Object.values(windows)) {
    if (!win.isDestroyed()) {
      win.webContents.send("app-event", eventName, payload);
    }
  }
}

function sendToWindow(label, eventName, payload) {
  const win = windows[label];
  if (win && !win.isDestroyed()) {
    win.webContents.send("app-event", eventName, payload);
  }
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

let menuItemsEnabled = false;

function updateMenuEnabledState(enabled) {
  menuItemsEnabled = enabled;
  buildMenu();
}

function buildMenu() {
  const e = menuItemsEnabled;

  const template = [
    ...(process.platform === "darwin"
      ? [
          {
            label: app.name,
            submenu: [
              {
                label: "Settings",
                accelerator: "CmdOrCtrl+,",
                click: () => openSettingsWindow(),
              },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Project",
          accelerator: "CmdOrCtrl+N",
          click: () => broadcastEvent("editor-new-project", null),
        },
        { type: "separator" },
        {
          label: "Open Project...",
          accelerator: "CmdOrCtrl+O",
          click: () => broadcastEvent("editor-open-project", null),
        },
        { type: "separator" },
        {
          id: "save",
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          enabled: e,
          click: () => broadcastEvent("save-requested", null),
        },
        {
          id: "save_as",
          label: "Save As...",
          accelerator: "CmdOrCtrl+Shift+S",
          enabled: e,
          click: () => broadcastEvent("save-as-requested", null),
        },
        { type: "separator" },
        {
          id: "export",
          label: "Export...",
          accelerator: "CmdOrCtrl+E",
          enabled: e,
          click: () => openExportWindow(),
        },
        { type: "separator" },
        { role: "close" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        {
          label: "Undo",
          accelerator: "CmdOrCtrl+Z",
          click: () => broadcastEvent("undo", null),
        },
        {
          label: "Redo",
          accelerator: "CmdOrCtrl+Shift+Z",
          click: () => broadcastEvent("redo", null),
        },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
        { type: "separator" },
        {
          id: "cut_node",
          label: "Cut Node",
          accelerator: "CmdOrCtrl+X",
          enabled: e,
          click: () => broadcastEvent("editor-cut", null),
        },
        {
          id: "copy_node",
          label: "Copy Node",
          accelerator: "CmdOrCtrl+C",
          enabled: e,
          click: () => broadcastEvent("editor-copy", null),
        },
        {
          id: "paste_node",
          label: "Paste Node",
          accelerator: "CmdOrCtrl+V",
          enabled: e,
          click: () => broadcastEvent("editor-paste", null),
        },
        {
          id: "select_all_nodes",
          label: "Select All Nodes",
          accelerator: "CmdOrCtrl+A",
          enabled: e,
          click: () => broadcastEvent("editor-select_all", null),
        },
      ],
    },
    {
      label: "Arrange",
      submenu: [
        {
          id: "arrange_vertically",
          label: "Make Vertical",
          accelerator: "CmdOrCtrl+Shift+V",
          enabled: e,
          click: () =>
            broadcastEvent("arrange-nodes", { direction: "DOWN" }),
        },
        {
          id: "arrange_horizontally",
          label: "Make Horizontal",
          accelerator: "CmdOrCtrl+Shift+H",
          enabled: e,
          click: () =>
            broadcastEvent("arrange-nodes", { direction: "RIGHT" }),
        },
      ],
    },
    {
      label: "Transform",
      submenu: [
        {
          id: "to_external_view",
          label: "To External View",
          enabled: e,
          click: () =>
            broadcastEvent("transform-nodes", { view: "external" }),
        },
        {
          id: "to_internal_view",
          label: "To Internal View",
          enabled: e,
          click: () =>
            broadcastEvent("transform-nodes", { view: "internal" }),
        },
      ],
    },
    {
      label: "Generate",
      submenu: [
        {
          id: "generate_from_code",
          label: "From Source Code...",
          enabled: e,
          click: () => openGenerateWindow(),
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          id: "history",
          label: "History",
          accelerator: "CmdOrCtrl+H",
          enabled: e,
          click: () => openHistoryWindow(),
        },
        { type: "separator" },
        {
          id: "edges_outliner",
          label: "Edges Outliner",
          accelerator: "CmdOrCtrl+L",
          enabled: e,
          click: () => openEdgesOutlinerWindow(),
        },
      ],
    },
    {
      label: "Window",
      submenu: [
        {
          label: "Welcome",
          click: () => openWelcomeWindow(),
        },
        { type: "separator" },
        { role: "minimize" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

function setupIPC() {
  // Window management
  ipcMain.handle("open_new_project_window", () => {
    openNewProjectWindow();
  });

  ipcMain.handle("open_welcome_window", () => {
    openWelcomeWindow();
  });

  ipcMain.handle(
    "open_editor_window",
    (_e, { projectName, projectPath, projectData }) => {
      openEditorWindow(projectName, projectPath, projectData);
    },
  );

  ipcMain.handle("open_settings_window", () => {
    openSettingsWindow();
  });

  ipcMain.handle("open_export_window", () => {
    openExportWindow();
  });

  ipcMain.handle("open_edges_outliner_window", () => {
    openEdgesOutlinerWindow();
  });

  ipcMain.handle("open_history_window", () => {
    openHistoryWindow();
  });

  ipcMain.handle("open_generate_window", () => {
    openGenerateWindow();
  });

  ipcMain.handle("close_window", (_e, { label }) => {
    const win = windows[label];
    if (win && !win.isDestroyed()) {
      win.close();
    }
  });

  // Window operations for the calling window
  ipcMain.handle("window:minimize", (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize();
  });

  ipcMain.handle("window:toggleMaximize", (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.handle("window:close", (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close();
  });

  ipcMain.handle("window:destroy", (e) => {
    BrowserWindow.fromWebContents(e.sender)?.destroy();
  });

  ipcMain.handle("window:getTitle", (e) => {
    return BrowserWindow.fromWebContents(e.sender)?.getTitle() || "";
  });

  ipcMain.handle("window:isMaximized", (e) => {
    return BrowserWindow.fromWebContents(e.sender)?.isMaximized() || false;
  });

  // Project management
  ipcMain.handle("request_project_details", () => {
    return [projectDetails.name, projectDetails.path];
  });

  ipcMain.handle("request_project_data", () => {
    if (projectDetails.path) {
      try {
        return fs.readFileSync(projectDetails.path, "utf-8");
      } catch {
        return null;
      }
    }
    return null;
  });

  ipcMain.handle("save_file", (_e, { data }) => {
    const name = projectDetails.name || "untitled";
    if (projectDetails.path) {
      fs.writeFileSync(projectDetails.path, data);
      addRecentProject({ name, path: projectDetails.path });
    }
  });

  ipcMain.handle("save_file_as", async (_e, { data }) => {
    const result = await dialog.showSaveDialog({
      defaultPath: "untitled.fr",
      title: "Save Project As",
      filters: [{ name: "Frost Files", extensions: ["fr"] }],
    });

    if (!result.canceled && result.filePath) {
      try {
        fs.writeFileSync(result.filePath, data);
        const name = path.basename(result.filePath, ".fr");
        addRecentProject({ name, path: result.filePath });

        const content = fs.readFileSync(result.filePath, "utf-8");
        openEditorWindow(name, result.filePath, content);
      } catch (err) {
        dialog.showErrorBox("Error", `Failed to save file: ${err.message}`);
      }
    }
  });

  ipcMain.handle("save_image_as", async (_e, { data }) => {
    const result = await dialog.showSaveDialog({
      defaultPath: "exported_flow.png",
      title: "Save Image As",
      filters: [{ name: "PNG Image", extensions: ["png"] }],
    });

    if (!result.canceled && result.filePath) {
      const raw = data.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(raw, "base64");
      fs.writeFileSync(result.filePath, buffer);
    }
  });

  ipcMain.handle("open_project_file", async () => {
    const result = await dialog.showOpenDialog({
      title: "Open Project",
      filters: [{ name: "Frost Files", extensions: ["fr"] }],
      properties: ["openFile"],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      await openProjectFromPath(filePath);
      return true;
    }

    return false;
  });

  ipcMain.handle("open_project_path", async (_e, { path: filePath }) => {
    await openProjectFromPath(filePath);
  });

  ipcMain.handle("get_recent_projects", () => {
    return getRecentProjects();
  });

  ipcMain.handle("clear_recent_projects", () => {
    clearRecentProjects();
  });

  ipcMain.handle("remove_recent_project", (_e, { path: projectPath }) => {
    removeRecentProject(projectPath);
  });

  // Menu toggling
  ipcMain.handle("toggle_menu_item", (_e, { item, enabled }) => {
    // Rebuild menu with updated state isn't straightforward with Electron's
    // static menus. We track the editor-open state and rebuild.
    // For individual item toggling, this is a no-op in the Electron version
    // since menu state is managed through the menuItemsEnabled flag.
  });

  // Settings
  ipcMain.handle("get_settings_state", () => {
    return settings;
  });

  ipcMain.handle("set_settings_state", (_e, updates) => {
    // Map camelCase keys from frontend to snake_case for storage
    const camelToSnake = (str) =>
      str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

    for (const key of Object.keys(updates)) {
      if (updates[key] !== undefined && updates[key] !== null) {
        const snakeKey = camelToSnake(key);
        if (snakeKey in settings) {
          settings[snakeKey] = updates[key];
        } else if (key in settings) {
          settings[key] = updates[key];
        }
      }
    }

    // Broadcast camelCase version to all windows
    broadcastEvent("settings-updated", {
      theme: settings.theme,
      panOnScroll: settings.pan_on_scroll,
      showMinimap: settings.show_minimap,
      coloredNodes: settings.colored_nodes,
      showControls: settings.show_controls,
      edgeStyle: settings.edge_style,
      autoSave: settings.auto_save,
      autoSaveInterval: settings.auto_save_interval,
      showGrid: settings.show_grid,
      snapToGrid: settings.snap_to_grid,
      gridSize: settings.grid_size,
      compactNodes: settings.compact_nodes,
      objectNodeAccessModifierColorLight:
        settings.object_node_access_modifier_color_light,
      objectNodeAccessModifierColorDark:
        settings.object_node_access_modifier_color_dark,
      objectNodeTypeSeparatorColorLight:
        settings.object_node_type_separator_color_light,
      objectNodeTypeSeparatorColorDark:
        settings.object_node_type_separator_color_dark,
      objectNodeTypeColorLight: settings.object_node_type_color_light,
      objectNodeTypeColorDark: settings.object_node_type_color_dark,
      objectNodeDefaultValueColorLight:
        settings.object_node_default_value_color_light,
      objectNodeDefaultValueColorDark:
        settings.object_node_default_value_color_dark,
      objectNodeParameterNameColorLight:
        settings.object_node_parameter_name_color_light,
      objectNodeParameterNameColorDark:
        settings.object_node_parameter_name_color_dark,
      nodeBorderRadius: settings.node_border_radius,
      showEdgeLabels: settings.show_edge_labels,
    });
  });

  ipcMain.handle("save_settings_state", () => {
    saveSettings();
  });

  // Code generation
  ipcMain.handle(
    "start_generation",
    async (_e, { paths, recursive, generateGroups }) => {
      // Close the generate options window
      const genWin = windows["generate"];
      if (genWin && !genWin.isDestroyed()) {
        genWin.close();
      }

      // Open progress window and wait for it to be ready
      const progressWin = openGeneratingWindow();
      await new Promise((resolve) => {
        if (progressWin.webContents.isLoading()) {
          progressWin.webContents.once("did-finish-load", resolve);
        } else {
          resolve();
        }
      });

      try {
        const result = await generateDiagram(
          paths,
          recursive,
          generateGroups,
          (progress) => {
            // Send progress updates to the generating window
            if (progressWin && !progressWin.isDestroyed()) {
              progressWin.webContents.send(
                "app-event",
                "generation-progress",
                progress,
              );
            }
          },
        );

        // Send result to editor
        sendToWindow("editor", "diagram-generated", result);
      } catch (err) {
        console.error("Generation failed:", err);
      } finally {
        // Close progress window
        if (progressWin && !progressWin.isDestroyed()) {
          progressWin.close();
        }
      }
    },
  );

  // Dialog adapter
  ipcMain.handle("dialog:open", async (_e, options) => {
    const properties = [];
    if (options.directory) properties.push("openDirectory");
    else properties.push("openFile");
    if (options.multiple) properties.push("multiSelections");

    const result = await dialog.showOpenDialog({
      title: options.title || "Select",
      properties,
      filters: options.filters || [],
    });

    if (result.canceled) return null;
    if (options.multiple) return result.filePaths;
    return result.filePaths[0] || null;
  });

  // OS info
  ipcMain.handle("os:type", () => {
    switch (process.platform) {
      case "darwin":
        return "macos";
      case "win32":
        return "windows";
      case "linux":
        return "linux";
      default:
        return process.platform;
    }
  });

  // Shell operations
  ipcMain.handle("shell:revealItemInDir", (_e, filePath) => {
    shell.showItemInFolder(filePath);
  });

  // Event forwarding: renderer → other renderers
  ipcMain.on("emit-event", (_e, eventName, payload) => {
    broadcastEvent(eventName, payload);
  });

  // Window close interception
  ipcMain.handle("window:onCloseRequested", (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (!win) return;

    // Prevent default close - let the renderer handle it
    win.on("close", (event) => {
      if (!win._forceClose) {
        event.preventDefault();
        win.webContents.send("app-event", "close-requested", null);
      }
    });
  });

  ipcMain.handle("window:forceClose", (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win) {
      win._forceClose = true;
      win.close();
    }
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function openProjectFromPath(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const name = path.basename(filePath, path.extname(filePath));
    addRecentProject({ name, path: filePath });
    openEditorWindow(name, filePath, content);
  } catch (err) {
    dialog.showErrorBox(
      "Error",
      `Failed to open project at path: ${filePath}\n\nError: ${err.message}`,
    );
  }
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  nativeTheme.themeSource = "dark";
  loadSettings();
  setupIPC();
  buildMenu();
  openWelcomeWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      openWelcomeWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
