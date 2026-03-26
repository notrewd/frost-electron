import { FC, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import { Input } from "../input";
import { Button } from "../button";
import { ChevronRight, GripVertical, Plus, Trash2 } from "lucide-react";
import { Switch } from "../switch";
import {
  ObjectNodeProperty,
  type ObjectNodeMethod,
} from "@/components/nodes/object-node";
import ObjectNodeParameterItem from "./object-node-parameter-item";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../collapsible";
import { SortableItem, SortableItemHandle } from "../sortable";
import { useObjectNodeColors } from "@/hooks/use-object-node-colors";

interface ObjectNodeMethodItemProps {
  method: ObjectNodeMethod;
  index: number;
  onUpdateMethod: (index: number, updated: Partial<ObjectNodeMethod>) => void;
  onRemoveMethod: (index: number) => void;
  onAddParameter: (methodIndex: number) => void;
  onUpdateParameter: (
    methodIndex: number,
    paramIndex: number,
    updated: Partial<ObjectNodeProperty>,
  ) => void;
  onRemoveParameter: (methodIndex: number, paramIndex: number) => void;
}

const ObjectNodeMethodItem: FC<ObjectNodeMethodItemProps> = ({
  method,
  index,
  onUpdateMethod,
  onRemoveMethod,
  onAddParameter,
  onUpdateParameter,
  onRemoveParameter,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const { aColor, sColor, tColor } = useObjectNodeColors();

  return (
    <SortableItem key={method.id} value={method.id} asChild>
      <div className="flex flex-col gap-2 p-2 border rounded-md bg-muted/20">
        <Collapsible
          className="flex flex-col gap-2"
          open={!collapsed}
          onOpenChange={(open) => setCollapsed(!open)}
        >
          <div className="flex gap-2 items-center">
            <SortableItemHandle asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
              >
                <GripVertical className="size-4" />
              </Button>
            </SortableItemHandle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 group">
                <ChevronRight className="size-4 transition-transform group-data-[state=open]:rotate-90" />
              </Button>
            </CollapsibleTrigger>
            <Select
              value={method.accessModifier}
              onValueChange={(val: any) =>
                onUpdateMethod(index, { accessModifier: val })
              }
            >
              <SelectTrigger className="h-8!" style={{ color: aColor }}>
                <SelectValue placeholder="Access" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public (+)</SelectItem>
                <SelectItem value="private">Private (-)</SelectItem>
                <SelectItem value="protected">Protected (#)</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="h-8 font-mono flex-1"
              value={method.name}
              onChange={(e) => onUpdateMethod(index, { name: e.target.value })}
              placeholder="Name"
            />
            <span className="text-muted-foreground" style={{ color: sColor }}>
              :
            </span>
            <Input
              className="h-8 font-mono w-25"
              value={method.returnType || ""}
              onChange={(e) =>
                onUpdateMethod(index, { returnType: e.target.value })
              }
              placeholder="Return Type"
              style={{ color: tColor }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onRemoveMethod(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <CollapsibleContent>
            <div className="flex gap-4 items-center px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Static</span>
                <Switch
                  checked={method.static || false}
                  onCheckedChange={(checked) =>
                    onUpdateMethod(index, { static: checked })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Abstract</span>
                <Switch
                  checked={method.abstract || false}
                  onCheckedChange={(checked) =>
                    onUpdateMethod(index, { abstract: checked })
                  }
                />
              </div>
            </div>

            {/* Parameters */}
            <div className="mt-2 pl-4 border-l-2 border-muted flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">
                  Parameters
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => onAddParameter(index)}
                >
                  <Plus className="size-3" /> Add Param
                </Button>
              </div>
              {method.parameters?.map((param, pIndex) => (
                <ObjectNodeParameterItem
                  key={index + "-" + pIndex}
                  param={param}
                  index={index}
                  pIndex={pIndex}
                  onUpdateParameter={onUpdateParameter}
                  onRemoveParameter={onRemoveParameter}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </SortableItem>
  );
};

export default ObjectNodeMethodItem;
