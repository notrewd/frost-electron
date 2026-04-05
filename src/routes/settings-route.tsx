import EditorSettings from "@/components/settings/editor";
import GeneralSettings from "@/components/settings/general";
import NodesSettings from "@/components/settings/nodes";
import EdgesSettings from "@/components/settings/edges";
import { Button } from "@/components/ui/button";
import ContentHeader from "@/components/ui/content-header";
import SearchInput from "@/components/ui/inputs/search-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import ObjectNodesSettings from "@/components/settings/object-nodes";
import SuggestionsSettings from "@/components/settings/suggestions";
import { cn } from "@/lib/utils";
import { invoke } from "@/lib/electron/invoke";
import { type } from "@/lib/electron/os";
import {
  LucideIcon,
  Save,
  Settings2,
  TvMinimal,
  Workflow,
  Spline,
  Lightbulb,
} from "lucide-react";
import { useCallback, useState, useEffect, useRef } from "react";
import DiscardDialog from "@/components/ui/dialogs/discard-dialog";
import { getCurrentWindow } from "@/lib/electron/window";

const appWindow = getCurrentWindow();

interface Category {
  id: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  keywords?: string[];
  parentId?: string;
}

const categories: Category[] = [
  {
    id: "general",
    title: "General",
    description: "General application settings.",
    icon: Settings2,
    keywords: [
      "Theme",
      "Select the theme for the application",
      "light",
      "dark",
      "system",
    ],
  },
  {
    id: "editor",
    title: "Editor",
    description: "Customize the look and feel of the editor.",
    icon: TvMinimal,
    keywords: [
      "Show Controls",
      "Toggle the visibility of the editor controls (zoom, fit view, etc.)",
      "Show Minimap",
      "Toggle the visibility of the minimap in the editor",
      "Pan on Scroll",
      "Enable or disable panning the editor when scrolling",
    ],
  },
  {
    id: "nodes",
    title: "Nodes",
    description: "Manage visual appearance of nodes.",
    icon: Workflow,
    keywords: [],
  },
  {
    id: "object-nodes",
    title: "Object Nodes",
    description: "Custom settings for Object nodes.",
    parentId: "nodes",
    keywords: [
      "Colored Nodes",
      "Enable or disable colored nodes",
      "Colors",
      "Color Scheme",
    ],
  },
  {
    id: "edges",
    title: "Edges",
    description: "Manage visual appearance of edges.",
    icon: Spline,
    keywords: [
      "Edge Style",
      "Choose the visual style of the edges connecting nodes",
      "Straight",
      "Smooth Step",
      "Bezier",
    ],
  },
  {
    id: "suggestions",
    title: "Suggestions",
    description: "Configure intelligent suggestions and warnings for nodes.",
    icon: Lightbulb,
    keywords: [
      "Suggestions",
      "Warnings",
      "Encapsulation",
      "Naming Convention",
      "God Class",
      "Empty Class",
      "Missing Return Type",
      "Mutable Getter",
      "Missing Constructor",
      "Abstract",
      "Parameters",
    ],
  },
];

const SettingsRoute = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(
    categories[0],
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [busy, setBusy] = useState(false);
  const [changed, setChanged] = useState(false);

  const [allowClose, setAllowClose] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [initialSettings, setInitialSettings] = useState<any>(null);

  const allowCloseRef = useRef(allowClose);
  const changedRef = useRef(changed);
  const closeUnlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    allowCloseRef.current = allowClose;
  }, [allowClose]);

  useEffect(() => {
    changedRef.current = changed;
  }, [changed]);

  useEffect(() => {
    const fetchInitial = async () => {
      const settings = await invoke("get_settings_state");
      setInitialSettings(settings);
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const setupOnClose = async () => {
      const dispose = await appWindow.onCloseRequested((event) => {
        if (allowCloseRef.current) {
          return;
        }

        if (changedRef.current) {
          event.preventDefault();
          setShowDiscardDialog(true);
          return;
        }

        event.preventDefault();
        allowCloseRef.current = true;
        setAllowClose(true);
        appWindow.destroy();
      });

      if (cancelled) {
        dispose();
        return;
      }
      closeUnlistenRef.current = dispose;
    };

    setupOnClose();

    return () => {
      cancelled = true;
      closeUnlistenRef.current?.();
      closeUnlistenRef.current = null;
    };
  }, []);

  const handleDiscardConfirm = useCallback(async () => {
    try {
      setShowDiscardDialog(false);

      if (initialSettings) {
        await invoke("set_settings_state", {
          theme: initialSettings.theme,
          panOnScroll: initialSettings.pan_on_scroll,
          showMinimap: initialSettings.show_minimap,
          coloredNodes: initialSettings.colored_nodes,
          showControls: initialSettings.show_controls,
          edgeStyle: initialSettings.edge_style,
          autoSave: initialSettings.auto_save,
          autoSaveInterval: initialSettings.auto_save_interval,
          showGrid: initialSettings.show_grid,
          snapToGrid: initialSettings.snap_to_grid,
          gridSize: initialSettings.grid_size,
          compactNodes: initialSettings.compact_nodes,
          objectNodeAccessModifierColorLight:
            initialSettings.object_node_access_modifier_color_light,
          objectNodeAccessModifierColorDark:
            initialSettings.object_node_access_modifier_color_dark,
          objectNodeTypeSeparatorColorLight:
            initialSettings.object_node_type_separator_color_light,
          objectNodeTypeSeparatorColorDark:
            initialSettings.object_node_type_separator_color_dark,
          objectNodeTypeColorLight:
            initialSettings.object_node_type_color_light,
          objectNodeTypeColorDark: initialSettings.object_node_type_color_dark,
          objectNodeDefaultValueColorLight:
            initialSettings.object_node_default_value_color_light,
          objectNodeDefaultValueColorDark:
            initialSettings.object_node_default_value_color_dark,
          objectNodeParameterNameColorLight:
            initialSettings.object_node_parameter_name_color_light,
          objectNodeParameterNameColorDark:
            initialSettings.object_node_parameter_name_color_dark,
          nodeBorderRadius: initialSettings.node_border_radius,

          showEdgeLabels: initialSettings.show_edge_labels,
          suggestionsEnabled: initialSettings.suggestions_enabled,
          suggestionEncapsulationViolation: initialSettings.suggestion_encapsulation_violation,
          suggestionNamingConventionClass: initialSettings.suggestion_naming_convention_class,
          suggestionNamingConventionMembers: initialSettings.suggestion_naming_convention_members,
          suggestionGodClass: initialSettings.suggestion_god_class,
          suggestionEmptyClass: initialSettings.suggestion_empty_class,
          suggestionMissingReturnType: initialSettings.suggestion_missing_return_type,
          suggestionMutableGetterExposure: initialSettings.suggestion_mutable_getter_exposure,
          suggestionMissingConstructor: initialSettings.suggestion_missing_constructor,
          suggestionUnusedAbstract: initialSettings.suggestion_unused_abstract,
          suggestionTooManyParameters: initialSettings.suggestion_too_many_parameters,
        });
      }

      allowCloseRef.current = true;
      changedRef.current = false;
      closeUnlistenRef.current?.();
      closeUnlistenRef.current = null;
      setAllowClose(true);
      setChanged(false);

      await new Promise((resolve) => setTimeout(resolve, 0));
      await appWindow.destroy();
    } catch (error) {
      console.error("Error in handleDiscardConfirm:", error);
    }
  }, [initialSettings]);

  const filteredCategories = categories.filter(
    (category) =>
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.keywords &&
        category.keywords.some((kw) =>
          kw.toLowerCase().includes(searchQuery.toLowerCase()),
        )),
  );

  useEffect(() => {
    if (
      searchQuery &&
      filteredCategories.length > 0 &&
      !filteredCategories.find((c) => c.id === selectedCategory.id)
    ) {
      setSelectedCategory(filteredCategories[0]);
    }
  }, [searchQuery, filteredCategories, selectedCategory.id]);

  const handleSave = useCallback(async () => {
    setBusy(true);
    try {
      await invoke("save_settings_state");
      setChanged(false);
      const settings = await invoke("get_settings_state");
      setInitialSettings(settings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <SidebarProvider>
      <Sidebar
        className={cn(
          type() === "macos" && "mt-10 h-auto!",
          type() === "windows" && "mt-8 h-auto!",
        )}
        variant="floating"
      >
        <SidebarContent>
          <SidebarGroup>
            <div className="px-2 mb-2 -mx-2">
              <SearchInput
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              {filteredCategories
                .filter((c) => !c.parentId)
                .map((category) => (
                  <SidebarMenu key={category.id}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setSelectedCategory(category)}
                        className={
                          selectedCategory === category ? "bg-muted" : ""
                        }
                      >
                        {category.icon && <category.icon className="size-4" />}
                        {category.title}
                      </SidebarMenuButton>
                      {filteredCategories.some(
                        (c) => c.parentId === category.id,
                      ) && (
                        <SidebarMenuSub>
                          {filteredCategories
                            .filter((c) => c.parentId === category.id)
                            .map((sub) => (
                              <SidebarMenuSubItem key={sub.id}>
                                <SidebarMenuSubButton
                                  onClick={() => setSelectedCategory(sub)}
                                  className={cn(
                                    "cursor-default",
                                    selectedCategory === sub && "bg-muted",
                                  )}
                                >
                                  {sub.title}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  </SidebarMenu>
                ))}
            </div>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <main className="flex flex-col items-stretch flex-1">
        <ContentHeader
          title={selectedCategory.title}
          description={selectedCategory.description}
          className="px-2"
        />
        <ScrollArea className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col p-2 gap-4">
            {selectedCategory.id === "general" && (
              <GeneralSettings
                onChange={() => setChanged(true)}
                searchQuery={searchQuery}
              />
            )}
            {selectedCategory.id === "edges" && (
              <EdgesSettings
                onChange={() => setChanged(true)}
                searchQuery={searchQuery}
              />
            )}
            {selectedCategory.id === "editor" && (
              <EditorSettings
                onChange={() => setChanged(true)}
                searchQuery={searchQuery}
              />
            )}
            {selectedCategory.id === "nodes" && (
              <NodesSettings
                onChange={() => setChanged(true)}
                searchQuery={searchQuery}
              />
            )}
            {selectedCategory.id === "object-nodes" && (
              <ObjectNodesSettings
                onChange={() => setChanged(true)}
                searchQuery={searchQuery}
              />
            )}
            {selectedCategory.id === "suggestions" && (
              <SuggestionsSettings
                onChange={() => setChanged(true)}
                searchQuery={searchQuery}
              />
            )}
          </div>
        </ScrollArea>
        <Separator className="my-2" />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={busy || !changed}
          >
            <Save className="size-4" />
            Save
          </Button>
        </div>
      </main>
      <DiscardDialog
        open={showDiscardDialog}
        onChange={setShowDiscardDialog}
        onConfirm={handleDiscardConfirm}
        title="Unsaved settings"
        description="You have unsaved settings. Do you want to discard them and close?"
      />
    </SidebarProvider>
  );
};

export default SettingsRoute;
