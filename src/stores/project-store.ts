import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import { ProjectState } from "./types";

export const useProjectStore = create<ProjectState>((set) => ({
  projectName: "",
  projectPath: "",
  projectData: "",
  projectEdited: false,
  canUndo: false,
  canRedo: false,

  setProjectName: (name) => set({ projectName: name }),
  setProjectPath: (path) => set({ projectPath: path }),
  setProjectData: (data) => set({ projectData: data }),
  setProjectEdited: (edited) => set({ projectEdited: edited }),
  setCanUndo: (canUndo) => set({ canUndo }),
  setCanRedo: (canRedo) => set({ canRedo }),
}));

export const initProjectListeners = () => {
  const fetchProjectDetails = async () => {
    try {
      const [name, path] = await invoke<[string | null, string | null]>(
        "request_project_details",
      );

      useProjectStore.getState().setProjectName(name ?? "");
      useProjectStore.getState().setProjectPath(path ?? "");
    } catch (error) {
      console.error("Failed to fetch project details:", error);
    }
  };

  fetchProjectDetails();

  listen<{ name: string; path: string }>("project-opened", (event) => {
    const { name, path } = event.payload;
    useProjectStore.getState().setProjectName(name);
    useProjectStore.getState().setProjectPath(path);
  });
};
