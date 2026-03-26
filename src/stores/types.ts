import { ObjectNodeData } from "@/components/nodes/object-node";
import {
  Edge,
  Node,
  OnEdgesChange,
  OnNodesChange,
  ReactFlowInstance,
} from "@xyflow/react";

export interface FlowState {
  nodes: Node<ObjectNodeData>[];
  edges: Edge[];
  instance: ReactFlowInstance<Node<ObjectNodeData>, Edge> | null;
  onNodesChange: OnNodesChange<Node<ObjectNodeData>>;
  onEdgesChange: OnEdgesChange;
  onConnect: (edge: Edge) => void;
  setNodes: (
    fn: (prev: Node<ObjectNodeData>[]) => Node<ObjectNodeData>[],
  ) => void;
  setEdges: (fn: (prev: Edge[]) => Edge[]) => void;
  setInstance: (
    instance: ReactFlowInstance<Node<ObjectNodeData>, Edge>,
  ) => void;
}

export interface ProjectState {
  projectName: string;
  projectPath: string;
  projectData: string;
  projectEdited: boolean;
  canUndo: boolean;
  canRedo: boolean;
  setProjectName: (name: string) => void;
  setProjectPath: (path: string) => void;
  setProjectData: (data: string) => void;
  setProjectEdited: (edited: boolean) => void;
  setCanUndo: (canUndo: boolean) => void;
  setCanRedo: (canRedo: boolean) => void;
}

export interface SettingsState {
  theme: "light" | "dark" | "system";
  pan_on_scroll: boolean;
  show_minimap: boolean;
  colored_nodes: boolean;
  object_node_access_modifier_color_light: string;
  object_node_access_modifier_color_dark: string;
  object_node_type_separator_color_light: string;
  object_node_type_separator_color_dark: string;
  object_node_type_color_light: string;
  object_node_type_color_dark: string;
  object_node_default_value_color_light: string;
  object_node_default_value_color_dark: string;
  object_node_parameter_name_color_light: string;
  object_node_parameter_name_color_dark: string;
  show_controls: boolean;
  edge_style: "straight" | "smoothstep" | "bezier";
  auto_save: boolean;
  auto_save_interval: number;
  show_grid: boolean;
  snap_to_grid: boolean;
  grid_size: number;
  compact_nodes: boolean;
  node_border_radius: number;
  show_edge_labels: boolean;

  setTheme: (theme: "light" | "dark" | "system") => void;
  setPanOnScroll: (enabled: boolean) => void;
  setShowMinimap: (enabled: boolean) => void;
  setColoredNodes: (enabled: boolean) => void;
  setObjectNodeAccessModifierColor: (light: string, dark: string) => void;
  setObjectNodeTypeSeparatorColor: (light: string, dark: string) => void;
  setObjectNodeTypeColor: (light: string, dark: string) => void;
  setObjectNodeDefaultValueColor: (light: string, dark: string) => void;
  setObjectNodeParameterNameColor: (light: string, dark: string) => void;
  setShowControls: (enabled: boolean) => void;
  setEdgeStyle: (edgeStyle: "straight" | "smoothstep" | "bezier") => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
  setShowGrid: (enabled: boolean) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setGridSize: (size: number) => void;
  setCompactNodes: (compact: boolean) => void;
  setNodeBorderRadius: (radius: number) => void;
  setShowEdgeLabels: (show: boolean) => void;
}
