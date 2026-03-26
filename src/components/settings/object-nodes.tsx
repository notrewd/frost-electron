import SettingsField from "../ui/settings-field";
import { useShallow } from "zustand/react/shallow";
import { useSettingsStore } from "@/stores/settings-store";
import { Switch } from "../ui/switch";
import { FC } from "react";
import { getThemeColorCounterpart } from "@/lib/utils";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";

interface ObjectNodesSettingsProps {
  onChange?: () => void;
  searchQuery?: string;
}

const ColorPickerField = ({
  label,
  description,
  color,
  onChange,
  isMatch,
}: any) => {
  if (
    !isMatch(label) &&
    !isMatch(description) &&
    !isMatch("Colors") &&
    !isMatch("Color Scheme")
  )
    return null;

  return (
    <SettingsField label={label} description={description}>
      <Popover>
        <PopoverTrigger asChild>
          <div
            className="w-32! h-6! rounded-md border shadow-sm cursor-pointer"
            style={{ backgroundColor: color }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3 flex flex-col gap-2" align="end">
          <HexColorPicker color={color} onChange={onChange} />
          <Input
            variant="small"
            value={color}
            onChange={(e) => onChange(e.target.value)}
          />
        </PopoverContent>
      </Popover>
    </SettingsField>
  );
};

const ObjectNodesSettings: FC<ObjectNodesSettingsProps> = ({
  onChange,
  searchQuery = "",
}) => {
  const {
    coloredNodes,
    setColoredNodes,
    objectNodeAccessModifierColorLight,
    objectNodeAccessModifierColorDark,
    theme,
    setObjectNodeAccessModifierColor,
    objectNodeTypeSeparatorColorLight,
    objectNodeTypeSeparatorColorDark,
    setObjectNodeTypeSeparatorColor,
    objectNodeTypeColorLight,
    objectNodeTypeColorDark,
    setObjectNodeTypeColor,
    objectNodeDefaultValueColorLight,
    objectNodeDefaultValueColorDark,
    setObjectNodeDefaultValueColor,
    objectNodeParameterNameColorLight,
    objectNodeParameterNameColorDark,
    setObjectNodeParameterNameColor,
  } = useSettingsStore(
    useShallow((state) => ({
      coloredNodes: state.colored_nodes,
      setColoredNodes: state.setColoredNodes,
      objectNodeAccessModifierColorLight:
        state.object_node_access_modifier_color_light,
      objectNodeAccessModifierColorDark:
        state.object_node_access_modifier_color_dark,
      theme: state.theme,
      setObjectNodeAccessModifierColor: state.setObjectNodeAccessModifierColor,
      objectNodeTypeSeparatorColorLight:
        state.object_node_type_separator_color_light,
      objectNodeTypeSeparatorColorDark:
        state.object_node_type_separator_color_dark,
      setObjectNodeTypeSeparatorColor: state.setObjectNodeTypeSeparatorColor,
      objectNodeTypeColorLight: state.object_node_type_color_light,
      objectNodeTypeColorDark: state.object_node_type_color_dark,
      setObjectNodeTypeColor: state.setObjectNodeTypeColor,
      objectNodeDefaultValueColorLight:
        state.object_node_default_value_color_light,
      objectNodeDefaultValueColorDark:
        state.object_node_default_value_color_dark,
      setObjectNodeDefaultValueColor: state.setObjectNodeDefaultValueColor,
      objectNodeParameterNameColorLight:
        state.object_node_parameter_name_color_light,
      objectNodeParameterNameColorDark:
        state.object_node_parameter_name_color_dark,
      setObjectNodeParameterNameColor: state.setObjectNodeParameterNameColor,
    })),
  );

  const isDark =
    theme === "system"
      ? document.documentElement.classList.contains("dark")
      : theme === "dark";

  const objectNodeAccessModifierColor = isDark
    ? objectNodeAccessModifierColorDark
    : objectNodeAccessModifierColorLight;
  const objectNodeTypeSeparatorColor = isDark
    ? objectNodeTypeSeparatorColorDark
    : objectNodeTypeSeparatorColorLight;
  const objectNodeTypeColor = isDark
    ? objectNodeTypeColorDark
    : objectNodeTypeColorLight;
  const objectNodeDefaultValueColor = isDark
    ? objectNodeDefaultValueColorDark
    : objectNodeDefaultValueColorLight;
  const objectNodeParameterNameColor = isDark
    ? objectNodeParameterNameColorDark
    : objectNodeParameterNameColorLight;

  const isMatch = (text: string) =>
    text.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <>
      {(isMatch("Colored Nodes") ||
        isMatch("Enable or disable colored nodes")) && (
        <SettingsField
          label="Colored Nodes"
          description="Enable or disable colored nodes"
        >
          <Switch
            checked={coloredNodes}
            onCheckedChange={(checked) => {
              setColoredNodes(checked);
              onChange?.();
            }}
          />
        </SettingsField>
      )}
      <Separator className="my-2" />
      <ColorPickerField
        label="Access Modifier Color"
        description="Color for access modifiers like +, -, #"
        color={objectNodeAccessModifierColor}
        onChange={(c: string) => {
          setObjectNodeAccessModifierColor(
            isDark ? getThemeColorCounterpart(c, false) : c,
            isDark ? c : getThemeColorCounterpart(c, true),
          );
          onChange?.();
        }}
        isMatch={isMatch}
      />

      <ColorPickerField
        label="Type Separator Color"
        description="Color for colon (:) separating properties and types"
        color={objectNodeTypeSeparatorColor}
        onChange={(c: string) => {
          setObjectNodeTypeSeparatorColor(
            isDark ? getThemeColorCounterpart(c, false) : c,
            isDark ? c : getThemeColorCounterpart(c, true),
          );
          onChange?.();
        }}
        isMatch={isMatch}
      />

      <ColorPickerField
        label="Type Color"
        description="Color for object types"
        color={objectNodeTypeColor}
        onChange={(c: string) => {
          setObjectNodeTypeColor(
            isDark ? getThemeColorCounterpart(c, false) : c,
            isDark ? c : getThemeColorCounterpart(c, true),
          );
          onChange?.();
        }}
        isMatch={isMatch}
      />

      <ColorPickerField
        label="Default Value Color"
        description="Color for default values"
        color={objectNodeDefaultValueColor}
        onChange={(c: string) => {
          setObjectNodeDefaultValueColor(
            isDark ? getThemeColorCounterpart(c, false) : c,
            isDark ? c : getThemeColorCounterpart(c, true),
          );
          onChange?.();
        }}
        isMatch={isMatch}
      />

      <ColorPickerField
        label="Parameter Name Color"
        description="Color for parameter names"
        color={objectNodeParameterNameColor}
        onChange={(c: string) => {
          setObjectNodeParameterNameColor(
            isDark ? getThemeColorCounterpart(c, false) : c,
            isDark ? c : getThemeColorCounterpart(c, true),
          );
          onChange?.();
        }}
        isMatch={isMatch}
      />
    </>
  );
};

export default ObjectNodesSettings;
