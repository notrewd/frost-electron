import { FC } from "react";
import { TabsContent } from "../../tabs";
import { Field, FieldContent, FieldLabel } from "../../field";
import { Input } from "../../input";
import { ObjectNodeData } from "@/components/nodes/object-node";
import { Textarea } from "../../textarea";
import { Switch } from "../../switch";

interface GeneralTabProps {
  data: ObjectNodeData;
  setData: (data: ObjectNodeData) => void;
}

const GeneralTab: FC<GeneralTabProps> = ({ data, setData }) => {
  return (
    <TabsContent value="general" className="flex flex-col gap-3">
      <div className="flex gap-4">
        <Field className="gap-1">
          <FieldContent className="flex flex-col gap-0">
            <FieldLabel>Name</FieldLabel>
          </FieldContent>
          <Input
            className="font-mono"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            variant="small"
          />
        </Field>
        <Field className="gap-1">
          <FieldContent className="flex flex-col gap-0">
            <FieldLabel>Stereotype</FieldLabel>
          </FieldContent>
          <Input
            className="font-mono"
            value={data.stereotype}
            onChange={(e) => setData({ ...data, stereotype: e.target.value })}
            placeholder="None"
            variant="small"
          />
        </Field>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Abstract</span>
        <Switch
          checked={data.abstract}
          onCheckedChange={(checked) => setData({ ...data, abstract: checked })}
        />
      </div>
      <Field className="gap-1">
        <FieldContent className="flex flex-col gap-0">
          <FieldLabel>Note</FieldLabel>
        </FieldContent>
        <Textarea
          className="font-mono min-h-25"
          value={data.note}
          onChange={(e) => setData({ ...data, note: e.target.value })}
          placeholder="None"
          variant="small"
        />
      </Field>
    </TabsContent>
  );
};

export default GeneralTab;
