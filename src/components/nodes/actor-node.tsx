import { FC, useEffect } from "react";
import { useUpdateNodeInternals } from "@xyflow/react";
import { User } from "lucide-react";
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
import NodeConnectionHandle from "../ui/nodes/node-connection-handle";
import NodeSelectionRing from "../ui/nodes/node-selection-ring";

export interface ActorNodeData extends Record<string, unknown> {
  name: string;
}

interface ActorNodeProps {
  id: string;
  data: ActorNodeData;
  selected: boolean;
}

const ActorNode: FC<ActorNodeProps> = ({ id, data, selected }) => {
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
              "relative flex flex-col items-center justify-center min-w-15 gap-1 bg-transparent text-foreground",
              compactNodes ? "p-1 pb-4" : "p-2 pb-6",
            )}
          >
            <NodeSelectionRing visible={selected} />
            <User
              className={cn("stroke-1", compactNodes ? "w-6 h-6" : "w-10 h-10")}
            />
            <p
              className={cn(
                "text-center font-medium wrap-break-word outline-hidden max-w-30",
                compactNodes ? "text-xs" : "text-sm",
              )}
            >
              {data.name || "Actor"}
            </p>
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

export default ActorNode;
