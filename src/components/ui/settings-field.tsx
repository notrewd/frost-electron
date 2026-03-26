import { FC, ReactNode } from "react";
import { Field, FieldContent, FieldDescription, FieldLabel } from "./field";
import { cn } from "@/lib/utils";

interface SettingsFieldProps {
  label: string;
  description?: string;
  subsetting?: boolean;
  children: ReactNode;
}

const SettingsField: FC<SettingsFieldProps> = ({
  label,
  description,
  subsetting = false,
  children,
}) => {
  return (
    <Field
      className={cn(
        "flex-row gap-4 items-center",
        subsetting && "pl-4 border-border border-l-2",
      )}
    >
      <FieldContent className="flex-1 gap-0">
        <FieldLabel>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      {children}
    </Field>
  );
};

export default SettingsField;
