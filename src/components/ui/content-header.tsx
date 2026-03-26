import { FC } from "react";
import { Separator } from "./separator";

interface ContentHeaderProps {
  title: string;
  description: string;
  className?: string;
}

const ContentHeader: FC<ContentHeaderProps> = ({
  title,
  description,
  className,
}) => {
  return (
    <div className={className}>
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Separator className="my-4" />
    </div>
  );
};

export default ContentHeader;
