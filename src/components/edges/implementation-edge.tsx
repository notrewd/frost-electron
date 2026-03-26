import { memo } from 'react';
import {
  useInternalNode,
  type EdgeProps,
  getStraightPath,
  getSmoothStepPath,
} from "@xyflow/react";

import { getEdgeParams, getSmartBezierPath } from "../../lib/utils";
import ArrowClosed from "../ui/icons/markers/arrow-closed";
import DashedBaseEdge from "./dashed-base-edge";
import { useSettingsStore } from "@/stores/settings-store";
import { useShallow } from "zustand/react/shallow";
import { EdgeLabel } from "./edge-label-renderer";

function ImplementationEdge({ id, source, target, style, data }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode,
  );

  const { edgeStyle, showEdgeLabels } =
    useSettingsStore(
      useShallow((state) => ({
        edgeStyle: state.edge_style,
        showEdgeLabels: state.show_edge_labels,
      })),
    );

  let path, labelX, labelY;
  if (edgeStyle === "straight") {
    [path, labelX, labelY] = getStraightPath({
      sourceX: sx,
      sourceY: sy,
      targetX: tx,
      targetY: ty,
    });
  } else if (edgeStyle === "smoothstep") {
    [path, labelX, labelY] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
      targetX: tx,
      targetY: ty,
    });
  } else {
    [path, labelX, labelY] = getSmartBezierPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
      targetX: tx,
      targetY: ty,
    });
  }return (
    <>
      <ArrowClosed />
      <DashedBaseEdge
        id={id}
        className="react-flow__edge-path"
        path={path}
        markerEnd={"url(#arrow-closed)"}
        style={{ strokeDasharray: "5 5", ...style }}
      />
      {showEdgeLabels && (
        <EdgeLabel
          labelX={labelX}
          labelY={labelY}
          sx={sx}
          sy={sy}
          tx={tx}
          ty={ty}
          data={data}
        />
      )}
    </>
  );
}

export default memo(ImplementationEdge);






