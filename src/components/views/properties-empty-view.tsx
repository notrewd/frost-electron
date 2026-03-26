import { SquareMousePointer } from "lucide-react";

const PropertiesEmptyView = () => {
  return (
    <div className="flex flex-col flex-1 justify-center items-center text-muted-foreground text-center px-6 gap-4">
      <SquareMousePointer className="size-8" />
      <p className="font-medium">Select an element to change its properties</p>
    </div>
  );
};

export default PropertiesEmptyView;
