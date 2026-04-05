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
import { listen } from "@/lib/electron/events";
import { invoke } from "@/lib/electron/invoke";
import { useProjectStore } from "@/stores/project-store";
import { useSettingsStore } from "@/stores/settings-store";
import { getCurrentWindow } from "@/lib/electron/window";
import DiscardDialog from "@/components/ui/dialogs/discard-dialog";
import { useShallow } from "zustand/react/shallow";
import { FlowState } from "@/stores";
import useFlowStore from "@/stores/flow-store";
import FlowEditor from "@/components/ui/editor";

const appWindow = getCurrentWindow();

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

  const [allowClose, setAllowClose] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const allowCloseRef = useRef(allowClose);
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
      const serializedData = JSON.stringify(flowData, null, 2);
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
      const serializedData = JSON.stringify(flowData, null, 2);

      try {
        await invoke("save_file_as", { data: serializedData });
        setProjectEdited(false);
      } catch (error) {
        console.error("Failed to save file as:", error);
      }
    });

    const diagramGeneratedUnlisten = listen<DiagramGeneratedEvent>(
      "diagram-generated",
      (event) => {
        if (event.payload.nodes) {
          setNodes((prev) => [...prev, ...event.payload.nodes]);
        }
        if (event.payload.edges) {
          setEdges((prev) => [...prev, ...event.payload.edges]);
        }
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
        const serializedData = JSON.stringify(flowData, null, 2);
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
    allowCloseRef.current = allowClose;
  }, [allowClose]);

  useEffect(() => {
    projectEditedRef.current = projectEdited;
  }, [projectEdited]);

  useEffect(() => {
    let cancelled = false;

    appWindow
      .onCloseRequested((event) => {
        if (allowCloseRef.current) {
          return;
        }

        if (projectEditedRef.current) {
          event.preventDefault();
          setShowDiscardDialog(true);
          return;
        }

        event.preventDefault();
        allowCloseRef.current = true;
        setAllowClose(true);
        appWindow.close();
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
  }, [setAllowClose, setShowDiscardDialog]);

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
    allowCloseRef.current = true;
    projectEditedRef.current = false;
    closeUnlistenRef.current?.();
    closeUnlistenRef.current = null;
    setAllowClose(true);
    setProjectEdited(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await appWindow.close();
  }, [setAllowClose, setProjectEdited, setShowDiscardDialog]);

  return (
    <>
      <ResizablePanelGroup orientation="horizontal" className="text-sm">
        <ResizablePanel
          className="bg-secondary flex flex-col"
          minSize="300px"
          defaultSize="300px"
          groupResizeBehavior="preserve-pixel-size"
        >
          <PanelBar>Library</PanelBar>
          <div className="flex flex-col flex-1 px-4 py-3 min-h-0">
            <LibraryPanel
              onItemDropped={handleLibraryItemDropped}
              onItemClicked={handleLibraryItemClicked}
            />
          </div>
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
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel
              className="flex flex-col"
              minSize="200px"
              defaultSize="200px"
            >
              <PanelBar>Project</PanelBar>
              <div className="flex flex-col h-full pl-4 py-2 pb-7 min-h-0 min-w-0">
                <ProjectPanel />
              </div>
            </ResizablePanel>
            <ResizableHandle className="bg-muted-foreground/25" />
            <ResizablePanel
              className="flex flex-col"
              minSize="200px"
              defaultSize="200px"
            >
              <PanelBar>Properties</PanelBar>
              <div className="flex flex-col flex-1 px-4 py-2 min-h-0 min-w-0">
                <PropertiesPanel />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
      <DiscardDialog
        open={showDiscardDialog}
        onChange={setShowDiscardDialog}
        onConfirm={handleDiscardConfirm}
      />
    </>
  );
};

export default EditorRoute;
