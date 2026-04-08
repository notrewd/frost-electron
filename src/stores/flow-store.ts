import { create } from "zustand";
import { FlowState, HistoryEntry } from "./types";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";

function stripForHistory(
  label: string,
  nodes: any[],
  edges: any[],
): HistoryEntry {
  return {
    label,
    nodes: nodes.map(
      ({ measured, selected, dragging, width, height, ...rest }) => rest,
    ),
    edges: edges.map(({ selected, ...rest }) => rest),
  };
}

/**
 * Incrementally apply a history state by reusing references for unchanged
 * nodes/edges.  Only nodes/edges that actually differ get new objects,
 * so React Flow skips re-rendering anything that hasn't changed.
 */
function applyHistoryState(
  currentNodes: any[],
  currentEdges: any[],
  targetNodes: any[],
  targetEdges: any[],
): { nodes: any[]; edges: any[] } {
  const currentNodeMap = new Map(currentNodes.map((n) => [n.id, n]));
  const currentEdgeMap = new Map(currentEdges.map((e) => [e.id, e]));

  let nodesChanged = targetNodes.length !== currentNodes.length;

  const nodes = targetNodes.map((target) => {
    const current = currentNodeMap.get(target.id);
    if (!current) {
      nodesChanged = true;
      return target;
    }
    // Strip visual-only props from current for structural comparison
    const {
      measured,
      selected,
      dragging,
      width,
      height,
      ...currentStripped
    } = current;
    if (JSON.stringify(currentStripped) === JSON.stringify(target)) {
      return current; // keep existing reference
    }
    nodesChanged = true;
    // Preserve measured dimensions so React Flow doesn't re-measure
    return measured ? { ...target, measured } : target;
  });

  let edgesChanged = targetEdges.length !== currentEdges.length;

  const edges = targetEdges.map((target) => {
    const current = currentEdgeMap.get(target.id);
    if (!current) {
      edgesChanged = true;
      return target;
    }
    const { selected, ...currentStripped } = current;
    if (JSON.stringify(currentStripped) === JSON.stringify(target)) {
      return current;
    }
    edgesChanged = true;
    return target;
  });

  return {
    nodes: nodesChanged ? nodes : currentNodes,
    edges: edgesChanged ? edges : currentEdges,
  };
}

const useFlowStore = create<FlowState>()((set, get) => ({
  nodes: [],
  edges: [],
  instance: null,
  _history: { past: [], future: [] },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (edge) => {
    set({ edges: addEdge(edge, get().edges) });
  },
  setNodes: (nodesListOrUpdater) => {
    set((state) => {
      const rawNodes =
        typeof nodesListOrUpdater === "function"
          ? nodesListOrUpdater(state.nodes)
          : nodesListOrUpdater;
      return {
        nodes: rawNodes.map((n: any) => {
          const { width, height, ...rest } = n;
          return rest;
        }),
      };
    });
  },
  setEdges: (edges) => {
    set((state) => ({ edges: edges(state.edges) }));
  },
  setInstance: (instance) => {
    set({ instance });
  },

  saveSnapshot: (label: string) => {
    const { nodes, edges, _history } = get();
    const entry = stripForHistory(label, nodes, edges);

    // Skip if identical to the last snapshot (ignore label for comparison)
    const last = _history.past[_history.past.length - 1];
    if (
      last &&
      JSON.stringify(last.nodes) === JSON.stringify(entry.nodes) &&
      JSON.stringify(last.edges) === JSON.stringify(entry.edges)
    )
      return;

    set({
      _history: {
        past: [..._history.past, entry],
        future: [],
      },
    });
  },

  undo: () => {
    const { nodes, edges, _history } = get();
    if (_history.past.length === 0) return;

    const previous = _history.past[_history.past.length - 1];
    const current = stripForHistory(previous.label, nodes, edges);
    const applied = applyHistoryState(nodes, edges, previous.nodes, previous.edges);

    set({
      ...applied,
      _history: {
        past: _history.past.slice(0, -1),
        future: [..._history.future, current],
      },
    });
  },

  redo: () => {
    const { nodes, edges, _history } = get();
    if (_history.future.length === 0) return;

    const next = _history.future[_history.future.length - 1];
    const current = stripForHistory(next.label, nodes, edges);
    const applied = applyHistoryState(nodes, edges, next.nodes, next.edges);

    set({
      ...applied,
      _history: {
        past: [..._history.past, current],
        future: _history.future.slice(0, -1),
      },
    });
  },

  clearHistory: () => {
    set({ _history: { past: [], future: [] } });
  },

  jumpToHistory: (targetIndex: number) => {
    const { nodes, edges, _history } = get();
    // Label for current state: use the last past entry's label (the action that led here)
    const currentLabel =
      _history.past[_history.past.length - 1]?.label ||
      _history.future[0]?.label ||
      "";
    const current = stripForHistory(currentLabel, nodes, edges);
    const allStates = [..._history.past, current, ..._history.future];
    const currentIndex = _history.past.length;

    if (
      targetIndex === currentIndex ||
      targetIndex < 0 ||
      targetIndex >= allStates.length
    )
      return;

    const targetState = allStates[targetIndex];
    const applied = applyHistoryState(nodes, edges, targetState.nodes, targetState.edges);
    set({
      ...applied,
      _history: {
        past: allStates.slice(0, targetIndex),
        future: allStates.slice(targetIndex + 1),
      },
    });
  },
}));

export default useFlowStore;
