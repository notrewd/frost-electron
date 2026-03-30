import { useEffect, useRef, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Focus, ArrowRight } from "lucide-react";
import { Edge } from "@xyflow/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchInput from "@/components/ui/inputs/search-input";

const edgeTypes = [
  { value: "association", label: "Association" },
  { value: "composition", label: "Composition" },
  { value: "generalization", label: "Generalization" },
  { value: "implementation", label: "Implementation" },
];

const EdgesOutlinerRoute = () => {
  const [edges, setEdges] = useState<Edge[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const edgeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const filteredEdges = edges.filter((edge) => {
    if (!searchQuery.trim()) return true;

    const terms = searchQuery.trim().split(/\s+/);

    return terms.every((term) => {
      let isNegated = false;
      let cleanTerm = term;

      if (cleanTerm.startsWith("-") || cleanTerm.startsWith("!")) {
        isNegated = true;
        cleanTerm = cleanTerm.slice(1);
      }

      let field = "any";
      if (cleanTerm.startsWith("source:")) {
        field = "source";
        cleanTerm = cleanTerm.slice(7);
      } else if (cleanTerm.startsWith("target:")) {
        field = "target";
        cleanTerm = cleanTerm.slice(7);
      } else if (cleanTerm.startsWith("type:")) {
        field = "type";
        cleanTerm = cleanTerm.slice(5);
      }

      cleanTerm = cleanTerm.toLowerCase();

      let isMatch = false;
      if (field === "source") {
        isMatch = edge.source.toLowerCase().includes(cleanTerm);
      } else if (field === "target") {
        isMatch = edge.target.toLowerCase().includes(cleanTerm);
      } else if (field === "type") {
        isMatch = (edge.type || "association")
          .toLowerCase()
          .includes(cleanTerm);
      } else {
        isMatch =
          edge.source.toLowerCase().includes(cleanTerm) ||
          edge.target.toLowerCase().includes(cleanTerm) ||
          (edge.type || "association").toLowerCase().includes(cleanTerm);
      }

      return isNegated ? !isMatch : isMatch;
    });
  });

  useEffect(() => {
    const selectedEdge = edges.find((e) => e.selected);
    if (selectedEdge) {
      const el = edgeRefs.current.get(selectedEdge.id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [edges]);

  useEffect(() => {
    const unlisten = listen<Edge[]>("edges-data", (event) => {
      setEdges(event.payload);
    });

    emit("request-edges");

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const handleUpdateEdgeType = (id: string, type: string) => {
    emit("update-edge-type", { id, type });
  };

  const handleDeleteEdge = (id: string) => {
    emit("delete-edge", { id });
  };

  const handleFocusEdge = (id: string) => {
    emit("focus-edge", { id });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="shrink-0 sticky top-0 z-10 bg-background">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Edges Outliner
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage all connections in the current project.
        </p>
        <div className="mt-4 px-1">
          <SearchInput
            placeholder="Search edges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Separator className="my-4" />
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3">
          {filteredEdges.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No edges found in the current view.
            </div>
          ) : (
            filteredEdges.map((edge) => (
              <div
                key={edge.id}
                ref={(el) => {
                  if (el) edgeRefs.current.set(edge.id, el);
                  else edgeRefs.current.delete(edge.id);
                }}
                className={`flex flex-col gap-2 p-3 rounded-lg border bg-card transition-colors scroll-mt-32 ${
                  edge.selected ? "border-primary" : "border-border"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="text-sm font-medium">Source</span>
                    <span
                      className="text-xs text-muted-foreground truncate"
                      title={edge.source}
                    >
                      {edge.source}
                    </span>
                  </div>

                  <ArrowRight className="size-4 text-muted-foreground shrink-0" />

                  <div className="flex flex-col gap-1 flex-1 min-w-0 text-right">
                    <span className="text-sm font-medium">Target</span>
                    <span
                      className="text-xs text-muted-foreground truncate"
                      title={edge.target}
                    >
                      {edge.target}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-2 justify-between">
                  <Select
                    value={edge.type || "association"}
                    onValueChange={(val) => handleUpdateEdgeType(edge.id, val)}
                  >
                    <SelectTrigger className="h-8 flex-1 min-w-0">
                      <SelectValue placeholder="Edge Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {edgeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handleFocusEdge(edge.id)}
                      title="Focus on Edge"
                    >
                      <Focus className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteEdge(edge.id)}
                      title="Delete Edge"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default EdgesOutlinerRoute;
