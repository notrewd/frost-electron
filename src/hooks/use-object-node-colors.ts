import { useMemo } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { useShallow } from "zustand/react/shallow";

export function useObjectNodeColors() {
  const {
    coloredNodes,
    theme,
    publicAccessColorLight,
    publicAccessColorDark,
    privateAccessColorLight,
    privateAccessColorDark,
    protectedAccessColorLight,
    protectedAccessColorDark,
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
      publicAccessColorLight: state.object_node_public_access_color_light,
      publicAccessColorDark: state.object_node_public_access_color_dark,
      privateAccessColorLight: state.object_node_private_access_color_light,
      privateAccessColorDark: state.object_node_private_access_color_dark,
      protectedAccessColorLight: state.object_node_protected_access_color_light,
      protectedAccessColorDark: state.object_node_protected_access_color_dark,
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
    publicAColor: coloredNodes
      ? isDark
        ? publicAccessColorDark
        : publicAccessColorLight
      : undefined,
    privateAColor: coloredNodes
      ? isDark
        ? privateAccessColorDark
        : privateAccessColorLight
      : undefined,
    protectedAColor: coloredNodes
      ? isDark
        ? protectedAccessColorDark
        : protectedAccessColorLight
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
