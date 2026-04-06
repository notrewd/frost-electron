import { FC, useState, useEffect, useMemo } from "react";
import { useUpdateNodeInternals } from "@xyflow/react";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { ChevronsLeft, ChevronsRight, Edit2, Lightbulb, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import ObjectNodeDialog from "../ui/dialogs/object-node-dialog";
import { useSettingsStore } from "@/stores/settings-store";
import { useShallow } from "zustand/react/shallow";
import { analyzeObjectNode, NodeSuggestion } from "@/lib/node-suggestions";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { ScrollArea } from "../ui/scroll-area";
import { ContextMenuItem, ContextMenuSeparator } from "../ui/context-menu";
import NodeContextMenu, {
  NodeContextMenuContent,
  NodeContextMenuDeleteOption,
  NodeContextMenuFocusOption,
  NodeContextMenuExportOption,
  NodeContextMenuGroupOption,
  NodeContextMenuOptions,
  NodeContextMenuUngroupOption,
} from "../ui/nodes/node-context-menu";
import NodeConnectionHandle from "../ui/nodes/node-connection-handle";
import NodeSelectionRing from "../ui/nodes/node-selection-ring";

export interface ObjectNodeProperty {
  id: string;
  name: string;
  type?: string;
  static?: boolean;
  defaultValue?: string;
}

export interface ObjectNodeAttribute extends ObjectNodeProperty {
  accessModifier: "public" | "private" | "protected";
  stereotype?: string;
}

export interface ObjectNodeMethod {
  id: string;
  name: string;
  accessModifier: "public" | "private" | "protected";
  abstract?: boolean;
  static?: boolean;
  returnType: string;
  parameters: ObjectNodeProperty[];
}

export interface ObjectNodeData extends Record<string, unknown> {
  name: string;
  stereotype?: string;
  attributes?: ObjectNodeAttribute[];
  methods?: ObjectNodeMethod[];
  abstract?: boolean;
  note?: string;
  viewType?: "external" | "internal";
}

interface ObjectNodeProps {
  id: string;
  data: ObjectNodeData;
  selected: boolean;
}

const SuggestionItem: FC<{ suggestion: NodeSuggestion }> = ({ suggestion }) => (
  <div className="border-b last:border-b-0 px-3 py-2 flex flex-col gap-1">
    <div className="flex items-center gap-1.5">
      {suggestion.severity === "warning" ? (
        <AlertTriangle className="size-3 shrink-0 text-amber-500" />
      ) : (
        <Info className="size-3 shrink-0 text-blue-500" />
      )}
      <span className="font-medium">{suggestion.title}</span>
    </div>
    <p className="text-muted-foreground whitespace-pre-line pl-4.5">
      {suggestion.details}
    </p>
    {suggestion.fix && (
      <p className="text-muted-foreground pl-4.5 italic">
        {suggestion.fix}
      </p>
    )}
  </div>
);

const ObjectNode: FC<ObjectNodeProps> = ({ id, data, selected }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(id);
  }, [data, id, updateNodeInternals]);

  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    coloredNodes,
    compactNodes,
    nodeBorderRadius,
    theme,
    publicAccessColorLight,
    publicAccessColorDark,
    privateAccessColorLight,
    privateAccessColorDark,
    protectedAccessColorLight,
    protectedAccessColorDark,
    separatorColorLight,
    separatorColorDark,
    typeColorLight,
    typeColorDark,
    defaultValueColorLight,
    defaultValueColorDark,
    parameterColorLight,
    parameterColorDark,
    suggestionsEnabled,
    sgEncapsulation,
    sgNamingClass,
    sgNamingMembers,
    sgGodClass,
    sgEmptyClass,
    sgMissingReturn,
    sgMutableGetter,
    sgMissingCtor,
    sgUnusedAbstract,
    sgTooManyParams,
  } = useSettingsStore(
    useShallow((state) => ({
      coloredNodes: state.colored_nodes,
      compactNodes: state.compact_nodes,
      nodeBorderRadius: state.node_border_radius,
      theme: state.theme,
      publicAccessColorLight: state.object_node_public_access_color_light,
      publicAccessColorDark: state.object_node_public_access_color_dark,
      privateAccessColorLight: state.object_node_private_access_color_light,
      privateAccessColorDark: state.object_node_private_access_color_dark,
      protectedAccessColorLight: state.object_node_protected_access_color_light,
      protectedAccessColorDark: state.object_node_protected_access_color_dark,
      separatorColorLight: state.object_node_type_separator_color_light,
      separatorColorDark: state.object_node_type_separator_color_dark,
      typeColorLight: state.object_node_type_color_light,
      typeColorDark: state.object_node_type_color_dark,
      defaultValueColorLight: state.object_node_default_value_color_light,
      defaultValueColorDark: state.object_node_default_value_color_dark,
      parameterColorLight: state.object_node_parameter_name_color_light,
      parameterColorDark: state.object_node_parameter_name_color_dark,
      suggestionsEnabled: state.suggestions_enabled,
      sgEncapsulation: state.suggestion_encapsulation_violation,
      sgNamingClass: state.suggestion_naming_convention_class,
      sgNamingMembers: state.suggestion_naming_convention_members,
      sgGodClass: state.suggestion_god_class,
      sgEmptyClass: state.suggestion_empty_class,
      sgMissingReturn: state.suggestion_missing_return_type,
      sgMutableGetter: state.suggestion_mutable_getter_exposure,
      sgMissingCtor: state.suggestion_missing_constructor,
      sgUnusedAbstract: state.suggestion_unused_abstract,
      sgTooManyParams: state.suggestion_too_many_parameters,
    })),
  );

  const suggestionSettings = useMemo(() => ({
    encapsulation_violation: sgEncapsulation,
    naming_convention_class: sgNamingClass,
    naming_convention_members: sgNamingMembers,
    god_class: sgGodClass,
    empty_class: sgEmptyClass,
    missing_return_type: sgMissingReturn,
    mutable_getter_exposure: sgMutableGetter,
    missing_constructor: sgMissingCtor,
    unused_abstract: sgUnusedAbstract,
    too_many_parameters: sgTooManyParams,
  }), [
    sgEncapsulation, sgNamingClass, sgNamingMembers, sgGodClass,
    sgEmptyClass, sgMissingReturn, sgMutableGetter, sgMissingCtor,
    sgUnusedAbstract, sgTooManyParams,
  ]);

  const isDark = useMemo(
    () =>
      theme === "system"
        ? document.documentElement.classList.contains("dark")
        : theme === "dark",
    [theme],
  );

  const publicAColor = useMemo(
    () =>
      coloredNodes ? (isDark ? publicAccessColorDark : publicAccessColorLight) : undefined,
    [coloredNodes, isDark, publicAccessColorDark, publicAccessColorLight],
  );

  const privateAColor = useMemo(
    () =>
      coloredNodes ? (isDark ? privateAccessColorDark : privateAccessColorLight) : undefined,
    [coloredNodes, isDark, privateAccessColorDark, privateAccessColorLight],
  );

  const protectedAColor = useMemo(
    () =>
      coloredNodes ? (isDark ? protectedAccessColorDark : protectedAccessColorLight) : undefined,
    [coloredNodes, isDark, protectedAccessColorDark, protectedAccessColorLight],
  );

  const sColor = useMemo(
    () =>
      coloredNodes
        ? isDark
          ? separatorColorDark
          : separatorColorLight
        : undefined,
    [coloredNodes, isDark, separatorColorDark, separatorColorLight],
  );

  const tColor = useMemo(
    () =>
      coloredNodes ? (isDark ? typeColorDark : typeColorLight) : undefined,
    [coloredNodes, isDark, typeColorDark, typeColorLight],
  );

  const dColor = useMemo(
    () =>
      coloredNodes
        ? isDark
          ? defaultValueColorDark
          : defaultValueColorLight
        : undefined,
    [coloredNodes, isDark, defaultValueColorDark, defaultValueColorLight],
  );

  const pColor = useMemo(
    () =>
      coloredNodes
        ? isDark
          ? parameterColorDark
          : parameterColorLight
        : undefined,
    [coloredNodes, isDark, parameterColorDark, parameterColorLight],
  );

  const suggestions = useMemo(
    () => suggestionsEnabled ? analyzeObjectNode(data, suggestionSettings) : [],
    [data, suggestionSettings, suggestionsEnabled],
  );

  const warningCount = useMemo(
    () => suggestions.filter((s) => s.severity === "warning").length,
    [suggestions],
  );

  const getAccessColor = (modifier: "public" | "private" | "protected") =>
    modifier === "public" ? publicAColor : modifier === "private" ? privateAColor : protectedAColor;

  const displayedAttributes = useMemo(() => {
    if (!data.attributes) return [];
    if (data.viewType === "external") {
      return data.attributes.filter((a) => a.accessModifier === "public");
    }
    return data.attributes;
  }, [data.attributes, data.viewType]);

  const displayedMethods = useMemo(() => {
    if (!data.methods) return [];
    if (data.viewType === "external") {
      return data.methods.filter((m) => m.accessModifier === "public");
    }
    return data.methods;
  }, [data.methods, data.viewType]);

  return (
    <>
      <NodeContextMenu>
        <NodeContextMenuContent>
          <Card
            className={cn(
              "flex flex-col relative",
              compactNodes
                ? "gap-0.5 py-2 font-mono text-xs"
                : "gap-2 py-4 font-mono pb-6",
            )}
            style={{
              borderRadius: `${nodeBorderRadius}px`,
            }}
            onDoubleClick={() => setDialogOpen(true)}
          >
            <NodeSelectionRing visible={selected} />
            {suggestions.length > 0 && (
              <HoverCard openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <button
                    data-suggestion-button
                    className={cn(
                      "absolute top-1.5 right-1.5 z-10 flex items-center justify-center rounded-full p-0.5 transition-colors",
                      warningCount > 0
                        ? "text-amber-500 hover:bg-amber-500/15"
                        : "text-blue-500 hover:bg-blue-500/15",
                    )}
                  >
                    <Lightbulb className={cn(compactNodes ? "size-3" : "size-3.5")} />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent
                  side="right"
                  align="start"
                  className="w-80 p-0 font-sans text-xs"
                >
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <Lightbulb className="size-3.5 text-muted-foreground" />
                    <span className="font-medium text-sm">
                      {suggestions.length} suggestion{suggestions.length !== 1 && "s"}
                    </span>
                  </div>
                  <ScrollArea viewportClassName="max-h-64">
                    {suggestions.map((s) => (
                      <SuggestionItem key={s.id} suggestion={s} />
                    ))}
                  </ScrollArea>
                </HoverCardContent>
              </HoverCard>
            )}
            {data.stereotype && (
              <div
                className={cn(
                  "px-4 w-full flex items-center justify-center text-muted-foreground",
                  compactNodes ? "text-[10px]" : "text-sm",
                )}
              >
                <ChevronsLeft
                  className={cn(compactNodes ? "size-3" : "size-4")}
                />
                <span>{data.stereotype}</span>
                <ChevronsRight
                  className={cn(compactNodes ? "size-3" : "size-4")}
                />
              </div>
            )}
            <p
              className={cn(
                "px-8 w-full text-center font-semibold",
                compactNodes ? "text-sm" : "text-base",
                data.abstract && "italic",
              )}
            >
              {data.name}
            </p>
            {displayedAttributes.length > 0 && (
              <Separator className={cn(compactNodes ? "my-1" : "my-2")} />
            )}
            {displayedAttributes.map((attr, index) => (
              <p key={index} className="px-4 flex gap-2 items-center text-nowrap">
                <span style={coloredNodes ? { color: getAccessColor(attr.accessModifier) } : undefined}>
                  {attr.accessModifier === "public"
                    ? "+"
                    : attr.accessModifier === "private"
                      ? "-"
                      : "#"}{" "}
                </span>
                {attr.stereotype && <span className="flex items-center text-muted-foreground">
                  <ChevronsLeft className={cn(compactNodes ? "size-3" : "size-4")} />
                  <span>{attr.stereotype}</span>
                  <ChevronsRight className={cn(compactNodes ? "size-3" : "size-4")} />
                </span>}
                <span
                  className={cn({
                    underline: attr.static,
                  })}
                >
                  {attr.name}
                  {attr.type && (
                    <>
                      <span
                        style={coloredNodes ? { color: sColor } : undefined}
                      >
                        :
                      </span>{" "}
                      <span
                        style={coloredNodes ? { color: tColor } : undefined}
                      >
                        {attr.type}
                      </span>
                    </>
                  )}
                  {attr.defaultValue && (
                    <>
                      {" = "}
                      <span
                        style={coloredNodes ? { color: dColor } : undefined}
                      >
                        {attr.defaultValue}
                      </span>
                    </>
                  )}
                </span>
              </p>
            ))}
            {displayedMethods.length > 0 && (
              <Separator className={cn(compactNodes ? "my-1" : "my-2")} />
            )}
            {displayedMethods.map((method, index) => {
              const isConstructor = method.name === data.name || method.name === "constructor";
              const renderName = data.viewType === "external" && isConstructor ? "new" : method.name;
              const renderReturnType = data.viewType === "external" && isConstructor ? data.name : method.returnType;

              return (
              <p key={index} className="px-4 flex gap-2 items-center text-nowrap">
                <span style={coloredNodes ? { color: getAccessColor(method.accessModifier) } : undefined}>
                  {method.accessModifier === "public"
                    ? "+"
                    : method.accessModifier === "private"
                      ? "-"
                      : "#"}{" "}
                </span>
                <span
                  className={cn({
                    underline: method.static,
                    italic: method.abstract,
                  })}
                >
                  {renderName}(
                  {method.parameters.map((param, index) => (
                    <>
                      <span
                        style={coloredNodes ? { color: pColor } : undefined}
                      >
                        {param.name}
                      </span>
                      <span
                        style={coloredNodes ? { color: sColor } : undefined}
                      >
                        :
                      </span>{" "}
                      <span
                        style={coloredNodes ? { color: tColor } : undefined}
                      >
                        {param.type}
                      </span>
                      {param.defaultValue && (
                        <>
                          {" = "}
                          <span
                            style={coloredNodes ? { color: dColor } : undefined}
                          >
                            {param.defaultValue}
                          </span>
                        </>
                      )}
                      {index < method.parameters.length - 1 ? ", " : ""}
                    </>
                  ))}
                  )
                  {renderReturnType && (
                    <>
                      <span
                        style={coloredNodes ? { color: sColor } : undefined}
                      >
                        :
                      </span>{" "}
                      <span
                        style={coloredNodes ? { color: tColor } : undefined}
                      >
                        {renderReturnType}
                      </span>
                    </>
                  )}
                </span>
              </p>
            )})}
            {!displayedAttributes.length && !displayedMethods.length && (
              <>
                <Separator className={cn(compactNodes ? "my-1" : "my-2")} />
                <p className="px-4 italic text-muted-foreground">
                  No attributes or methods
                </p>
              </>
            )}
            <NodeConnectionHandle nodeId={id} />
          </Card>
        </NodeContextMenuContent>
        <NodeContextMenuOptions>
          <ContextMenuItem onClick={() => setDialogOpen(true)}>
            <Edit2 className="size-4" />
            Edit Data
          </ContextMenuItem>
          <ContextMenuSeparator />
          <NodeContextMenuFocusOption nodeId={id} />
          <NodeContextMenuGroupOption nodeId={id} />
          <NodeContextMenuUngroupOption nodeId={id} />
          <ContextMenuSeparator />
          <NodeContextMenuExportOption nodeId={id} />
          <ContextMenuSeparator />
          <NodeContextMenuDeleteOption nodeId={id} />
        </NodeContextMenuOptions>
      </NodeContextMenu>
      <ObjectNodeDialog
        id={id}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        data={data}
      />
    </>
  );
};

export default ObjectNode;
