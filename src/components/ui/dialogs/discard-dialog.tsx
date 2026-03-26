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

interface DiscardDialogProps {
  open: boolean;
  onChange: (open: boolean) => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  title?: string;
  description?: string;
}

const DiscardDialog: FC<DiscardDialogProps> = ({
  open,
  onChange,
  onCancel,
  onConfirm,
  title = "Unsaved changes",
  description = "This project has unsaved changes. Do you want to discard them?",
}) => {
  const handleOnCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }

    onChange(false);
  }, [onCancel, onChange]);

  const handleOnConfirm = useCallback(() => {
    if (onConfirm) {
      onConfirm();
    }

    onChange(false);
  }, [onConfirm, onChange]);

  return (
    <Dialog open={open} onOpenChange={onChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleOnCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleOnConfirm}>
            Discard Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DiscardDialog;
