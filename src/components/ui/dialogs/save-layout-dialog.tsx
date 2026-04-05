import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { Button } from "../button";
import { Input } from "../input";
import { FC, useCallback, useState } from "react";

interface SaveLayoutDialogProps {
  open: boolean;
  onChange: (open: boolean) => void;
  onSave: (name: string) => void;
}

const SaveLayoutDialog: FC<SaveLayoutDialogProps> = ({
  open,
  onChange,
  onSave,
}) => {
  const [name, setName] = useState("");

  const handleSave = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName("");
    onChange(false);
  }, [name, onSave, onChange]);

  const handleCancel = useCallback(() => {
    setName("");
    onChange(false);
  }, [onChange]);

  return (
    <Dialog open={open} onOpenChange={onChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Layout</DialogTitle>
          <DialogDescription>
            Enter a name for this panel layout preset.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Layout name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveLayoutDialog;
