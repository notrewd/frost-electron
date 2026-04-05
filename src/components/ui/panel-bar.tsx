import { FC, ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { PanelId } from "@/stores/layout-store";
import { cn } from "@/lib/utils";

interface PanelBarProps {
  panelId: PanelId;
  children?: ReactNode;
}

const PanelBar: FC<PanelBarProps> = ({ panelId, children }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `panel-drag-${panelId}`,
    data: { panelId },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "w-full bg-background/50 flex px-4 py-1 select-none",
        isDragging && "opacity-50",
      )}
    >
      {children}
    </div>
  );
};

export default PanelBar;
