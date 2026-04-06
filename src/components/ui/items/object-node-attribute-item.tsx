import { FC } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import { ObjectNodeAttribute } from "@/components/nodes/object-node";
import { Input } from "../input";
import { Button } from "../button";
import { GripVertical, Trash2 } from "lucide-react";
import { Switch } from "../switch";
import { SortableItem, SortableItemHandle } from "../sortable";
import { useObjectNodeColors } from "@/hooks/use-object-node-colors";

interface ObjectNodeAttributeItemProps {
  attr: ObjectNodeAttribute;
  index: number;
  updateAttribute: (
    index: number,
    updated: Partial<ObjectNodeAttribute>,
  ) => void;
  removeAttribute: (index: number) => void;
}

const ObjectNodeAttributeItem: FC<ObjectNodeAttributeItemProps> = ({
  attr,
  index,
  updateAttribute,
  removeAttribute,
}) => {
  const { publicAColor, privateAColor, protectedAColor, sColor, tColor, dColor } = useObjectNodeColors();
  const aColor = attr.accessModifier === "public" ? publicAColor : attr.accessModifier === "private" ? privateAColor : protectedAColor;

  return (
    <SortableItem key={attr.id} value={attr.id} asChild>
      <div className="flex flex-col gap-2 p-2 border rounded-md bg-muted/20">
        <div className="flex gap-2 items-center">
          <SortableItemHandle asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
            >
              <GripVertical className="size-4" />
            </Button>
          </SortableItemHandle>
          <Select
            value={attr.accessModifier}
            onValueChange={(val: any) =>
              updateAttribute(index, { accessModifier: val })
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
            value={attr.name}
            onChange={(e) => updateAttribute(index, { name: e.target.value })}
            placeholder="Name"
          />
          <span className="text-muted-foreground" style={{ color: sColor }}>
            :
          </span>
          <Input
            className="h-8 font-mono w-32"
            value={attr.type || ""}
            onChange={(e) => updateAttribute(index, { type: e.target.value })}
            placeholder="Type"
            style={{ color: tColor }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => removeAttribute(index)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
        <div className="flex gap-4 items-center px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Static</span>
            <Switch
              checked={attr.static || false}
              onCheckedChange={(checked) =>
                updateAttribute(index, { static: checked })
              }
            />
          </div>
          <Input
            className="h-7 text-xs font-mono flex-1"
            value={attr.defaultValue || ""}
            onChange={(e) =>
              updateAttribute(index, { defaultValue: e.target.value })
            }
            placeholder="Default Value"
            style={{ color: dColor }}
          />
          <Input
            className="h-7 text-xs font-mono flex-1"
            value={attr.stereotype || ""}
            onChange={(e) =>
              updateAttribute(index, { stereotype: e.target.value })
            }
            placeholder="Stereotype"
          />
        </div>
      </div>
    </SortableItem>
  );
};

export default ObjectNodeAttributeItem;
