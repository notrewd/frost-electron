import { FC, useEffect } from "react";
import { useUpdateNodeInternals } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { useShallow } from "zustand/react/shallow";
import NodeContextMenu, {
  NodeContextMenuContent,
  NodeContextMenuDeleteOption,
  NodeContextMenuFocusOption,
  NodeContextMenuExportOption,
  NodeContextMenuGroupOption,
  NodeContextMenuOptions,
  NodeContextMenuUngroupOption,
} from "../ui/nodes/node-context-menu";
import { ContextMenuSeparator } from "../ui/context-menu";
import NodeSelectionRing from "../ui/nodes/node-selection-ring";

export interface UseCaseNodeData extends Record<string, unknown> {
  name: string;
}

interface UseCaseNodeProps {
  id: string;
  data: UseCaseNodeData;
  selected: boolean;
}

const UseCaseNode: FC<UseCaseNodeProps> = ({ id, data, selected }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(id);
  }, [data, id, updateNodeInternals]);

  const { compactNodes } = useSettingsStore(
    useShallow((state) => ({
      compactNodes: state.compact_nodes,
    })),
  );

  return (
    <>
      <NodeContextMenu>
        <NodeContextMenuContent>
          <div
            className={cn(
              "relative flex items-center justify-center bg-background border-2 border-foreground shadow-sm",
              compactNodes ? "p-2 min-w-22 min-h-10" : "p-4 min-w-30 min-h-15",
            )}
            style={{ borderRadius: "50%" }}
          >
            <NodeSelectionRing visible={selected} />
            <p
              className={cn(
                "text-center font-semibold wrap-break-word px-2 outline-hidden",
                compactNodes ? "text-xs" : "text-sm",
              )}
            >
              {data.name || "Use Case"}
            </p>
          </div>
        </NodeContextMenuContent>
        <NodeContextMenuOptions>
          <NodeContextMenuFocusOption nodeId={id} />
          <NodeContextMenuGroupOption nodeId={id} />
          <NodeContextMenuUngroupOption nodeId={id} />
          <ContextMenuSeparator />
          <NodeContextMenuExportOption nodeId={id} />
          <ContextMenuSeparator />
          <NodeContextMenuDeleteOption nodeId={id} />
        </NodeContextMenuOptions>
      </NodeContextMenu>
    </>
  );
};

export default UseCaseNode;
