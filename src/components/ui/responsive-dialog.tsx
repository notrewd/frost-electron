import React, { FC } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogContentProps {
  className?: string;
  contentClassName?: string;
  viewportClassName?: string;
  viewportAsChild?: boolean;
  children: React.ReactNode;
}

export const ResponsiveDialog: FC<ResponsiveDialogProps> = ({
  open,
  onOpenChange,
  className,
  children,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("flex max-h-[90dvh] min-h-0 flex-col px-0", className)}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
};

export const ResponsiveDialogHeader: FC<ResponsiveDialogHeaderProps> = ({
  className,
  children,
}) => {
  return (
    <DialogHeader className={cn("px-5", className)}>{children}</DialogHeader>
  );
};

export const ResponsiveDialogContent: FC<ResponsiveDialogContentProps> = ({
  className,
  contentClassName,
  children,
}) => {
  return (
    <ScrollArea
      className={cn("flex-1 flex flex-col overflow-hidden", className)}
    >
      <div className={cn("px-5", contentClassName)}>{children}</div>
    </ScrollArea>
  );
};
