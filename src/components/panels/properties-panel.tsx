import { FC, useState, useMemo, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import useFlowStore from "@/stores/flow-store";
import { FlowState } from "@/stores/types";
import PropertiesEmptyView from "../views/properties-empty-view";
import { Input } from "../ui/input";
import { NumberInput } from "../ui/number-input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import ObjectNodeDialog from "../ui/dialogs/object-node-dialog";
import NoteNodeDialog from "../ui/dialogs/note-node-dialog";
import { ScrollArea } from "../ui/scroll-area";
import {
  Edit2,
  ArrowRight,
  ArrowRightLeft,
  Box,
  Hash,
  SquareDashed,
  Archive,
  MessageSquare,
  Circle,
  User,
  Component,
} from "lucide-react";
import { ObjectNodeData } from "@/components/nodes/object-node";
import { NoteNodeData } from "@/components/nodes/note-node";
import { cn } from "@/lib/utils";
import PropertiesSection from "../ui/properties-section";
import { Separator } from "../ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { HexAlphaColorPicker } from "react-colorful";

const PropRow = ({
  label,
  children,
  disabled = false,
  className,
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) => (
  <div
    className={cn(
      "flex items-center justify-between px-3 py-1.5 focus-within:bg-muted/5 transition-colors",
      disabled && "opacity-50 pointer-events-none",
      className,
    )}
  >
    <span className="text-xs text-muted-foreground w-1/3 truncate font-medium">
      {label}
    </span>
    <div className="w-2/3 flex items-center justify-end gap-2">{children}</div>
  </div>
);

const PropertiesPanel: FC = () => {
  const { setNodes, setEdges } = useFlowStore(
    useShallow((state: FlowState) => ({
      setNodes: state.setNodes,
      setEdges: state.setEdges,
    })),
  );

  const selectedNodes = useFlowStore(
    useShallow((state: FlowState) =>
      state.nodes.filter((node) => node.selected),
    ),
  );

  const selectedEdges = useFlowStore(
    useShallow((state: FlowState) =>
      state.edges.filter((edge) => edge.selected),
    ),
  );

  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [selectedNodeForDialog, setSelectedNodeForDialog] = useState<
    string | null
  >(null);

  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const handleInputFocus = () => {
    useFlowStore.getState().saveSnapshot("Edit properties");
  };

  const bulkNodeX = useMemo(() => {
    if (selectedNodes.length === 0) return "";
    const firstX = Math.round(selectedNodes[0].position.x);
    return selectedNodes.every((n) => Math.round(n.position.x) === firstX)
      ? firstX.toString()
      : "";
  }, [selectedNodes]);

  const bulkNodeY = useMemo(() => {
    if (selectedNodes.length === 0) return "";
    const firstY = Math.round(selectedNodes[0].position.y);
    return selectedNodes.every((n) => Math.round(n.position.y) === firstY)
      ? firstY.toString()
      : "";
  }, [selectedNodes]);

  const bulkEdgeType = useMemo(() => {
    if (selectedEdges.length === 0) return "";
    const firstType = selectedEdges[0].type;
    return selectedEdges.every((e) => e.type === firstType)
      ? firstType || "generalization"
      : "";
  }, [selectedEdges]);

  const bulkEdgeLabel = useMemo(() => {
    if (selectedEdges.length === 0) return "";
    const firstLabel = selectedEdges[0].data?.label as string;
    return selectedEdges.every((e) => (e.data?.label as string) === firstLabel)
      ? firstLabel || ""
      : "";
  }, [selectedEdges]);

  const bulkSourceCardinality = useMemo(() => {
    if (selectedEdges.length === 0) return "";
    const firstSourceCard = selectedEdges[0].data?.sourceCardinality as string;
    return selectedEdges.every(
      (e) => (e.data?.sourceCardinality as string) === firstSourceCard,
    )
      ? firstSourceCard || ""
      : "";
  }, [selectedEdges]);

  const bulkTargetCardinality = useMemo(() => {
    if (selectedEdges.length === 0) return "";
    const firstTargetCard = selectedEdges[0].data?.targetCardinality as string;
    return selectedEdges.every(
      (e) => (e.data?.targetCardinality as string) === firstTargetCard,
    )
      ? firstTargetCard || ""
      : "";
  }, [selectedEdges]);

  useEffect(() => {
    if (colorPickerOpen) {
      useFlowStore.getState().saveSnapshot("Change color");
    }
  }, [colorPickerOpen]);

  if (selectedNodes.length === 0 && selectedEdges.length === 0) {
    return <PropertiesEmptyView />;
  }

  const handleNodeEditClick = (nodeId: string) => {
    setSelectedNodeForDialog(nodeId);
    setNodeDialogOpen(true);
  };

  const handleBulkNodePositionChange = (axis: "x" | "y", value: string) => {
    if (value.trim() === "") return;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.selected
          ? {
              ...node,
              position: {
                ...node.position,
                [axis]: numValue,
              },
            }
          : node,
      ),
    );
  };

  const handleGroupNameChange = (value: string) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.selected && node.type === "group"
          ? {
              ...node,
              data: {
                ...node.data,
                name: value,
              },
            }
          : node,
      ),
    );
  };

  const handleGroupColorChange = (color: string) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.selected && node.type === "group"
          ? {
              ...node,
              data: {
                ...node.data,
                color: color || node.data?.color || "#18181b",
              },
            }
          : node,
      ),
    );
  };

  const handleBulkEdgeTypeChange = (newType: string) => {
    setEdges((prevEdges) =>
      prevEdges.map((edge) =>
        edge.selected ? { ...edge, type: newType } : edge,
      ),
    );
  };

  const handleBulkEdgeLabelChange = (label: string) => {
    setEdges((prevEdges) =>
      prevEdges.map((edge) =>
        edge.selected
          ? {
              ...edge,
              data: {
                ...edge.data,
                label,
              },
            }
          : edge,
      ),
    );
  };

  const handleBulkEdgeCardinalityChange = (
    key: "sourceCardinality" | "targetCardinality",
    value: string,
  ) => {
    setEdges((prevEdges) =>
      prevEdges.map((edge) =>
        edge.selected
          ? {
              ...edge,
              data: {
                ...edge.data,
                [key]: value,
              },
            }
          : edge,
      ),
    );
  };

  const handleReverseEdges = () => {
    useFlowStore.getState().saveSnapshot("Reverse edges");
    setEdges((prevEdges) =>
      prevEdges.map((edge) =>
        edge.selected
          ? {
              ...edge,
              source: edge.target,
              target: edge.source,
              sourceHandle: edge.targetHandle,
              targetHandle: edge.sourceHandle,
              data: {
                ...edge.data,
                sourceCardinality: edge.data?.targetCardinality,
                targetCardinality: edge.data?.sourceCardinality,
              },
            }
          : edge,
      ),
    );
  };

  const getSelectedNodeForDialog = () => {
    if (!selectedNodeForDialog) return null;
    return (
      selectedNodes.find((n) => n.id === selectedNodeForDialog) ||
      useFlowStore.getState().nodes.find((n) => n.id === selectedNodeForDialog)
    );
  };

  const selectedNodeDialog = getSelectedNodeForDialog();

  return (
    <>
      <ScrollArea className="flex-1 min-h-0 w-[calc(100%+16px)] pr-4">
        {selectedNodes.length > 0 && (
          <PropertiesSection
            title={`Node Properties (${selectedNodes.length})`}
            icon={Box}
          >
            <div className="px-3 py-2 mb-1 grid grid-cols-[1fr_auto] items-center gap-2">
              <div className="font-mono text-sm truncate min-w-0">
                {selectedNodes.length === 1
                  ? (selectedNodes[0].data.name as string)
                  : "Multiple selected"}
              </div>
              {selectedNodes.length === 1 &&
                selectedNodes[0].type === "object" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={selectedNodes.length > 1}
                    onClick={() =>
                      selectedNodes.length === 1 &&
                      handleNodeEditClick(selectedNodes[0].id)
                    }
                  >
                    <Edit2 className="size-3" />
                    Edit Data
                  </Button>
                )}
            </div>
            <PropRow label="Position X">
              <NumberInput
                value={bulkNodeX}
                placeholder={bulkNodeX === "" ? "Mixed" : ""}
                onChange={(val) => handleBulkNodePositionChange("x", val)}
                onFocus={handleInputFocus}

                variant="small"
                step={10}
              />
            </PropRow>
            <PropRow label="Position Y">
              <NumberInput
                value={bulkNodeY}
                placeholder={bulkNodeY === "" ? "Mixed" : ""}
                onChange={(val) => handleBulkNodePositionChange("y", val)}
                onFocus={handleInputFocus}

                variant="small"
                step={10}
              />
            </PropRow>
          </PropertiesSection>
        )}
        {selectedNodes.some((node) => node.type === "group") && (
          <>
            <Separator className="my-2 first:hidden" />
            <PropertiesSection
              title={`Group Properties (${selectedNodes.filter((node) => node.type === "group").length})`}
              icon={SquareDashed}
            >
              <PropRow label="Group Name">
                <Input
                  value={
                    (selectedNodes.filter((n) => n.type === "group")[0].data
                      .name as string) || ""
                  }
                  placeholder="Group Name"
                  onChange={(e) => handleGroupNameChange(e.target.value)}
                  onFocus={handleInputFocus}
  
                  variant="small"
                />
              </PropRow>
              <PropRow label="Group Color">
                <Popover
                  open={colorPickerOpen}
                  onOpenChange={setColorPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-full p-0 transition-none"
                      title="Change Group Color"
                      style={{
                        backgroundColor:
                          selectedNodes
                            .filter((n) => n.type === "group")[0]
                            .data.color?.toString() || "#18181b",
                      }}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto!" align="end">
                    <div className="flex flex-col gap-2">
                      <HexAlphaColorPicker
                        color={
                          selectedNodes.filter((n) => n.type === "group")[0]
                            .data.color as string
                        }
                        onChange={handleGroupColorChange}
                      />
                      <Input
                        variant="small"
                        value={
                          selectedNodes.filter((n) => n.type === "group")[0]
                            .data.color as string
                        }
                        onChange={(e) => handleGroupColorChange(e.target.value)}
                        onFocus={handleInputFocus}
        
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </PropRow>
            </PropertiesSection>
          </>
        )}
        {selectedNodes.some((node) => node.type === "package") && (
          <>
            <Separator className="my-2 first:hidden" />
            <PropertiesSection
              title={`Package Properties (${selectedNodes.filter((node) => node.type === "package").length})`}
              icon={Archive}
            >
              <PropRow label="Name">
                <Input
                  value={
                    (selectedNodes.filter((n) => n.type === "package")[0].data
                      .name as string) || ""
                  }
                  placeholder="Package Name"
                  onChange={(e) => {
                    const newName = e.target.value;
                    setNodes((prevNodes) =>
                      prevNodes.map((node) =>
                        node.selected && node.type === "package"
                          ? {
                              ...node,
                              data: {
                                ...node.data,
                                name: newName,
                              },
                            }
                          : node,
                      ),
                    );
                  }}
                  onFocus={handleInputFocus}
  
                  variant="small"
                />
              </PropRow>
            </PropertiesSection>
          </>
        )}
        {selectedNodes.some((node) => node.type === "note") && (
          <>
            <Separator className="my-2 first:hidden" />
            <PropertiesSection
              title={`Note Properties (${selectedNodes.filter((node) => node.type === "note").length})`}
              icon={MessageSquare}
            >
              <PropRow label="Content">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs w-full"
                  disabled={
                    selectedNodes.filter((node) => node.type === "note")
                      .length > 1
                  }
                  onClick={() => {
                    const noteNodes = selectedNodes.filter(
                      (node) => node.type === "note",
                    );
                    if (noteNodes.length === 1) {
                      handleNodeEditClick(noteNodes[0].id);
                    }
                  }}
                >
                  <Edit2 className="size-3 mr-2" />
                  Edit Content
                </Button>
              </PropRow>
            </PropertiesSection>
          </>
        )}
        {selectedNodes.some((node) => node.type === "use-case") && (
          <>
            <Separator className="my-2 first:hidden" />
            <PropertiesSection
              title={`Use Case Properties (${selectedNodes.filter((node) => node.type === "use-case").length})`}
              icon={Circle}
            >
              <PropRow label="Name">
                <Input
                  value={
                    (selectedNodes.filter((n) => n.type === "use-case")[0].data
                      .name as string) || ""
                  }
                  placeholder="Use Case Name"
                  onChange={(e) => {
                    const newName = e.target.value;
                    setNodes((prevNodes) =>
                      prevNodes.map((node) =>
                        node.selected && node.type === "use-case"
                          ? {
                              ...node,
                              data: { ...node.data, name: newName },
                            }
                          : node,
                      ),
                    );
                  }}
                  onFocus={handleInputFocus}
  
                  variant="small"
                />
              </PropRow>
            </PropertiesSection>
          </>
        )}
        {selectedNodes.some((node) => node.type === "actor") && (
          <>
            <Separator className="my-2 first:hidden" />
            <PropertiesSection
              title={`Actor Properties (${selectedNodes.filter((node) => node.type === "actor").length})`}
              icon={User}
            >
              <PropRow label="Name">
                <Input
                  value={
                    (selectedNodes.filter((n) => n.type === "actor")[0].data
                      .name as string) || ""
                  }
                  placeholder="Actor Name"
                  onChange={(e) => {
                    const newName = e.target.value;
                    setNodes((prevNodes) =>
                      prevNodes.map((node) =>
                        node.selected && node.type === "actor"
                          ? {
                              ...node,
                              data: { ...node.data, name: newName },
                            }
                          : node,
                      ),
                    );
                  }}
                  onFocus={handleInputFocus}
  
                  variant="small"
                />
              </PropRow>
            </PropertiesSection>
          </>
        )}
        {selectedNodes.some((node) => node.type === "component") && (
          <>
            <Separator className="my-2 first:hidden" />
            <PropertiesSection
              title={`Component Properties (${selectedNodes.filter((node) => node.type === "component").length})`}
              icon={Component}
            >
              <PropRow label="Name">
                <Input
                  value={
                    (selectedNodes.filter((n) => n.type === "component")[0].data
                      .name as string) || ""
                  }
                  placeholder="Component Name"
                  onChange={(e) => {
                    const newName = e.target.value;
                    setNodes((prevNodes) =>
                      prevNodes.map((node) =>
                        node.selected && node.type === "component"
                          ? {
                              ...node,
                              data: { ...node.data, name: newName },
                            }
                          : node,
                      ),
                    );
                  }}
                  onFocus={handleInputFocus}
  
                  variant="small"
                />
              </PropRow>
            </PropertiesSection>
          </>
        )}
        {selectedEdges.length > 0 && (
          <>
            <Separator className="my-2 first:hidden" />
            <PropertiesSection
              title={`Edge Properties (${selectedEdges.length})`}
              icon={ArrowRight}
            >
              <div className="px-3 py-2 mb-1 grid grid-cols-[1fr_auto] items-center gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Connection
                  </p>
                  <p className="font-mono text-xs mt-0.5 opacity-80 truncate min-w-0">
                    {selectedEdges.length === 1
                      ? `${selectedEdges[0].source} -> ${selectedEdges[0].target}`
                      : "Multiple selected"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleReverseEdges}
                  title="Reverse Connection"
                >
                  <ArrowRightLeft className="size-3.5" />
                </Button>
              </div>
              <PropRow label="Type">
                <Select
                  value={bulkEdgeType}
                  onValueChange={handleBulkEdgeTypeChange}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Mixed types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generalization">
                      Generalization
                    </SelectItem>
                    <SelectItem value="association">Association</SelectItem>
                    <SelectItem value="composition">Composition</SelectItem>
                    <SelectItem value="implementation">
                      Implementation
                    </SelectItem>
                  </SelectContent>
                </Select>
              </PropRow>
              <PropRow label="Label">
                <Input
                  value={bulkEdgeLabel}
                  placeholder={
                    selectedEdges.length > 1 && bulkEdgeLabel === ""
                      ? "Mixed labels"
                      : "Optional label"
                  }
                  onChange={(e) => handleBulkEdgeLabelChange(e.target.value)}
                  onFocus={handleInputFocus}
  
                  variant="small"
                />
              </PropRow>
            </PropertiesSection>
          </>
        )}

        {selectedEdges.length > 0 && (
          <>
            <Separator className="my-2 first:hidden" />
            <PropertiesSection title={`Cardinality`} icon={Hash}>
              <PropRow label="Source">
                <Input
                  value={bulkSourceCardinality}
                  placeholder={
                    selectedEdges.length > 1 && bulkSourceCardinality === ""
                      ? "Mixed"
                      : "e.g. 1..*"
                  }
                  onChange={(e) =>
                    handleBulkEdgeCardinalityChange(
                      "sourceCardinality",
                      e.target.value,
                    )
                  }
                  onFocus={handleInputFocus}
  
                  variant="small"
                />
              </PropRow>
              <PropRow label="Target">
                <Input
                  value={bulkTargetCardinality}
                  placeholder={
                    selectedEdges.length > 1 && bulkTargetCardinality === ""
                      ? "Mixed"
                      : "e.g. 0..1"
                  }
                  onChange={(e) =>
                    handleBulkEdgeCardinalityChange(
                      "targetCardinality",
                      e.target.value,
                    )
                  }
                  onFocus={handleInputFocus}
  
                  variant="small"
                />
              </PropRow>
            </PropertiesSection>
          </>
        )}
      </ScrollArea>

      {selectedNodeDialog && selectedNodeDialog.type === "object" && (
        <ObjectNodeDialog
          id={selectedNodeDialog.id}
          data={selectedNodeDialog.data as ObjectNodeData}
          open={nodeDialogOpen}
          onOpenChange={(open) => {
            setNodeDialogOpen(open);
            if (!open) {
              const timer = setTimeout(
                () => setSelectedNodeForDialog(null),
                150,
              );
              return () => clearTimeout(timer);
            }
          }}
        />
      )}

      {selectedNodeDialog && selectedNodeDialog.type === "note" && (
        <NoteNodeDialog
          id={selectedNodeDialog.id}
          data={selectedNodeDialog.data as NoteNodeData}
          open={nodeDialogOpen}
          onOpenChange={(open) => {
            setNodeDialogOpen(open);
            if (!open) {
              const timer = setTimeout(
                () => setSelectedNodeForDialog(null),
                150,
              );
              return () => clearTimeout(timer);
            }
          }}
        />
      )}
    </>
  );
};

export default PropertiesPanel;
