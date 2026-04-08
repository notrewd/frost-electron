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

    set({
      nodes: previous.nodes as any,
      edges: previous.edges as any,
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

    set({
      nodes: next.nodes as any,
      edges: next.edges as any,
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
    set({
      nodes: targetState.nodes as any,
      edges: targetState.edges as any,
      _history: {
        past: allStates.slice(0, targetIndex),
        future: allStates.slice(targetIndex + 1),
      },
    });
  },
}));

export default useFlowStore;
