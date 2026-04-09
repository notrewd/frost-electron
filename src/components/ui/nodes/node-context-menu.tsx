import React, { Children, FC, ReactNode, useCallback, useMemo } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../context-menu";
import { Focus, FolderPlus, Trash2, Ungroup, Download } from "lucide-react";
import useFlowStore from "@/stores/flow-store";
import { emit } from "@/lib/electron/events";

interface NodeContextMenuProps {
  children?: ReactNode;
}

interface NodeContextMenuOptionProps {
  nodeId: string;
}

const NodeContextMenu: FC<NodeContextMenuProps> = ({ children }) => {
  const triggerContent = useMemo(
    () =>
      Children.toArray(children).find(
        (child) =>
          React.isValidElement(child) && child.type === NodeContextMenuContent,
      ),
    [children],
  ) as React.ReactElement<{ children?: React.ReactNode }>;

  const optionsContent = useMemo(
    () =>
      Children.toArray(children).find(
        (child) =>
          React.isValidElement(child) && child.type === NodeContextMenuOptions,
      ),
    [children],
  ) as React.ReactElement<{ children?: React.ReactNode }>;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {triggerContent?.props?.children}
      </ContextMenuTrigger>
      <ContextMenuContent>{optionsContent?.props?.children}</ContextMenuContent>
    </ContextMenu>
  );
};

export const NodeContextMenuContent: FC<NodeContextMenuProps> = ({
  children,
}) => {
  return children;
};

export const NodeContextMenuOptions: FC<NodeContextMenuProps> = ({
  children,
}) => {
  return children;
};

export const NodeContextMenuFocusOption: FC<NodeContextMenuOptionProps> = ({
  nodeId,
}) => {
  const instance = useFlowStore((state) => state.instance);

  const handleFocus = useCallback(() => {
    const { nodes } = useFlowStore.getState();
    instance?.fitView({
      nodes: nodes
        .filter((node) => node.selected || node.id === nodeId)
        .map((node) => ({ id: node.id })),
      duration: 500,
    });
  }, [instance, nodeId]);

  return (
    <ContextMenuItem onClick={handleFocus}>
      <Focus className="size-4" />
      Focus
    </ContextMenuItem>
  );
};

export const NodeContextMenuExportOption: FC<NodeContextMenuOptionProps> = ({
  nodeId,
}) => {
  const handleExport = useCallback(() => {
    const { nodes } = useFlowStore.getState();
    const selectedNodes = nodes.filter(
      (node) => node.selected || node.id === nodeId,
    );
    const nodeIds = selectedNodes.map((n) => n.id);
    emit("request-export-selection-image", { nodeIds });
  }, [nodeId]);

  return (
    <ContextMenuItem onClick={handleExport}>
      <Download className="size-4" />
      Export to PNG
    </ContextMenuItem>
  );
};

export const NodeContextMenuGroupOption: FC<NodeContextMenuOptionProps> = ({
  nodeId,
}) => {
  const setNodes = useFlowStore((state) => state.setNodes);

  const handleGroup = useCallback(() => {
    useFlowStore.getState().saveSnapshot("Group nodes");
    const { nodes } = useFlowStore.getState();
    const selectedNodesAll = nodes.filter(
      (node) => node.selected || node.id === nodeId,
    );
    if (selectedNodesAll.length === 0) return;

    const selectedNodes = selectedNodesAll.filter((node) => {
      let current = node.parentId;
      while (current) {
        if (selectedNodesAll.some((n) => n.id === current)) return false;
        const parent = nodes.find((n) => n.id === current);
        current = parent?.parentId;
      }
      return true;
    });

    if (selectedNodes.length === 0) return;

    const parentIds = [...new Set(selectedNodes.map((n) => n.parentId))];
    const commonParentId = parentIds.length === 1 ? parentIds[0] : undefined;

    const minX = Math.min(...selectedNodes.map((n) => n.position.x));
    const minY = Math.min(...selectedNodes.map((n) => n.position.y));
    const maxX = Math.max(
      ...selectedNodes.map((n) => n.position.x + (n.measured?.width || 200)),
    );
    const maxY = Math.max(
      ...selectedNodes.map((n) => n.position.y + (n.measured?.height || 200)),
    );

    const padding = 40;
    const groupX = minX - padding;
    const groupY = minY - padding;
    const groupWidth = maxX - minX + padding * 2;
    const groupHeight = maxY - minY + padding * 2;

    const groupId = `group-${Date.now()}`;
    const newGroup = {
      id: groupId,
      type: "group",
      position: { x: groupX, y: groupY },
      style: {
        width: groupWidth,
        height: groupHeight,
        border: "none",
        background: "transparent",
      },
      zIndex: -1,
      data: { name: "New Group", color: "#18181b50" },
      ...(commonParentId ? { parentId: commonParentId } : {}),
    };

    setNodes((currentNodes) => {
      const selectedIds = selectedNodes.map((n) => n.id);
      const minIndex = currentNodes.findIndex((n) =>
        selectedIds.includes(n.id),
      );
      const updatedNodes = currentNodes.map((node) => {
        if (selectedIds.includes(node.id)) {
          return {
            ...node,
            parentId: groupId,
            position: {
              x: node.position.x - groupX,
              y: node.position.y - groupY,
            },
            selected: false,
          };
        }
        return node;
      });
      const finalNodes = [...updatedNodes];
      finalNodes.splice(minIndex !== -1 ? minIndex : 0, 0, {
        ...newGroup,
        selected: true,
      } as any);

      const groupsToDelete = parentIds.filter(
        (pid) => pid && !finalNodes.some((n) => n.parentId === pid),
      );

      return finalNodes.filter((n) => !groupsToDelete.includes(n.id));
    });
  }, [setNodes, nodeId]);

  return (
    <ContextMenuItem onClick={handleGroup}>
      <FolderPlus className="size-4" />
      Group
    </ContextMenuItem>
  );
};

export const NodeContextMenuUngroupOption: FC<NodeContextMenuOptionProps> = ({
  nodeId,
}) => {
  const setNodes = useFlowStore((state) => state.setNodes);

  const handleUngroup = useCallback(() => {
    useFlowStore.getState().saveSnapshot("Ungroup nodes");
    const { nodes } = useFlowStore.getState();
    const targetNodes = nodes.filter(
      (node) => node.selected || node.id === nodeId,
    );
    const nodesToUngroup = targetNodes.filter((n) => n.parentId);
    if (nodesToUngroup.length === 0) return;

    setNodes((currentNodes) => {
      const groupIds = [...new Set(nodesToUngroup.map((n) => n.parentId))];
      const groupsToDelete = groupIds
        .map((groupId) =>
          !currentNodes.some(
            (n) => n.parentId === groupId && !nodesToUngroup.includes(n),
          )
            ? groupId
            : null,
        )
        .filter(Boolean);

      return currentNodes
        .filter((node) => !groupsToDelete.includes(node.id))
        .map((node) => {
          if (nodesToUngroup.find((n) => n.id === node.id)) {
            const parent = currentNodes.find((p) => p.id === node.parentId);
            return {
              ...node,
              parentId: parent?.parentId,
              position: {
                x: (parent?.position.x || 0) + node.position.x,
                y: (parent?.position.y || 0) + node.position.y,
              },
            };
          }
          return node;
        });
    });
  }, [setNodes, nodeId]);

  const showUngroup = useFlowStore((state) =>
    state.nodes.some((n) => (n.selected || n.id === nodeId) && n.parentId),
  );

  if (!showUngroup) return null;

  return (
    <ContextMenuItem onClick={handleUngroup}>
      <Ungroup className="size-4" />
      Ungroup
    </ContextMenuItem>
  );
};

export const NodeContextMenuDeleteOption: FC<NodeContextMenuOptionProps> = ({
  nodeId,
}) => {
  const setNodes = useFlowStore((state) => state.setNodes);

  const handleDelete = useCallback(() => {
    useFlowStore.getState().saveSnapshot("Delete node");
    const { nodes } = useFlowStore.getState();
    const nodesToDelete = nodes
      .filter((node) => node.selected || node.id === nodeId)
      .map((node) => node.id);
    setNodes((nodes) =>
      nodes.filter((node) => !nodesToDelete.includes(node.id)),
    );
  }, [setNodes, nodeId]);

  return (
    <ContextMenuItem onClick={handleDelete} variant="destructive">
      <Trash2 className="size-4" />
      Delete
    </ContextMenuItem>
  );
};

export default NodeContextMenu;
