"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  JSX,
  ReactNode,
  cloneElement,
  isValidElement,
  memo,
} from "react";
import {
  DragDropProvider,
  DragOverlay,
  useDraggable,
  useDroppable,
  useDragOperation,
} from "@dnd-kit/react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Folder, ChevronRight, ChevronDown, Box } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { X } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import SearchInput from "./inputs/search-input";
import { ScrollArea } from "./scroll-area";

export interface TreeViewItem {
  id: string;
  name: string;
  type: string;
  children?: TreeViewItem[];
  checked?: boolean;
}

export interface TreeViewIconMap {
  [key: string]: React.ReactNode | undefined;
}

export interface TreeViewMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: "default" | "destructive";
  action: (items: TreeViewItem[]) => void;
  show?: (items: TreeViewItem[]) => boolean;
}

export interface TreeViewMenuItemsByType {
  /**
   * Map from item.type -> menu items.
   * Use "*" as a fallback for any type.
   */
  [type: string]: TreeViewMenuItem[] | undefined;
}

export interface TreeViewProps {
  className?: string;
  data: TreeViewItem[];
  title?: string;
  showExpandAll?: boolean;
  showCheckboxes?: boolean;
  checkboxPosition?: "left" | "right";
  searchPlaceholder?: string;
  selectionText?: string;
  checkboxLabels?: {
    check: string;
    uncheck: string;
  };
  getIcon?: (item: TreeViewItem, depth: number) => React.ReactNode;
  onSelectionChange?: (selectedItems: TreeViewItem[]) => void;
  onAction?: (action: string, items: TreeViewItem[]) => void;
  onCheckChange?: (item: TreeViewItem, checked: boolean) => void;
  iconMap?: TreeViewIconMap;
  /**
   * Optional per-type context menu items.
   * If present, items will be resolved as:
   *   1) menuItemsByType[item.type]
   *   2) menuItemsByType["*"]
   *   3) menuItems (legacy fallback)
   */
  menuItemsByType?: TreeViewMenuItemsByType;
  menuItems?: TreeViewMenuItem[];
  selectedIds?: Set<string>;
  onDataChange?: (data: TreeViewItem[]) => void;
}

interface TreeItemProps {
  item: TreeViewItem;
  depth?: number;
  selectedIds: Set<string>;
  lastSelectedId: React.MutableRefObject<string | null>;
  onSelect: (ids: Set<string>) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string, isOpen: boolean) => void;
  getIcon?: (item: TreeViewItem, depth: number) => React.ReactNode;
  onAction?: (action: string, items: TreeViewItem[]) => void;
  onAccessChange?: (item: TreeViewItem, hasAccess: boolean) => void;
  allItems: TreeViewItem[];
  showAccessRights?: boolean;
  itemMap: Map<string, TreeViewItem>;
  iconMap?: TreeViewIconMap;
  menuItemsByType?: TreeViewMenuItemsByType;
  menuItems?: TreeViewMenuItem[];
  getSelectedItems: () => TreeViewItem[];
}

// Helper function to build a map of all items by ID
const buildItemMap = (items: TreeViewItem[]): Map<string, TreeViewItem> => {
  const map = new Map<string, TreeViewItem>();
  const processItem = (item: TreeViewItem) => {
    map.set(item.id, item);
    item.children?.forEach(processItem);
  };
  items.forEach(processItem);
  return map;
};

// Update the getCheckState function to work bottom-up
const getCheckState = (
  item: TreeViewItem,
  itemMap: Map<string, TreeViewItem>,
): "checked" | "unchecked" | "indeterminate" => {
  // Get the original item from the map
  const originalItem = itemMap.get(item.id);
  if (!originalItem) return "unchecked";

  // If it's a leaf node (no children), return its check state
  if (!originalItem.children || originalItem.children.length === 0) {
    return originalItem.checked ? "checked" : "unchecked";
  }

  // Count the check states of immediate children
  let checkedCount = 0;
  let indeterminateCount = 0;

  originalItem.children.forEach((child) => {
    const childState = getCheckState(child, itemMap);
    if (childState === "checked") checkedCount++;
    if (childState === "indeterminate") indeterminateCount++;
  });

  // Calculate parent state based on children states
  const totalChildren = originalItem.children.length;

  // If all children are checked
  if (checkedCount === totalChildren) {
    return "checked";
  }
  // If any child is checked or indeterminate
  if (checkedCount > 0 || indeterminateCount > 0) {
    return "indeterminate";
  }
  // If no children are checked or indeterminate
  return "unchecked";
};

// Add this default icon map
const defaultIconMap: TreeViewIconMap = {
  file: <Box className="h-4 w-4 text-red-600" />,
  folder: <Folder className="h-4 w-4 text-primary/80" />,
};

const TreeItem = memo(function TreeItem({
  item,
  depth = 0,
  selectedIds,
  lastSelectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
  getIcon,
  onAction,
  onAccessChange,
  allItems,
  showAccessRights,
  itemMap,
  iconMap = defaultIconMap,
  menuItemsByType,
  menuItems,
  getSelectedItems,
}: TreeItemProps): JSX.Element {
  const isOpen = expandedIds.has(item.id);
  const isSelected = selectedIds.has(item.id);
  const itemRef = useRef<HTMLDivElement>(null);
  const [selectionStyle, setSelectionStyle] = useState("");

  const { source } = useDragOperation();
  const isDraggingGlobal = source != null;

  const { ref: dragRef, isDragging } = useDraggable({
    id: item.id,
    data: { item },
    disabled: item.type === "root",
  });

  const { ref: droppableTop, isDropTarget: isDropTargetTop } = useDroppable({
    id: `${item.id}|top`,
    data: { position: "top", item },
    disabled: item.type === "root",
  });
  const { ref: droppableInside, isDropTarget: isDropTargetInside } =
    useDroppable({
      id: `${item.id}|inside`,
      data: { position: "inside", item },
      disabled:
        item.type !== "folder" && item.type !== "root" && !item.children,
    });
  const { ref: droppableBottom, isDropTarget: isDropTargetBottom } =
    useDroppable({
      id: `${item.id}|bottom`,
      data: { position: "bottom", item },
      disabled: item.type === "root",
    });

  // Get all visible items in order
  const getVisibleItems = useCallback(
    (items: TreeViewItem[]): TreeViewItem[] => {
      let visibleItems: TreeViewItem[] = [];

      items.forEach((item) => {
        visibleItems.push(item);
        if (item.children && expandedIds.has(item.id)) {
          visibleItems = [...visibleItems, ...getVisibleItems(item.children)];
        }
      });

      return visibleItems;
    },
    [expandedIds],
  );

  useEffect(() => {
    if (!isSelected) {
      setSelectionStyle("");
      return;
    }

    // Get all visible items from the entire tree
    const visibleItems = getVisibleItems(allItems);
    const currentIndex = visibleItems.findIndex((i) => i.id === item.id);

    const prevItem = visibleItems[currentIndex - 1];
    const nextItem = visibleItems[currentIndex + 1];

    const isPrevSelected = prevItem && selectedIds.has(prevItem.id);
    const isNextSelected = nextItem && selectedIds.has(nextItem.id);

    const roundTop = !isPrevSelected;
    const roundBottom = !isNextSelected;

    setSelectionStyle(
      `${roundTop ? "rounded-t-md" : ""} ${roundBottom ? "rounded-b-md" : ""}`,
    );
  }, [
    isSelected,
    selectedIds,
    expandedIds,
    item.id,
    getVisibleItems,
    allItems,
  ]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      let newSelection = new Set(selectedIds);

      if (!itemRef.current) return;

      if (e.shiftKey && lastSelectedId.current !== null) {
        const items = Array.from(
          document.querySelectorAll("[data-tree-item]"),
        ) as HTMLElement[];
        const lastIndex = items.findIndex(
          (el) => el.getAttribute("data-id") === lastSelectedId.current,
        );
        const currentIndex = items.findIndex((el) => el === itemRef.current);
        const [start, end] = [
          Math.min(lastIndex, currentIndex),
          Math.max(lastIndex, currentIndex),
        ];

        items.slice(start, end + 1).forEach((el) => {
          const id = el.getAttribute("data-id");
          const parentFolderClosed = el.closest('[data-folder-closed="true"]');
          const isClosedFolder =
            el.getAttribute("data-folder-closed") === "true";

          if (id && (isClosedFolder || !parentFolderClosed)) {
            newSelection.add(id);
          }
        });
      } else if (e.ctrlKey || e.metaKey) {
        if (newSelection.has(item.id)) {
          newSelection.delete(item.id);
        } else {
          newSelection.add(item.id);
        }
      } else {
        newSelection = new Set([item.id]);
        // Open folder on single click if it's a folder
        if (item.children && isSelected) {
          onToggleExpand(item.id, !isOpen);
        }
      }

      lastSelectedId.current = item.id;
      onSelect(newSelection);
    },
    [
      selectedIds,
      item.id,
      item.children,
      isSelected,
      isOpen,
      onSelect,
      onToggleExpand,
      lastSelectedId,
    ],
  );

  // Helper function to get all descendants of an item (including the item itself)
  const getAllDescendants = useCallback(
    (item: TreeViewItem): TreeViewItem[] => {
      const descendants = [item];
      if (item.children) {
        item.children.forEach((child) => {
          descendants.push(...getAllDescendants(child));
        });
      }
      return descendants;
    },
    [],
  );

  const handleAccessClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onAccessChange) {
        const currentState = getCheckState(item, itemMap);
        // Toggle between checked and unchecked, treating indeterminate as unchecked
        const newChecked = currentState === "checked" ? false : true;

        onAccessChange(item, newChecked);
      }
    },
    [item, itemMap, onAccessChange],
  );

  const renderIcon = useCallback(() => {
    if (getIcon) {
      return getIcon(item, depth);
    }

    // Use the provided iconMap or fall back to default
    return iconMap[item.type] || iconMap.folder || defaultIconMap.folder;
  }, [getIcon, item, depth, iconMap]);

  const getItemPath = useCallback(
    (item: TreeViewItem, items: TreeViewItem[]): string => {
      const path: string[] = [item.name];

      const findParent = (
        currentItem: TreeViewItem,
        allItems: TreeViewItem[],
      ) => {
        for (const potentialParent of allItems) {
          if (
            potentialParent.children?.some(
              (child) => child.id === currentItem.id,
            )
          ) {
            path.unshift(potentialParent.name);
            findParent(potentialParent, allItems);
            break;
          }
          if (potentialParent.children) {
            findParent(currentItem, potentialParent.children);
          }
        }
      };

      findParent(item, items);
      return path.join(" → ");
    },
    [],
  );

  // Add function to count selected items in a folder
  const getSelectedChildrenCount = useCallback(
    (item: TreeViewItem): number => {
      let count = 0;

      if (!item.children) return 0;

      item.children.forEach((child) => {
        if (selectedIds.has(child.id)) {
          count++;
        }
        if (child.children) {
          count += getSelectedChildrenCount(child);
        }
      });

      return count;
    },
    [selectedIds],
  );

  // Get selected count only if item has children and is collapsed
  const selectedCount = useMemo(
    () => (item.children && !isOpen && getSelectedChildrenCount(item)) || null,
    [item, isOpen, getSelectedChildrenCount],
  );

  const resolvedMenuItems = useMemo(
    () => menuItemsByType?.[item.type] ?? menuItemsByType?.["*"] ?? menuItems,
    [menuItemsByType, item.type, menuItems],
  );

  const hasMenuItems = (resolvedMenuItems?.length ?? 0) > 0;

  const renderMenuIcon = useCallback((icon?: ReactNode) => {
    if (!icon) return null;

    // Force icon color to inherit from the menu item's text color (e.g. destructive).
    if (isValidElement<{ className?: string }>(icon)) {
      return cloneElement(icon, {
        className: cn(icon.props.className, "size-4 shrink-0 text-current"),
      });
    }

    return <span className="size-4 shrink-0 text-current">{icon}</span>;
  }, []);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="min-w-0">
          <div className="relative">
            {isDraggingGlobal && source?.id !== item.id && (
              <div className="absolute inset-0 z-10 pointer-events-auto">
                {item.type !== "root" && (
                  <div
                    ref={droppableTop}
                    className="absolute top-0 left-0 w-full h-[25%]"
                  />
                )}
                {(item.type === "folder" ||
                  item.type === "root" ||
                  item.children) && (
                  <div
                    ref={droppableInside}
                    className={`absolute left-0 w-full ${item.type === "root" ? "inset-0" : "top-[25%] h-[50%]"}`}
                  />
                )}
                {item.type !== "root" && (
                  <div
                    ref={droppableBottom}
                    className="absolute bottom-0 left-0 w-full h-[25%]"
                  />
                )}
              </div>
            )}
            {isDropTargetTop && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-primary z-20 pointer-events-none" />
            )}
            {isDropTargetBottom && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary z-20 pointer-events-none" />
            )}
            {isDropTargetInside && (
              <div className="absolute inset-0 ring-2 ring-primary bg-primary/10 rounded z-20 pointer-events-none" />
            )}

            <div
              ref={(node) => {
                dragRef(node);
                // Assign to our local Ref
                (itemRef as React.RefObject<HTMLDivElement | null>).current =
                  node;
              }}
              data-tree-item
              data-id={item.id}
              data-depth={depth}
              data-folder-closed={item.children && !isOpen}
              className={`select-none hover:bg-background/50 rounded-md min-w-0 transition-opacity ${
                isDragging ? "opacity-30" : ""
              } ${
                isSelected
                  ? `bg-background/50 ${selectionStyle}`
                  : "text-foreground"
              } px-1`}
              style={{ paddingLeft: `${depth * 20}px` }}
              onClick={handleClick}
            >
              <div className="flex items-center h-8 min-w-0">
                {item.children ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0 group">
                    <Collapsible
                      open={isOpen}
                      onOpenChange={(open) => onToggleExpand(item.id, open)}
                    >
                      <CollapsibleTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <motion.div
                            initial={false}
                            animate={{ rotate: isOpen ? 90 : 0 }}
                            transition={{ duration: 0.1 }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </motion.div>
                        </Button>
                      </CollapsibleTrigger>
                    </Collapsible>
                    {showAccessRights && (
                      <div
                        className="relative flex items-center justify-center w-4 h-4 hover:opacity-80"
                        onClick={handleAccessClick}
                      >
                        {getCheckState(item, itemMap) === "checked" && (
                          <div className="w-4 h-4 border rounded bg-primary border-primary flex items-center justify-center">
                            <svg
                              className="h-3 w-3 text-primary-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                        {getCheckState(item, itemMap) === "unchecked" && (
                          <div className="w-4 h-4 border rounded border-input" />
                        )}
                        {getCheckState(item, itemMap) === "indeterminate" && (
                          <div className="w-4 h-4 border rounded bg-primary border-primary flex items-center justify-center">
                            <div className="h-0.5 w-2 bg-primary-foreground" />
                          </div>
                        )}
                      </div>
                    )}
                    {renderIcon()}
                    <span className="flex-1 truncate min-w-0">{item.name}</span>
                    {selectedCount !== null && selectedCount > 0 && (
                      <Badge variant="outline" className="mr-2">
                        {selectedCount} selected
                      </Badge>
                    )}
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 group-hover:opacity-100 opacity-0 items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">{item.name}</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>
                              <span className="font-medium">Type:</span>{" "}
                              {item.type.charAt(0).toUpperCase() +
                                item.type.slice(1).replace("_", " ")}
                            </div>
                            <div>
                              <span className="font-medium">ID:</span> {item.id}
                            </div>
                            <div>
                              <span className="font-medium">Location:</span>{" "}
                              {getItemPath(item, allItems)}
                            </div>
                            <div>
                              <span className="font-medium">Items:</span>{" "}
                              {item.children?.length || 0} direct items
                            </div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 pl-8 min-w-0 group">
                    {showAccessRights && (
                      <div
                        className="relative flex items-center justify-center w-4 h-4 hover:opacity-80"
                        onClick={handleAccessClick}
                      >
                        {item.checked ? (
                          <div className="w-4 h-4 border rounded bg-primary border-primary flex items-center justify-center">
                            <svg
                              className="h-3 w-3 text-primary-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-4 h-4 border rounded border-input" />
                        )}
                      </div>
                    )}
                    {renderIcon()}
                    <span className="flex-1 truncate min-w-0">{item.name}</span>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 group-hover:opacity-100 opacity-0 items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">{item.name}</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>
                              <span className="font-medium">Type:</span>{" "}
                              {item.type.charAt(0).toUpperCase() +
                                item.type.slice(1).replace("_", " ")}
                            </div>
                            <div>
                              <span className="font-medium">ID:</span> {item.id}
                            </div>
                            <div>
                              <span className="font-medium">Location:</span>{" "}
                              {getItemPath(item, allItems)}
                            </div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                )}
              </div>
            </div>
          </div>

          {item.children && (
            <Collapsible
              open={isOpen}
              onOpenChange={(open) => onToggleExpand(item.id, open)}
            >
              <AnimatePresence initial={false}>
                {isOpen && (
                  <CollapsibleContent forceMount asChild>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.05 }}
                    >
                      {item.children?.map((child) => (
                        <TreeItem
                          key={child.id}
                          item={child}
                          depth={depth + 1}
                          selectedIds={selectedIds}
                          lastSelectedId={lastSelectedId}
                          onSelect={onSelect}
                          expandedIds={expandedIds}
                          onToggleExpand={onToggleExpand}
                          getIcon={getIcon}
                          onAction={onAction}
                          onAccessChange={onAccessChange}
                          allItems={allItems}
                          showAccessRights={showAccessRights}
                          itemMap={itemMap}
                          iconMap={iconMap}
                          menuItemsByType={menuItemsByType}
                          menuItems={menuItems}
                          getSelectedItems={getSelectedItems}
                        />
                      ))}
                    </motion.div>
                  </CollapsibleContent>
                )}
              </AnimatePresence>
            </Collapsible>
          )}
        </div>
      </ContextMenuTrigger>
      {hasMenuItems && (
        <ContextMenuContent>
          {resolvedMenuItems
            ?.filter((menuItem) => {
              const targetItems = selectedIds.has(item.id)
                ? getSelectedItems()
                : [item];
              return menuItem.show ? menuItem.show(targetItems) : true;
            })
            .map((menuItem) => (
              <ContextMenuItem
                key={menuItem.id}
                onClick={() => {
                  const items = selectedIds.has(item.id)
                    ? getSelectedItems()
                    : [item];
                  menuItem.action(items);
                }}
                variant={menuItem.variant || "default"}
              >
                {renderMenuIcon(menuItem.icon)}
                {menuItem.label}
              </ContextMenuItem>
            ))}
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
});

export default function TreeView({
  className,
  checkboxLabels = {
    check: "Check",
    uncheck: "Uncheck",
  },
  data: propData,
  iconMap,
  searchPlaceholder = "Search...",
  selectionText = "selected",
  showExpandAll = true,
  showCheckboxes = false,
  getIcon,
  onSelectionChange,
  onAction,
  onCheckChange,
  menuItemsByType,
  menuItems,
  selectedIds: propSelectedIds,
  onDataChange,
}: TreeViewProps) {
  const [data, setData] = useState<TreeViewItem[]>(propData);

  useEffect(() => {
    setData(propData);
  }, [propData]);

  const [currentMousePos, setCurrentMousePos] = useState<number>(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragStartPosition, setDragStartPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
    new Set(),
  );
  const selectedIds = propSelectedIds ?? internalSelectedIds;
  const [searchQuery, setSearchQuery] = useState("");

  const dragRef = useRef<HTMLDivElement>(null);
  const lastSelectedId = useRef<string | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  const DRAG_THRESHOLD = 10; // pixels

  // Create a map of all items by ID
  const itemMap = useMemo(() => buildItemMap(data), [data]);

  // Memoize the search results and expanded IDs
  const { filteredData, searchExpandedIds } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { filteredData: data, searchExpandedIds: new Set<string>() };
    }

    const searchLower = searchQuery.toLowerCase();
    const newExpandedIds = new Set<string>();

    // Helper function to check if an item or its descendants match the search
    const itemMatches = (item: TreeViewItem): boolean => {
      const nameMatches = item.name.toLowerCase().includes(searchLower);
      if (nameMatches) return true;

      if (item.children) {
        return item.children.some((child) => itemMatches(child));
      }

      return false;
    };

    // Helper function to filter tree while keeping parent structure
    const filterTree = (items: TreeViewItem[]): TreeViewItem[] => {
      return items
        .map((item) => {
          if (!item.children) {
            return itemMatches(item) ? item : null;
          }

          const filteredChildren = filterTree(item.children);
          if (filteredChildren.length > 0 || itemMatches(item)) {
            if (item.children) {
              newExpandedIds.add(item.id);
            }
            return {
              ...item,
              children: filteredChildren,
            };
          }
          return null;
        })
        .filter((item): item is TreeViewItem => item !== null);
    };

    return {
      filteredData: filterTree(data),
      searchExpandedIds: newExpandedIds,
    };
  }, [data, searchQuery]);

  // Update expanded IDs when search changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedIds((prev) => new Set([...prev, ...searchExpandedIds]));
    }
  }, [searchExpandedIds, searchQuery]);

  const handleSelection = useCallback(
    (newSelectedIds: Set<string>) => {
      if (!propSelectedIds) {
        setInternalSelectedIds(newSelectedIds);
      }

      if (onSelectionChange) {
        // Need to construct selected items to pass back
        const items: TreeViewItem[] = [];
        const processItem = (item: TreeViewItem) => {
          if (newSelectedIds.has(item.id)) {
            items.push(item);
          }
          item.children?.forEach(processItem);
        };
        data.forEach(processItem);
        onSelectionChange(items);
      }
    },
    [propSelectedIds, onSelectionChange, data],
  );

  // Function to collect all folder IDs
  const getAllFolderIds = useCallback((items: TreeViewItem[]): string[] => {
    let ids: string[] = [];
    items.forEach((item) => {
      if (item.children) {
        ids.push(item.id);
        ids = [...ids, ...getAllFolderIds(item.children)];
      }
    });
    return ids;
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedIds(new Set(getAllFolderIds(data)));
  }, [data, getAllFolderIds]);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const handleDragEnd = useCallback(
    (event: any) => {
      const { operation } = event;
      const { source, target } = operation;
      if (!source || !target) return;

      const sourceId = source.id;
      const targetParts = String(target.id).split("|");
      const targetId = targetParts[0];
      const position = targetParts[1]; // 'top', 'inside', 'bottom'

      if (!position || sourceId === targetId) return;

      setData((prev) => {
        const cloneTree = (nodes: TreeViewItem[]): TreeViewItem[] => {
          return nodes.map((node) => ({
            ...node,
            children: node.children ? cloneTree(node.children) : undefined,
          }));
        };

        const newTree = cloneTree(prev);
        let itemToMove: TreeViewItem | null = null;

        const findNode = (
          nodes: TreeViewItem[],
          id: string,
        ): TreeViewItem | null => {
          for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
              const found = findNode(node.children, id);
              if (found) return found;
            }
          }
          return null;
        };

        const isDescendant = (
          nodes: TreeViewItem[],
          pId: string,
          cId: string,
        ): boolean => {
          const parent = findNode(nodes, pId);
          if (!parent) return false;
          const check = (node: TreeViewItem): boolean => {
            if (node.id === cId) return true;
            if (node.children) return node.children.some(check);
            return false;
          };
          return check(parent);
        };

        if (isDescendant(newTree, sourceId, targetId)) return prev;

        const removeNode = (nodes: TreeViewItem[]) => {
          const result: TreeViewItem[] = [];
          for (const node of nodes) {
            if (node.id === sourceId) {
              itemToMove = node;
              continue;
            }
            if (node.children) {
              node.children = removeNode(node.children);
            }
            result.push(node);
          }
          return result;
        };

        const intermediateTree = removeNode(newTree);
        if (!itemToMove) return prev;

        const insertNode = (nodes: TreeViewItem[]): TreeViewItem[] => {
          const result: TreeViewItem[] = [];
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.id === targetId) {
              if (position === "top") {
                result.push(itemToMove!);
                result.push(node);
              } else if (position === "bottom") {
                result.push(node);
                result.push(itemToMove!);
              } else if (position === "inside") {
                if (!node.children) node.children = [];
                node.children.unshift(itemToMove!);
                result.push(node);
              }
            } else {
              if (node.children) {
                node.children = insertNode(node.children);
              }
              result.push(node);
            }
          }
          return result;
        };

        const finalTree = insertNode(intermediateTree);

        setTimeout(() => {
          onDataChange?.(finalTree);
        }, 0);
        return finalTree;
      });
    },
    [onDataChange],
  );

  const handleToggleExpand = useCallback((id: string, isOpen: boolean) => {
    setExpandedIds((prev) => {
      const newExpandedIds = new Set(prev);
      if (isOpen) {
        newExpandedIds.add(id);
      } else {
        newExpandedIds.delete(id);
      }
      return newExpandedIds;
    });
  }, []);

  // Get selected items
  const getSelectedItems = useCallback((): TreeViewItem[] => {
    const items: TreeViewItem[] = [];
    const processItem = (item: TreeViewItem) => {
      if (selectedIds.has(item.id)) {
        items.push(item);
      }
      item.children?.forEach(processItem);
    };
    data.forEach(processItem);
    return items;
  }, [selectedIds, data]);

  // Get selected items, filtering out parents if their children are selected
  const getEffectiveSelectedItems = useCallback((): TreeViewItem[] => {
    const selectedItems = getSelectedItems();

    // Build a set of all selected IDs for quick lookup
    const selectedIdsSet = new Set(selectedItems.map((item) => item.id));

    // Filter out parents whose children are also selected
    return selectedItems.filter((item) => {
      // If this item has no children, always include it
      if (!item.children) return true;

      // Check if any children of this item are selected
      const hasSelectedChildren = item.children.some((child) =>
        selectedIdsSet.has(child.id),
      );

      // Only include this item if none of its children are selected
      return !hasSelectedChildren;
    });
  }, [getSelectedItems]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only track on left click and not on buttons
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;

    // Prevent custom dragging marquee selection if we're clicking on a tree item
    // This allows dnd-kit logic to handle dragging without triggering 60fps refreshes from the marquee selection state
    if ((e.target as HTMLElement).closest("[data-tree-item]")) return;

    setDragStartPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Check if primary button is still held down
      if (!(e.buttons & 1)) {
        setIsDragging(false);
        setDragStart(null);
        setDragStartPosition(null);
        return;
      }

      // If we haven't registered a potential drag start position, ignore
      if (!dragStartPosition) return;

      // Calculate distance moved
      const deltaX = e.clientX - dragStartPosition.x;
      const deltaY = e.clientY - dragStartPosition.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // If we haven't started dragging yet, check if we should start
      if (!isDragging) {
        if (distance > DRAG_THRESHOLD) {
          setIsDragging(true);
          setDragStart(dragStartPosition.y);

          // Clear selection if not holding shift/ctrl
          if (!e.shiftKey && !e.ctrlKey) {
            handleSelection(new Set());
            lastSelectedId.current = null;
          }
        }
        return;
      }

      // Rest of the existing drag logic
      if (!dragRef.current) return;

      const items = Array.from(
        dragRef.current.querySelectorAll("[data-tree-item]"),
      ) as HTMLElement[];

      const startY = dragStart;
      const currentY = e.clientY;
      const [selectionStart, selectionEnd] = [
        Math.min(startY || 0, currentY),
        Math.max(startY || 0, currentY),
      ];

      const newSelection = new Set(
        e.shiftKey || e.ctrlKey ? Array.from(selectedIds) : [],
      );

      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const itemTop = rect.top;
        const itemBottom = rect.top + rect.height;

        if (itemBottom >= selectionStart && itemTop <= selectionEnd) {
          const id = item.getAttribute("data-id");
          const isClosedFolder =
            item.getAttribute("data-folder-closed") === "true";
          const parentFolderClosed = item.closest(
            '[data-folder-closed="true"]',
          );

          if (id && (isClosedFolder || !parentFolderClosed)) {
            newSelection.add(id);
          }
        }
      });

      handleSelection(newSelection);
      setCurrentMousePos(e.clientY);
    },
    [isDragging, dragStart, selectedIds, dragStartPosition, handleSelection],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
    setDragStartPosition(null);
  }, []);

  // Add cleanup for mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("mouseleave", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [isDragging, handleMouseUp]);

  // Call onSelectionChange when selection changes
  // Remove this effect, as it's now handled by handleSelection
  // useEffect(() => {
  //   if (onSelectionChange) {
  //     onSelectionChange(getSelectedItems());
  //   }
  // }, [selectedIds, onSelectionChange, getSelectedItems]);

  return (
    <div className="flex h-full gap-4 min-w-0">
      <div ref={treeRef} className="w-full min-w-0">
        <AnimatePresence mode="wait">
          {selectedIds.size > 0 ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-10 flex items-center justify-between bg-background rounded-lg border px-4 mb-2 mr-4"
            >
              <div
                className="font-medium flex items-center"
                title="Clear selection"
                onClick={() => {
                  handleSelection(new Set());
                  lastSelectedId.current = null;
                }}
              >
                <X className="h-4 w-4 mr-2" />
                {selectedIds.size} {selectionText}
              </div>

              {showCheckboxes && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const effectiveItems = getEffectiveSelectedItems();
                      const processItem = (item: TreeViewItem) => {
                        onCheckChange?.(item, true);
                        item.children?.forEach(processItem);
                      };
                      effectiveItems.forEach(processItem);
                    }}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    {checkboxLabels.check}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const effectiveItems = getEffectiveSelectedItems();
                      const processItem = (item: TreeViewItem) => {
                        onCheckChange?.(item, false);
                        item.children?.forEach(processItem);
                      };
                      effectiveItems.forEach(processItem);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {checkboxLabels.uncheck}
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="h-10 flex items-center gap-2 mb-2 mr-4"
            >
              <SearchInput
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {showExpandAll && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-2"
                    onClick={handleExpandAll}
                  >
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Expand All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-2"
                    onClick={handleCollapseAll}
                  >
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Collapse All
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <DragDropProvider onDragEnd={handleDragEnd}>
          <div
            ref={dragRef}
            className={cn(
              "rounded-lg bg-card relative select-none h-full min-h-0 min-w-0 pb-12",
              className,
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
          >
            <ScrollArea className="h-full pr-4">
              {isDragging && (
                <div
                  className="absolute inset-0 bg-blue-500/0 pointer-events-none"
                  style={{
                    top: Math.min(
                      dragStart || 0,
                      dragStart === null ? 0 : currentMousePos,
                    ),
                    height: Math.abs(
                      (dragStart || 0) -
                        (dragStart === null ? 0 : currentMousePos),
                    ),
                  }}
                />
              )}
              {filteredData.map((item) => (
                <TreeItem
                  key={item.id}
                  item={item}
                  selectedIds={selectedIds}
                  lastSelectedId={lastSelectedId}
                  onSelect={handleSelection}
                  expandedIds={expandedIds}
                  onToggleExpand={handleToggleExpand}
                  getIcon={getIcon}
                  onAction={onAction}
                  onAccessChange={onCheckChange}
                  allItems={data}
                  showAccessRights={showCheckboxes}
                  itemMap={itemMap}
                  iconMap={iconMap}
                  menuItemsByType={menuItemsByType}
                  menuItems={menuItems}
                  getSelectedItems={getSelectedItems}
                />
              ))}
            </ScrollArea>
          </div>
          <DragOverlay>
            {(source: any) => {
              if (!source?.data?.item) return null;
              return (
                <div className="bg-background border rounded shadow-md px-3 py-1 flex items-center gap-2 opacity-80 text-sm">
                  {source.data.item.name}
                </div>
              );
            }}
          </DragOverlay>
        </DragDropProvider>
      </div>
    </div>
  );
}
