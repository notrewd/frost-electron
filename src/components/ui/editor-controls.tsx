import { Panel, useReactFlow } from "@xyflow/react";
import { Plus, Minus, Maximize, Lock, Unlock } from "lucide-react";
import { Button } from "./button";

interface EditorControlsProps {
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
}

const EditorControls = ({ isLocked, setIsLocked }: EditorControlsProps) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel position="bottom-left" className="flex gap-2">
      <Button
        variant="secondary"
        size="icon"
        onClick={() => zoomIn()}
        title="Zoom In"
      >
        <Plus className="w-4 h-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={() => zoomOut()}
        title="Zoom Out"
      >
        <Minus className="w-4 h-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={() => fitView({ duration: 500 })}
        title="Fit View"
      >
        <Maximize className="w-4 h-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={() => setIsLocked(!isLocked)}
        title={isLocked ? "Unlock" : "Lock"}
      >
        {isLocked ? (
          <Lock className="w-4 h-4" />
        ) : (
          <Unlock className="w-4 h-4" />
        )}
      </Button>
    </Panel>
  );
};

export default EditorControls;
