import {FlowState} from "@/stores";
import useFlowStore from "@/stores/flow-store";
import {
  Background,
  Connection,
  Edge,
  getViewportForBounds,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
} from "@xyflow/react";
import {useShallow} from "zustand/react/shallow";
import ObjectNode from "../nodes/object-node";
import {ProjectOpenedEvent} from "@/types/events";
import {emit, listen} from "@tauri-apps/api/event";
import {useCallback, useEffect, useMemo, useState} from "react";
import {invoke} from "@tauri-apps/api/core";
import {toPng} from "html-to-image";
import {useStore} from "zustand";
import {Button} from "./button";
import {Download, Focus, FolderPlus, Redo, Trash2, Undo} from "lucide-react";
import {useProjectStore} from "@/stores/project-store";
import EditorControls from "./editor-controls";
import {useSettingsStore} from "@/stores/settings-store";
import GeneralizationEdge from "../edges/generalization-edge";
import CustomConnectionLine from "../connection-lines/custom-connection-line";
import useMousePosition from "@/hooks/use-mouse-position";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,} from "./dropdown-menu";
import AssociationEdge from "../edges/association-edge";
import AssociationArrow from "@/components/ui/icons/arrows/association-arrow";
import CompositionArrow from "./icons/arrows/composition-arrow";
import ImplementationArrow from "./icons/arrows/implementation-arrow";
import GeneralizationArrow from "./icons/arrows/generalization-arrow";
import ImplementationEdge from "../edges/implementation-edge";
import CompositionEdge from "../edges/composition-edge";

import GroupNode from "../nodes/group-node";
import PackageNode from "../nodes/package-node";
import NoteNode from "../nodes/note-node";
import UseCaseNode from "../nodes/use-case-node";
import ActorNode from "../nodes/actor-node";
import ComponentNode from "../nodes/component-node";
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

const elkOptions = {
  "elk.algorithm": "layered",
  "elk.layered.spacing.nodeNodeBetweenLayers": "100",
  "elk.spacing.nodeNode": "80",
};

const getLayoutedElements = (nodes: any[], edges: any[], options: any = {}) => {
  const isHorizontal = options?.["elk.direction"] === "RIGHT";

  // We need to handle hierarchy for ELK
  // First, map nodes to an object for fast lookup
  const nodeMap = new Map();
  const rootNodes: any[] = [];

  nodes.forEach((node) => {
    const elkNode: any = {
      ...node,
      // Adjust the target and source handle positions based on the layout
      // direction.
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      children: [],
    };

    if (node.type !== "group") {
      elkNode.width = node.measured?.width ?? 150;
      elkNode.height = node.measured?.height ?? 50;
    } else {
      elkNode.layoutOptions = {
        "elk.padding": "[top=50,left=50,bottom=50,right=50]",
      };
    }

    nodeMap.set(node.id, elkNode);
  });

  nodes.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId).children.push(nodeMap.get(node.id));
    } else {
      rootNodes.push(nodeMap.get(node.id));
    }
  });

  const graph = {
    id: "root",
    layoutOptions: {
      ...options,
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
    },
    children: rootNodes,
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  return elk
    .layout(graph)
    .then((layoutedGraph) => {
      // Flatten the returned graph nodes
      const extractNodes = (elkNodes: any[], result: any[] = []) => {
        elkNodes.forEach((node) => {
          const style =
            node.type === "group"
              ? {
                  ...node.style,
                  width: node.width,
                  height: node.height,
                }
              : node.style;

          result.push({
            ...node,
            position: { x: node.x, y: node.y },
            style,
          });
          if (node.children && node.children.length > 0) {
            extractNodes(node.children, result);
          }
        });
        return result;
      };

      const flatNodes = extractNodes(layoutedGraph.children || []);

      // Clean up children property we added for elk
      const finalNodes = flatNodes.map((n) => {
        const { children, ...rest } = n;
        return rest;
      });

      return {
        nodes: finalNodes,
        edges: edges, // Return original edges for react flow
      };
    })
    .catch(console.error);
};

const nodeTypes = {
  object: ObjectNode,
  group: GroupNode,
  package: PackageNode,
  note: NoteNode,
  "use-case": UseCaseNode,
  actor: ActorNode,
  component: ComponentNode,
};

const edgeTypes = {
  generalization: GeneralizationEdge,
  association: AssociationEdge,
  implementation: ImplementationEdge,
  composition: CompositionEdge,
};

const defaultEdgeOptions = {
  type: "generalization",
};

const connectionLineStyle = {
  stroke: "var(--foreground)",
  strokeWidth: 2,
  strokeDasharray: "5 5",
};

const deleteKeyCode = ["Backspace", "Delete"];
const panOnDrag = [1, 2];
const proOptions = { hideAttribution: true };

const FlowEditor = () => {
  const mousePosition = useMousePosition();

  const [edgeTypesMenuPosition, setEdgeTypesMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [selectionMenuPosition, setSelectionMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [currentConnection, setCurrentConnection] = useState<Connection | null>(
    null,
  );

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
    setInstance,
  } = useFlowStore(
    useShallow((state: FlowState) => ({
      nodes: state.nodes,
      edges: state.edges,
      instance: state.instance,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      setNodes: state.setNodes,
      setEdges: state.setEdges,
      setInstance: state.setInstance,
    })),
  );

  // Undo/Redo hooks
  const {
    undo,
    redo,
    pause,
    resume,
    clear,
    canUndo,
    canRedo,
    pastLen,
    futureLen,
  } = useStore(
    (useFlowStore as any).temporal,
    useShallow((state: any) => ({
      undo: state.undo,
      redo: state.redo,
      pause: state.pause,
      resume: state.resume,
      clear: state.clear,
      canUndo: state.pastStates.length > 0,
      canRedo: state.futureStates.length > 0,
      pastLen: state.pastStates.length,
      futureLen: state.futureStates.length,
    })),
  );

  useEffect(() => {
    // Broadcast history whenever it changes
    emit("request-history");
  }, [pastLen, futureLen]);
  const { setCanUndo, setCanRedo } = useProjectStore(
    useShallow((state) => ({
      setCanUndo: state.setCanUndo,
      setCanRedo: state.setCanRedo,
    })),
  );

  const {
    theme,
    panOnScroll,
    showMinimap,
    showControls,
    showGrid,
    snapToGrid,
    gridSize,
  } = useSettingsStore(
    useShallow((state) => ({
      theme: state.theme,
      panOnScroll: state.pan_on_scroll,
      showMinimap: state.show_minimap,
      showControls: state.show_controls,
      showGrid: state.show_grid,
      snapToGrid: state.snap_to_grid,
      gridSize: state.grid_size,
    })),
  );
  useEffect(() => {
    console.log("Settings changed:", { theme, panOnScroll, showMinimap });
  }, [theme, panOnScroll, showMinimap]);

  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    setCanUndo(canUndo);
    setCanRedo(canRedo);
  }, [canUndo, canRedo, setCanUndo, setCanRedo]);

  const onNodeDragStart = useCallback(() => {
    // Pause history recording during drag to avoid excessive states
    pause();
  }, [pause]);

  const onNodeDragStop = useCallback(() => {
    resume();
  }, [resume]);
  useEffect(() => {
    console.log(theme, panOnScroll, showMinimap);
  }, [theme, panOnScroll, showMinimap]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input is focused
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  useEffect(() => {
    invoke("toggle_menu_item", { item: "select_all_nodes", enabled: true });

    const fetchProjectData = async () => {
      try {
        const data = await invoke<string>("request_project_data");
        if (!data) return;

        const flowData = JSON.parse(data);
        if (!flowData) return;

        pause();
        setNodes(() => flowData.nodes || []);
        setEdges(() => flowData.edges || []);

        // Wait a tick for state to update, then clear history and resume
        setTimeout(() => {
          clear();
          resume();
        }, 0);
      } catch (error) {
        console.error("Failed to fetch project data:", error);
      }
    };

    fetchProjectData();

    const projectOpenedUnlisten = listen<ProjectOpenedEvent>(
      "project-opened",
      async (event) => {
        const { data } = event.payload;

        console.log("Received project data:", data);

        pause();

        if (!data) {
          setNodes(() => []);
          setEdges(() => []);
          setTimeout(() => {
            clear();
            resume();
          }, 0);
          return;
        }

        try {
          const flowData = JSON.parse(data);
          if (!flowData) {
            setTimeout(() => {
              clear();
              resume();
            }, 0);
            return;
          }

          setNodes(() => flowData.nodes || []);
          setEdges(() => flowData.edges || []);

          setTimeout(() => {
            clear();
            resume();
          }, 0);
        } catch (error) {
          console.error("Failed to load project data:", error);
          setTimeout(() => {
            clear();
            resume();
          }, 0);
        }
      },
    );

    const undoUnlisten = listen("undo", () => {
      if (useProjectStore.getState().canUndo) undo();
    });

    const redoUnlisten = listen("redo", () => {
      if (useProjectStore.getState().canRedo) redo();
    });

    const exportUnlisten = listen<{
      transparentBackground?: boolean;
      backgroundColor?: string;
      padding?: number;
    }>("request-export-image", async (event) => {
      const {
        transparentBackground = true,
        backgroundColor = "#1a365d",
        padding = 10,
      } = event.payload || {};

      const nodes = useFlowStore.getState().nodes;
      if (!nodes || nodes.length === 0) {
        emit("export-image-ready", "");
        return;
      }

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      nodes.forEach((node) => {
        let x = node.position.x;
        let y = node.position.y;
        let pId = node.parentId;

        while (pId) {
          const parent = nodes.find((n) => n.id === pId);
          if (parent) {
            x += parent.position.x;
            y += parent.position.y;
            pId = parent.parentId;
          } else {
            pId = undefined;
          }
        }

        const width = Number(
          node.measured?.width || node.style?.width || node.width || 200,
        );
        const height = Number(
          node.measured?.height || node.style?.height || node.height || 200,
        );

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      });

      const nodesBounds = {
        x: minX === Infinity ? 0 : minX,
        y: minY === Infinity ? 0 : minY,
        width: maxX === -Infinity ? 10 : Math.max(0, maxX - minX),
        height: maxY === -Infinity ? 10 : Math.max(0, maxY - minY),
      };
      const imageWidth = Math.max(
        1024,
        Math.ceil(nodesBounds.width) + padding * 2,
      );
      const imageHeight = Math.max(
        768,
        Math.ceil(nodesBounds.height) + padding * 2,
      );

      const viewport = getViewportForBounds(
        nodesBounds,
        imageWidth,
        imageHeight,
        0.01,
        2,
        padding / 100,
      );

      const viewportElement: HTMLElement | null = document.querySelector(
        ".react-flow__viewport",
      );

      if (!viewportElement) {
        emit("export-image-ready", "");
        return;
      }

      try {
        const dataUrl = await toPng(viewportElement, {
          backgroundColor: transparentBackground
            ? "transparent"
            : backgroundColor,
          width: imageWidth,
          height: imageHeight,
          style: {
            width: imageWidth.toString() + "px",
            height: imageHeight.toString() + "px",
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          },
          filter: (node) => {
            if (
              node?.classList?.contains("react-flow__handle") ||
              node?.classList?.contains("react-flow__ring")
            ) {
              return false;
            }
            if (
              node?.classList &&
              typeof node.classList.remove === "function"
            ) {
              node.classList.remove("selected");
            }
            return true;
          },
        });
        emit("export-image-ready", dataUrl);
      } catch (error) {
        console.error("Export failed:", error);
        emit("export-image-ready", "");
      }
    });

    const exportSelectionUnlisten = listen<{
      nodeIds: string[];
      transparentBackground?: boolean;
      padding?: number;
    }>("request-export-selection-image", async (event) => {
      const {
        nodeIds,
        transparentBackground = true,
        padding = 10,
      } = event.payload || {};

      const nodesState = useFlowStore.getState().nodes;
      const edgesState = useFlowStore.getState().edges;

      const expandedNodeIds = new Set(nodeIds);
      let added = true;
      while (added) {
        added = false;
        nodesState.forEach((n) => {
          if (
            n.parentId &&
            expandedNodeIds.has(n.parentId) &&
            !expandedNodeIds.has(n.id)
          ) {
            expandedNodeIds.add(n.id);
            added = true;
          }
        });
      }
      const finalNodeIds = Array.from(expandedNodeIds);

      const nodes = nodesState.filter((n) => finalNodeIds.includes(n.id));

      if (!nodes || nodes.length === 0) {
        return;
      }

      const validEdgeIds = edgesState
        .filter(
          (e) =>
            finalNodeIds.includes(e.source) && finalNodeIds.includes(e.target),
        )
        .map((e) => e.id);

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      nodes.forEach((node) => {
        let x = node.position.x;
        let y = node.position.y;
        let pId = node.parentId;

        while (pId) {
          const parent = nodesState.find((n) => n.id === pId);
          if (parent) {
            x += parent.position.x;
            y += parent.position.y;
            pId = parent.parentId;
          } else {
            pId = undefined;
          }
        }

        const width = Number(
          node.measured?.width || node.style?.width || node.width || 200,
        );
        const height = Number(
          node.measured?.height || node.style?.height || node.height || 200,
        );

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      });

      const nodesBounds = {
        x: minX === Infinity ? 0 : minX,
        y: minY === Infinity ? 0 : minY,
        width: maxX === -Infinity ? 10 : Math.max(0, maxX - minX),
        height: maxY === -Infinity ? 10 : Math.max(0, maxY - minY),
      };

      const imageWidth = Math.max(
        1024,
        Math.ceil(nodesBounds.width) + padding * 2,
      );
      const imageHeight = Math.max(
        768,
        Math.ceil(nodesBounds.height) + padding * 2,
      );

      const viewport = getViewportForBounds(
        nodesBounds,
        imageWidth,
        imageHeight,
        0.01,
        2,
        padding / 100,
      );

      const viewportElement: HTMLElement | null = document.querySelector(
        ".react-flow__viewport",
      );

      if (!viewportElement) {
        return;
      }

      try {
        const dataUrl = await toPng(viewportElement, {
          backgroundColor: transparentBackground ? "transparent" : "#1a365d",
          width: imageWidth,
          height: imageHeight,
          style: {
            width: imageWidth.toString() + "px",
            height: imageHeight.toString() + "px",
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          },
          filter: (node) => {
            if (
              node?.classList?.contains("react-flow__handle") ||
              node?.classList?.contains("react-flow__ring")
            ) {
              return false;
            }
            if (node?.classList?.contains("react-flow__node")) {
              const id = node.getAttribute("data-id");
              if (id && !finalNodeIds.includes(id)) return false;
            }
            if (node?.classList?.contains("react-flow__edge")) {
              const id = node.getAttribute("data-id");
              if (id && !validEdgeIds.includes(id)) return false;
            }
            if (
              node?.classList &&
              typeof node.classList.remove === "function"
            ) {
              node.classList.remove("selected");
            }
            return true;
          },
        });
        invoke("save_image_as", { data: dataUrl });
      } catch (error) {
        console.error("Export selection failed:", error);
      }
    });

    const edgesUnlisten = listen("request-edges", async () => {
      const edges = useFlowStore.getState().edges;
      emit("edges-data", edges);
    });

    const historyUnlisten = listen("request-history", async () => {
      const temporalState = (useFlowStore as any).temporal.getState();
      const pastLen = temporalState.pastStates.length;
      const futureLen = temporalState.futureStates.length;

      const historyItems = [];
      for (let i = 0; i <= pastLen + futureLen; i++) {
        historyItems.push({
          index: i,
          isActive: i === pastLen,
          label: i === 0 ? "Initial State" : `History State #${i}`,
        });
      }

      emit("history-data", historyItems);
    });

    const historyJumpUnlisten = listen<{ index: number }>(
      "history-jump",
      async (event) => {
        const targetIndex = event.payload.index;
        const temporalState = (useFlowStore as any).temporal.getState();
        const currentIndex = temporalState.pastStates.length;

        const distance = currentIndex - targetIndex;

        if (distance > 0) {
          temporalState.undo(distance);
        } else if (distance < 0) {
          temporalState.redo(Math.abs(distance));
        }

        // Emit updated history after state changes
        setTimeout(() => {
          emit("request-history");
        }, 10);
      },
    );

    const updateEdgeUnlisten = listen<{ id: string; type: string }>(
      "update-edge-type",
      async (event) => {
        const { id, type } = event.payload;
        const currentEdges = useFlowStore.getState().edges;
        const newEdges = currentEdges.map((e) =>
          e.id === id ? { ...e, type } : e,
        );
        useFlowStore.getState().setEdges(() => newEdges);
        emit("edges-data", newEdges);
      },
    );

    const deleteEdgeUnlisten = listen<{ id: string }>(
      "delete-edge",
      async (event) => {
        const { id } = event.payload;
        const currentEdges = useFlowStore.getState().edges;
        const newEdges = currentEdges.filter((e) => e.id !== id);
        useFlowStore.getState().setEdges(() => newEdges);
        emit("edges-data", newEdges);
      },
    );

    const focusEdgeUnlisten = listen<{ id: string }>(
      "focus-edge",
      async (event) => {
        const { id } = event.payload;
        const currentEdges = useFlowStore.getState().edges;
        const newEdges = currentEdges.map((e) => ({
          ...e,
          selected: e.id === id,
        }));
        useFlowStore.getState().setEdges(() => newEdges);

        const reactFlowInstance = useFlowStore.getState().instance;
        const edge = currentEdges.find((e) => e.id === id);
        if (edge && reactFlowInstance) {
          const nodes = useFlowStore.getState().nodes;
          const sourceNode = nodes.find((n) => n.id === edge.source);
          if (sourceNode) {
            reactFlowInstance.setCenter(
              sourceNode.position.x,
              sourceNode.position.y,
              { zoom: 1, duration: 800 },
            );
          }
        }
      },
    );

    const arrangeUnlisten = listen<{ direction: string }>(
      "arrange-nodes",
      async (event) => {
        const { direction } = event.payload;
        const opts = { "elk.direction": direction, ...elkOptions };

        const currentNodes = useFlowStore.getState().nodes;
        const currentEdges = useFlowStore.getState().edges;
        const reactFlowInstance = useFlowStore.getState().instance;

        const layouted = await getLayoutedElements(
          currentNodes,
          currentEdges,
          opts,
        );

        if (layouted) {
          useFlowStore.getState().setNodes(() => layouted.nodes);
          useFlowStore.getState().setEdges(() => layouted.edges);

          if (reactFlowInstance) {
            setTimeout(() => {
              reactFlowInstance.fitView({ duration: 500 });
            }, 50);
          }
        }
      },
    );

    const transformUnlisten = listen<{ view: string }>(
      "transform-nodes",
      async (event) => {
        const { view } = event.payload;
        const currentNodes = useFlowStore.getState().nodes;
        
        const newNodes = currentNodes.map((node) => {
          if (node.type === "object") {
            return {
              ...node,
              data: {
                ...node.data,
                viewType: view as "external" | "internal",
              },
            };
          }
          return node;
        });

        useFlowStore.getState().setNodes(() => newNodes);
      },
    );

    return () => {
      projectOpenedUnlisten.then((f) => f());
      undoUnlisten.then((f) => f());
      redoUnlisten.then((f) => f());
      exportUnlisten.then((f) => f());
      exportSelectionUnlisten.then((f) => f());
      edgesUnlisten.then((f) => f());
      historyUnlisten.then((f) => f());
      historyJumpUnlisten.then((f) => f());
      updateEdgeUnlisten.then((f) => f());
      deleteEdgeUnlisten.then((f) => f());
      focusEdgeUnlisten.then((f) => f());
      arrangeUnlisten.then((f) => f());
      transformUnlisten.then((f) => f());
    };
  }, []);

  useEffect(() => {
    let lastEdges = "";

    return useFlowStore.subscribe((state) => {
      const currentEdges = JSON.stringify(state.edges);
      if (currentEdges !== lastEdges) {
        lastEdges = currentEdges;
        emit("edges-data", state.edges);
      }
    });
  }, []);

  const handleOnConnect = useCallback(
    (connection: Connection) => {
      setCurrentConnection(connection);
      setEdgeTypesMenuPosition({
        x: mousePosition.current.x || 0,
        y: mousePosition.current.y || 0,
      });
    },
    [onConnect, mousePosition],
  );

  const handleSelectionContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setSelectionMenuPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  const handleSelectionGroup = useCallback(() => {
    const { nodes: currentFlowNodes, setNodes } = useFlowStore.getState();
    const selectedNodesAll = currentFlowNodes.filter((node) => node.selected);
    if (selectedNodesAll.length === 0) return;

    const selectedNodes = selectedNodesAll.filter((node) => {
      let current = node.parentId;
      while (current) {
        if (selectedNodesAll.some((n) => n.id === current)) return false;
        const parent = currentFlowNodes.find((n) => n.id === current);
        current = parent?.parentId;
      }
      return true;
    });

    if (selectedNodes.length === 0) return;

    const parentIds = [...new Set(selectedNodes.map((n) => n.parentId))];
    const commonParentId = parentIds.length === 1 ? parentIds[0] : undefined;

    // Calculate bounding box
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
      // Add parent to selected nodes, update their position to relative, unselect them
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
    setSelectionMenuPosition(null);
  }, []);

  const handleSelectionFocus = useCallback(() => {
    const { instance, nodes: currentFlowNodes } = useFlowStore.getState();
    instance?.fitView({
      nodes: currentFlowNodes
        .filter((node) => node.selected)
        .map((n) => ({ id: n.id })),
    });
    setSelectionMenuPosition(null);
  }, []);

  const handleSelectionDelete = useCallback(() => {
    const { setNodes, setEdges } = useFlowStore.getState();
    setNodes((nodes) => nodes.filter((node) => !node.selected));
    setEdges((edges) => edges.filter((edge) => !edge.selected));
    setSelectionMenuPosition(null);
  }, []);

  const handleSelectionExport = useCallback(() => {
    const { nodes } = useFlowStore.getState();
    const selectedNodes = nodes.filter((node) => node.selected);
    const nodeIds = selectedNodes.map((n) => n.id);
    emit("request-export-selection-image", { nodeIds });
    setSelectionMenuPosition(null);
  }, []);

  const addEdge = useCallback(
    (edgeType: string, marker: MarkerType) => {
      if (!currentConnection) return;

      const edge: Edge = {
        id: `${currentConnection.source}-${currentConnection.sourceHandle}-${currentConnection.target}-${currentConnection.targetHandle}`,
        source: currentConnection.source,
        sourceHandle: currentConnection.sourceHandle,
        target: currentConnection.target,
        targetHandle: currentConnection.targetHandle,
        type: edgeType,
        style: { stroke: "var(--foreground)", strokeWidth: 2 },
        markerEnd: {
          color: "var(--foreground)",
          type: marker,
        },
      };

      onConnect(edge);

      setEdgeTypesMenuPosition(null);
      setCurrentConnection(null);
    },
    [onConnect, currentConnection],
  );

  const snapGrid = useMemo(
    () => [gridSize, gridSize] as [number, number],
    [gridSize],
  );

  return (
    <>
      <ReactFlow
        className="frost-editor-flow"
        nodes={nodes}
        edges={edges}
        colorMode={theme === "system" ? undefined : theme}
        panOnScroll={panOnScroll}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        deleteKeyCode={deleteKeyCode}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleOnConnect}
        onSelectionContextMenu={handleSelectionContextMenu}
        onInit={(instance) => setInstance(instance as any)}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        snapToGrid={snapToGrid}
        snapGrid={snapGrid}
        proOptions={proOptions}
        fitView
        selectionOnDrag={!isLocked}
        panOnDrag={panOnDrag}
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        elementsSelectable={!isLocked}
        connectionLineComponent={CustomConnectionLine}
        connectionLineStyle={connectionLineStyle}
        minZoom={0.02}
        elevateNodesOnSelect={false}
        elevateEdgesOnSelect={false}
      >
        {showControls && (
          <>
            <EditorControls isLocked={isLocked} setIsLocked={setIsLocked} />
            <Panel position="top-left" className="flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => undo()}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => redo()}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </Panel>
          </>
        )}
        {showMinimap && <MiniMap hidden={false} />}
        {showGrid && <Background />}
      </ReactFlow>

      <DropdownMenu
        open={!!edgeTypesMenuPosition}
        onOpenChange={() => {
          setEdgeTypesMenuPosition(null);
          setCurrentConnection(null);
        }}
      >
        <DropdownMenuContent
          className="absolute"
          style={{
            top: edgeTypesMenuPosition?.y || 0,
            left: edgeTypesMenuPosition?.x || 0,
          }}
        >
          <DropdownMenuItem
            onClick={() => addEdge("generalization", MarkerType.ArrowClosed)}
          >
            <GeneralizationArrow className="size-4" />
            Generalization
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => addEdge("association", MarkerType.Arrow)}
          >
            <AssociationArrow className="size-4" />
            Association
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => addEdge("composition", MarkerType.ArrowClosed)}
          >
            <CompositionArrow className="size-4" />
            Composition
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => addEdge("implementation", MarkerType.ArrowClosed)}
          >
            <ImplementationArrow className="size-4" />
            Implementation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu
        open={!!selectionMenuPosition}
        onOpenChange={() => {
          setSelectionMenuPosition(null);
        }}
      >
        <DropdownMenuContent
          className="absolute w-36"
          style={{
            top: selectionMenuPosition?.y || 0,
            left: selectionMenuPosition?.x || 0,
          }}
        >
          <DropdownMenuItem onClick={handleSelectionFocus}>
            <Focus className="size-4" />
            Focus
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSelectionGroup}>
            <FolderPlus className="size-4" />
            Group
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSelectionExport}>
            <Download className="size-4" />
            Export to PNG
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={handleSelectionDelete}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default FlowEditor;
