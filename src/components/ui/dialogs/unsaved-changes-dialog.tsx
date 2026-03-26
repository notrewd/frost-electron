import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { Button } from "../button";
import { FC, useCallback } from "react";

interface UnsavedChangesDialogProps {
  open: boolean;
  onChange: (open: boolean) => void;
  onCancel?: () => void;
  onDiscard?: () => void;
  onSave?: () => void;
}

const UnsavedChangesDialog: FC<UnsavedChangesDialogProps> = ({
  open,
  onChange,
  onCancel,
  onDiscard,
  onSave,
}) => {
  const handleOnCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
    onChange(false);
  }, [onCancel, onChange]);

  const handleOnDiscard = useCallback(() => {
    if (onDiscard) {
      onDiscard();
    }
    onChange(false);
  }, [onDiscard, onChange]);

  const handleOnSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
    onChange(false);
  }, [onSave, onChange]);

  return (
    <Dialog open={open} onOpenChange={onChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unsaved changes</DialogTitle>
          <DialogDescription>
            You have unsaved changes. Do you want to save or discard them?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={handleOnCancel}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleOnDiscard}>
              Discard
            </Button>
            <Button variant="default" onClick={handleOnSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnsavedChangesDialog;
