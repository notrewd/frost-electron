import { FC, useEffect } from "react";
import { useUpdateNodeInternals } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { useShallow } from "zustand/react/shallow";
import { Component } from "lucide-react";
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
import NodeConnectionHandle from "../ui/nodes/node-connection-handle";
import NodeSelectionRing from "../ui/nodes/node-selection-ring";

export interface ComponentNodeData extends Record<string, unknown> {
  name: string;
}

interface ComponentNodeProps {
  id: string;
  data: ComponentNodeData;
  selected: boolean;
}

const ComponentNode: FC<ComponentNodeProps> = ({ id, data, selected }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(id);
  }, [data, id, updateNodeInternals]);

  const { compactNodes, nodeBorderRadius } = useSettingsStore(
    useShallow((state) => ({
      compactNodes: state.compact_nodes,
      nodeBorderRadius: state.node_border_radius,
    })),
  );

  return (
    <>
      <NodeContextMenu>
        <NodeContextMenuContent>
          <div
            className={cn(
              "relative flex flex-col bg-background border border-border shadow-sm",
              compactNodes
                ? "p-2 min-w-28 min-h-12"
                : "p-4 min-w-37.5 min-h-20",
            )}
            style={{ borderRadius: `${nodeBorderRadius}px` }}
          >
            <NodeSelectionRing visible={selected} />
            <div
              className={cn(
                "absolute",
                compactNodes ? "top-1 right-1" : "top-2 right-2",
              )}
            >
              <Component
                className={cn(
                  "opacity-50",
                  compactNodes ? "w-3 h-3" : "w-5 h-5",
                )}
              />
            </div>
            <div
              className={cn(
                "flex-1 flex items-center justify-center",
                compactNodes ? "pt-1" : "pt-2",
              )}
            >
              <p
                className={cn(
                  "text-center font-semibold wrap-break-word outline-hidden",
                  compactNodes ? "text-xs" : "text-sm",
                )}
              >
                {data.name || "Component"}
              </p>
            </div>
            <NodeConnectionHandle nodeId={id} />
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

export default ComponentNode;
