export type ProjectOpenedEvent = {
  name: string;
  path: string;
  data: string;
};

export type ThemeChangedEvent = {
  theme: "light" | "dark" | "system";
};

export type DiagramGeneratedEvent = {
  nodes: any[];
  edges: any[];
};

export type SettingsUpdatedEvent = {
  theme: "light" | "dark" | "system";
  pan_on_scroll: boolean;
  show_minimap: boolean;
  colored_nodes: boolean;
  show_controls: boolean;
};
