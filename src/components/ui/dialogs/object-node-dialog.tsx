import { FC, useState, useEffect } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
} from "../responsive-dialog";
import { DialogDescription, DialogTitle } from "../dialog";
import { ObjectNodeData } from "@/components/nodes/object-node";
import { Tabs, TabsList, TabsTrigger } from "../tabs";
import GeneralTab from "../tabs/object-node/general";
import AttributesTab from "../tabs/object-node/attributes";
import MethodsTab from "../tabs/object-node/methods";
import { Button } from "../button";
import useFlowStore from "@/stores/flow-store";
import UnsavedChangesDialog from "./unsaved-changes-dialog";
import { Separator } from "../separator";

interface ObjectNodeDialogProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ObjectNodeData;
}

const ObjectNodeDialog: FC<ObjectNodeDialogProps> = ({
  id,
  open,
  onOpenChange,
  data,
}) => {
  const [internalData, setInternalData] = useState<ObjectNodeData>(data);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const setNodes = useFlowStore((state) => state.setNodes);

  useEffect(() => {
    if (open) {
      setInternalData(data);
    }
  }, [open, data]);

  const hasChanges = JSON.stringify(internalData) !== JSON.stringify(data);

  const handleApply = () => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: internalData };
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
      <Tabs defaultValue="general">
        <ResponsiveDialog
          open={open}
          onOpenChange={handleOpenChange}
          className="gap-2 sm:max-w-2xl"
        >
          <ResponsiveDialogHeader>
            <div className="flex flex-col gap-1 mb-1">
              <DialogTitle>{data.name}</DialogTitle>
              <DialogDescription>
                Customize the properties and methods of the object node.
              </DialogDescription>
            </div>
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
              <TabsTrigger value="methods">Methods</TabsTrigger>
            </TabsList>
          </ResponsiveDialogHeader>
          <ResponsiveDialogContent>
            <div className="flex flex-col pb-2 gap-4">
              <GeneralTab data={internalData} setData={setInternalData} />
              <AttributesTab data={internalData} setData={setInternalData} />
              <MethodsTab data={internalData} setData={setInternalData} />
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
      </Tabs>
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onChange={setShowUnsavedDialog}
        onDiscard={handleDiscard}
        onSave={handleApply}
      />
    </>
  );
};

export default ObjectNodeDialog;
