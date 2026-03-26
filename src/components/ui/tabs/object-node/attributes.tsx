import { FC, useMemo, useState } from "react";
import { TabsContent } from "../../tabs";
import {
  ObjectNodeData,
  ObjectNodeAttribute,
} from "@/components/nodes/object-node";
import { Button } from "../../button";
import { Plus } from "lucide-react";
import { ScrollArea } from "../../scroll-area";
import SearchInput from "../../inputs/search-input";
import { generateUniqueAttributeId } from "@/lib/utils";
import ObjectNodeAttributeItem from "../../items/object-node-attribute-item";
import { Sortable, SortableContent } from "../../sortable";

interface AttributesTabProps {
  data: ObjectNodeData;
  setData: (data: ObjectNodeData) => void;
}

const AttributesTab: FC<AttributesTabProps> = ({ data, setData }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const attributes = useMemo(() => {
    if (!data.attributes) return [];
    return data.attributes.filter((attr) =>
      attr.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [data.attributes, searchQuery]);

  const addAttribute = () => {
    const newAttribute: ObjectNodeAttribute = {
      id: generateUniqueAttributeId(),
      name: "newAttribute",
      accessModifier: "private",
      type: "string",
    };
    setData({ ...data, attributes: [...attributes, newAttribute] });
  };

  const updateAttribute = (
    index: number,
    updated: Partial<ObjectNodeAttribute>,
  ) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], ...updated };
    setData({ ...data, attributes: newAttributes });
  };

  const removeAttribute = (index: number) => {
    const newAttributes = [...attributes];
    newAttributes.splice(index, 1);
    setData({ ...data, attributes: newAttributes });
  };

  return (
    <TabsContent value="attributes" className="flex flex-col gap-3 h-75">
      <div className="flex flex-col sticky -top-px bg-background z-10 py-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Attributes</span>
          <Button variant="outline" size="sm" onClick={addAttribute}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
        <SearchInput
          placeholder="Search attributes..."
          className="mt-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1 border rounded-md p-2">
        {attributes.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            No attributes{" "}
            {searchQuery ? `matching "${searchQuery}"` : "defined"}.
          </div>
        ) : (
          <Sortable
            value={attributes}
            onValueChange={(newAttributes) =>
              setData({ ...data, attributes: newAttributes })
            }
            getItemValue={(item) => item.id}
          >
            <SortableContent className="flex flex-col gap-4">
              {attributes.map((attr, index) => (
                <ObjectNodeAttributeItem
                  key={attr.id}
                  attr={attr}
                  index={index}
                  updateAttribute={updateAttribute}
                  removeAttribute={removeAttribute}
                />
              ))}
            </SortableContent>
          </Sortable>
        )}
      </ScrollArea>
    </TabsContent>
  );
};

export default AttributesTab;
