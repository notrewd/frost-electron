import { useMemo } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { useShallow } from "zustand/react/shallow";

export function useObjectNodeColors() {
  const {
    coloredNodes,
    theme,
    accessColorLight,
    accessColorDark,
    separatorColorLight,
    separatorColorDark,
    typeColorLight,
    typeColorDark,
    defaultValueColorLight,
    defaultValueColorDark,
    parameterColorLight,
    parameterColorDark,
  } = useSettingsStore(
    useShallow((state) => ({
      coloredNodes: state.colored_nodes,
      theme: state.theme,
      accessColorLight: state.object_node_access_modifier_color_light,
      accessColorDark: state.object_node_access_modifier_color_dark,
      separatorColorLight: state.object_node_type_separator_color_light,
      separatorColorDark: state.object_node_type_separator_color_dark,
      typeColorLight: state.object_node_type_color_light,
      typeColorDark: state.object_node_type_color_dark,
      defaultValueColorLight: state.object_node_default_value_color_light,
      defaultValueColorDark: state.object_node_default_value_color_dark,
      parameterColorLight: state.object_node_parameter_name_color_light,
      parameterColorDark: state.object_node_parameter_name_color_dark,
    })),
  );

  const isDark = useMemo(
    () =>
      theme === "system"
        ? document.documentElement.classList.contains("dark")
        : theme === "dark",
    [theme],
  );

  return {
    aColor: coloredNodes
      ? isDark
        ? accessColorDark
        : accessColorLight
      : undefined,
    sColor: coloredNodes
      ? isDark
        ? separatorColorDark
        : separatorColorLight
      : undefined,
    tColor: coloredNodes
      ? isDark
        ? typeColorDark
        : typeColorLight
      : undefined,
    dColor: coloredNodes
      ? isDark
        ? defaultValueColorDark
        : defaultValueColorLight
      : undefined,
    pColor: coloredNodes
      ? isDark
        ? parameterColorDark
        : parameterColorLight
      : undefined,
  };
}
