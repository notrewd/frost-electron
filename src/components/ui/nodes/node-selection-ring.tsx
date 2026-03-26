import { FC } from "react";

interface NodeSelectionRingProps {
  visible: boolean;
}

const NodeSelectionRing: FC<NodeSelectionRingProps> = ({ visible }) => {
  if (!visible) return null;
  return <div className="absolute inset-0 ring rounded-md react-flow__ring" />;
};

export default NodeSelectionRing;
