import { ScrollArea } from "@/components/ui/scroll-area";
import Titlebar from "@/components/ui/titlebar.tsx";
import { Outlet } from "react-router";

const DialogLayout = () => {
  return (
    <>
      <Titlebar variant="dialog" />
      <main className="flex flex-col flex-1 overflow-hidden">
        <ScrollArea className="flex flex-col h-full px-6 py-4 [&_[data-slot=scroll-area-viewport]>div]:min-h-full [&_[data-slot=scroll-area-viewport]>div]:flex! [&_[data-slot=scroll-area-viewport]>div]:flex-col [&_[data-slot=scroll-area-viewport]>div]:relative">
          <Outlet />
        </ScrollArea>
      </main>
    </>
  );
};

export default DialogLayout;
