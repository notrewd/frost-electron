import SettingsField from "../ui/settings-field";
import { useShallow } from "zustand/react/shallow";
import { useSettingsStore } from "@/stores/settings-store";
import { Switch } from "../ui/switch";
import { NumberInput } from "../ui/number-input";
import { FC } from "react";

interface NodesSettingsProps {
  onChange?: () => void;
  searchQuery?: string;
}

const NodesSettings: FC<NodesSettingsProps> = ({
  onChange,
  searchQuery = "",
}) => {
  const {
    compactNodes,
    setCompactNodes,
    nodeBorderRadius,
    setNodeBorderRadius,
  } = useSettingsStore(
    useShallow((state) => ({
      compactNodes: state.compact_nodes,
      setCompactNodes: state.setCompactNodes,
      nodeBorderRadius: state.node_border_radius,
      setNodeBorderRadius: state.setNodeBorderRadius,
    })),
  );

  const isMatch = (text: string) =>
    text.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <>
      {(isMatch("Compact Nodes") ||
        isMatch("Use a more compact visual style for nodes")) && (
        <SettingsField
          label="Compact Nodes"
          description="Use a more compact visual style for nodes"
        >
          <Switch
            checked={compactNodes}
            onCheckedChange={(checked) => {
              setCompactNodes(checked);
              onChange?.();
            }}
          />
        </SettingsField>
      )}

      {(isMatch("Node Border Radius") ||
        isMatch("Corner roundness of the nodes")) && (
        <SettingsField
          label="Node Border Radius"
          description="Corner roundness of the nodes (in px)"
        >
          <div className="w-48!">
            <NumberInput
              value={nodeBorderRadius}
              min={0}
              max={32}
              onChange={(value) => {
                setNodeBorderRadius(Number(value) || 0);
                onChange?.();
              }}
            />
          </div>
        </SettingsField>
      )}
    </>
  );
};

export default NodesSettings;
