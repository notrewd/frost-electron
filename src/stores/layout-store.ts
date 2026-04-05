import { create } from "zustand/react";

export type PanelId = "library" | "project" | "properties";
export type DockSide = "left" | "right";
export type DockPosition = "top" | "bottom";
export type DockAction = "stack" | "replace";

export interface DockSlot {
  side: DockSide;
  position: DockPosition;
}

export const DEFAULT_POSITIONS: Record<PanelId, DockSlot> = {
  library: { side: "left", position: "top" },
  project: { side: "right", position: "top" },
  properties: { side: "right", position: "bottom" },
};

interface LayoutState {
  panelPositions: Record<PanelId, DockSlot>;
  movePanel: (panelId: PanelId, target: DockSlot, action: DockAction) => void;
  setPositions: (positions: Record<PanelId, DockSlot>) => void;
}

const PANEL_IDS: PanelId[] = ["library", "project", "properties"];

export function getPanelsForSide(
  side: DockSide,
  positions: Record<PanelId, DockSlot>,
): PanelId[] {
  const panels = PANEL_IDS.filter((id) => positions[id].side === side);
  // Sort: top before bottom
  panels.sort((a, b) => {
    const posA = positions[a].position === "top" ? 0 : 1;
    const posB = positions[b].position === "top" ? 0 : 1;
    return posA - posB;
  });
  return panels;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  panelPositions: { ...DEFAULT_POSITIONS },

  movePanel: (panelId, target, action) =>
    set((state) => {
      const current = state.panelPositions[panelId];

      // No-op if dropping on same slot
      if (current.side === target.side && current.position === target.position) {
        return state;
      }

      const newPositions = { ...state.panelPositions };

      if (action === "replace") {
        // Swap: the dragged panel takes the target slot, the occupant (if any)
        // takes the dragged panel's old slot.
        const occupant = PANEL_IDS.find(
          (id) =>
            id !== panelId &&
            state.panelPositions[id].side === target.side &&
            state.panelPositions[id].position === target.position,
        );

        newPositions[panelId] = target;

        if (occupant) {
          newPositions[occupant] = current;
        }

        return { panelPositions: newPositions };
      }

      // action === "stack": place alongside the existing panel on that side
      newPositions[panelId] = target;

      // Find panel that now conflicts (occupies the same slot)
      const conflict = PANEL_IDS.find(
        (id) =>
          id !== panelId &&
          newPositions[id].side === target.side &&
          newPositions[id].position === target.position,
      );

      if (conflict) {
        // Count how many panels are on the target side after the move
        const countOnTargetSide = PANEL_IDS.filter(
          (id) => newPositions[id].side === target.side,
        ).length;

        if (countOnTargetSide <= 2) {
          // Room on this side — push the conflict to the other position
          const otherPos = target.position === "top" ? "bottom" : "top";
          newPositions[conflict] = { side: target.side, position: otherPos };
        } else {
          // 3 panels on one side — displace the conflict to the source side
          newPositions[conflict] = {
            side: current.side,
            position: current.position,
          };
        }
      }

      return { panelPositions: newPositions };
    }),

  setPositions: (positions) => set({ panelPositions: positions }),
}));
