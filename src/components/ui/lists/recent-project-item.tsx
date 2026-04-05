import { RecentProject } from "@/types/app";
import { FC, useCallback } from "react";
import { Button } from "../button";
import { Ellipsis, Folder, Trash } from "lucide-react";
import { invoke } from "@/lib/electron/invoke";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { revealItemInDir } from "@/lib/electron/shell";

interface RecentProjectItemProps {
  recentProject: RecentProject;
  onRemove: (path: string) => void;
}

const RecentProjectItem: FC<RecentProjectItemProps> = ({
  recentProject,
  onRemove,
}) => {
  const handleOpenProject = useCallback(async () => {
    try {
      await invoke("open_project_path", { path: recentProject.path });
    } catch (error) {
      console.error("Failed to open project file:", error);
      return;
    }

    try {
      await invoke("close_window", { label: "welcome" });
    } catch (error) {
      console.error("Failed to close welcome window:", error);
    }
  }, [recentProject.path]);

  const handleOpen = useCallback(async () => {
    try {
      await revealItemInDir(recentProject.path);
    } catch (error) {
      console.error("Failed to open project path:", error);
    }
  }, [recentProject.path]);

  const handleOnRemove = useCallback(() => {
    onRemove(recentProject.path);
  }, [recentProject.path, onRemove]);

  return (
    <Button
      variant="ghost"
      className="flex w-full items-center gap-4 px-4 py-2 h-auto"
      onClick={handleOpenProject}
    >
      <Folder className="size-6 text-muted-foreground" />
      <div className="flex flex-1 flex-col items-start">
        <p>{recentProject.name}</p>
        <p className="text-muted-foreground">{recentProject.path}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => event.stopPropagation()}
          >
            <Ellipsis className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                handleOpen();
              }}
            >
              <Folder className="size-4" />
              Open in explorer
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={(event) => {
                event.stopPropagation();
                handleOnRemove();
              }}
            >
              <Trash className="size-4" />
              Remove from recent
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </Button>
  );
};

export default RecentProjectItem;
