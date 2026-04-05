import { create } from "zustand/react";
import { SettingsState } from "./types";
import { listen } from "@/lib/electron/events";
import { invoke } from "@/lib/electron/invoke";
import { setTheme } from "@/managers/theme-manager";

export const useSettingsStore = create<SettingsState>(() => ({
  theme: "dark",
  pan_on_scroll: false,
  show_minimap: true,
  colored_nodes: true,
  object_node_access_modifier_color_light: "#16a34a",
  object_node_access_modifier_color_dark: "#16a34a",
  object_node_type_separator_color_light: "#dc2626",
  object_node_type_separator_color_dark: "#dc2626",
  object_node_type_color_light: "#2563eb",
  object_node_type_color_dark: "#2563eb",
  object_node_default_value_color_light: "#9333ea",
  object_node_default_value_color_dark: "#9333ea",
  object_node_parameter_name_color_light: "#ea580c",
  object_node_parameter_name_color_dark: "#ea580c",
  show_controls: true,
  edge_style: "bezier",
  auto_save: false,
  auto_save_interval: 5,
  show_grid: true,
  snap_to_grid: false,
  grid_size: 15,
  compact_nodes: false,
  node_border_radius: 8,
  show_edge_labels: true,

  setTheme: (theme) => {
    invoke("set_settings_state", { theme });
  },
  setPanOnScroll: (enabled: boolean) =>
    invoke("set_settings_state", { panOnScroll: enabled }),
  setShowMinimap: (enabled: boolean) =>
    invoke("set_settings_state", { showMinimap: enabled }),
  setColoredNodes: (enabled: boolean) =>
    invoke("set_settings_state", { coloredNodes: enabled }),
  setObjectNodeAccessModifierColor: (light: string, dark: string) =>
    invoke("set_settings_state", {
      objectNodeAccessModifierColorLight: light,
      objectNodeAccessModifierColorDark: dark,
    }),
  setObjectNodeTypeSeparatorColor: (light: string, dark: string) =>
    invoke("set_settings_state", {
      objectNodeTypeSeparatorColorLight: light,
      objectNodeTypeSeparatorColorDark: dark,
    }),
  setObjectNodeTypeColor: (light: string, dark: string) =>
    invoke("set_settings_state", {
      objectNodeTypeColorLight: light,
      objectNodeTypeColorDark: dark,
    }),
  setObjectNodeDefaultValueColor: (light: string, dark: string) =>
    invoke("set_settings_state", {
      objectNodeDefaultValueColorLight: light,
      objectNodeDefaultValueColorDark: dark,
    }),
  setObjectNodeParameterNameColor: (light: string, dark: string) =>
    invoke("set_settings_state", {
      objectNodeParameterNameColorLight: light,
      objectNodeParameterNameColorDark: dark,
    }),
  setShowControls: (enabled: boolean) =>
    invoke("set_settings_state", { showControls: enabled }),
  setEdgeStyle: (style: "straight" | "smoothstep" | "bezier") =>
    invoke("set_settings_state", { edgeStyle: style }),
  setAutoSave: (enabled: boolean) =>
    invoke("set_settings_state", { autoSave: enabled }),
  setAutoSaveInterval: (interval: number) =>
    invoke("set_settings_state", { autoSaveInterval: interval }),
  setShowGrid: (enabled: boolean) =>
    invoke("set_settings_state", { showGrid: enabled }),
  setSnapToGrid: (enabled: boolean) =>
    invoke("set_settings_state", { snapToGrid: enabled }),
  setGridSize: (size: number) =>
    invoke("set_settings_state", { gridSize: size }),
  setCompactNodes: (compact: boolean) =>
    invoke("set_settings_state", { compactNodes: compact }),
  setNodeBorderRadius: (radius: number) =>
    invoke("set_settings_state", { nodeBorderRadius: radius }),
  setShowEdgeLabels: (show: boolean) =>
    invoke("set_settings_state", { showEdgeLabels: show }),
}));

const fetchSettings = async () => {
  const settings = (await invoke("get_settings_state")) as SettingsState;

  useSettingsStore.setState({
    theme: settings.theme,
    pan_on_scroll: settings.pan_on_scroll,
    show_minimap: settings.show_minimap,
    colored_nodes: settings.colored_nodes,
    object_node_access_modifier_color_light:
      settings.object_node_access_modifier_color_light,
    object_node_access_modifier_color_dark:
      settings.object_node_access_modifier_color_dark,
    object_node_type_separator_color_light:
      settings.object_node_type_separator_color_light,
    object_node_type_separator_color_dark:
      settings.object_node_type_separator_color_dark,
    object_node_type_color_light: settings.object_node_type_color_light,
    object_node_type_color_dark: settings.object_node_type_color_dark,
    object_node_default_value_color_light:
      settings.object_node_default_value_color_light,
    object_node_default_value_color_dark:
      settings.object_node_default_value_color_dark,
    object_node_parameter_name_color_light:
      settings.object_node_parameter_name_color_light,
    object_node_parameter_name_color_dark:
      settings.object_node_parameter_name_color_dark,
    show_controls: settings.show_controls,
    edge_style: settings.edge_style,
    auto_save: settings.auto_save,
    auto_save_interval: settings.auto_save_interval,
    show_grid: settings.show_grid,
    snap_to_grid: settings.snap_to_grid,
    grid_size: settings.grid_size,
    compact_nodes: settings.compact_nodes,
    node_border_radius: settings.node_border_radius,
    show_edge_labels: settings.show_edge_labels,
  });

  setTheme(settings.theme);
};

const subscribeToSettingsUpdates = () => {
  listen("settings-updated", (event) => {
    const settings = event.payload as any;

    useSettingsStore.setState({
      theme: settings.theme,
      pan_on_scroll: settings.panOnScroll,
      show_minimap: settings.showMinimap,
      colored_nodes: settings.coloredNodes,
      object_node_access_modifier_color_light:
        settings.objectNodeAccessModifierColorLight,
      object_node_access_modifier_color_dark:
        settings.objectNodeAccessModifierColorDark,
      object_node_type_separator_color_light:
        settings.objectNodeTypeSeparatorColorLight,
      object_node_type_separator_color_dark:
        settings.objectNodeTypeSeparatorColorDark,
      object_node_type_color_light: settings.objectNodeTypeColorLight,
      object_node_type_color_dark: settings.objectNodeTypeColorDark,
      object_node_default_value_color_light:
        settings.objectNodeDefaultValueColorLight,
      object_node_default_value_color_dark:
        settings.objectNodeDefaultValueColorDark,
      object_node_parameter_name_color_light:
        settings.objectNodeParameterNameColorLight,
      object_node_parameter_name_color_dark:
        settings.objectNodeParameterNameColorDark,
      edge_style: settings.edgeStyle,
      show_controls: settings.showControls,
      auto_save: settings.autoSave,
      auto_save_interval: settings.autoSaveInterval,
      show_grid: settings.showGrid,
      snap_to_grid: settings.snapToGrid,
      grid_size: settings.gridSize,
      compact_nodes: settings.compactNodes,
      node_border_radius: settings.nodeBorderRadius,
      show_edge_labels: settings.showEdgeLabels,
    });

    setTheme(settings.theme);
  });
};

fetchSettings();
subscribeToSettingsUpdates();
