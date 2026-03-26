import { memo } from 'react';
import { BaseEdge, type BaseEdgeProps } from "@xyflow/react";

export function DashedBaseEdge({
  id,
  path,
  markerEnd,
  markerStart,
  style,
  interactionWidth,
  className,
  ...props
}: BaseEdgeProps) {
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={style}
        interactionWidth={interactionWidth}
        className={className}
        {...props}
      />
      <path
        d={path}
        fill="none"
        strokeOpacity={0}
        className={className || "react-flow__edge-path"}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{ ...style, strokeDasharray: "none" }}
      />
    </>
  );
}

export default memo(DashedBaseEdge);

