import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import "@xyflow/react/dist/style.css";
import "./editor-route.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Node, type Edge } from "@xyflow/react";
import PropertiesPanel from "@/components/panels/properties-panel";
import LibraryPanel from "@/components/panels/library-panel";
import PanelBar from "@/components/ui/panel-bar";
import ProjectPanel from "@/components/panels/project-panel";
import type { ObjectNodeData } from "@/components/nodes/object-node";
import type { DragEventData } from "@neodrag/react";
import type { LibraryPaletteItem } from "@/components/panels/library-panel";
import type { DiagramGeneratedEvent } from "@/types/events";
import { useEditorActions } from "@/components/providers/editor-actions-provider";
import { emit, listen } from "@/lib/electron/events";
import { invoke } from "@/lib/electron/invoke";
import { useProjectStore } from "@/stores/project-store";
import { useSettingsStore } from "@/stores/settings-store";
import { getCurrentWindow } from "@/lib/electron/window";
import DiscardDialog from "@/components/ui/dialogs/discard-dialog";
import { useShallow } from "zustand/react/shallow";
import { FlowState } from "@/stores";
import useFlowStore from "@/stores/flow-store";
import FlowEditor from "@/components/ui/editor";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  MouseSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  useLayoutStore,
  getPanelsForSide,
  type PanelId,
  type DockSide,
  type DockSlot,
  type DockAction,
} from "@/stores/layout-store";
import DockDropZone, { DockReplaceZone } from "@/components/ui/dock-drop-zone";
import SaveLayoutDialog from "@/components/ui/dialogs/save-layout-dialog";

const appWindow = getCurrentWindow();

const PANEL_LABELS: Record<PanelId, string> = {
  library: "Library",
  project: "Project",
  properties: "Properties",
};

const EditorRoute = () => {
  const { projectEdited, setProjectEdited, projectPath } = useProjectStore(
    useShallow((state) => ({
      projectEdited: state.projectEdited,
      setProjectEdited: state.setProjectEdited,
      projectPath: state.projectPath,
    })),
  );

  const { autoSave, autoSaveInterval } = useSettingsStore(
    useShallow((state) => ({
      autoSave: state.auto_save,
      autoSaveInterval: state.auto_save_interval,
    })),
  );
  const { setHandlers, setState } = useEditorActions();

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showSaveLayoutDialog, setShowSaveLayoutDialog] = useState(false);
  const [activeDrag, setActiveDrag] = useState<PanelId | null>(null);

  const { panelPositions, movePanel, setPositions } = useLayoutStore();

  const leftPanels = getPanelsForSide("left", panelPositions);
  const rightPanels = getPanelsForSide("right", panelPositions);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  });
  const sensors = useSensors(mouseSensor);

  const projectEditedRef = useRef(projectEdited);
  const closeUnlistenRef = useRef<(() => void) | null>(null);

  const selector = useShallow((state: FlowState) => ({
    nodes: state.nodes,
    edges: state.edges,
    instance: state.instance,
    setNodes: state.setNodes,
    setEdges: state.setEdges,
  }));

  const {
    nodes,
    edges,
    instance: reactFlowInstance,
    setNodes,
    setEdges,
  } = useFlowStore(selector);

  useEffect(() => {
    setProjectEdited(true);
  }, [nodes, edges]);

  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  const clipboardRef = useRef<{
    nodes: Node<ObjectNodeData>[];
    edges: Edge[];
  } | null>(null);
  const pasteCountRef = useRef(0);

  useEffect(() => {
    const saveUnlisten = listen("save-requested", async () => {
      if (!reactFlowInstance) return;
      const flowData = reactFlowInstance.toObject();
      const currentLayout = useLayoutStore.getState().panelPositions;
      const serializedData = JSON.stringify(
        { ...flowData, panelLayout: currentLayout },
        null,
        2,
      );
      try {
        await invoke("save_file", { data: serializedData });
        setProjectEdited(false);
      } catch (error) {
        console.error("Failed to save file:", error);
      }
    });

    const saveAsUnlisten = listen("save-as-requested", async () => {
      if (!reactFlowInstance) return;
      const flowData = reactFlowInstance.toObject();
      const currentLayout = useLayoutStore.getState().panelPositions;
      const serializedData = JSON.stringify(
        { ...flowData, panelLayout: currentLayout },
        null,
        2,
      );

      try {
        await invoke("save_file_as", { data: serializedData });
        setProjectEdited(false);
      } catch (error) {
        console.error("Failed to save file as:", error);
      }
    });

    const diagramGeneratedUnlisten = listen<DiagramGeneratedEvent>(
      "diagram-generated",
      async (event) => {
        const allNodes = event.payload.nodes || [];
        const allEdges = event.payload.edges || [];
        const totalItems = allNodes.length + allEdges.length;

        if (totalItems === 0) return;

        useFlowStore.getState().saveSnapshot("Generate diagram");
        const BATCH_SIZE = 5;
        let spawned = 0;

        const waitForFrame = () =>
          new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

        // Spawn nodes in batches
        for (let i = 0; i < allNodes.length; i += BATCH_SIZE) {
          const batch = allNodes.slice(i, i + BATCH_SIZE);
          setNodes((prev) => [...prev, ...batch]);
          spawned += batch.length;
          emit("generation-progress", {
            current: spawned,
            total: totalItems,
            message: `Spawning nodes (${Math.min(i + BATCH_SIZE, allNodes.length)}/${allNodes.length})...`,
          });
          await waitForFrame();
        }

        // Spawn edges in batches
        for (let i = 0; i < allEdges.length; i += BATCH_SIZE) {
          const batch = allEdges.slice(i, i + BATCH_SIZE);
          setEdges((prev) => [...prev, ...batch]);
          spawned += batch.length;
          emit("generation-progress", {
            current: spawned,
            total: totalItems,
            message: `Spawning edges (${Math.min(i + BATCH_SIZE, allEdges.length)}/${allEdges.length})...`,
          });
          await waitForFrame();
        }

        // All items spawned — close the generating window
        invoke("close_window", { label: "generating" });
      },
    );

    return () => {
      saveUnlisten.then((f) => f());
      saveAsUnlisten.then((f) => f());
      diagramGeneratedUnlisten.then((f) => f());
    };
  }, [reactFlowInstance, setNodes, setEdges]);

  useEffect(() => {
    if (!autoSave || !reactFlowInstance || !projectPath) return;

    const interval = setInterval(
      async () => {
        if (!projectEditedRef.current) return;

        const flowData = reactFlowInstance.toObject();
        const currentLayout = useLayoutStore.getState().panelPositions;
        const serializedData = JSON.stringify(
          { ...flowData, panelLayout: currentLayout },
          null,
          2,
        );
        try {
          await invoke("save_file", { data: serializedData });
          setProjectEdited(false);
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      },
      autoSaveInterval * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [
    autoSave,
    autoSaveInterval,
    reactFlowInstance,
    projectPath,
    setProjectEdited,
  ]);

  useEffect(() => {
    const applyPresetUnlisten = listen<Record<PanelId, DockSlot>>(
      "apply-layout-preset",
      (event) => {
        setPositions(event.payload);
      },
    );

    const savePresetUnlisten = listen(
      "save-layout-preset-requested",
      () => {
        setShowSaveLayoutDialog(true);
      },
    );

    return () => {
      applyPresetUnlisten.then((f) => f());
      savePresetUnlisten.then((f) => f());
    };
  }, [setPositions]);

  const handleSaveLayoutPreset = useCallback(
    async (name: string) => {
      await invoke("save_layout_preset", { name, positions: panelPositions });
    },
    [panelPositions],
  );

  const cloneData = useCallback(<T,>(value: T): T => {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value)) as T;
  }, []);

  const getSelectedNodes = useCallback(() => {
    return nodes.filter((node) => node.selected);
  }, [nodes]);

  const getNodesWithChildren = useCallback(
    (initialNodes: Node[]) => {
      const resultIds = new Set(initialNodes.map((n) => n.id));
      let added = true;
      while (added) {
        added = false;
        nodes.forEach((node) => {
          if (
            node.parentId &&
            resultIds.has(node.parentId) &&
            !resultIds.has(node.id)
          ) {
            resultIds.add(node.id);
            added = true;
          }
        });
      }
      return nodes.filter((n) => resultIds.has(n.id));
    },
    [nodes],
  );

  const copyNodes = useCallback(() => {
    let selectedNodes = getSelectedNodes();
    selectedNodes = getNodesWithChildren(selectedNodes);

    if (selectedNodes.length === 0) {
      return;
    }

    const selectedIds = new Set(selectedNodes.map((node) => node.id));
    const selectedEdges = edges.filter(
      (edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target),
    );

    clipboardRef.current = {
      nodes: selectedNodes.map((node) => ({
        ...node,
        data: cloneData(node.data),
        position: { ...node.position },
        selected: false,
      })),
      edges: selectedEdges.map((edge) => ({
        ...edge,
        data: edge.data ? cloneData(edge.data) : edge.data,
        selected: false,
      })),
    };

    pasteCountRef.current = 0;
    setState((prev) => ({ ...prev, canPaste: true }));
  }, [cloneData, edges, getSelectedNodes, setState]);

  const selectAllNodes = useCallback(() => {
    setNodes((nodes) => nodes.map((node) => ({ ...node, selected: true })));
    setEdges((edges) => edges.map((edge) => ({ ...edge, selected: true })));
  }, [setEdges, setNodes]);

  const cutNodes = useCallback(() => {
    let selectedNodes = getSelectedNodes();
    selectedNodes = getNodesWithChildren(selectedNodes);

    if (selectedNodes.length === 0) {
      return;
    }

    const selectedIds = new Set(selectedNodes.map((node) => node.id));

    clipboardRef.current = {
      nodes: selectedNodes.map((node) => ({
        ...node,
        data: cloneData(node.data),
        position: { ...node.position },
        selected: false,
      })),
      edges: edges
        .filter(
          (edge) =>
            selectedIds.has(edge.source) && selectedIds.has(edge.target),
        )
        .map((edge) => ({
          ...edge,
          data: edge.data ? cloneData(edge.data) : edge.data,
          selected: false,
        })),
    };

    pasteCountRef.current = 0;
    setState((prev) => ({ ...prev, canPaste: true }));

    useFlowStore.getState().saveSnapshot("Cut nodes");
    setNodes((nodes) => nodes.filter((node) => !selectedIds.has(node.id)));
    setEdges((edges) =>
      edges.filter(
        (edge) =>
          !selectedIds.has(edge.source) && !selectedIds.has(edge.target),
      ),
    );
  }, [cloneData, edges, getSelectedNodes, setEdges, setNodes, setState]);

  const pasteNodes = useCallback(() => {
    const clipboard = clipboardRef.current;

    if (!clipboard || clipboard.nodes.length === 0) {
      return;
    }

    useFlowStore.getState().saveSnapshot("Paste nodes");

    pasteCountRef.current += 1;
    const offset = 24 * pasteCountRef.current;
    const timestamp = Date.now().toString(36);
    const idMap = new Map<string, string>();

    const newNodesInitial = clipboard.nodes.map((node, index) => {
      const newId = `n${timestamp}${index}${Math.random()
        .toString(36)
        .slice(2, 7)}`;

      idMap.set(node.id, newId);

      return {
        ...node,
        id: newId,
      };
    });

    const newNodes = newNodesInitial.map((node, index) => {
      const originalNode = clipboard.nodes[index];
      const newParentId = originalNode.parentId
        ? idMap.get(originalNode.parentId) || originalNode.parentId
        : undefined;
      const isParentCopied =
        originalNode.parentId && idMap.has(originalNode.parentId);

      const newPos = isParentCopied
        ? { ...originalNode.position }
        : {
            x: originalNode.position.x + offset,
            y: originalNode.position.y + offset,
          };

      return {
        ...node,
        parentId: newParentId,
        position: newPos,
        selected: true,
      };
    });

    const newEdges: Edge[] = [];

    clipboard.edges.forEach((edge, index) => {
      const source = idMap.get(edge.source);
      const target = idMap.get(edge.target);

      if (!source || !target) {
        return;
      }

      newEdges.push({
        ...edge,
        id: `e${timestamp}${index}${Math.random().toString(36).slice(2, 7)}`,
        source,
        target,
        selected: true,
      });
    });

    setNodes((nodes) =>
      nodes
        .map((node) => ({
          ...node,
          selected: false,
        }))
        .concat(newNodes),
    );

    setEdges((edges) =>
      edges
        .map(
          (edge) =>
            ({
              ...edge,
              selected: false,
            }) as Edge,
        )
        .concat(newEdges),
    );
  }, [edges, nodes, setEdges, setNodes]);

  useEffect(() => {
    const hasSelection = nodes.some((node) => node.selected);
    setState((prev) => ({ ...prev, canCutCopy: hasSelection }));
  }, [nodes, setState]);

  useEffect(() => {
    setHandlers({
      cut: cutNodes,
      copy: copyNodes,
      paste: pasteNodes,
      selectAll: selectAllNodes,
    });

    return () => {
      setHandlers(null);
    };
  }, [copyNodes, cutNodes, pasteNodes, selectAllNodes, setHandlers]);

  useEffect(() => {
    projectEditedRef.current = projectEdited;
  }, [projectEdited]);

  useEffect(() => {
    let cancelled = false;

    appWindow
      .onCloseRequested((event) => {
        if (projectEditedRef.current) {
          event.preventDefault();
          setShowDiscardDialog(true);
        }
      })
      .then((dispose) => {
        if (cancelled) {
          dispose();
          return;
        }
        closeUnlistenRef.current = dispose;
      });

    return () => {
      cancelled = true;
      closeUnlistenRef.current?.();
      closeUnlistenRef.current = null;
    };
  }, [setShowDiscardDialog]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifier = event.ctrlKey || event.metaKey;

      if (!isModifier) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        !!target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA");

      if (isEditableTarget) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "x":
          event.preventDefault();
          cutNodes();
          break;
        case "c":
          event.preventDefault();
          copyNodes();
          break;
        case "v":
          event.preventDefault();
          pasteNodes();
          break;
        case "a":
          event.preventDefault();
          selectAllNodes();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [copyNodes, cutNodes, pasteNodes, selectAllNodes]);

  const handleLibraryItemDropped = useCallback(
    (item: LibraryPaletteItem, drag: DragEventData) => {
      if (!reactFlowInstance) return;

      const bounds = reactFlowWrapperRef.current?.getBoundingClientRect();
      if (!bounds) return;

      const { clientX, clientY } = drag.event;
      const isInside =
        clientX >= bounds.left &&
        clientX <= bounds.right &&
        clientY >= bounds.top &&
        clientY <= bounds.bottom;

      if (!isInside) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: clientX,
        y: clientY,
      });

      const id = `n${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      useFlowStore.getState().saveSnapshot("Add node");
      setNodes((nds) => [
        ...nds,
        {
          id,
          type: item.template.type,
          position,
          data: item.template.data,
        } as any,
      ]);
    },
    [reactFlowInstance, setNodes],
  );

  const handleLibraryItemClicked = useCallback(
    (item: LibraryPaletteItem) => {
      if (!reactFlowInstance) return;

      const id = `n${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      // Get the center of the current viewport
      const { x, y, zoom } = reactFlowInstance.getViewport();

      // We want to place it in the center of the React Flow container
      const wrapperBounds =
        reactFlowWrapperRef.current?.getBoundingClientRect();

      // Convert screen/container center to flow position
      // For some reason screenToFlowPosition doesn't account for the container's absolute position automatically
      // without passing the absolute client coordinates. So we pass the bounded coordinates.
      const position = wrapperBounds
        ? reactFlowInstance.screenToFlowPosition({
            x: wrapperBounds.left + wrapperBounds.width / 2,
            y: wrapperBounds.top + wrapperBounds.height / 2,
          })
        : { x: -x / zoom, y: -y / zoom };

      useFlowStore.getState().saveSnapshot("Add node");
      setNodes((nds) => {
        // Deselect all other nodes
        const unselectedNodes = nds.map((node) => ({
          ...node,
          selected: false,
        }));

        return [
          ...unselectedNodes,
          {
            id,
            type: item.template.type,
            position,
            data: item.template.data,
            selected: true,
          } as any,
        ];
      });

      // Focus on the newly created node
      setTimeout(() => {
        reactFlowInstance.fitView({
          nodes: [{ id }],
          duration: 500,
          padding: 0.2,
          maxZoom: 1,
        });
      }, 50);
    },
    [reactFlowInstance, setNodes],
  );

  const handleDiscardConfirm = useCallback(async () => {
    setShowDiscardDialog(false);
    setProjectEdited(false);
    await appWindow.close();
  }, [setProjectEdited, setShowDiscardDialog]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const panelId = event.active.data.current?.panelId as PanelId | undefined;
    if (panelId) {
      setActiveDrag(panelId);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);
      const { active, over } = event;
      if (!over) return;

      const panelId = active.data.current?.panelId as PanelId | undefined;
      if (!panelId) return;

      const side = over.data.current?.side;
      const position = over.data.current?.position;
      const action = (over.data.current?.action ?? "stack") as DockAction;
      if (side && position) {
        movePanel(panelId, { side, position }, action);
      }
    },
    [movePanel],
  );

  const handleDragCancel = useCallback(() => {
    setActiveDrag(null);
  }, []);

  const renderPanelContent = useCallback(
    (panelId: PanelId) => {
      switch (panelId) {
        case "library":
          return (
            <>
              <PanelBar panelId="library">Library</PanelBar>
              <div className="flex flex-col flex-1 px-4 py-3 min-h-0">
                <LibraryPanel
                  onItemDropped={handleLibraryItemDropped}
                  onItemClicked={handleLibraryItemClicked}
                />
              </div>
            </>
          );
        case "project":
          return (
            <>
              <PanelBar panelId="project">Project</PanelBar>
              <div className="flex flex-col h-full pl-4 py-2 pb-7 min-h-0 min-w-0">
                <ProjectPanel />
              </div>
            </>
          );
        case "properties":
          return (
            <>
              <PanelBar panelId="properties">Properties</PanelBar>
              <div className="flex flex-col flex-1 px-4 py-2 min-h-0 min-w-0">
                <PropertiesPanel />
              </div>
            </>
          );
      }
    },
    [handleLibraryItemDropped, handleLibraryItemClicked],
  );

  const renderSidebar = useCallback(
    (side: DockSide, panels: PanelId[]) => {
      if (panels.length === 0) return null;

      if (panels.length === 1) {
        return (
          <div className="relative flex flex-col h-full">
            {renderPanelContent(panels[0])}
            {activeDrag && activeDrag !== panels[0] && (
              <>
                <DockDropZone side={side} position="top" action="stack" />
                <DockDropZone side={side} position="top" action="replace" />
                <DockDropZone side={side} position="bottom" action="stack" />
              </>
            )}
          </div>
        );
      }

      // Two panels: vertical split — each panel gets a replace zone
      return (
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel
            className="relative flex flex-col"
            minSize="200px"
            defaultSize="200px"
          >
            {renderPanelContent(panels[0])}
            {activeDrag && activeDrag !== panels[0] && (
              <div className="absolute inset-0 z-50">
                <DockReplaceZone side={side} position="top" />
              </div>
            )}
          </ResizablePanel>
          <ResizableHandle className="bg-muted-foreground/25" />
          <ResizablePanel
            className="relative flex flex-col"
            minSize="200px"
            defaultSize="200px"
          >
            {renderPanelContent(panels[1])}
            {activeDrag && activeDrag !== panels[1] && (
              <div className="absolute inset-0 z-50">
                <DockReplaceZone side={side} position="bottom" />
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    },
    [renderPanelContent, activeDrag],
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <ResizablePanelGroup orientation="horizontal" className="text-sm">
          <ResizablePanel
            className="bg-secondary flex flex-col"
            minSize="300px"
            defaultSize="300px"
            groupResizeBehavior="preserve-pixel-size"
          >
            {renderSidebar("left", leftPanels)}
          </ResizablePanel>
          <ResizablePanel className="flex flex-col" minSize="300px">
            <div ref={reactFlowWrapperRef} className="flex flex-col flex-1">
              <FlowEditor />
            </div>
          </ResizablePanel>
          <ResizablePanel
            className="bg-secondary"
            minSize="300px"
            defaultSize="300px"
            groupResizeBehavior="preserve-pixel-size"
          >
            {renderSidebar("right", rightPanels)}
          </ResizablePanel>
        </ResizablePanelGroup>

        <DragOverlay>
          {activeDrag ? (
            <div className="bg-background/90 border border-border px-4 py-1 rounded shadow-lg text-sm">
              {PANEL_LABELS[activeDrag]}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <DiscardDialog
        open={showDiscardDialog}
        onChange={setShowDiscardDialog}
        onConfirm={handleDiscardConfirm}
      />
      <SaveLayoutDialog
        open={showSaveLayoutDialog}
        onChange={setShowSaveLayoutDialog}
        onSave={handleSaveLayoutPreset}
      />
    </>
  );
};

export default EditorRoute;
