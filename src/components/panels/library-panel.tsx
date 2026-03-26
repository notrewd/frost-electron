import {
  Archive,
  ChevronsLeftRightEllipsis,
  TableProperties,
  Tag,
  MessageSquare,
  Circle,
  User,
  Component,
  LayoutGrid,
  List,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LibraryItem from "../ui/library-item";
import { default as SearchInput } from "../ui/inputs/search-input";
import { useMemo, useState, type ChangeEvent } from "react";
import type { DragEventData } from "@neodrag/react";
import type { ObjectNodeData } from "@/components/nodes/object-node";
import type { NoteNodeData } from "@/components/nodes/note-node";
import type { UseCaseNodeData } from "@/components/nodes/use-case-node";
import type { ActorNodeData } from "@/components/nodes/actor-node";
import type { ComponentNodeData } from "@/components/nodes/component-node";
import PropertiesSection from "../ui/properties-section";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { ButtonGroup } from "../ui/button-group";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export type LibraryNodeTemplate =
  | { type: "object"; data: ObjectNodeData }
  | { type: "package"; data: { name: string } }
  | { type: "note"; data: NoteNodeData }
  | { type: "use-case"; data: UseCaseNodeData }
  | { type: "actor"; data: ActorNodeData }
  | { type: "component"; data: ComponentNodeData };

export type LibraryPaletteItem = {
  icon: LucideIcon;
  label: string;
  template: LibraryNodeTemplate;
};

export type LibraryPalleteCategory = {
  label: string;
  items: LibraryPaletteItem[];
};

type LibraryPanelProps = {
  onItemDropped?: (item: LibraryPaletteItem, drag: DragEventData) => void;
  onItemClicked?: (item: LibraryPaletteItem) => void;
};

const categories: LibraryPalleteCategory[] = [
  {
    label: "General",
    items: [
      {
        icon: TableProperties,
        label: "Class Node",
        template: {
          type: "object",
          data: {
            name: "Class",
            attributes: [],
            methods: [],
          },
        },
      },
      {
        icon: Archive,
        label: "Package",
        template: {
          type: "package",
          data: {
            name: "Package",
          },
        },
      },
      {
        icon: MessageSquare,
        label: "Note",
        template: {
          type: "note",
          data: {
            name: "Note",
            note: "",
          },
        },
      },
    ],
  },
  {
    label: "Use Case",
    items: [
      {
        icon: Circle,
        label: "Use Case",
        template: {
          type: "use-case",
          data: {
            name: "Use Case",
          },
        },
      },
      {
        icon: User,
        label: "Actor",
        template: {
          type: "actor",
          data: {
            name: "Actor",
          },
        },
      },
      {
        icon: Component,
        label: "Component",
        template: {
          type: "component",
          data: {
            name: "Component",
          },
        },
      },
    ],
  },
  {
    label: "Templates",
    items: [
      {
        icon: ChevronsLeftRightEllipsis,
        label: "Interface Node",
        template: {
          type: "object",
          data: {
            name: "Interface",
            stereotype: "interface",
            attributes: [],
            methods: [],
          },
        },
      },
      {
        icon: Tag,
        label: "Enum Node",
        template: {
          type: "object",
          data: {
            name: "Enum",
            stereotype: "enumeration",
            attributes: [],
            methods: [],
          },
        },
      },
    ],
  },
] as const;

const LibraryPanel = ({ onItemDropped, onItemClicked }: LibraryPanelProps) => {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return categories;

    const filtered = categories.map((category) => ({
      ...category,
      items: category.items.filter((item) =>
        item.label.toLowerCase().includes(q),
      ),
    }));

    // we don't want to show empty categories, so we filter them out
    return filtered.filter((category) => category.items.length > 0);
  }, [query]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <SearchInput
          placeholder="Search library..."
          className="w-full"
          value={query}
          onChange={handleSearch}
        />
        <ButtonGroup>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("grid")}
            title="Grid View"
            className="h-8"
          >
            <LayoutGrid
              className={cn(viewMode === "list" && "text-muted-foreground")}
            />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("list")}
            title="List View"
            className="h-8"
          >
            <List
              className={cn(viewMode === "grid" && "text-muted-foreground")}
            />
          </Button>
        </ButtonGroup>
      </div>
      <ScrollArea className="flex-1 min-h-0 w-[calc(100%+16px)] pr-4">
        {filteredCategories.map((item, index) => (
          <div key={index}>
            <Separator className="my-2" />
            <PropertiesSection title={item.label}>
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 gap-4"
                    : "flex flex-col gap-2"
                }
              >
                {item.items.map((paletteItem) => (
                  <LibraryItem
                    key={`${paletteItem.label}`}
                    icon={paletteItem.icon}
                    draggable
                    viewMode={viewMode}
                    onClick={() => onItemClicked?.(paletteItem)}
                    onDragEnd={(drag) => {
                      onItemDropped?.(paletteItem, drag);
                    }}
                  >
                    {paletteItem.label}
                  </LibraryItem>
                ))}
              </div>
            </PropertiesSection>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default LibraryPanel;
