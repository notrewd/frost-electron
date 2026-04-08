import { FC, useCallback, useEffect } from "react";
import { useUpdateNodeInternals } from "@xyflow/react";
import { Focus, Trash2, Ungroup, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { useShallow } from "zustand/react/shallow";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../ui/context-menu";
import useFlowStore from "@/stores/flow-store";
import { Card } from "../ui/card";
import { emit } from "@/lib/electron/events";

export interface GroupNodeData extends Record<string, unknown> {
  name: string;
  color: string;
}

interface GroupNodeProps {
  id: string;
  data: GroupNodeData;
  selected: boolean;
}

const GroupNode: FC<GroupNodeProps> = ({ id, data, selected }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(id);
  }, [data, id, updateNodeInternals]);

  const { setNodes, instance } = useFlowStore(
    useShallow((state) => ({
      setNodes: state.setNodes,
      instance: state.instance,
    })),
  );

  const childrenNodes = useFlowStore(
    useShallow((state) => state.nodes.filter((n) => n.parentId === id)),
  );

  const { nodeBorderRadius } = useSettingsStore(
    useShallow((state) => ({
      nodeBorderRadius: state.node_border_radius,
    })),
  );

  const handleFocus = useCallback(() => {
    if (!instance) return;
    const currentNodes = instance.getNodes();
    instance?.fitView({
      nodes: currentNodes
        .filter((node) => node.selected || node.id === id)
        .map((node) => ({ id: node.id })),
    });
  }, [instance, id]);

  const handleExport = useCallback(() => {
    const { nodes } = useFlowStore.getState();
    const selectedNodes = nodes.filter(
      (node) => node.selected || node.id === id,
    );
    const nodeIds = selectedNodes.map((n) => n.id);
    emit("request-export-selection-image", { nodeIds });
  }, [id]);

  const handleDelete = useCallback(() => {
    useFlowStore.getState().saveSnapshot("Delete group");
    setNodes((currentNodes) => {
      // Find all groups that are selected or the current group
      const groupsToDelete = currentNodes
        .filter((node) => node.selected || node.id === id)
        .map((node) => node.id);

      // Find all nodes that are children of these groups
      const childrenToDelete = currentNodes
        .filter(
          (node) => node.parentId && groupsToDelete.includes(node.parentId),
        )
        .map((node) => node.id);

      const allToDelete = new Set([...groupsToDelete, ...childrenToDelete]);

      return currentNodes.filter((node) => !allToDelete.has(node.id));
    });
  }, [setNodes, id]);

  const handleUngroup = useCallback(() => {
    useFlowStore.getState().saveSnapshot("Ungroup nodes");
    setNodes((prevNodes) => {
      const groupNode = prevNodes.find((n) => n.id === id);
      if (!groupNode) return prevNodes;

      const newNodes = prevNodes
        .filter((n) => n.id !== id)
        .map((n) => {
          if (n.parentId === id) {
            return {
              ...n,
              parentId: groupNode.parentId,
              position: {
                x: (groupNode.position?.x ?? 0) + n.position.x,
                y: (groupNode.position?.y ?? 0) + n.position.y,
              },
            };
          }
          return n;
        });
      return newNodes;
    });
  }, [id, setNodes]);

  let visualLeft = 0;
  let visualTop = 0;
  let visualWidth = 200;
  let visualHeight = 200;

  if (childrenNodes.length > 0) {
    const minX = Math.min(...childrenNodes.map((n) => n.position.x));
    const minY = Math.min(...childrenNodes.map((n) => n.position.y));
    const maxX = Math.max(
      ...childrenNodes.map((n) => n.position.x + (n.measured?.width || 200)),
    );
    const maxY = Math.max(
      ...childrenNodes.map((n) => n.position.y + (n.measured?.height || 200)),
    );

    const padding = 40;
    visualLeft = minX - padding;
    visualTop = minY - padding;
    visualWidth = Math.max(200, maxX - minX + padding * 2);
    visualHeight = Math.max(200, maxY - minY + padding * 2);
  }

  const isDragging = childrenNodes.some((n) => n.dragging);

  // Effect to perfectly bounds nodes
  useEffect(() => {
    if (childrenNodes.length === 0) return;
    if (isDragging) return; // Prevent heavy re-calculating sets while children are actively flying around

    setNodes((nds) => {
      const node = nds.find((n) => n.id === id);
      if (!node) return nds;

      const currentX = node.position.x;
      const currentY = node.position.y;

      const targetWidth = visualWidth;
      const targetHeight = visualHeight;

      const wDiff = Math.abs((Number(node.style?.width) || 0) - targetWidth);
      const hDiff = Math.abs((Number(node.style?.height) || 0) - targetHeight);

      if (wDiff > 1 || hDiff > 1 || visualLeft !== 0 || visualTop !== 0) {
        let targetX = currentX;
        let targetY = currentY;
        let childrenUpdateMaps = [] as any[];

        if (visualLeft !== 0 || visualTop !== 0) {
          targetX += visualLeft;
          targetY += visualTop;

          // Adjust all children in this group by (-visualLeft, -visualTop)
          childrenUpdateMaps = nds
            .filter((n) => n.parentId === id)
            .map((n) => ({
              id: n.id,
              deltaX: -visualLeft,
              deltaY: -visualTop,
            }));
        }

        const nextNodes = nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              position: { x: targetX, y: targetY },
              style: {
                ...n.style,
                width: targetWidth,
                height: targetHeight,
                border: "none",
                background: "transparent",
              },
            };
          }

          const childUpdate = childrenUpdateMaps.find((cu) => cu.id === n.id);
          if (childUpdate) {
            return {
              ...n,
              position: {
                x: n.position.x + childUpdate.deltaX,
                y: n.position.y + childUpdate.deltaY,
              },
            };
          }

          return n;
        });

        return nextNodes;
      }
      return nds;
    });
  }, [
    visualWidth,
    visualHeight,
    visualLeft,
    visualTop,
    id,
    setNodes,
    childrenNodes.length,
    isDragging,
  ]);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <Card
            className={cn("absolute border-dashed shadow-none")}
            style={{
              borderRadius: `${nodeBorderRadius}px`,
              left: visualLeft,
              top: visualTop,
              width: visualWidth,
              height: visualHeight,
              backgroundColor: data.color,
            }}
          >
            {selected && (
              <div
                className="absolute inset-0 ring-2 ring-primary ring-offset-2 ring-offset-background react-flow__ring pointer-events-none"
                style={{ borderRadius: `${nodeBorderRadius}px` }}
              />
            )}
            <div
              className={cn(
                "absolute top-0 left-0 w-full px-4 py-1.5 border-b border-dashed bg-muted/50 font-semibold text-xs text-muted-foreground truncate",
              )}
              style={{
                borderTopLeftRadius: `${Math.max(0, nodeBorderRadius - 1)}px`,
                borderTopRightRadius: `${Math.max(0, nodeBorderRadius - 1)}px`,
              }}
            >
              {data.name || "Group"}
            </div>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleFocus}>
            <Focus className="size-4" />
            Focus
          </ContextMenuItem>
          <ContextMenuItem onClick={handleUngroup}>
            <Ungroup className="size-4" />
            Ungroup
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleExport}>
            <Download className="size-4" />
            Export to PNG
          </ContextMenuItem>
          <ContextMenuItem variant="destructive" onClick={handleDelete}>
            <Trash2 className="size-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
};

export default GroupNode;
