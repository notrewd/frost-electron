import { FC, useState, useEffect } from "react";
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
import { ContextMenuItem, ContextMenuSeparator } from "../ui/context-menu";
import NodeSelectionRing from "../ui/nodes/node-selection-ring";
import { Edit2 } from "lucide-react";
import NoteNodeDialog from "../ui/dialogs/note-node-dialog";

export interface NoteNodeData extends Record<string, unknown> {
  name: string;
  note: string;
}

interface NoteNodeProps {
  id: string;
  data: NoteNodeData;
  selected: boolean;
}

const NoteNode: FC<NoteNodeProps> = ({ id, data, selected }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(id);
  }, [data, id, updateNodeInternals]);

  const [dialogOpen, setDialogOpen] = useState(false);

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
              "relative flex flex-col bg-[#fef08a] dark:bg-[#ca8a04] text-foreground shadow-md",
              "border border-border",
              compactNodes
                ? "min-w-28 min-h-16 p-2"
                : "min-w-37.5 min-h-25 p-4",
            )}
            style={{
              borderRadius: `${nodeBorderRadius}px`,
            }}
            onDoubleClick={() => setDialogOpen(true)}
          >
            <NodeSelectionRing visible={selected} />
            <p
              className={cn(
                "w-full h-full whitespace-pre-wrap font-sans outline-hidden wrap-break-word",
                compactNodes ? "text-xs" : "text-sm",
              )}
            >
              {data.note || "Double click to edit note"}
            </p>
          </div>
        </NodeContextMenuContent>
        <NodeContextMenuOptions>
          <ContextMenuItem onClick={() => setDialogOpen(true)}>
            <Edit2 className="size-4" />
            Edit Data
          </ContextMenuItem>
          <ContextMenuSeparator />
          <NodeContextMenuFocusOption nodeId={id} />
          <NodeContextMenuGroupOption nodeId={id} />
          <NodeContextMenuUngroupOption nodeId={id} />
          <ContextMenuSeparator />
          <NodeContextMenuExportOption nodeId={id} />
          <ContextMenuSeparator />
          <NodeContextMenuDeleteOption nodeId={id} />
        </NodeContextMenuOptions>
      </NodeContextMenu>
      <NoteNodeDialog
        id={id}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        data={data}
      />
    </>
  );
};

export default NoteNode;
