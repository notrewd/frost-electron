import { useDroppable } from "@dnd-kit/core";
import type { DockSide, DockPosition, DockAction } from "@/stores/layout-store";
import { cn } from "@/lib/utils";

interface DockDropZoneProps {
  side: DockSide;
  position: DockPosition;
  action: DockAction;
}

const positionStyles = {
  stack: {
    top: "top-0 h-1/3 rounded-b",
    bottom: "bottom-0 h-1/3 rounded-t",
  },
  replace: {
    // For single-panel sides, the replace zone sits in the middle third
    top: "top-1/3 h-1/3",
    bottom: "top-1/3 h-1/3",
  },
  // For two-panel sides, each panel gets a full replace zone
  "replace-full": {
    top: "inset-0",
    bottom: "inset-0",
  },
};

const DockDropZone = ({ side, position, action }: DockDropZoneProps) => {
  const slotId = `${side}-${position}-${action}`;
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { side, position, action },
  });

  const isReplace = action === "replace";

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute left-0 right-0 z-50 pointer-events-auto transition-colors duration-150 flex items-center justify-center",
        positionStyles[action][position],
        isOver
          ? isReplace
            ? "bg-amber-500/25 border-2 border-solid border-amber-500"
            : "bg-blue-500/25 border-2 border-solid border-blue-500"
          : isReplace
            ? "bg-amber-500/10 border-2 border-dashed border-amber-400/50"
            : "bg-blue-500/10 border-2 border-dashed border-blue-400/50",
      )}
    >
      <span
        className={cn(
          "text-sm font-bold pointer-events-none px-4 py-1.5 rounded-md shadow-md",
          isOver
            ? isReplace
              ? "text-white bg-amber-600"
              : "text-white bg-blue-600"
            : isReplace
              ? "text-white bg-amber-600/90"
              : "text-white bg-blue-600/90",
        )}
      >
        {isReplace ? "Replace" : position === "top" ? "Stack above" : "Stack below"}
      </span>
    </div>
  );
};

/** Full-area replace zone used inside two-panel sides */
export const DockReplaceZone = ({
  side,
  position,
}: Omit<DockDropZoneProps, "action">) => {
  const slotId = `${side}-${position}-replace`;
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { side, position, action: "replace" as DockAction },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute inset-0 z-50 pointer-events-auto transition-colors duration-150 flex items-center justify-center",
        isOver
          ? "bg-amber-500/25 border-2 border-solid border-amber-500"
          : "bg-amber-500/10 border-2 border-dashed border-amber-400/50",
      )}
    >
      <span
        className={cn(
          "text-sm font-bold pointer-events-none px-4 py-1.5 rounded-md shadow-md",
          isOver ? "text-white bg-amber-600" : "text-white bg-amber-600/90",
        )}
      >
        Replace
      </span>
    </div>
  );
};

export default DockDropZone;
