import { Handle, Position, useConnection } from "@xyflow/react";
import { Spline } from "lucide-react";
import { FC, useMemo } from "react";

interface NodeConnectionHandleProps {
  nodeId: string;
}

const NodeConnectionHandle: FC<NodeConnectionHandleProps> = ({ nodeId }) => {
  const connection = useConnection();

  const isTarget = useMemo(
    () => connection.inProgress && connection.fromNode.id !== nodeId,
    [connection, nodeId],
  );

  return (
    <>
      {!connection.inProgress && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            position: "absolute",
            zIndex: "50",
            top: "unset",
            right: "1em",
            bottom: "0",
            background: "none",
            border: "none",
            width: "1em",
            height: "1em",
          }}
        >
          <div className="rounded-md bg-muted size-8 flex flex-col items-center justify-center">
            <Spline className="size-4 text-foreground" />
          </div>
        </Handle>
      )}
      {(!connection.inProgress || isTarget) && (
        <Handle
          type="target"
          position={Position.Left}
          isConnectableStart={false}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            top: "0",
            left: "0",
            background: "none",
            border: "none",
            zIndex: "50",
            transform: "none",
          }}
        />
      )}
    </>
  );
};

export default NodeConnectionHandle;
