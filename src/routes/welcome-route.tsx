import { Button } from "@/components/ui/button.tsx";
import { CirclePlus, FolderOpen } from "lucide-react";
import Titlebar from "@/components/ui/titlebar.tsx";
import FrostIcon from "@/assets/graphics/app/frost.svg";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable.tsx";
import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RecentProject } from "@/types/app";
import RecentProjectsList from "@/components/ui/lists/recent-projects-list";
import { Badge } from "@/components/ui/badge";

const WelcomeRoute = () => {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        const projects: RecentProject[] = await invoke("get_recent_projects");
        setRecentProjects(projects);
      } catch (error) {
        console.error("Failed to fetch recent projects:", error);
      }
    };

    fetchRecentProjects();
  }, []);

  const handleNewProject = useCallback(async () => {
    try {
      await invoke("open_new_project_window");
    } catch (error) {
      console.error("Failed to open new project window:", error);
    }
  }, []);

  const handleOpenProject = useCallback(async () => {
    try {
      const opened = await invoke("open_project_file");
      if (!opened) return;
    } catch (error) {
      console.error("Failed to open project file:", error);
      return;
    }

    try {
      await invoke("close_window", { label: "welcome" });
    } catch (error) {
      console.error("Failed to close welcome window:", error);
    }
  }, []);

  return (
    <>
      <Titlebar variant="no-title" />
      <main className="flex items-stretch flex-1">
        <ResizablePanelGroup dir="horizontal">
          <ResizablePanel
            className="bg-secondary w-64 flex flex-col items-center justify-center gap-2"
            minSize={300}
            defaultSize={300}
          >
            <img
              src={FrostIcon}
              className="size-32 mb-4 pointer-events-none"
              alt="Application Icon"
            />
            <p className="text-xl font-medium">Frost</p>
            <div className="flex gap-2">
              <p className="text-muted-foreground text-sm">version 0.1.1</p>
              <Badge variant="outline">beta</Badge>
            </div>
            <div className="flex flex-col gap-2 mt-10">
              <Button onClick={handleNewProject}>
                <CirclePlus />
                Create New Project
              </Button>
              <Button variant="outline" onClick={handleOpenProject}>
                <FolderOpen />
                Open Existing Project
              </Button>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel className="flex flex-col" minSize={300}>
            <RecentProjectsList
              recentProjects={recentProjects}
              setRecentProjects={setRecentProjects}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </>
  );
};

export default WelcomeRoute;
