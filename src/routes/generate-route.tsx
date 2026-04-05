import { useState } from "react";
import { invoke } from "@/lib/electron/invoke";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { open } from "@/lib/electron/dialog";

export default function GenerateRoute() {
  const [paths, setPaths] = useState<string[]>([]);
  const [recursive, setRecursive] = useState(true);
  const [generateGroups, setGenerateGroups] = useState(true);

  const handleSelectFiles = async () => {
    const selected = await open({
      multiple: true,
      directory: false,
    });
    if (Array.isArray(selected)) {
      setPaths(selected);
    } else if (selected) {
      setPaths([selected]);
    }
  };

  const handleSelectDirectories = async () => {
    const selected = await open({
      multiple: true,
      directory: true,
    });
    if (Array.isArray(selected)) {
      setPaths(selected);
    } else if (selected) {
      setPaths([selected]);
    }
  };

  const handleGenerate = async () => {
    try {
      await invoke("start_generation", {
        paths,
        recursive,
        generateGroups,
      });
    } catch (error) {
      console.error("Error starting generation:", error);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-auto">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Generate Diagram</h2>
        <p className="text-sm text-muted-foreground">
          Import your source code to auto-generate a diagram.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label>Source Files or Directories</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSelectFiles}
              className="flex-1"
            >
              Select Files
            </Button>
            <Button
              variant="outline"
              onClick={handleSelectDirectories}
              className="flex-1"
            >
              Select Directories
            </Button>
          </div>
          {paths.length > 0 && (
            <p className="text-sm mt-2 text-muted-foreground break-all">
              {paths.length} file/folder(s) selected
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2 mt-2">
          <Checkbox
            id="recursive"
            checked={recursive}
            onCheckedChange={(c) => setRecursive(!!c)}
          />
          <Label htmlFor="recursive">Import directories recursively</Label>
        </div>

        <div className="flex items-center space-x-2 mt-2">
          <Checkbox
            id="generateGroups"
            checked={generateGroups}
            onCheckedChange={(c) => setGenerateGroups(!!c)}
          />
          <Label htmlFor="generateGroups">
            Generate groups from directories
          </Label>
        </div>
      </div>

      <div className="mt-auto flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => invoke("close_window", { label: "generate" })}>
          Cancel
        </Button>
        <Button onClick={handleGenerate} disabled={paths.length === 0}>
          Generate
        </Button>
      </div>
    </div>
  );
}
