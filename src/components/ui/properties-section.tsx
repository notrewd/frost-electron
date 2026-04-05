import React, { FC, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertiesSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<any>;
  defaultOpen?: boolean;
}

const PropertiesSection: FC<PropertiesSectionProps> = ({
  title,
  children,
  icon: Icon,
  defaultOpen = true,
}: PropertiesSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="flex flex-col border-border/50"
    >
      <CollapsibleTrigger className="flex items-center justify-between px-3 py-2 hover:bg-background/50 w-full outline-none rounded-md">
        <div className="flex items-center">
          {Icon && <Icon className="w-3.5 h-3.5 mr-2 text-muted-foreground" />}
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform",
            !open && "-rotate-90",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col pb-2 pt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default PropertiesSection;
