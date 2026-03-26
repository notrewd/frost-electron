import { FC, ReactNode } from "react";

interface PanelBarProps {
  children?: ReactNode;
}

const PanelBar: FC<PanelBarProps> = ({ children }) => {
  return (
    <div className="w-full bg-background/50 flex px-4 py-1">{children}</div>
  );
};

export default PanelBar;
