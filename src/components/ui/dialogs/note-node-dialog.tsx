import { FC, useState, useEffect } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
} from "../responsive-dialog";
import { DialogDescription, DialogTitle } from "../dialog";
import { NoteNodeData } from "@/components/nodes/note-node";
import { Button } from "../button";
import useFlowStore from "@/stores/flow-store";
import UnsavedChangesDialog from "./unsaved-changes-dialog";
import { Separator } from "../separator";
import { Textarea } from "../textarea";
import { Label } from "../label";

interface NoteNodeDialogProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: NoteNodeData;
}

const NoteNodeDialog: FC<NoteNodeDialogProps> = ({
  id,
  open,
  onOpenChange,
  data,
}) => {
  const [internalData, setInternalData] = useState<NoteNodeData>(data);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const setNodes = useFlowStore((state) => state.setNodes);

  useEffect(() => {
    if (open) {
      setInternalData(data);
    }
  }, [open, data]);

  const hasChanges = JSON.stringify(internalData) !== JSON.stringify(data);

  const handleApply = () => {
    const concatenatedNote =
      internalData.note.length > 50
        ? internalData.note.slice(0, 50) + "..."
        : internalData.note;

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...internalData, name: concatenatedNote },
          } as any;
        }
        return node;
      }),
    );
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(newOpen);
    }
  };

  const handleDiscard = () => {
    setInternalData(data);
    onOpenChange(false);
  };

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={handleOpenChange}
        className="gap-2 sm:max-w-xl"
      >
        <ResponsiveDialogHeader>
          <div className="flex flex-col gap-1 mb-1">
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Modify the content of the note.
            </DialogDescription>
          </div>
        </ResponsiveDialogHeader>
        <ResponsiveDialogContent>
          <div className="flex flex-col pb-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="note-content">Content</Label>
              <Textarea
                id="note-content"
                value={internalData.note || ""}
                onChange={(e) =>
                  setInternalData({ ...internalData, note: e.target.value })
                }
                placeholder="Enter note content..."
                className="min-h-50"
              />
            </div>
          </div>
        </ResponsiveDialogContent>
        <div className="flex flex-col gap-2 px-4">
          <Separator />
          <div className="flex justify-end mt-2">
            <Button onClick={handleApply} disabled={!hasChanges}>
              Apply
            </Button>
          </div>
        </div>
      </ResponsiveDialog>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onChange={setShowUnsavedDialog}
        onDiscard={handleDiscard}
        onSave={handleApply}
      />
    </>
  );
};

export default NoteNodeDialog;
