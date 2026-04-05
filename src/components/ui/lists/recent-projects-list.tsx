import { RecentProject } from "@/types/app";
import { FC, useCallback, Dispatch, SetStateAction } from "react";
import RecentProjectItem from "./recent-project-item";
import { FolderX } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "../empty";
import { invoke } from "@/lib/electron/invoke";
import { ScrollArea, ScrollBar } from "../scroll-area";

interface RecentProjectsListProps {
  recentProjects: RecentProject[];
  setRecentProjects: Dispatch<SetStateAction<RecentProject[]>>;
}

const RecentProjectsList: FC<RecentProjectsListProps> = ({
  recentProjects,
  setRecentProjects,
}) => {
  const handleRemoveProject = useCallback(
    async (path: string) => {
      setRecentProjects((prevProjects) =>
        prevProjects.filter((project) => project.path !== path),
      );

      try {
        await invoke("remove_recent_project", { path });
      } catch (error) {
        console.error("Failed to remove recent project:", error);
      }
    },
    [setRecentProjects],
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {recentProjects.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-2">Recent Projects</h2>
          <ScrollArea className="flex flex-1 flex-col items-stretch gap-2 size-full">
            {recentProjects.map((project) => (
              <RecentProjectItem
                key={project.path}
                recentProject={project}
                onRemove={handleRemoveProject}
              />
            ))}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </>
      )}

      {recentProjects.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderX />
            </EmptyMedia>
            <EmptyTitle>No recent projects found</EmptyTitle>
            <EmptyDescription>
              Get started by creating a new project.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
};

export default RecentProjectsList;
