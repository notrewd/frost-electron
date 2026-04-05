import { FC, useState, useEffect, useRef, useCallback } from "react";
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
import { useMotionValue, useSpring, motion } from "framer-motion";

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

  const [activeTab, setActiveTab] = useState("general");

  // --- Animated height ---
  const contentRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const height = useMotionValue(0);
  const animatedHeight = useSpring(height, {
    stiffness: 500,
    damping: 40,
    mass: 0.5,
  });
  const [ready, setReady] = useState(false);

  const contentCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Clean up old observer.
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      contentRef.current = node;

      if (!node) {
        setReady(false);
        return;
      }

      // Set the initial height instantly (no spring animation).
      height.jump(node.offsetHeight);
      setReady(true);

      // Observe future size changes.
      observerRef.current = new ResizeObserver(([entry]) => {
        height.set(entry.contentRect.height);
      });
      observerRef.current.observe(node);
    },
    [height],
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
            <motion.div
              style={{ height: ready ? animatedHeight : "auto" }}
              className="overflow-hidden"
            >
              <div ref={contentCallbackRef} className="flex flex-col pb-2 gap-4">
                <GeneralTab data={internalData} setData={setInternalData} />
                <AttributesTab
                  data={internalData}
                  setData={setInternalData}
                />
                <MethodsTab data={internalData} setData={setInternalData} />
              </div>
            </motion.div>
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
