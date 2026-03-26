import { FC, useMemo, useState } from "react";
import { TabsContent } from "../../tabs";
import {
  ObjectNodeData,
  ObjectNodeMethod,
  ObjectNodeProperty,
} from "@/components/nodes/object-node";
import { Button } from "../../button";
import { Plus } from "lucide-react";
import { ScrollArea } from "../../scroll-area";
import ObjectNodeMethodItem from "../../items/object-node-method-item";
import SearchInput from "../../inputs/search-input";
import { generateUniqueMethodId, generateUniqueParameterId } from "@/lib/utils";
import { Sortable, SortableContent } from "../../sortable";

interface MethodsTabProps {
  data: ObjectNodeData;
  setData: (data: ObjectNodeData) => void;
}

const MethodsTab: FC<MethodsTabProps> = ({ data, setData }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const methods = useMemo(() => {
    if (!data.methods) return [];
    return data.methods.filter((method) =>
      method.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [data.methods, searchQuery]);

  const addMethod = () => {
    const newMethod: ObjectNodeMethod = {
      id: generateUniqueMethodId(),
      name: "newMethod",
      accessModifier: "public",
      returnType: "void",
      parameters: [],
    };
    setData({ ...data, methods: [...methods, newMethod] });
  };

  const updateMethod = (index: number, updated: Partial<ObjectNodeMethod>) => {
    const newMethods = [...methods];
    newMethods[index] = { ...newMethods[index], ...updated };
    setData({ ...data, methods: newMethods });
  };

  const removeMethod = (index: number) => {
    const newMethods = [...methods];
    newMethods.splice(index, 1);
    setData({ ...data, methods: newMethods });
  };

  const addParameter = (methodIndex: number) => {
    const method = methods[methodIndex];
    const newParam: ObjectNodeProperty = {
      id: generateUniqueParameterId(),
      name: "param",
      type: "string",
    };
    updateMethod(methodIndex, {
      parameters: [...(method.parameters || []), newParam],
    });
  };

  const updateParameter = (
    methodIndex: number,
    paramIndex: number,
    updated: Partial<ObjectNodeProperty>,
  ) => {
    const method = methods[methodIndex];
    const newParams = [...(method.parameters || [])];
    newParams[paramIndex] = { ...newParams[paramIndex], ...updated };
    updateMethod(methodIndex, { parameters: newParams });
  };

  const removeParameter = (methodIndex: number, paramIndex: number) => {
    const method = methods[methodIndex];
    const newParams = [...(method.parameters || [])];
    newParams.splice(paramIndex, 1);
    updateMethod(methodIndex, { parameters: newParams });
  };

  return (
    <TabsContent value="methods" className="flex flex-col gap-3 h-75 relative">
      <div className="flex flex-col sticky -top-px bg-background z-10 py-2">
        <div className="flex justify-between items-center ">
          <span className="text-sm font-medium">Methods</span>
          <Button variant="outline" size="sm" onClick={addMethod}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
        <SearchInput
          placeholder="Search methods..."
          className="mt-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1 border rounded-md p-2">
        {methods.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            No methods {searchQuery ? `matching "${searchQuery}"` : "defined"}.
          </div>
        ) : (
          <Sortable
            value={methods}
            onValueChange={(newMethods) =>
              setData({ ...data, methods: newMethods })
            }
            getItemValue={(item) => item.id}
          >
            <SortableContent className="flex flex-col gap-4">
              {methods.map((method, index) => (
                <ObjectNodeMethodItem
                  key={index}
                  method={method}
                  index={index}
                  onUpdateMethod={updateMethod}
                  onRemoveMethod={removeMethod}
                  onAddParameter={addParameter}
                  onUpdateParameter={updateParameter}
                  onRemoveParameter={removeParameter}
                />
              ))}
            </SortableContent>
          </Sortable>
        )}
      </ScrollArea>
    </TabsContent>
  );
};

export default MethodsTab;
