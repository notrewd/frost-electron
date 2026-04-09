import {
  Archive,
  Focus,
  Folder,
  FolderPlus,
  FolderRoot,
  SquareChartGantt,
  Trash,
  Ungroup,
  Download,
  MessageSquare,
  Circle,
  User,
  Component,
} from "lucide-react";
import { emit } from "@/lib/electron/events";
import TreeView, {
  TreeViewItem,
  TreeViewMenuItemsByType,
} from "../ui/tree-view";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useProjectStore } from "@/stores/project-store";
import useFlowStore from "@/stores/flow-store";
import { useShallow } from "zustand/react/shallow";
import { FlowState } from "@/stores";

const iconMap = {
  root: <FolderRoot className="size-4" />,
  folder: <Folder className="size-4" />,
  node: <SquareChartGantt className="size-4" />,
  package: <Archive className="size-4" />,
  note: <MessageSquare className="size-4" />,
  "use-case": <Circle className="size-4" />,
  actor: <User className="size-4" />,
  component: <Component className="size-4" />,
};

const ProjectPanel = () => {
  const projectName = useProjectStore((state) => state.projectName);

  const { setNodes, setEdges, instance } = useFlowStore(
    useShallow((state: FlowState) => ({
      setNodes: state.setNodes,
      setEdges: state.setEdges,
      instance: state.instance,
    })),
  );

  const [treeData, setTreeData] = useState<TreeViewItem[]>([]);
  const [treeSelectedIds, setTreeSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let lastHash = '';
    let lastSelectedHash = '';

    const updateTree = (nodes: any[]) => {
      const currentHash = JSON.stringify(
        nodes.map((n: any) => ({
          id: n.id,
          name: n.data.name,
          type: n.type,
          parentId: n.parentId,
        }))
      );
      if (currentHash !== lastHash) {
        lastHash = currentHash;
        const buildHierarchy = (parentId: string | undefined): TreeViewItem[] => {
          const children = nodes.filter((node) => (node.parentId ?? undefined) === parentId);
          return children.map((node) => ({
            id: node.id,
            name: (node.data.name as string) || 'Group',
            type:
              node.type === 'group'
                ? ('folder' as const)
                : node.type === 'package'
                ? ('package' as const)
                : node.type === 'note'
                ? ('note' as const)
                : node.type === 'use-case'
                ? ('use-case' as const)
                : node.type === 'actor'
                ? ('actor' as const)
                : node.type === 'component'
                ? ('component' as const)
                : ('node' as const),
            selected: node.selected,
            ...(node.type === 'group' ? { children: buildHierarchy(node.id) } : {}),
          }));
        };
        setTreeData(buildHierarchy(undefined));
      }

      const currentSelectedHash = JSON.stringify(
        nodes.filter((n: any) => n.selected).map((n: any) => n.id)
      );
      if (currentSelectedHash !== lastSelectedHash) {
        lastSelectedHash = currentSelectedHash;
        setTreeSelectedIds(
          new Set(nodes.filter((node: any) => node.selected).map((node: any) => node.id))
        );
      }
    };

    const unsub = useFlowStore.subscribe((state) => {
      updateTree(state.nodes);
    });

    updateTree(useFlowStore.getState().nodes);

    return unsub;
  }, []);

  const handleSelectionChange = useCallback(
    (selectedItems: TreeViewItem[]) => {
      const selectedIds = new Set(selectedItems.map((item) => item.id));
      setNodes((nodes) =>
        nodes.map((node) => ({
          ...node,
          selected: selectedIds.has(node.id),
        })),
      );
    },
    [setNodes],
  );

  const handleDelete = useCallback(
    (id: string) => {
      useFlowStore.getState().saveSnapshot("Delete node");
      setNodes((nodes) => nodes.filter((node) => node.id !== id));
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== id && edge.target !== id),
      );
    },
    [setNodes, setEdges],
  );

  const handleGroup = useCallback(
    (items: TreeViewItem[]) => {
      useFlowStore.getState().saveSnapshot("Group nodes");
      const itemIds = items.map((item) => item.id);
      const selectedNodes = useFlowStore.getState().nodes.filter((n) => itemIds.includes(n.id));
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
        const minIndex = currentNodes.findIndex((n) => itemIds.includes(n.id));
        const updatedNodes = currentNodes.map((node) => {
          if (itemIds.includes(node.id)) {
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
        return finalNodes;
      });
    },
    [setNodes],
  );

  const handleUngroup = useCallback(
    (items: TreeViewItem[]) => {
      useFlowStore.getState().saveSnapshot("Ungroup nodes");
      const itemIds = items.map((item) => item.id);

      setNodes((currentNodes) => {
        // First, find if we selected any groups and we want to just dissolve them
        const groupsToDissolve = currentNodes.filter(
          (n) => n.type === "group" && itemIds.includes(n.id),
        );
        const groupIdsToDissolve = groupsToDissolve.map((g) => g.id);

        let finalNodes = currentNodes.map((node) => {
          // If node was directly inside a dissolved group or it is one of the nodes to ungroup
          if (
            node.parentId &&
            (groupIdsToDissolve.includes(node.parentId) ||
              itemIds.includes(node.id))
          ) {
            const parent = currentNodes.find((p) => p.id === node.parentId);
            return {
              ...node,
              parentId: parent?.parentId,
              position: {
                x: (parent?.position?.x || 0) + node.position.x,
                y: (parent?.position?.y || 0) + node.position.y,
              },
            };
          }
          return node;
        });

        // Remove the dissolved groups entirely
        finalNodes = finalNodes.filter(
          (n) => !groupIdsToDissolve.includes(n.id),
        );

        return finalNodes;
      });
    },
    [setNodes],
  );

  const [data, setData] = useState<TreeViewItem[]>([]);

  const handleDataChange = useCallback(
    (newData: TreeViewItem[]) => {
      useFlowStore.getState().saveSnapshot("Reorder nodes");
      const newParentMap = new Map<string, string | undefined>();

      const walk = (items: TreeViewItem[], parentId: string | undefined) => {
        items.forEach((item) => {
          if (item.id === "root") {
            if (item.children) {
              walk(item.children, undefined);
            }
          } else {
            newParentMap.set(item.id, parentId);
            if (item.children) {
              walk(item.children, item.id);
            }
          }
        });
      };

      walk(newData, undefined);

      setNodes((currentNodes) => {
        let updated = currentNodes.map((node) => {
          if (!newParentMap.has(node.id)) return node; // Skip if not present (although shouldn't happen)

          const oldParentId = node.parentId;
          const newParentId = newParentMap.get(node.id);

          if (oldParentId !== newParentId) {
            let currentAbsX = node.position.x;
            let currentAbsY = node.position.y;

            let p = oldParentId;
            while (p) {
              const parentNode = currentNodes.find((n) => n.id === p);
              if (parentNode) {
                currentAbsX += parentNode.position.x;
                currentAbsY += parentNode.position.y;
                p = parentNode.parentId;
              } else {
                p = undefined;
              }
            }

            let newX = currentAbsX;
            let newY = currentAbsY;

            let np = newParentId;
            while (np) {
              const newParentNode = currentNodes.find((n) => n.id === np);
              if (newParentNode) {
                newX -= newParentNode.position.x;
                newY -= newParentNode.position.y;
                np = newParentNode.parentId;
              } else {
                np = undefined;
              }
            }

            return {
              ...node,
              parentId: newParentId,
              position: { x: newX, y: newY },
            };
          }

          return node;
        });

        // Remove empty groups iteratively (to handle nested empty groups)
        let removedGroupIds: string[] = [];
        let hasEmptyGroups = true;
        while (hasEmptyGroups) {
          const usedParentIds = new Set(
            updated.map((n) => n.parentId).filter(Boolean),
          );
          const emptyGroups = updated.filter(
            (n) => n.type === "group" && !usedParentIds.has(n.id),
          );
          if (emptyGroups.length > 0) {
            const emptyGroupIds = emptyGroups.map((g) => g.id);
            removedGroupIds.push(...emptyGroupIds);
            const emptyGroupIdsSet = new Set(emptyGroupIds);
            updated = updated.filter((n) => !emptyGroupIdsSet.has(n.id));
          } else {
            hasEmptyGroups = false;
          }
        }

        if (removedGroupIds.length > 0) {
          setEdges((currentEdges) =>
            currentEdges.filter(
              (e) =>
                !removedGroupIds.includes(e.source) &&
                !removedGroupIds.includes(e.target),
            ),
          );
        }

        return updated;
      });
    },
    [setNodes, setEdges],
  );

  const menuItems: TreeViewMenuItemsByType = useMemo(() => {
    const commonNodeActions = [
      {
        id: "focus",
        label: "Focus",
        icon: <Focus className="size-4" />,
        action: (items: TreeViewItem[]) => {
          instance?.fitView({
            nodes: items.map((item) => ({ id: item.id })),
            duration: 500,
          });
        },
      },
      {
        id: "group",
        label: "Group",
        icon: <FolderPlus className="size-4" />,
        action: handleGroup,
      },
      {
        id: "ungroup",
        label: "Ungroup",
        icon: <Ungroup className="size-4" />,
        action: handleUngroup,
        show: (items: TreeViewItem[]) => {
          const itemIds = items.map((item) => item.id);
          const selectedNodes = useFlowStore.getState().nodes.filter((n) => itemIds.includes(n.id));
          return selectedNodes.some((n) => n.parentId || n.type === "group");
        },
      },
      {
        id: "export",
        label: "Export to PNG",
        icon: <Download className="size-4" />,
        action: (items: TreeViewItem[]) => {
          const nodeIds = items.map((item) => item.id);
          emit("request-export-selection-image", { nodeIds });
        },
      },
      {
        id: "delete",
        label: "Delete",
        icon: <Trash className="size-4" />,
        variant: "destructive" as const,
        action: (items: TreeViewItem[]) => {
          items.forEach((item) => {
            handleDelete(item.id);
          });
        },
      },
    ];

    return {
      node: commonNodeActions,
      folder: commonNodeActions,
      package: commonNodeActions,
      note: commonNodeActions,
      "use-case": commonNodeActions,
      actor: commonNodeActions,
      component: commonNodeActions,
    };
  }, [handleDelete, handleGroup, handleUngroup, instance]);

  useEffect(() => {
    const rootItem: TreeViewItem = {
      id: "root",
      name: projectName || "Project",
      type: "root",
      children: treeData,
    };

    setData([rootItem]);
  }, [treeData, projectName]);

  return (
      <div className="overflow-hidden">
        <TreeView
            data={data}
            showExpandAll={false}
            iconMap={iconMap}
            menuItemsByType={menuItems}
            searchPlaceholder="Search project..."
            className="bg-transparent"
            selectedIds={treeSelectedIds}
            onSelectionChange={handleSelectionChange}
            onDataChange={handleDataChange}
        />
      </div>
  );
};

export default ProjectPanel;
